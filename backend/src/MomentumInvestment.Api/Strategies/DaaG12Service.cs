using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace MomentumInvestment.Api.Strategies;

/// <summary>
/// DAA-G12 (Defensive Asset Allocation, Keller &amp; Keuning 2018).
///
/// Adds a "canary" universe (VWO, BND in the default) on top of VAA's
/// breadth-momentum idea. The number of canary assets with non-positive
/// 13612W momentum determines how much of the portfolio rotates to cash:
///
///   CF = min(1, (1/T) * floor(b * T / B))
///   t  = round((1 - CF) * T)
///
/// where T = 6 is the top-risky selection parameter, B = 2 is the breadth
/// parameter, and b is the count of "bad" canaries.
///
/// For DAA-G12 this collapses to three discrete states:
///   b=0 → CF=0,    t=6  → top 6 risky at 1/6 each (100% offensive)
///   b=1 → CF=0.5,  t=3  → top 3 risky at 1/6 each + 50% in best cash
///   b=2 → CF=1.0,  t=0  → 100% in best cash
///
/// Per-asset risky weight is constant 1/T (= 1/6) across b ∈ {0, 1}; only
/// the count of risky positions shrinks. Cash, when held, is concentrated
/// in the single highest-momentum asset of the cash universe.
/// </summary>
public sealed class DaaG12Service : IAllocationStrategy<DaaG12Universe>
{
    public string StrategyId => "daa-g12";

    /// <summary>Top-risky selection parameter (canonical DAA-G12 default).</summary>
    public const int T = 6;

    /// <summary>Canary breadth parameter.</summary>
    public const int B = 2;

    private readonly ILogger<DaaG12Service> _logger;

    public DaaG12Service(ILogger<DaaG12Service>? logger = null)
    {
        _logger = logger ?? NullLogger<DaaG12Service>.Instance;
    }

    public AllocationDecision Decide(
        DateOnly asOf,
        DaaG12Universe universe,
        IReadOnlyDictionary<string, IReadOnlyList<DailyClose>> dailyByTicker)
    {
        // Score every distinct ticker once. Canary/risky/cash often share
        // tickers (VWO is canary+risky, LQD is risky+cash) so we cache the
        // per-ticker score here and look it up below.
        var scoresByTicker = new Dictionary<string, decimal>();
        foreach (var ticker in universe.AllTickers())
        {
            scoresByTicker[ticker] = MomentumScorer.Score13612W(ticker, asOf, dailyByTicker, _logger);
        }

        // Bucket-tagged score list for the response. Order: Canary → Risky → Cash
        // so the mobile UI can render them in a stable, meaningful sequence.
        // A ticker that appears in multiple buckets gets multiple entries with
        // different bucket labels (same numeric score).
        var canaryScores = universe.Canary
            .Select(t => new AssetMomentum(t, scoresByTicker[t], Bucket: "Canary"))
            .ToList();
        var riskyScores = universe.Risky
            .Select(t => new AssetMomentum(t, scoresByTicker[t], Bucket: "Risky"))
            .ToList();
        var cashScores = universe.Cash
            .Select(t => new AssetMomentum(t, scoresByTicker[t], Bucket: "Cash"))
            .ToList();
        var allScores = canaryScores.Concat(riskyScores).Concat(cashScores).ToList();

        // 1. Count "bad" canary assets — Keller treats <= 0 as bad.
        var badCanaries = canaryScores.Where(s => s.Score <= 0m).Select(s => s.Ticker).ToList();
        int b = badCanaries.Count;

        // 2. Cash fraction (the "Easy Trading" form per TuringTrader's
        // reference implementation: CF = min(1, (1/T) * floor(b*T/B))).
        decimal cf = Math.Min(1.0m,
            Math.Floor((decimal)b * T / B) / T);

        // 3. Number of top risky positions to hold.
        int t = (int)Math.Round((1.0m - cf) * T);

        // 4. Pick top-t risky by score (descending).
        var topRisky = riskyScores
            .OrderByDescending(s => s.Score)
            .Take(t)
            .ToList();

        // 5. Pick the single best cash asset by score (only used if cf > 0).
        var topCash = cashScores
            .OrderByDescending(s => s.Score)
            .FirstOrDefault();

        // 6. Compose allocations. Risky weight per holding is constant 1/T
        //    when t > 0 (since (1-CF)/t works out to 1/T at b ∈ {0, 1}).
        var allocations = new List<Allocation>();
        if (t > 0)
        {
            var riskyWeight = (1.0m - cf) / t;
            foreach (var r in topRisky)
            {
                allocations.Add(new Allocation(r.Ticker, riskyWeight));
            }
        }
        if (cf > 0m)
        {
            if (topCash is null)
            {
                throw new InvalidOperationException(
                    "Cash fraction > 0 but no cash assets supplied in the universe.");
            }
            allocations.Add(new Allocation(topCash.Ticker, cf));
        }

        // 7. ModeLabel + reasoning.
        var modeLabel = b switch
        {
            0 => "Offensive",
            1 => "Hybrid",
            _ => "Defensive",
        };
        var reasoning = b switch
        {
            0 =>
                $"Both canary assets ({string.Join(", ", universe.Canary)}) have positive 13612W momentum. " +
                $"Offensive mode: top {t} risky at {1.0m / T:P2} each — " +
                $"{string.Join(", ", topRisky.Select(r => $"{r.Ticker} ({r.Score:F4})"))}.",
            1 =>
                $"Canary breadth: {b} of {universe.Canary.Count} bad ({string.Join(", ", badCanaries)}). " +
                $"Hybrid mode: top {t} risky at {1.0m / T:P2} each — " +
                $"{string.Join(", ", topRisky.Select(r => $"{r.Ticker} ({r.Score:F4})"))} — " +
                $"plus {cf:P0} in top cash {topCash!.Ticker} ({topCash.Score:F4}).",
            _ =>
                $"All canary assets ({string.Join(", ", universe.Canary)}) have non-positive 13612W momentum. " +
                $"Defensive mode: 100% in top cash {topCash!.Ticker} ({topCash.Score:F4}).",
        };

        return new AllocationDecision(
            StrategyId: StrategyId,
            AsOf: asOf,
            ModeLabel: modeLabel,
            Allocations: allocations,
            Scores: allScores,
            Reasoning: reasoning);
    }
}
