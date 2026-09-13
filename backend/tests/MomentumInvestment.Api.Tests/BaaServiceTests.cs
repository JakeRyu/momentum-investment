using MomentumInvestment.Api.Strategies;
using Xunit;

namespace MomentumInvestment.Api.Tests;

/// <summary>
/// BAA-G12 logic verification — the bold canary gate (unanimous AND on
/// 13612W over four risk assets) plus the paper's split of signals:
/// 13612W for the canary only, SMA12 for ranking both the risky and the
/// defensive sleeves.
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

    /// <summary>
    /// Every distinct ticker in the canonical universe, so a test only
    /// has to name the ones whose ranking it cares about.
    /// </summary>
    private static IReadOnlyDictionary<string, IReadOnlyList<DailyClose>> UniverseWith(
        params (string Ticker, decimal Ratio)[] overrides)
    {
        var all = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        foreach (var t in BaaUniverse.Us.AllTickers()) all[t] = 1.001m;
        foreach (var (ticker, ratio) in overrides) all[ticker] = ratio;
        return all.ToDictionary(kv => kv.Key, kv => History(kv.Value));
    }

    [Fact]
    public void Decide_AllCanariesGood_OffensiveTopSixAtOneSixth()
    {
        var prices = UniverseWith(
            ("SPY", 1.20m), ("QQQ", 1.19m), ("IWM", 1.18m),
            ("VGK", 1.17m), ("EWJ", 1.16m), ("VWO", 1.15m),
            ("VNQ", 1.02m), ("DBC", 1.02m), ("GLD", 1.02m),
            ("TLT", 1.02m), ("HYG", 1.02m), ("LQD", 1.02m),
            ("VEA", 1.05m), ("BND", 1.05m));

        var decision = new BaaService().Decide(AsOf, BaaUniverse.Us, prices);

        Assert.Equal("baa-g12", decision.StrategyId);
        Assert.Equal("Offensive", decision.ModeLabel);
        Assert.Equal(6, decision.Allocations.Count);
        Assert.Equal(
            new[] { "SPY", "QQQ", "IWM", "VGK", "EWJ", "VWO" },
            decision.Allocations.Select(a => a.Ticker));
        Assert.All(decision.Allocations, a => Assert.Equal(1m / 6m, a.Weight, precision: 10));
    }

    [Fact]
    public void Decide_OffensiveRankingIgnoresAbsoluteMomentum()
    {
        // The paper is explicit: "we don't use absolute momentum for the
        // Top6 selection of the Offensive universe, only relative
        // momentum". So a falling asset still gets held if it ranks in
        // the top six — unlike HAA, where a bad slot goes to cash.
        var prices = UniverseWith(
            ("SPY", 0.99m), ("QQQ", 0.98m), ("IWM", 0.97m),
            ("VGK", 0.96m), ("EWJ", 0.95m), ("VWO", 0.94m),
            ("VNQ", 0.93m), ("DBC", 0.92m), ("GLD", 0.91m),
            ("TLT", 0.90m), ("HYG", 0.89m), ("LQD", 0.88m),
            ("VEA", 1.05m), ("BND", 1.05m));

        var decision = new BaaService().Decide(AsOf, BaaUniverse.Us, prices);

        // SPY and VWO are canaries too, and both are falling — so the
        // gate is what actually fires here.
        Assert.Equal("Defensive", decision.ModeLabel);
    }

    [Fact]
    public void Decide_OneCanaryBad_ForcesDefensive()
    {
        var prices = UniverseWith(
            ("SPY", 1.10m), ("VWO", 1.10m), ("VEA", 1.10m),
            ("BND", 0.99m), // the single bad canary
            ("BIL", 1.001m), ("IEF", 1.06m), ("TLT", 1.05m), ("TIP", 1.04m));

        var decision = new BaaService().Decide(AsOf, BaaUniverse.Us, prices);

        Assert.Equal("Defensive", decision.ModeLabel);
        Assert.Contains("BND", decision.Reasoning);
    }

    [Fact]
    public void Decide_CanaryExactlyZero_IsBad()
    {
        var prices = UniverseWith(
            ("SPY", 1.10m), ("VWO", 1.10m), ("VEA", 1.10m),
            ("BND", 1.00m), // momentum exactly 0 — bad by Keller's convention
            ("IEF", 1.06m), ("TLT", 1.05m), ("TIP", 1.04m));

        var decision = new BaaService().Decide(AsOf, BaaUniverse.Us, prices);

        Assert.Equal("Defensive", decision.ModeLabel);
    }

    [Fact]
    public void Decide_Defensive_HoldsTopThreeCashAtOneThirdEach()
    {
        // TD=3 by SMA12, and all three beat BIL so none is replaced.
        var prices = UniverseWith(
            ("BND", 0.99m), // trip the gate
            ("IEF", 1.30m), ("TLT", 1.25m), ("TIP", 1.20m),
            ("LQD", 1.02m), ("DBC", 1.02m), ("BIL", 1.001m));

        var decision = new BaaService().Decide(AsOf, BaaUniverse.Us, prices);

        Assert.Equal("Defensive", decision.ModeLabel);
        Assert.Equal(3, decision.Allocations.Count);
        Assert.Equal(
            new[] { "IEF", "TLT", "TIP" },
            decision.Allocations.Select(a => a.Ticker));
        Assert.All(decision.Allocations, a => Assert.Equal(1m / 3m, a.Weight, precision: 10));
        Assert.Equal(1.0m, decision.Allocations.Sum(a => a.Weight), precision: 10);
    }

    [Fact]
    public void Decide_Defensive_PicksTrailingBilAreReplacedByBil()
    {
        // Absolute-momentum floor: a Top-3 pick scoring below BIL is not
        // worth holding over cash. Here IEF beats BIL but TLT and TIP do
        // not, so two thirds collapse onto BIL and are summed, not
        // listed twice.
        var prices = UniverseWith(
            ("BND", 0.99m), // trip the gate
            ("BIL", 1.10m),
            ("IEF", 1.20m), ("TLT", 1.05m), ("TIP", 1.04m),
            ("LQD", 1.02m), ("DBC", 1.02m));

        var decision = new BaaService().Decide(AsOf, BaaUniverse.Us, prices);

        Assert.Equal(2, decision.Allocations.Count);
        var ief = decision.Allocations.Single(a => a.Ticker == "IEF");
        var bil = decision.Allocations.Single(a => a.Ticker == "BIL");
        Assert.Equal(1m / 3m, ief.Weight, precision: 10);
        Assert.Equal(2m / 3m, bil.Weight, precision: 10);
        Assert.Equal(1.0m, decision.Allocations.Sum(a => a.Weight), precision: 10);
        Assert.Contains("BIL", decision.Reasoning);
    }

    [Fact]
    public void Decide_ScoresIncludeEveryRoleWithCorrectBuckets()
    {
        var prices = UniverseWith(("BND", 0.99m));

        var decision = new BaaService().Decide(AsOf, BaaUniverse.Us, prices);

        // 4 canary + 12 risky + 7 cash. Tickers repeat across buckets by
        // design (SPY and VWO are canary and risky; TLT, LQD and DBC are
        // risky and cash; BND is canary and cash).
        Assert.Equal(4, decision.Scores.Count(s => s.Bucket == "Canary"));
        Assert.Equal(12, decision.Scores.Count(s => s.Bucket == "Risky"));
        Assert.Equal(7, decision.Scores.Count(s => s.Bucket == "Cash"));
        Assert.Equal("Canary", decision.Scores[0].Bucket);
    }
}
