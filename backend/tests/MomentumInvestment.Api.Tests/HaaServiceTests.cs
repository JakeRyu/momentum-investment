using MomentumInvestment.Api.Strategies;
using Xunit;

namespace MomentumInvestment.Api.Tests;

/// <summary>
/// HAA logic verification — the canary on/off switch and top-T=4
/// selection from the 8-risky universe.
///
/// Same 5-point lookback fixture as VAA/DAA: score = 19·(currentRatio − 1)
/// when the prior four prices are flat at 100.
/// </summary>
public sealed class HaaServiceTests
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

    private static IReadOnlyDictionary<string, IReadOnlyList<DailyClose>> PricesFor(
        params (string Ticker, decimal Ratio)[] entries)
    {
        return entries.ToDictionary(e => e.Ticker, e => History(e.Ratio));
    }

    [Fact]
    public void Decide_CanaryPositive_AllRiskyPositive_OffensiveTopFourAtTwentyFivePercent()
    {
        // TIP positive (1.01 → 13612U +0.01) → offensive.
        // 8 risky all positive, ranked SPY > IWM > VEA > VWO > VNQ > DBC > IEF > TLT.
        // Top T=4 = SPY, IWM, VEA, VWO at 25% each.
        var prices = PricesFor(
            ("TIP", 1.01m),
            ("SPY", 1.10m), ("IWM", 1.09m), ("VEA", 1.08m), ("VWO", 1.07m),
            ("VNQ", 1.06m), ("DBC", 1.05m), ("IEF", 1.04m), ("TLT", 1.03m),
            ("BIL", 1.001m));

        var decision = new HaaService().Decide(AsOf, HaaUniverse.Us, prices);

        Assert.Equal("haa", decision.StrategyId);
        Assert.Equal("Offensive", decision.ModeLabel);
        Assert.Equal(4, decision.Allocations.Count);
        Assert.All(decision.Allocations, a => Assert.Equal(0.25m, a.Weight));
        Assert.Equal(
            new[] { "SPY", "IWM", "VEA", "VWO" },
            decision.Allocations.Select(a => a.Ticker));
        Assert.Equal(1.0m, decision.Allocations.Sum(a => a.Weight), precision: 10);
    }

    [Fact]
    public void Decide_CanaryPositive_BadAssetInTopFour_SendsThatQuarterToCash()
    {
        // The "hybrid" half. TIP positive so the regime is risk-on, but
        // the 4th-ranked asset (VWO, -0.01) is not rising, so its quarter
        // goes to cash instead of being held. One month can be part
        // invested and part defensive.
        // Cash universe: BIL +0.001 beats IEF -0.04, so BIL is "cash".
        var prices = PricesFor(
            ("TIP", 1.01m),
            ("SPY", 1.10m), ("IWM", 1.09m), ("VEA", 1.08m),
            ("VWO", 0.99m),
            ("VNQ", 0.98m), ("DBC", 0.97m), ("IEF", 0.96m), ("TLT", 0.95m),
            ("BIL", 1.001m));

        var decision = new HaaService().Decide(AsOf, HaaUniverse.Us, prices);

        Assert.Equal("Hybrid", decision.ModeLabel);
        Assert.Equal(
            new[] { "SPY", "IWM", "VEA", "BIL" },
            decision.Allocations.Select(a => a.Ticker));
        Assert.All(decision.Allocations, a => Assert.Equal(0.25m, a.Weight));
        Assert.Equal(1.0m, decision.Allocations.Sum(a => a.Weight), precision: 10);
    }

    [Fact]
    public void Decide_CanaryPositive_EveryTopFourAssetBad_GoesFullyToCash()
    {
        // Canary still bullish, but nothing in the Top-4 is rising, so
        // all four quarters go to cash. Before this strategy implemented
        // dual momentum it stayed 100% invested in the least-bad four.
        // Cash: BIL +0.001 beats IEF -0.07.
        var prices = PricesFor(
            ("TIP", 1.01m),
            ("SPY", 0.99m), ("IWM", 0.98m), ("VEA", 0.97m), ("VWO", 0.96m),
            ("VNQ", 0.95m), ("DBC", 0.94m), ("IEF", 0.93m), ("TLT", 0.92m),
            ("BIL", 1.001m));

        var decision = new HaaService().Decide(AsOf, HaaUniverse.Us, prices);

        Assert.Equal("Hybrid", decision.ModeLabel);
        Assert.Single(decision.Allocations);
        Assert.Equal("BIL", decision.Allocations[0].Ticker);
        Assert.Equal(1.0m, decision.Allocations[0].Weight);
    }

    [Fact]
    public void Decide_CanaryNegative_DefensiveMode_HundredPercentInCash()
    {
        // TIP negative (0.99 → 13612U −0.01) → defensive regardless of risky.
        // Even though some risky have positive momentum, the canary gate
        // forces everything into cash.
        var prices = PricesFor(
            ("TIP", 0.99m),
            ("SPY", 1.10m), ("IWM", 1.09m), ("VEA", 1.08m), ("VWO", 1.07m),
            ("VNQ", 1.06m), ("DBC", 1.05m), ("IEF", 1.04m), ("TLT", 1.03m),
            ("BIL", 1.001m));

        var decision = new HaaService().Decide(AsOf, HaaUniverse.Us, prices);

        Assert.Equal("haa", decision.StrategyId);
        Assert.Equal("Defensive", decision.ModeLabel);
        Assert.Single(decision.Allocations);
        // ND=2, TD=1: cash is the better of BIL (+0.001) and IEF (+0.04).
        Assert.Equal("IEF", decision.Allocations[0].Ticker);
        Assert.Equal(1.0m, decision.Allocations[0].Weight);
    }

    [Fact]
    public void Decide_CanaryExactlyZero_DefensiveBoundary()
    {
        // TIP at 1.0 → 13612U = 0 exactly.
        // The defensive gate is ≤ 0 (inclusive), so this lands defensive.
        // Same convention as DAA's canary check and PAA's "good" definition.
        var prices = PricesFor(
            ("TIP", 1.00m), // momentum exactly 0
            ("SPY", 1.10m), ("IWM", 1.09m), ("VEA", 1.08m), ("VWO", 1.07m),
            ("VNQ", 1.06m), ("DBC", 1.05m), ("IEF", 1.04m), ("TLT", 1.03m),
            ("BIL", 1.001m));

        var decision = new HaaService().Decide(AsOf, HaaUniverse.Us, prices);

        Assert.Equal("Defensive", decision.ModeLabel);
        Assert.Single(decision.Allocations);
        Assert.Equal("IEF", decision.Allocations[0].Ticker);
    }

    [Fact]
    public void Decide_ScoresIncludeCanaryRiskyAndCashWithCorrectBuckets()
    {
        var prices = PricesFor(
            ("TIP", 1.01m),
            ("SPY", 1.10m), ("IWM", 1.09m), ("VEA", 1.08m), ("VWO", 1.07m),
            ("VNQ", 1.06m), ("DBC", 1.05m), ("IEF", 1.04m), ("TLT", 1.03m),
            ("BIL", 1.001m));

        var decision = new HaaService().Decide(AsOf, HaaUniverse.Us, prices);

        // 1 canary + 8 risky + 2 cash = 11 score entries. IEF appears
        // twice by design: it is both a risky asset and a cash candidate.
        Assert.Equal(11, decision.Scores.Count);
        Assert.Single(decision.Scores, s => s.Bucket == "Canary");
        Assert.Equal(8, decision.Scores.Count(s => s.Bucket == "Risky"));
        Assert.Equal(2, decision.Scores.Count(s => s.Bucket == "Cash"));

        // Canary should be the first score row so the mobile UI's
        // bucket-order rendering shows it on top.
        Assert.Equal("Canary", decision.Scores[0].Bucket);
        Assert.Equal("TIP", decision.Scores[0].Ticker);
    }

    [Fact]
    public void Decide_AsOfAfterTheLastClose_ReportsTheCloseItUsed()
    {
        var prices = PricesFor(
            ("TIP", 1.01m),
            ("SPY", 1.10m), ("IWM", 1.09m), ("VEA", 1.08m), ("VWO", 1.07m),
            ("VNQ", 1.06m), ("DBC", 1.05m), ("IEF", 1.04m), ("TLT", 1.03m),
            ("BIL", 1.001m));

        var decision = new HaaService().Decide(AsOf.AddDays(2), HaaUniverse.Us, prices);

        Assert.Equal(AsOf.AddDays(2), decision.AsOf);
        Assert.Equal(AsOf, decision.PricesAsOf);
    }
}
