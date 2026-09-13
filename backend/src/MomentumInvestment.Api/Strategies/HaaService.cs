using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace MomentumInvestment.Api.Strategies;

/// <summary>
/// HAA — Hybrid Asset Allocation (Keller &amp; Keuning, 2023).
///
/// "Hybrid" because two mechanisms combine. A canary (TIP, TIPS-class)
/// gates the regime, and ordinary dual momentum then filters what is
/// left:
///
///   13612U(TIP) &#8804; 0  &#8594;  100% cash                       (Defensive)
///   otherwise        &#8594;  top T=4 risky at 1/T each, but any
///                            slot whose own momentum is &#8804; 0 goes
///                            to cash                      (Offensive/Hybrid)
///
/// So a month can be part invested and part defensive — one bad asset
/// in the Top-4 means 25% cash. Cash is the better of the two-asset
/// defensive universe (BIL/IEF, ND=2, TD=1).
///
/// All three universes are scored with 13612U — the unweighted mean of
/// the 1/3/6/12-month returns (the paper's L=1), not the weighted
/// 13612W used by VAA/DAA/BAA.
///
/// Reference: Keller &amp; Keuning, "Dual and Canary Momentum with Rising
/// Yields/Inflation: Hybrid Asset Allocation (HAA)", SSRN 4346906, 2023,
/// Fig 6 (HAA-Balanced, G8/T4).
/// </summary>
public sealed class HaaService : IAllocationStrategy<HaaUniverse>
{
    public string StrategyId => "haa";

    /// <summary>Top-risky selection parameter (canonical HAA-Balanced).</summary>
    public const int T = 4;

    private readonly ILogger<HaaService> _logger;

    public HaaService(ILogger<HaaService>? logger = null)
    {
        _logger = logger ?? NullLogger<HaaService>.Instance;
    }

    public AllocationDecision Decide(
        DateOnly asOf,
        HaaUniverse universe,
        IReadOnlyDictionary<string, IReadOnlyList<DailyClose>> dailyByTicker)
    {
        // Score every distinct ticker once. AllTickers() dedups in case
        // canary/cash overlap with risky in some non-canonical universe.
        var scoresByTicker = new Dictionary<string, decimal>();
        foreach (var ticker in universe.AllTickers())
        {
            scoresByTicker[ticker] = MomentumScorer.Score13612U(ticker, asOf, dailyByTicker, _logger);
        }

        var riskyScores = universe.Risky
            .Select(t => new AssetMomentum(t, scoresByTicker[t], Bucket: "Risky"))
            .ToList();
        var canaryScore = new AssetMomentum(
            universe.Canary,
            scoresByTicker[universe.Canary],
            Bucket: "Canary");
        var cashScores = universe.Cash
            .Select(t => new AssetMomentum(t, scoresByTicker[t], Bucket: "Cash"))
            .ToList();

        // TD=1: the best of the defensive universe is what "cash" means
        // for this month, both for the canary switch and for replacing
        // bad assets inside the Top-T.
        var topCash = cashScores.OrderByDescending(s => s.Score).First();

        // Emit canary first so the mobile UI's bucket-order rendering
        // shows the trigger signal at the top of the score list.
        var allScores = new List<AssetMomentum> { canaryScore };
        allScores.AddRange(riskyScores);
        allScores.AddRange(cashScores);

        // Binary regime switch. Keller's convention: ≤ 0 is bearish (>
        // 0 alone is "good"), same as the canary semantics in DAA and
        // PAA.
        bool defensive = canaryScore.Score <= 0m;

        List<Allocation> allocations;
        string modeLabel;
        string reasoning;

        if (defensive)
        {
            allocations = new List<Allocation>
            {
                new Allocation(topCash.Ticker, 1m),
            };
            modeLabel = "Defensive";
            reasoning =
                $"The inflation-protected canary ({universe.Canary}) has turned down, which " +
                $"this strategy reads as a rising-yield shock, so it has moved fully into " +
                $"{topCash.Ticker}.";
        }
        else
        {
            var topRisky = riskyScores
                .OrderByDescending(s => s.Score)
                .Take(T)
                .ToList();

            // The "hybrid" half: the canary gates the regime, and then
            // ordinary dual momentum filters what is left. A Top-T slot
            // whose own momentum is non-positive is not held — that
            // quarter goes to cash instead, so a month can be part
            // invested and part defensive.
            var held = topRisky.Where(r => r.Score > 0m).ToList();
            int badSlots = topRisky.Count - held.Count;

            decimal weight = 1m / T;
            allocations = held
                .Select(r => new Allocation(r.Ticker, weight))
                .ToList();

            if (badSlots > 0)
            {
                allocations.Add(new Allocation(topCash.Ticker, badSlots * weight));
            }

            modeLabel = badSlots == 0 ? "Offensive" : "Hybrid";
            reasoning = badSlots == 0
                ? $"The inflation-protected canary ({universe.Canary}) is still trending up and " +
                  $"all {T} of the strongest risky assets are rising, so the strategy is fully " +
                  $"invested at {weight:P2} each — {string.Join(", ", held.Select(r => r.Ticker))}."
                : $"The inflation-protected canary ({universe.Canary}) is still trending up, but " +
                  $"{badSlots} of the {T} strongest risky assets {(badSlots == 1 ? "is" : "are")} " +
                  $"not rising, so {(badSlots * weight):P0} of the portfolio sits in " +
                  $"{topCash.Ticker} instead" +
                  (held.Count > 0
                      ? $", alongside {string.Join(", ", held.Select(r => r.Ticker))}."
                      : ".");
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
