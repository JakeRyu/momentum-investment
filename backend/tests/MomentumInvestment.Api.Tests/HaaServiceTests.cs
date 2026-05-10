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
        // TIP positive (1.01 → score +0.19) → offensive.
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
    public void Decide_CanaryPositive_MixedRisky_TopFourTakenRegardlessOfSign()
    {
        // TIP positive → offensive. Risky has 3 positive + 5 negative.
        // Top 4 by score still picked, even though one of them is negative.
        // This matches Keller's HAA: the canary IS the on/off filter; once
        // bullish, individual asset signs don't gate inclusion — only ranking.
        // Ranked: SPY=1.90 > IWM=1.71 > VEA=1.52 > VWO=−0.19 > others lower.
        var prices = PricesFor(
            ("TIP", 1.01m),
            ("SPY", 1.10m), ("IWM", 1.09m), ("VEA", 1.08m), // 3 positive
            ("VWO", 0.99m),                                 // 1st of negatives, still top 4
            ("VNQ", 0.98m), ("DBC", 0.97m), ("IEF", 0.96m), ("TLT", 0.95m),
            ("BIL", 1.001m));

        var decision = new HaaService().Decide(AsOf, HaaUniverse.Us, prices);

        Assert.Equal("Offensive", decision.ModeLabel);
        Assert.Equal(4, decision.Allocations.Count);
        Assert.Equal(
            new[] { "SPY", "IWM", "VEA", "VWO" },
            decision.Allocations.Select(a => a.Ticker));
        Assert.All(decision.Allocations, a => Assert.Equal(0.25m, a.Weight));
    }

    [Fact]
    public void Decide_CanaryNegative_DefensiveMode_HundredPercentInCash()
    {
        // TIP negative (0.99 → score −0.19) → defensive regardless of risky.
        // Even though some risky have positive momentum, the canary gate
        // forces 100% into BIL.
        var prices = PricesFor(
            ("TIP", 0.99m),
            ("SPY", 1.10m), ("IWM", 1.09m), ("VEA", 1.08m), ("VWO", 1.07m),
            ("VNQ", 1.06m), ("DBC", 1.05m), ("IEF", 1.04m), ("TLT", 1.03m),
            ("BIL", 1.001m));

        var decision = new HaaService().Decide(AsOf, HaaUniverse.Us, prices);

        Assert.Equal("haa", decision.StrategyId);
        Assert.Equal("Defensive", decision.ModeLabel);
        Assert.Single(decision.Allocations);
        Assert.Equal("BIL", decision.Allocations[0].Ticker);
        Assert.Equal(1.0m, decision.Allocations[0].Weight);
    }

    [Fact]
    public void Decide_CanaryExactlyZero_DefensiveBoundary()
    {
        // TIP at 1.0 → score = 19·(1 − 1) = 0 exactly.
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
        Assert.Equal("BIL", decision.Allocations[0].Ticker);
    }

    [Fact]
    public void Decide_AllRiskyNegative_StillSelectsTopFourWhenCanaryBullish()
    {
        // Adversarial: TIP slightly positive (offensive) but every risky
        // is negative. Strategy still picks the 4 least-bad risky at 25%
        // each. The "correct" thing per Keller is to trust the canary; if
        // the user wants to override, it's their portfolio decision.
        var prices = PricesFor(
            ("TIP", 1.01m), // +0.19
            ("SPY", 0.99m), ("IWM", 0.98m), ("VEA", 0.97m), ("VWO", 0.96m),
            ("VNQ", 0.95m), ("DBC", 0.94m), ("IEF", 0.93m), ("TLT", 0.92m),
            ("BIL", 1.001m));

        var decision = new HaaService().Decide(AsOf, HaaUniverse.Us, prices);

        Assert.Equal("Offensive", decision.ModeLabel);
        Assert.Equal(4, decision.Allocations.Count);
        // Top 4 = least-bad: SPY, IWM, VEA, VWO.
        Assert.Equal(
            new[] { "SPY", "IWM", "VEA", "VWO" },
            decision.Allocations.Select(a => a.Ticker));
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

        // 1 canary + 8 risky + 1 cash = 10 score entries.
        Assert.Equal(10, decision.Scores.Count);
        Assert.Single(decision.Scores, s => s.Bucket == "Canary");
        Assert.Equal(8, decision.Scores.Count(s => s.Bucket == "Risky"));
        Assert.Single(decision.Scores, s => s.Bucket == "Cash");

        // Canary should be the first score row so the mobile UI's
        // bucket-order rendering shows it on top.
        Assert.Equal("Canary", decision.Scores[0].Bucket);
        Assert.Equal("TIP", decision.Scores[0].Ticker);
    }
}
