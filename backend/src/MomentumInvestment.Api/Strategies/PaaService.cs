using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace MomentumInvestment.Api.Strategies;

/// <summary>
/// PAA-G12 (Protective Asset Allocation, Keller &amp; van Putten 2016),
/// configured as PAA2 — the most defensive variant Keller recommends as
/// the default.
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
/// where a = 2 is the protection factor (PAA2). For N=12, a=2 → N1 = 6,
/// so the bond fraction collapses to:
///
///   n ≤ 6  → BF = 1   → 100% in top cash (Defensive)
///   n = 7  → BF = 5/6 → 17% risky / 83% cash (Hybrid)
///   n = 8  → BF = 4/6 → 33% risky / 67% cash
///   …
///   n = 12 → BF = 0   → 100% across top T=6 risky (Offensive)
///
/// Each risky position holds <c>(1 − BF) / T</c>. With T = 6 and BF &lt; 1
/// we always have at least 7 good assets (n &gt; 6), so the top-T cut always
/// fills T positions; cash holds the remainder. Cash, when held, is
/// concentrated in the single highest-momentum asset of the cash universe
/// — same convention as DAA.
/// </summary>
public sealed class PaaService : IAllocationStrategy<PaaUniverse>
{
    public string StrategyId => "paa-g12";

    /// <summary>Top-risky selection parameter (canonical PAA-G12 default).</summary>
    public const int T = 6;

    /// <summary>Protection factor (a=2 → PAA2, the vigilant variant).</summary>
    public const int A = 2;

    private readonly ILogger<PaaService> _logger;

    public PaaService(ILogger<PaaService>? logger = null)
    {
        _logger = logger ?? NullLogger<PaaService>.Instance;
    }

    public AllocationDecision Decide(
        DateOnly asOf,
        PaaUniverse universe,
        IReadOnlyDictionary<string, IReadOnlyList<DailyClose>> dailyByTicker)
    {
        int N = universe.Risky.Count;
        // N1 = N − a·N/4. With a=2 this is N/2. Decimal so divisions later
        // stay precise.
        decimal n1 = N - A * (decimal)N / 4m;

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
        //    t == T whenever any risky weight is non-zero — but the
        //    expression keeps the implementation correct for PAA0/PAA1 if
        //    we ever expose them.
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
        //    spill into cash automatically).
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

        // 7. Mode label + reasoning. Threshold for "fully defensive" with
        //    a=2 is n ≤ N − N1 (= 6 for the canonical N=12).
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
                $"(≤ {threshold}, the PAA2 protection threshold). " +
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
            StrategyId: StrategyId,
            AsOf: asOf,
            ModeLabel: modeLabel,
            Allocations: allocations,
            Scores: allScores,
            Reasoning: reasoning);
    }
}
