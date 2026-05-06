using MomentumInvestment.Api.Strategies;
using Xunit;

namespace MomentumInvestment.Api.Tests;

/// <summary>
/// PAA-G12 (PAA2) logic verification — bond fraction, top-T selection,
/// and the n ≤ 6 → 100% cash collapse for the canonical N=12, T=6, a=2
/// configuration.
///
/// Fixture: each ticker gets 12 monthly closes — eleven flat at 100,
/// then a final close = 100·ratio at asOf. With this shape,
///   SMA = (ratio·100 + 11·100) / 12 = 100·(ratio + 11)/12
///   momentum = ratio·100 / SMA − 1
///            = 12·ratio / (ratio + 11) − 1
///            = 11·(ratio − 1) / (ratio + 11)
/// so ratio &gt; 1 ⇒ momentum &gt; 0, ratio &lt; 1 ⇒ momentum &lt; 0,
/// ratio = 1 ⇒ momentum = 0. Easy to dial in any "n good" count.
/// </summary>
public sealed class PaaServiceTests
{
    private static readonly DateOnly AsOf = new(2026, 1, 30);

    private static IReadOnlyList<DailyClose> History(decimal currentRatio)
    {
        var entries = new List<DailyClose>();
        for (int m = 11; m >= 1; m--)
        {
            entries.Add(new DailyClose(AsOf.AddMonths(-m), 100m));
        }
        entries.Add(new DailyClose(AsOf, 100m * currentRatio));
        return entries;
    }

    /// <summary>
    /// Builds a prices dictionary covering every distinct ticker in the
    /// default PAA-G12 US universe. LQD is shared between risky and cash;
    /// supplying it once is enough — the universe's <c>AllTickers()</c>
    /// dedups before fetching.
    /// </summary>
    private static IReadOnlyDictionary<string, IReadOnlyList<DailyClose>> PricesFor(
        params (string Ticker, decimal Ratio)[] entries)
    {
        return entries.ToDictionary(e => e.Ticker, e => History(e.Ratio));
    }

    [Fact]
    public void Decide_AllTwelveGood_OffensiveMode_HoldsTopSixRiskyAtOneSixthEach()
    {
        // All 12 risky have ratio > 1 → n=12, BF=0, top 6 at 1/6 each.
        // Ranking determined by ratio (higher ratio → higher score).
        var prices = PricesFor(
            ("SPY", 1.10m), ("IWM", 1.09m), ("QQQ", 1.08m), ("VGK", 1.07m),
            ("EWJ", 1.06m), ("EEM", 1.05m), ("VNQ", 1.04m), ("GSG", 1.03m),
            ("GLD", 1.02m), ("HYG", 1.015m), ("LQD", 1.01m), ("TLT", 1.005m),
            ("IEF", 1.006m), ("SHY", 1.004m));

        var decision = new PaaService().Decide(AsOf, PaaUniverse.Us, prices);

        Assert.Equal("paa-g12", decision.StrategyId);
        Assert.Equal("Offensive", decision.ModeLabel);
        Assert.Equal(6, decision.Allocations.Count);
        Assert.All(decision.Allocations, a => Assert.Equal(1m / 6m, a.Weight));
        Assert.Equal(
            new[] { "SPY", "IWM", "QQQ", "VGK", "EWJ", "EEM" },
            decision.Allocations.Select(a => a.Ticker));
        Assert.Equal(1.0m, decision.Allocations.Sum(a => a.Weight), precision: 10);
    }

    [Fact]
    public void Decide_EightGood_HybridMode_HoldsTopSixAtScaledWeightPlusCash()
    {
        // n=8 good, 4 bad. BF = (12-8)/6 = 4/6 = 2/3.
        // Risky weight per holding = (1 − 2/3)/6 = 1/18.
        // Total risky = 6 × 1/18 = 1/3. Cash = 1 − 1/3 = 2/3 = BF.
        var prices = PricesFor(
            ("SPY", 1.10m), ("IWM", 1.09m), ("QQQ", 1.08m), ("VGK", 1.07m),
            ("EWJ", 1.06m), ("EEM", 1.05m), ("VNQ", 1.04m), ("GSG", 1.03m), // 8 good
            ("GLD", 0.99m), ("HYG", 0.98m), ("LQD", 0.97m), ("TLT", 0.96m), // 4 bad
            ("IEF", 1.006m), ("SHY", 1.004m));

        var decision = new PaaService().Decide(AsOf, PaaUniverse.Us, prices);

        Assert.Equal("Hybrid", decision.ModeLabel);
        Assert.Equal(7, decision.Allocations.Count); // 6 risky + 1 cash

        var riskyAllocs = decision.Allocations.Take(6).ToList();
        Assert.Equal(
            new[] { "SPY", "IWM", "QQQ", "VGK", "EWJ", "EEM" },
            riskyAllocs.Select(a => a.Ticker));
        Assert.All(riskyAllocs, a => Assert.Equal(1m / 18m, a.Weight, precision: 10));

        var cashAlloc = decision.Allocations[6];
        Assert.Equal("IEF", cashAlloc.Ticker);
        Assert.Equal(2m / 3m, cashAlloc.Weight, precision: 10);

        Assert.Equal(1.0m, decision.Allocations.Sum(a => a.Weight), precision: 10);
    }

    [Fact]
    public void Decide_SixGood_BoundaryDefensive_HundredPercentCash()
    {
        // n=6 (= protection threshold for a=2): BF = (12-6)/6 = 1 → 100% cash.
        // ≤ N − N1 inclusive — confirms the boundary is treated as defensive.
        var prices = PricesFor(
            ("SPY", 1.10m), ("IWM", 1.09m), ("QQQ", 1.08m), ("VGK", 1.07m),
            ("EWJ", 1.06m), ("EEM", 1.05m), // 6 good
            ("VNQ", 0.99m), ("GSG", 0.98m), ("GLD", 0.97m),
            ("HYG", 0.96m), ("LQD", 0.95m), ("TLT", 0.94m), // 6 bad
            ("IEF", 1.006m), ("SHY", 1.004m));

        var decision = new PaaService().Decide(AsOf, PaaUniverse.Us, prices);

        Assert.Equal("Defensive", decision.ModeLabel);
        Assert.Single(decision.Allocations);
        Assert.Equal("IEF", decision.Allocations[0].Ticker);
        Assert.Equal(1.0m, decision.Allocations[0].Weight);
    }

    [Fact]
    public void Decide_AllBad_DefensiveMode_HundredPercentInBestCash()
    {
        // n=0 → BF = 12/6 = 2, capped to 1 → 100% cash.
        var prices = PricesFor(
            ("SPY", 0.95m), ("IWM", 0.94m), ("QQQ", 0.93m), ("VGK", 0.92m),
            ("EWJ", 0.91m), ("EEM", 0.90m), ("VNQ", 0.89m), ("GSG", 0.88m),
            ("GLD", 0.87m), ("HYG", 0.86m), ("LQD", 0.85m), ("TLT", 0.84m),
            ("IEF", 1.006m), ("SHY", 1.004m));

        var decision = new PaaService().Decide(AsOf, PaaUniverse.Us, prices);

        Assert.Equal("Defensive", decision.ModeLabel);
        Assert.Single(decision.Allocations);
        Assert.Equal("IEF", decision.Allocations[0].Ticker);
        Assert.Equal(1.0m, decision.Allocations[0].Weight);
    }

    [Fact]
    public void Decide_RiskyAtZeroMomentum_TreatedAsNotGood_BoundaryIsExclusive()
    {
        // VNQ has ratio 1.00 → momentum exactly 0. Keller's rule treats > 0
        // as good, so this is *not* counted: 6 strictly-good + VNQ neutral
        // + 5 bad → n=6 → still defensive (≤ threshold).
        var prices = PricesFor(
            ("SPY", 1.10m), ("IWM", 1.09m), ("QQQ", 1.08m), ("VGK", 1.07m),
            ("EWJ", 1.06m), ("EEM", 1.05m),
            ("VNQ", 1.00m), // exactly 0
            ("GSG", 0.98m), ("GLD", 0.97m),
            ("HYG", 0.96m), ("LQD", 0.95m), ("TLT", 0.94m),
            ("IEF", 1.006m), ("SHY", 1.004m));

        var decision = new PaaService().Decide(AsOf, PaaUniverse.Us, prices);

        Assert.Equal("Defensive", decision.ModeLabel);
        Assert.Single(decision.Allocations);
    }

    [Fact]
    public void Decide_SevenGood_JustAboveThreshold_LeavesTinyRiskyExposure()
    {
        // n=7: BF = (12-7)/6 = 5/6 ≈ 83% cash, 17% risky.
        // Each of top 6 risky = (1 − 5/6)/6 = 1/36. Total risky = 6/36 = 1/6.
        var prices = PricesFor(
            ("SPY", 1.10m), ("IWM", 1.09m), ("QQQ", 1.08m), ("VGK", 1.07m),
            ("EWJ", 1.06m), ("EEM", 1.05m), ("VNQ", 1.04m), // 7 good
            ("GSG", 0.99m), ("GLD", 0.97m), ("HYG", 0.96m),
            ("LQD", 0.95m), ("TLT", 0.94m), // 5 bad
            ("IEF", 1.006m), ("SHY", 1.004m));

        var decision = new PaaService().Decide(AsOf, PaaUniverse.Us, prices);

        Assert.Equal("Hybrid", decision.ModeLabel);
        Assert.Equal(7, decision.Allocations.Count);
        Assert.All(decision.Allocations.Take(6), a => Assert.Equal(1m / 36m, a.Weight, precision: 10));
        Assert.Equal("IEF", decision.Allocations[6].Ticker);
        Assert.Equal(5m / 6m, decision.Allocations[6].Weight, precision: 10);
        Assert.Equal(1.0m, decision.Allocations.Sum(a => a.Weight), precision: 10);
    }

    [Fact]
    public void Decide_ScoresIncludedForBothBuckets_DuplicatesAcrossBucketsLabelledSeparately()
    {
        var prices = PricesFor(
            ("SPY", 1.10m), ("IWM", 1.09m), ("QQQ", 1.08m), ("VGK", 1.07m),
            ("EWJ", 1.06m), ("EEM", 1.05m), ("VNQ", 1.04m), ("GSG", 1.03m),
            ("GLD", 1.02m), ("HYG", 1.015m), ("LQD", 1.01m), ("TLT", 1.005m),
            ("IEF", 1.006m), ("SHY", 1.004m));

        var decision = new PaaService().Decide(AsOf, PaaUniverse.Us, prices);

        // Risky: 12 entries. Cash: IEF, SHY, LQD = 3 entries.
        // LQD appears in both buckets so total = 12 + 3 = 15.
        Assert.Equal(15, decision.Scores.Count);
        Assert.Equal(12, decision.Scores.Count(s => s.Bucket == "Risky"));
        Assert.Equal(3, decision.Scores.Count(s => s.Bucket == "Cash"));

        var lqdEntries = decision.Scores.Where(s => s.Ticker == "LQD").ToList();
        Assert.Equal(2, lqdEntries.Count);
        Assert.Single(lqdEntries.Where(s => s.Bucket == "Risky"));
        Assert.Single(lqdEntries.Where(s => s.Bucket == "Cash"));
        Assert.Equal(lqdEntries[0].Score, lqdEntries[1].Score);
    }
}
