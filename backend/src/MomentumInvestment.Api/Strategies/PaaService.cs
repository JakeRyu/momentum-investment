using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace MomentumInvestment.Api.Strategies;

/// <summary>
/// PAA-G12 (Protective Asset Allocation, Keller &amp; van Putten 2016),
/// supporting all three protection factors a ∈ {0, 1, 2}.
///
/// Unlike VAA/DAA the momentum signal is SMA(12), not 13612W:
///
///   momentum_i = p₀ / SMA(p₀..p₁₁) − 1
///
/// "Good" assets are those with momentum &gt; 0. Let n = count of good
/// assets in the risky universe of size N = 12. The bond fraction is:
///
///   BF = max(0, min(1, (N − n) / N1))
///   N1 = N − a·N/4
///
/// where a is the protection factor:
///   a = 0 (Aggressive) → N1 = 12, BF = (12-n)/12 → defensive only at n = 0
///   a = 1 (Moderate)   → N1 =  9, BF = (12-n)/9  → defensive at n ≤ 3
///   a = 2 (Vigilant)   → N1 =  6, BF = (12-n)/6  → defensive at n ≤ 6
///
/// Each risky position holds <c>(1 − BF) / T</c> with T = 6. When n &lt; T
/// (only possible for a = 0 or a = 1), only n positions are filled and
/// the (T − n) empty slots collapse into the cash holding. Cash, when
/// held, is concentrated in the single highest-momentum asset of the
/// cash universe — same convention as DAA.
///
/// The class-level <see cref="StrategyId"/> identifies the family
/// (<c>"paa-g12"</c>) for logging/DI purposes; the per-call response
/// <see cref="AllocationDecision.StrategyId"/> distinguishes a-variants
/// as <c>"paa-g12-a0"</c> / <c>"paa-g12-a1"</c> / <c>"paa-g12-a2"</c>
/// so future history-view consumers can tell them apart.
/// </summary>
public sealed class PaaService : IAllocationStrategy<PaaUniverse>
{
    public string StrategyId => "paa-g12";

    /// <summary>Top-risky selection parameter (canonical PAA-G12 default).</summary>
    public const int T = 6;

    /// <summary>
    /// Default protection factor used by the 3-arg <see cref="Decide"/>
    /// overload — a = 2 (Vigilant), Keller's recommended baseline. Kept as
    /// a constant so callers (and the JSON endpoint's default) reference a
    /// single source of truth.
    /// </summary>
    public const int DefaultA = 2;

    private readonly ILogger<PaaService> _logger;

    public PaaService(ILogger<PaaService>? logger = null)
    {
        _logger = logger ?? NullLogger<PaaService>.Instance;
    }

    /// <summary>
    /// <see cref="IAllocationStrategy{TUniverse}"/> contract implementation —
    /// delegates to the variant-aware overload with <see cref="DefaultA"/>
    /// (PAA2). Existing callers that don't care about variant selection
    /// keep working unchanged.
    /// </summary>
    public AllocationDecision Decide(
        DateOnly asOf,
        PaaUniverse universe,
        IReadOnlyDictionary<string, IReadOnlyList<DailyClose>> dailyByTicker)
        => Decide(asOf, universe, dailyByTicker, DefaultA);

    /// <summary>
    /// Variant-aware overload. <paramref name="a"/> selects the protection
    /// factor: 0 (Aggressive), 1 (Moderate), or 2 (Vigilant). Out-of-range
    /// values throw — Keller's paper only defines those three.
    /// </summary>
    public AllocationDecision Decide(
        DateOnly asOf,
        PaaUniverse universe,
        IReadOnlyDictionary<string, IReadOnlyList<DailyClose>> dailyByTicker,
        int a)
    {
        if (a is < 0 or > 2)
        {
            throw new ArgumentOutOfRangeException(
                nameof(a),
                a,
                "Protection factor must be 0 (Aggressive), 1 (Moderate), or 2 (Vigilant).");
        }

        int N = universe.Risky.Count;
        // N1 = N − a·N/4. For (N=12, a=0/1/2) this is 12/9/6. Decimal so
        // divisions later stay precise.
        decimal n1 = N - a * (decimal)N / 4m;

        // Score every distinct ticker once (cash and risky may share, e.g.
        // LQD in some configurations). Then build per-bucket lists from
        // the cached scores.
        var scoresByTicker = new Dictionary<string, decimal>();
        foreach (var ticker in universe.AllTickers())
        {
            scoresByTicker[ticker] = MomentumScorer.ScoreSMA12(ticker, asOf, dailyByTicker, _logger);
        }

        var riskyScores = universe.Risky
            .Select(t => new AssetMomentum(t, scoresByTicker[t], Bucket: "Risky"))
            .ToList();
        var cashScores = universe.Cash
            .Select(t => new AssetMomentum(t, scoresByTicker[t], Bucket: "Cash"))
            .ToList();
        var allScores = riskyScores.Concat(cashScores).ToList();

        // 1. Count "good" risky assets (Keller treats > 0 as good; non-positive
        //    means SMA12-relative price decay).
        int n = riskyScores.Count(s => s.Score > 0m);

        // 2. Bond fraction, capped to [0, 1].
        decimal bf = Math.Max(0m, Math.Min(1m, (N - n) / n1));

        // 3. Top risky positions actually held = min(n, T). For PAA2 this
        //    only matters when BF < 1 (i.e. n > T = 6), so in practice
        //    t == T whenever any risky weight is non-zero. PAA0/PAA1 can
        //    have n < T while BF < 1 (e.g. PAA1 with n = 4 → BF = 8/9,
        //    only 4 risky positions filled, the remaining slots spill
        //    into cash).
        int t = Math.Min(n, T);

        // 4. Pick top-t risky by score, restricted to the good ones.
        var topRisky = riskyScores
            .Where(s => s.Score > 0m)
            .OrderByDescending(s => s.Score)
            .Take(t)
            .ToList();

        // 5. Pick the single best cash asset by score.
        var topCash = cashScores.OrderByDescending(s => s.Score).FirstOrDefault();

        // 6. Compose allocations.
        //    Risky weight per holding is constant (1 − BF) / T (Keller's
        //    fixed denominator T, not t — when n < T the leftover slots
        //    spill into cash automatically via cashFraction below).
        var allocations = new List<Allocation>();
        decimal riskyWeight = (1m - bf) / T;
        decimal totalRiskyWeight = 0m;
        if (riskyWeight > 0m)
        {
            foreach (var r in topRisky)
            {
                allocations.Add(new Allocation(r.Ticker, riskyWeight));
                totalRiskyWeight += riskyWeight;
            }
        }

        decimal cashFraction = 1m - totalRiskyWeight;
        if (cashFraction > 0m)
        {
            if (topCash is null)
            {
                throw new InvalidOperationException(
                    "Cash fraction > 0 but no cash assets supplied in the universe.");
            }
            allocations.Add(new Allocation(topCash.Ticker, cashFraction));
        }

        // 7. Mode label + reasoning. Threshold for "fully defensive" is
        //    n ≤ N − N1 (= 0/3/6 for a = 0/1/2 with N = 12).
        string modeLabel;
        string reasoning;
        if (bf == 0m)
        {
            modeLabel = "Offensive";
            reasoning =
                $"All {N} risky assets have positive SMA12 momentum. " +
                $"Offensive mode: top {T} at {1m / T:P2} each — " +
                $"{string.Join(", ", topRisky.Select(r => $"{r.Ticker} ({r.Score:F4})"))}.";
        }
        else if (bf >= 1m)
        {
            modeLabel = "Defensive";
            int threshold = N - (int)n1;
            reasoning =
                $"Only {n} of {N} risky assets have positive momentum " +
                $"(≤ {threshold}, the PAA{a} protection threshold). " +
                $"Defensive mode: 100% in top cash {topCash!.Ticker} ({topCash.Score:F4}).";
        }
        else
        {
            modeLabel = "Hybrid";
            reasoning =
                $"{n} of {N} risky assets have positive SMA12 momentum. " +
                $"Hybrid mode: top {t} risky at {riskyWeight:P2} each — " +
                $"{string.Join(", ", topRisky.Select(r => $"{r.Ticker} ({r.Score:F4})"))} — " +
                $"plus {cashFraction:P0} in top cash {topCash!.Ticker} ({topCash.Score:F4}).";
        }

        return new AllocationDecision(
            // Per-variant id so a future history view can tell PAA0/1/2
            // decisions apart. Class-level StrategyId stays "paa-g12" for
            // DI/logging.
            StrategyId: $"paa-g12-a{a}",
            AsOf: asOf,
            ModeLabel: modeLabel,
            Allocations: allocations,
            Scores: allScores,
            Reasoning: reasoning);
    }
}
