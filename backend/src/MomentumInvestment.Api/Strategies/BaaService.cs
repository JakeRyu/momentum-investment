using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace MomentumInvestment.Api.Strategies;

/// <summary>
/// BAA-G12 — Bold Asset Allocation (Keller, 2022).
///
/// "Bold" because the canary gate is unanimous-AND rather than DAA's
/// breadth count: ALL canaries (TIP, IEF, BIL) must have positive
/// 13612W to enter offensive. Otherwise the portfolio collapses to a
/// single defensive holding.
///
///   ALL canaries 13612W &gt; 0  →  top T=6 risky by 13612W at 1/T each
///   ANY canary  13612W ≤ 0    →  top 1 cash by SMA12 at 100%
///
/// Two signal types coexist in one strategy: 13612W gates the regime
/// and ranks risky; SMA12 (PAA-style) ranks cash. The mixed signals are
/// deliberate — Keller argues SMA12 better captures slow defensive
/// trends while 13612W's heavier short-term weights better capture the
/// risk-on impulses the canary tries to confirm.
///
/// Reference: Keller, "Bold Asset Allocation: A Tactical Asset Allocation
/// Strategy with Aggressive Crash Protection", SSRN 4166845, 2022.
/// </summary>
public sealed class BaaService : IAllocationStrategy<BaaUniverse>
{
    public string StrategyId => "baa-g12";

    /// <summary>Top-risky selection parameter when offensive. T=6 of 12.</summary>
    public const int T = 6;

    private readonly ILogger<BaaService> _logger;

    public BaaService(ILogger<BaaService>? logger = null)
    {
        _logger = logger ?? NullLogger<BaaService>.Instance;
    }

    public AllocationDecision Decide(
        DateOnly asOf,
        BaaUniverse universe,
        IReadOnlyDictionary<string, IReadOnlyList<DailyClose>> dailyByTicker)
    {
        // Score per role. Tickers can appear in multiple buckets (IEF in
        // canary+cash, LQD in risky+cash) so cache by (ticker, signal-type)
        // — same ticker may legitimately need both 13612W (canary/risky
        // role) and SMA12 (cash role) scoring.
        var thirteen612WByTicker = new Dictionary<string, decimal>();
        var sma12ByTicker = new Dictionary<string, decimal>();

        // 13612W is needed for canary + risky.
        foreach (var ticker in universe.Canary.Concat(universe.Risky).Distinct())
        {
            thirteen612WByTicker[ticker] = MomentumScorer.Score13612W(ticker, asOf, dailyByTicker, _logger);
        }
        // SMA12 is needed for cash only.
        foreach (var ticker in universe.Cash)
        {
            sma12ByTicker[ticker] = MomentumScorer.ScoreSMA12(ticker, asOf, dailyByTicker, _logger);
        }

        var canaryScores = universe.Canary
            .Select(t => new AssetMomentum(t, thirteen612WByTicker[t], Bucket: "Canary"))
            .ToList();
        var riskyScores = universe.Risky
            .Select(t => new AssetMomentum(t, thirteen612WByTicker[t], Bucket: "Risky"))
            .ToList();
        var cashScores = universe.Cash
            .Select(t => new AssetMomentum(t, sma12ByTicker[t], Bucket: "Cash"))
            .ToList();

        var allScores = new List<AssetMomentum>();
        allScores.AddRange(canaryScores);
        allScores.AddRange(riskyScores);
        allScores.AddRange(cashScores);

        // Bold canary gate — unanimous AND. A single non-positive canary
        // forces defensive, regardless of how strong the others are.
        // Keller's "≤ 0" semantics same as DAA/HAA/PAA conventions.
        bool allCanaryGood = canaryScores.All(s => s.Score > 0m);

        List<Allocation> allocations;
        string modeLabel;
        string reasoning;

        if (allCanaryGood)
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
                $"All {canaryScores.Count} canaries positive (" +
                $"{string.Join(", ", canaryScores.Select(c => $"{c.Ticker}={c.Score:F4}"))}). " +
                $"Offensive mode: top {T} risky at {weight:P2} each — " +
                $"{string.Join(", ", topRisky.Select(r => $"{r.Ticker} ({r.Score:F4})"))}.";
        }
        else
        {
            var topCash = cashScores.OrderByDescending(s => s.Score).First();
            allocations = new List<Allocation>
            {
                new Allocation(topCash.Ticker, 1m),
            };
            modeLabel = "Defensive";

            var bad = canaryScores.Where(c => c.Score <= 0m).ToList();
            reasoning =
                $"{bad.Count} of {canaryScores.Count} canaries non-positive (" +
                $"{string.Join(", ", bad.Select(c => $"{c.Ticker}={c.Score:F4}"))}). " +
                $"Defensive mode: 100% in top cash {topCash.Ticker} (SMA12 = {topCash.Score:F4}).";
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
