using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace MomentumInvestment.Api.Strategies;

/// <summary>
/// HAA — Hybrid Asset Allocation (Keller &amp; Keuning, 2023).
///
/// Designed for rising-yield regimes that broke 60/40 portfolios in
/// 2022. The canary (TIP, TIPS-class) gates a binary on/off:
///
///   13612W(TIP) ≤ 0  →  100% in cash (BIL)               (Defensive)
///   13612W(TIP) &gt; 0  →  top T=4 risky at 1/T each         (Offensive)
///
/// 13612W is the same momentum metric used by VAA/DAA. The risky
/// universe (default 8 ETFs across 4 categories — US equities, foreign
/// equities, real assets, treasuries) is selected by flat top-T scoring,
/// not per-category. T = 4 is Keller's "Balanced" default; lower T
/// values give "Aggressive" variants we have not exposed yet.
///
/// Reference: Keller &amp; Keuning, "Relative and Absolute Momentum in
/// Times of Rising/Low Yields: Hybrid Asset Allocation (HAA)", SSRN
/// 4346906, 2023.
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
            scoresByTicker[ticker] = MomentumScorer.Score13612W(ticker, asOf, dailyByTicker, _logger);
        }

        var riskyScores = universe.Risky
            .Select(t => new AssetMomentum(t, scoresByTicker[t], Bucket: "Risky"))
            .ToList();
        var canaryScore = new AssetMomentum(
            universe.Canary,
            scoresByTicker[universe.Canary],
            Bucket: "Canary");
        var cashScore = new AssetMomentum(
            universe.Cash,
            scoresByTicker[universe.Cash],
            Bucket: "Cash");

        // Emit canary first so the mobile UI's bucket-order rendering
        // shows the trigger signal at the top of the score list.
        var allScores = new List<AssetMomentum> { canaryScore };
        allScores.AddRange(riskyScores);
        allScores.Add(cashScore);

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
                new Allocation(universe.Cash, 1m),
            };
            modeLabel = "Defensive";
            reasoning =
                $"Canary {universe.Canary} 13612W = {canaryScore.Score:F4} ≤ 0 " +
                $"(rising-yield regime). Defensive mode: 100% in cash {universe.Cash}.";
        }
        else
        {
            var topRisky = riskyScores
                .OrderByDescending(s => s.Score)
                .Take(T)
                .ToList();

            decimal weight = 1m / T;
            allocations = topRisky
                .Select(r => new Allocation(r.Ticker, weight))
                .ToList();
            modeLabel = "Offensive";
            reasoning =
                $"Canary {universe.Canary} 13612W = {canaryScore.Score:F4} > 0. " +
                $"Offensive mode: top {T} risky at {weight:P2} each — " +
                $"{string.Join(", ", topRisky.Select(r => $"{r.Ticker} ({r.Score:F4})"))}.";
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
