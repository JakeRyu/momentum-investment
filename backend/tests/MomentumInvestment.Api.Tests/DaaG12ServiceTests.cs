using MomentumInvestment.Api.Strategies;
using Xunit;

namespace MomentumInvestment.Api.Tests;

/// <summary>
/// DAA-G12 logic verification — the three discrete states (b ∈ {0, 1, 2})
/// produced by the canary breadth count. Same fixture pattern as the VAA
/// tests: a 5-point chronologically sorted history at the lookback targets,
/// with score == 19·(currentRatio − 1) when the prior four prices are flat.
/// </summary>
public sealed class DaaG12ServiceTests
{
    private static readonly DateOnly AsOf = new(2026, 1, 30);

    private static IReadOnlyList<DailyClose> History(decimal currentRatio)
    {
        return new List<DailyClose>
        {
            new(AsOf.AddMonths(-12), 100m),
            new(AsOf.AddMonths(-6),  100m),
            new(AsOf.AddMonths(-3),  100m),
            new(AsOf.AddMonths(-1),  100m),
            new(AsOf,                100m * currentRatio),
        };
    }

    /// <summary>
    /// Builds a prices dictionary covering every distinct ticker in the
    /// default DAA-G12 US universe. Each entry maps ticker → ratio. Tickers
    /// shared across buckets (VWO is canary+risky, LQD is risky+cash) are
    /// fetched once with a single ratio.
    /// </summary>
    private static IReadOnlyDictionary<string, IReadOnlyList<DailyClose>> PricesFor(
        params (string Ticker, decimal Ratio)[] entries)
    {
        return entries.ToDictionary(e => e.Ticker, e => History(e.Ratio));
    }

    [Fact]
    public void Decide_BothCanaryPositive_OffensiveMode_HoldsTopSixRiskyAtOneSixthEach()
    {
        // Canary both positive: VWO=+0.19, BND=+0.19.
        // Risky (sorted high → low):
        //   SPY=1.90, IWM=1.71, QQQ=1.52, VGK=1.33, EWJ=1.14, VWO=0.19, VNQ=-0.19,
        //   GSG=-0.38, GLD=-0.57, TLT=-0.76, HYG=-0.95, LQD=-1.14
        // Top 6 = SPY, IWM, QQQ, VGK, EWJ, VWO at 1/6 each.
        var prices = PricesFor(
            ("VWO", 1.01m),  // canary+risky
            ("BND", 1.01m),  // canary
            ("SPY", 1.10m),
            ("IWM", 1.09m),
            ("QQQ", 1.08m),
            ("VGK", 1.07m),
            ("EWJ", 1.06m),
            ("VNQ", 0.99m),
            ("GSG", 0.98m),
            ("GLD", 0.97m),
            ("TLT", 0.96m),
            ("HYG", 0.95m),
            ("LQD", 0.94m),  // risky+cash
            ("SHY", 1.005m),
            ("IEF", 1.003m));

        var decision = new DaaG12Service().Decide(AsOf, DaaG12Universe.Us, prices);

        Assert.Equal("daa-g12", decision.StrategyId);
        Assert.Equal("Offensive", decision.ModeLabel);
        Assert.Equal(6, decision.Allocations.Count);
        Assert.All(decision.Allocations, a => Assert.Equal(1m / 6m, a.Weight));
        // Total weight ≈ 1.0 (6 × 1/6). Decimal can't represent 1/6 exactly,
        // so the sum overshoots by ~1e-27. Compare with tolerance.
        Assert.Equal(1.0m, decision.Allocations.Sum(a => a.Weight), precision: 10);
        // Top 6 by score (SPY > IWM > QQQ > VGK > EWJ > VWO).
        Assert.Equal(
            new[] { "SPY", "IWM", "QQQ", "VGK", "EWJ", "VWO" },
            decision.Allocations.Select(a => a.Ticker));
    }

    [Fact]
    public void Decide_OneCanaryBad_HybridMode_HoldsTopThreeRiskyAtOneSixthPlusFiftyPercentCash()
    {
        // BND canary bad (ratio 0.95 → score -0.95 ≤ 0). VWO canary good (+0.19).
        // Risky top 3 (descending): SPY=1.90, IWM=1.71, QQQ=1.52.
        // Cash top 1 by score: SHY=0.095, IEF=0.057, LQD=-1.14 (LQD shared
        // with risky bucket but separately listed in cash). Best cash = SHY.
        var prices = PricesFor(
            ("VWO", 1.01m),
            ("BND", 0.95m),  // bad canary
            ("SPY", 1.10m),
            ("IWM", 1.09m),
            ("QQQ", 1.08m),
            ("VGK", 1.07m),
            ("EWJ", 1.06m),
            ("VNQ", 0.99m),
            ("GSG", 0.98m),
            ("GLD", 0.97m),
            ("TLT", 0.96m),
            ("HYG", 0.95m),
            ("LQD", 0.94m),
            ("SHY", 1.005m),
            ("IEF", 1.003m));

        var decision = new DaaG12Service().Decide(AsOf, DaaG12Universe.Us, prices);

        Assert.Equal("Hybrid", decision.ModeLabel);
        Assert.Equal(4, decision.Allocations.Count);

        // Per-asset risky weight stays at 1/6 even though the count drops to 3.
        var riskyAllocs = decision.Allocations.Take(3).ToList();
        Assert.Equal(
            new[] { "SPY", "IWM", "QQQ" },
            riskyAllocs.Select(a => a.Ticker));
        Assert.All(riskyAllocs, a => Assert.Equal(1m / 6m, a.Weight));

        // Cash slice: 50% in best cash asset.
        var cashAlloc = decision.Allocations[3];
        Assert.Equal("SHY", cashAlloc.Ticker);
        Assert.Equal(0.5m, cashAlloc.Weight);

        // Risky 3×(1/6) + cash 0.5 ≈ 1.0. Decimal can't represent 1/6 exactly,
        // so the sum overshoots by ~1e-27. Compare with tolerance.
        Assert.Equal(1.0m, decision.Allocations.Sum(a => a.Weight), precision: 10);
    }

    [Fact]
    public void Decide_BothCanaryBad_DefensiveMode_HoldsHundredPercentInBestCash()
    {
        // Both canaries bad → CF=1.0, t=0. Cash universe momentum (descending):
        // SHY=+0.095, IEF=+0.057, LQD=-1.14. Best cash = SHY.
        var prices = PricesFor(
            ("VWO", 0.99m),  // bad canary (score -0.19)
            ("BND", 0.95m),  // bad canary (score -0.95)
            ("SPY", 1.10m),
            ("IWM", 1.09m),
            ("QQQ", 1.08m),
            ("VGK", 1.07m),
            ("EWJ", 1.06m),
            ("VNQ", 1.05m),
            ("GSG", 1.04m),
            ("GLD", 1.03m),
            ("TLT", 1.02m),
            ("HYG", 1.01m),
            ("LQD", 0.94m),
            ("SHY", 1.005m),
            ("IEF", 1.003m));

        var decision = new DaaG12Service().Decide(AsOf, DaaG12Universe.Us, prices);

        Assert.Equal("Defensive", decision.ModeLabel);
        Assert.Single(decision.Allocations);
        Assert.Equal("SHY", decision.Allocations[0].Ticker);
        Assert.Equal(1.0m, decision.Allocations[0].Weight);
    }

    [Fact]
    public void Decide_CanaryAtZero_TreatedAsBad_BoundaryIsInclusive()
    {
        // VWO flat (ratio 1.0 → score exactly 0). Keller's rule: <= 0 is "bad",
        // so this should still trigger the hybrid (b=1) path.
        var prices = PricesFor(
            ("VWO", 1.00m),  // exactly zero score
            ("BND", 1.01m),  // good canary
            ("SPY", 1.10m),
            ("IWM", 1.09m),
            ("QQQ", 1.08m),
            ("VGK", 1.07m),
            ("EWJ", 1.06m),
            ("VNQ", 0.99m),
            ("GSG", 0.98m),
            ("GLD", 0.97m),
            ("TLT", 0.96m),
            ("HYG", 0.95m),
            ("LQD", 0.94m),
            ("SHY", 1.005m),
            ("IEF", 1.003m));

        var decision = new DaaG12Service().Decide(AsOf, DaaG12Universe.Us, prices);

        Assert.Equal("Hybrid", decision.ModeLabel);
        // 3 risky × 1/6 + 1 cash × 0.5 = 4 entries, sum 1.0.
        Assert.Equal(4, decision.Allocations.Count);
        Assert.Equal(0.5m, decision.Allocations[^1].Weight);
    }

    [Fact]
    public void Decide_ScoresIncludedForAllThreeBuckets_DuplicatesAcrossBucketsLabelledSeparately()
    {
        var prices = PricesFor(
            ("VWO", 1.01m),
            ("BND", 1.01m),
            ("SPY", 1.10m),
            ("IWM", 1.09m),
            ("QQQ", 1.08m),
            ("VGK", 1.07m),
            ("EWJ", 1.06m),
            ("VNQ", 0.99m),
            ("GSG", 0.98m),
            ("GLD", 0.97m),
            ("TLT", 0.96m),
            ("HYG", 0.95m),
            ("LQD", 0.94m),
            ("SHY", 1.005m),
            ("IEF", 1.003m));

        var decision = new DaaG12Service().Decide(AsOf, DaaG12Universe.Us, prices);

        // Canary: VWO, BND  → 2 entries
        // Risky:  12 tickers → 12 entries
        // Cash:   SHY, IEF, LQD → 3 entries
        // Total scores rows: 2 + 12 + 3 = 17 (VWO and LQD are deliberately
        // duplicated across buckets so the UI can render them in each).
        Assert.Equal(17, decision.Scores.Count);
        Assert.Equal(2,  decision.Scores.Count(s => s.Bucket == "Canary"));
        Assert.Equal(12, decision.Scores.Count(s => s.Bucket == "Risky"));
        Assert.Equal(3,  decision.Scores.Count(s => s.Bucket == "Cash"));

        // VWO appears once as Canary and once as Risky, with the same score.
        var vwoEntries = decision.Scores.Where(s => s.Ticker == "VWO").ToList();
        Assert.Equal(2, vwoEntries.Count);
        Assert.Single(vwoEntries.Where(s => s.Bucket == "Canary"));
        Assert.Single(vwoEntries.Where(s => s.Bucket == "Risky"));
        Assert.Equal(vwoEntries[0].Score, vwoEntries[1].Score);
    }
}
