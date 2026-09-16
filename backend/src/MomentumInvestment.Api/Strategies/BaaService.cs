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

    /// <summary>Defensive selection size (paper: TD=3).</summary>
    public const int TD = 3;

    /// <summary>
    /// A defensive pick scoring below this asset is replaced by it —
    /// the absolute-momentum floor on the Top-3 (paper, step 3).
    /// </summary>
    public const string CashFloorTicker = "BIL";

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

        // 13612W is the fast filter, and the paper uses it for the
        // canary only (LP=0). Ranking both sleeves is the slow SMA12
        // (LO=LD=12) — "slow relative momentum with fast absolute
        // momentum" is the whole design.
        foreach (var ticker in universe.Canary)
        {
            thirteen612WByTicker[ticker] = MomentumScorer.Score13612W(ticker, asOf, dailyByTicker, _logger);
        }
        foreach (var ticker in universe.Risky.Concat(universe.Cash).Distinct())
        {
            sma12ByTicker[ticker] = MomentumScorer.ScoreSMA12(ticker, asOf, dailyByTicker, _logger);
        }

        var canaryScores = universe.Canary
            .Select(t => new AssetMomentum(t, thirteen612WByTicker[t], Bucket: "Canary"))
            .ToList();
        var riskyScores = universe.Risky
            .Select(t => new AssetMomentum(t, sma12ByTicker[t], Bucket: "Risky"))
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
                $"All {canaryScores.Count} canary assets are trending up, so the strategy " +
                $"holds the {T} strongest risky assets at {weight:P2} each — " +
                $"{string.Join(", ", topRisky.Select(r => r.Ticker))}.";
        }
        else
        {
            // TD=3 by SMA12, then absolute momentum: a pick whose score
            // is below BIL's own is not worth holding over cash, so it
            // becomes BIL. Several slots can collapse onto BIL, so the
            // weights are summed per ticker rather than listed twice.
            var topCash = cashScores
                .OrderByDescending(s => s.Score)
                .Take(TD)
                .ToList();

            var bilScore = cashScores.FirstOrDefault(s =>
                string.Equals(s.Ticker, CashFloorTicker, StringComparison.OrdinalIgnoreCase));

            decimal cashWeight = 1m / TD;
            var byTicker = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
            int replaced = 0;
            foreach (var pick in topCash)
            {
                var ticker = pick.Ticker;
                if (bilScore is not null && pick.Score < bilScore.Score)
                {
                    ticker = bilScore.Ticker;
                    replaced++;
                }
                byTicker[ticker] = byTicker.TryGetValue(ticker, out var w) ? w + cashWeight : cashWeight;
            }

            allocations = byTicker
                .Select(kv => new Allocation(kv.Key, kv.Value))
                .ToList();
            modeLabel = "Defensive";

            var bad = canaryScores.Where(c => c.Score <= 0m).ToList();
            reasoning =
                $"{bad.Count} of {canaryScores.Count} canary assets have turned down " +
                $"({string.Join(", ", bad.Select(c => c.Ticker))}) — this strategy needs every " +
                $"one of them rising — so it has moved fully into the defensive sleeve: " +
                $"{string.Join(", ", allocations.Select(a => a.Ticker))}" +
                (replaced > 0
                    ? $", with {replaced} of the {TD} slots falling back to {CashFloorTicker} for " +
                      $"trailing {CashFloorTicker} itself."
                    : ".");
        }

        return new AllocationDecision(
            StrategyId: StrategyId,
            AsOf: asOf,
            PricesAsOf: LookbackPriceLookup.ResolvePriceDate(asOf, dailyByTicker),
            ModeLabel: modeLabel,
            Allocations: allocations,
            Scores: allScores,
            Reasoning: reasoning);
    }
}
