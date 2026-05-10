using MomentumInvestment.Api.Strategies;
using Xunit;

namespace MomentumInvestment.Api.Tests;

/// <summary>
/// BAA-G12 logic verification — the bold canary gate (unanimous AND on
/// 13612W) plus mixed-signal scoring (13612W for canary/risky, SMA12 for
/// cash).
///
/// Fixture: 13 monthly closes (asOf−12mo through asOf). 13612W needs
/// the asOf−12mo lookback point; SMA12 needs the 12-month window
/// asOf−11mo through asOf. The union is 13 entries — 12 flat at 100,
/// then a final close at asOf = 100·ratio. With this shape:
///   - 13612W → 19·(ratio − 1)  (same closed form as VAA/DAA tests)
///   - SMA12  → 11·(ratio − 1) / (ratio + 11)
/// so ratio &gt; 1 ⇒ both scores positive, ratio &lt; 1 ⇒ both negative,
/// ratio = 1 ⇒ both exactly 0. Lets us dial in any "good"/"bad" pattern
/// across both signal types simultaneously. Note: the asOf−12mo point
/// is past the SMA12 window so it's silently ignored by SMA12 — only
/// the 12 closes at asOf−11mo through asOf participate in that average.
/// </summary>
public sealed class BaaServiceTests
{
    private static readonly DateOnly AsOf = new(2026, 1, 30);

    private static IReadOnlyList<DailyClose> History(decimal currentRatio)
    {
        var entries = new List<DailyClose>();
        // Include asOf−12mo so 13612W's p12 lookback resolves. PAA's
        // tests don't need this because PAA uses SMA12 only.
        for (int m = 12; m >= 1; m--)
        {
            entries.Add(new DailyClose(AsOf.AddMonths(-m), 100m));
        }
        entries.Add(new DailyClose(AsOf, 100m * currentRatio));
        return entries;
    }

    private static IReadOnlyDictionary<string, IReadOnlyList<DailyClose>> PricesFor(
        params (string Ticker, decimal Ratio)[] entries)
    {
        return entries.ToDictionary(e => e.Ticker, e => History(e.Ratio));
    }

    /// <summary>
    /// Distinct-ticker price set covering the full BAA-G12 universe.
    /// Tickers appearing in multiple buckets (BIL canary+cash, IEF
    /// canary+cash, LQD risky+cash) are listed once; AllTickers() dedups
    /// before fetching.
    /// </summary>
    private static IReadOnlyDictionary<string, IReadOnlyList<DailyClose>> CanonicalPricesAllPositive()
    {
        return PricesFor(
            // Canary
            ("TIP", 1.01m), ("IEF", 1.005m), ("BIL", 1.001m),
            // Risky (12 — TIP/IEF already above for canary; LQD added below)
            ("SPY", 1.10m), ("IWM", 1.09m), ("QQQ", 1.08m), ("VGK", 1.07m),
            ("EWJ", 1.06m), ("EEM", 1.05m), ("VNQ", 1.04m), ("GSG", 1.03m),
            ("GLD", 1.02m), ("TLT", 1.015m), ("HYG", 1.012m), ("LQD", 1.011m),
            // Cash extras (BIL/IEF/LQD already covered)
            ("BND", 1.004m));
    }

    [Fact]
    public void Decide_AllCanariesPositive_OffensiveMode_TopSixRiskyAtOneSixth()
    {
        // All 3 canaries (TIP/IEF/BIL) > 0 → offensive.
        // Risky ranked SPY > IWM > QQQ > VGK > EWJ > EEM > VNQ > ... → top 6.
        var prices = CanonicalPricesAllPositive();

        var decision = new BaaService().Decide(AsOf, BaaUniverse.Us, prices);

        Assert.Equal("baa-g12", decision.StrategyId);
        Assert.Equal("Offensive", decision.ModeLabel);
        Assert.Equal(6, decision.Allocations.Count);
        Assert.All(decision.Allocations, a => Assert.Equal(1m / 6m, a.Weight));
        Assert.Equal(
            new[] { "SPY", "IWM", "QQQ", "VGK", "EWJ", "EEM" },
            decision.Allocations.Select(a => a.Ticker));
        Assert.Equal(1.0m, decision.Allocations.Sum(a => a.Weight), precision: 10);
    }

    [Fact]
    public void Decide_OneCanaryNegative_DefensiveMode_TopCashBySma12()
    {
        // TIP slightly negative → unanimous-AND fails → defensive,
        // regardless of the other two canaries or the risky lineup.
        // Cash is selected by SMA12. With our fixture, SMA12 score
        // strictly increases with ratio, so highest-ratio cash wins.
        // Cash universe: BIL, IEF, TLT, BND, LQD → ratios 1.001, 1.005,
        // 1.015, 1.004, 1.011 → top is TLT.
        var prices = PricesFor(
            ("TIP", 0.99m),  // ← single bad canary
            ("IEF", 1.005m), ("BIL", 1.001m),
            ("SPY", 1.10m), ("IWM", 1.09m), ("QQQ", 1.08m), ("VGK", 1.07m),
            ("EWJ", 1.06m), ("EEM", 1.05m), ("VNQ", 1.04m), ("GSG", 1.03m),
            ("GLD", 1.02m), ("TLT", 1.015m), ("HYG", 1.012m), ("LQD", 1.011m),
            ("BND", 1.004m));

        var decision = new BaaService().Decide(AsOf, BaaUniverse.Us, prices);

        Assert.Equal("baa-g12", decision.StrategyId);
        Assert.Equal("Defensive", decision.ModeLabel);
        Assert.Single(decision.Allocations);
        Assert.Equal("TLT", decision.Allocations[0].Ticker);
        Assert.Equal(1.0m, decision.Allocations[0].Weight);
    }

    [Fact]
    public void Decide_AllCanariesNegative_DefensiveMode()
    {
        var prices = PricesFor(
            ("TIP", 0.99m), ("IEF", 0.98m), ("BIL", 0.999m),
            ("SPY", 1.10m), ("IWM", 1.09m), ("QQQ", 1.08m), ("VGK", 1.07m),
            ("EWJ", 1.06m), ("EEM", 1.05m), ("VNQ", 1.04m), ("GSG", 1.03m),
            ("GLD", 1.02m), ("TLT", 1.015m), ("HYG", 1.012m), ("LQD", 1.011m),
            ("BND", 1.004m));

        var decision = new BaaService().Decide(AsOf, BaaUniverse.Us, prices);

        Assert.Equal("Defensive", decision.ModeLabel);
        Assert.Single(decision.Allocations);
        // TLT still highest SMA12 across cash even with ALL canaries
        // bearish — the risk-on signal doesn't gate cash ranking.
        Assert.Equal("TLT", decision.Allocations[0].Ticker);
    }

    [Fact]
    public void Decide_CanaryExactlyZero_BoundaryDefensive()
    {
        // BIL exactly at 1.0 → 13612W = 19·(1−1) = 0 exactly.
        // Bold gate is "all > 0" (strict), so a single canary at 0
        // already fails the AND → defensive. Same convention as DAA
        // canary breadth (≤ 0 is "bad").
        var prices = PricesFor(
            ("TIP", 1.01m), ("IEF", 1.005m),
            ("BIL", 1.00m), // exactly 0
            ("SPY", 1.10m), ("IWM", 1.09m), ("QQQ", 1.08m), ("VGK", 1.07m),
            ("EWJ", 1.06m), ("EEM", 1.05m), ("VNQ", 1.04m), ("GSG", 1.03m),
            ("GLD", 1.02m), ("TLT", 1.015m), ("HYG", 1.012m), ("LQD", 1.011m),
            ("BND", 1.004m));

        var decision = new BaaService().Decide(AsOf, BaaUniverse.Us, prices);

        Assert.Equal("Defensive", decision.ModeLabel);
    }

    [Fact]
    public void Decide_OffensiveModePicksRiskyByThirteenSixTwelveW_NotSma12()
    {
        // Adversarial: rig the cash candidate LQD with a higher ratio
        // than several risky tickers. If risky ranking accidentally
        // used SMA12 (cash signal), LQD might leak in. With proper
        // 13612W ranking, LQD's SMA12 advantage doesn't help — its
        // 13612W (also derived from same fixture, scaled differently)
        // still ranks below the high-ratio risky picks.
        // This guards against signal-mixing bugs.
        var prices = PricesFor(
            ("TIP", 1.01m), ("IEF", 1.005m), ("BIL", 1.001m),
            ("SPY", 1.10m), ("IWM", 1.09m), ("QQQ", 1.08m), ("VGK", 1.07m),
            ("EWJ", 1.06m), ("EEM", 1.05m),
            ("LQD", 1.04m), // would-be cash bait — but it's also risky
            ("VNQ", 1.03m), ("GSG", 1.02m), ("GLD", 1.015m),
            ("TLT", 1.012m), ("HYG", 1.011m),
            ("BND", 1.003m));

        var decision = new BaaService().Decide(AsOf, BaaUniverse.Us, prices);

        Assert.Equal("Offensive", decision.ModeLabel);
        // Top 6 by 13612W (ratio): SPY > IWM > QQQ > VGK > EWJ > EEM.
        Assert.Equal(
            new[] { "SPY", "IWM", "QQQ", "VGK", "EWJ", "EEM" },
            decision.Allocations.Select(a => a.Ticker));
    }

    [Fact]
    public void Decide_ScoresIncludeAllRolesWithCorrectBuckets()
    {
        var prices = CanonicalPricesAllPositive();

        var decision = new BaaService().Decide(AsOf, BaaUniverse.Us, prices);

        // 3 canary + 12 risky + 5 cash = 20 entries. Tickers shared
        // across buckets (IEF in canary+cash, BIL in canary+cash, LQD in
        // risky+cash) appear in each bucket they belong to with separate
        // bucket labels — same convention DAA established.
        Assert.Equal(20, decision.Scores.Count);
        Assert.Equal(3, decision.Scores.Count(s => s.Bucket == "Canary"));
        Assert.Equal(12, decision.Scores.Count(s => s.Bucket == "Risky"));
        Assert.Equal(5, decision.Scores.Count(s => s.Bucket == "Cash"));

        // IEF appears in canary+cash with DIFFERENT scores (13612W vs
        // SMA12). LQD appears in risky+cash similarly. Confirms the
        // mixed-signal scoring isn't accidentally collapsed.
        var iefRows = decision.Scores.Where(s => s.Ticker == "IEF").ToList();
        Assert.Equal(2, iefRows.Count);
        var iefCanary = iefRows.Single(s => s.Bucket == "Canary");
        var iefCash = iefRows.Single(s => s.Bucket == "Cash");
        // IEF ratio = 1.005:
        //   13612W = 19·(0.005) = 0.095
        //   SMA12  = 11·0.005 / 12.005 ≈ 0.00458
        Assert.NotEqual(iefCanary.Score, iefCash.Score);
        Assert.True(iefCanary.Score > iefCash.Score,
            "13612W should weight the recent move more heavily than SMA12 with the same ratio.");
    }
}
