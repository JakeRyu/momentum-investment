using MomentumInvestment.Api.Fred;
using MomentumInvestment.Api.Strategies;
using Xunit;

namespace MomentumInvestment.Api.Tests;

/// <summary>
/// LAA Growth-Trend-timing decision logic verification. The four GT
/// regimes from Keller (2019) are exhaustively covered:
///
///   SPY ≥ SMA200, UE ≤ SMA12  → Risk-On  (most common, neither bearish)
///   SPY &lt; SMA200, UE ≤ SMA12  → Risk-On  (technical-only correction)
///   SPY ≥ SMA200, UE &gt; SMA12  → Risk-On  (UE rising but still in uptrend)
///   SPY &lt; SMA200, UE &gt; SMA12  → Risk-Off (only this combination triggers)
///
/// Fixture: synthetic SPY history of 201 daily closes (200 flat at 100,
/// then a final close at <c>spyClose</c>), so the SMA over the trailing
/// 200 days ending at asOf is exactly 100. Controlling whether
/// <c>spyClose</c> is above or below 100 controls the equity-trend
/// signal directly.
///
/// UNRATE: 12 monthly observations, eleven flat at 4.0 plus a final
/// observation at <c>ueValue</c>. SMA = (ueValue + 11·4.0) / 12. We pass
/// values that put <c>ueValue</c> clearly above or below the SMA so the
/// boolean signal is unambiguous.
/// </summary>
public sealed class LaaServiceTests
{
    private static readonly DateOnly AsOf = new(2026, 5, 4);

    private static IReadOnlyList<DailyClose> FlatSpyHistory(decimal todayClose)
    {
        // 200 trading days at 100 then today at todayClose.
        // Earliest date is 200 calendar days before asOf (test only uses
        // the entries' presence and order; gaps within the synthetic dates
        // don't matter because DailySma takes the trailing window of
        // 200 entries from the end-index regardless of calendar spacing).
        var entries = new List<DailyClose>(201);
        for (int i = 200; i >= 1; i--)
        {
            entries.Add(new DailyClose(AsOf.AddDays(-i), 100m));
        }
        entries.Add(new DailyClose(AsOf, todayClose));
        return entries;
    }

    private static IReadOnlyList<DailyClose> FlatHistory(decimal close)
    {
        // For non-signal tickers we just need any 200+ entries so the
        // service's existence checks pass. The values aren't read.
        var entries = new List<DailyClose>(12);
        for (int m = 11; m >= 0; m--)
        {
            entries.Add(new DailyClose(AsOf.AddMonths(-m), close));
        }
        return entries;
    }

    private static IReadOnlyList<MonthlyObservation> UeHistory(decimal currentValue)
    {
        // 11 flat months at 4.0, then current month at currentValue.
        // Observation_date is the 1st of each month (FRED convention).
        var entries = new List<MonthlyObservation>(12);
        var firstMonth = new DateOnly(AsOf.Year, AsOf.Month, 1).AddMonths(-11);
        for (int i = 0; i < 11; i++)
        {
            entries.Add(new MonthlyObservation(firstMonth.AddMonths(i), 4.0m));
        }
        entries.Add(new MonthlyObservation(firstMonth.AddMonths(11), currentValue));
        return entries;
    }

    private static IReadOnlyDictionary<string, IReadOnlyList<DailyClose>> Prices(decimal spyClose)
    {
        return new Dictionary<string, IReadOnlyList<DailyClose>>
        {
            ["IWD"] = FlatHistory(120m),
            ["GLD"] = FlatHistory(200m),
            ["IEF"] = FlatHistory(95m),
            ["QQQ"] = FlatHistory(450m),
            ["SHY"] = FlatHistory(82m),
            ["SPY"] = FlatSpyHistory(spyClose),
        };
    }

    [Fact]
    public void Decide_BothSignalsBearish_RiskOff_ReplacesQqqWithShy()
    {
        // SPY 95 < SMA 100, UE 5.0 > SMA (5+11·4)/12 = 49/12 ≈ 4.083.
        var decision = new LaaService().Decide(AsOf, LaaUniverse.Us, Prices(95m), UeHistory(5.0m));

        Assert.Equal("laa", decision.StrategyId);
        Assert.Equal("Defensive", decision.ModeLabel);
        Assert.Equal(4, decision.Allocations.Count);

        // Permanent + cash, in that order. No QQQ.
        Assert.Equal(new[] { "IWD", "GLD", "IEF", "SHY" }, decision.Allocations.Select(a => a.Ticker));
        Assert.All(decision.Allocations, a => Assert.Equal(0.25m, a.Weight));
        Assert.Equal(1.0m, decision.Allocations.Sum(a => a.Weight));
    }

    [Fact]
    public void Decide_OnlySpyBearish_StaysRiskOn()
    {
        // SPY 95 < SMA 100, UE 3.0 (clearly below 4.0) → only equity is bearish.
        var decision = new LaaService().Decide(AsOf, LaaUniverse.Us, Prices(95m), UeHistory(3.0m));

        Assert.Equal("Offensive", decision.ModeLabel);
        Assert.Equal(new[] { "IWD", "GLD", "IEF", "QQQ" }, decision.Allocations.Select(a => a.Ticker));
    }

    [Fact]
    public void Decide_OnlyUeBearish_StaysRiskOn()
    {
        // SPY 105 ≥ SMA 100, UE 5.0 > SMA ≈ 4.083 → only UE is bearish.
        var decision = new LaaService().Decide(AsOf, LaaUniverse.Us, Prices(105m), UeHistory(5.0m));

        Assert.Equal("Offensive", decision.ModeLabel);
        Assert.Equal(new[] { "IWD", "GLD", "IEF", "QQQ" }, decision.Allocations.Select(a => a.Ticker));
    }

    [Fact]
    public void Decide_NeitherSignalBearish_StaysRiskOn()
    {
        var decision = new LaaService().Decide(AsOf, LaaUniverse.Us, Prices(110m), UeHistory(3.5m));

        Assert.Equal("Offensive", decision.ModeLabel);
        Assert.Equal(new[] { "IWD", "GLD", "IEF", "QQQ" }, decision.Allocations.Select(a => a.Ticker));
    }

    [Fact]
    public void Decide_SpyExactlyAtSma_NotBearish_StaysRiskOn()
    {
        // SPY == SMA → spyBearish = (SPY < SMA) is false → not risk-off.
        // Confirms boundary is exclusive (equality treated as bullish), matching
        // GT timing's "below SMA" wording.
        var decision = new LaaService().Decide(AsOf, LaaUniverse.Us, Prices(100m), UeHistory(5.0m));

        Assert.Equal("Offensive", decision.ModeLabel);
    }

    [Fact]
    public void Decide_UeExactlyAtSma_NotBearish_StaysRiskOn()
    {
        // ueValue = 4.0 → UE == SMA → ueBearish = (UE > SMA) is false.
        var decision = new LaaService().Decide(AsOf, LaaUniverse.Us, Prices(95m), UeHistory(4.0m));

        Assert.Equal("Offensive", decision.ModeLabel);
    }

    [Fact]
    public void Decide_EmitsBothSignalsInScores_WithBucketSignal()
    {
        var decision = new LaaService().Decide(AsOf, LaaUniverse.Us, Prices(95m), UeHistory(5.0m));

        Assert.Equal(2, decision.Scores.Count);
        Assert.All(decision.Scores, s => Assert.Equal("Signal", s.Bucket));

        // SPY trend includes today in the SMA (199 days at 100 + today at 95
        // → SMA = 19995/200 = 99.975), so the exact value is awkward in
        // decimal arithmetic. Asserting the sign here is enough — the
        // boolean trigger is what drives mode selection, and the exact
        // value is reproducible from the fixture for human inspection.
        var spy = decision.Scores.Single(s => s.Ticker == "SPY");
        Assert.True(spy.Score < 0m);

        // UE math is exact: ueValue=5.0, sma=(11·4.0 + 5.0)/12 = 49/12.
        // ueTrend = 5/(49/12) - 1 = 60/49 - 1 = 11/49.
        var ue = decision.Scores.Single(s => s.Ticker == "UNRATE");
        var expectedUe = 11m / 49m;
        Assert.Equal(expectedUe, ue.Score, precision: 10);
    }

    [Fact]
    public void Decide_NeutralFixture_BothScoresZero()
    {
        // SPY today = 100 = mean of 199 prior + today; UE today = 4.0 = mean
        // of 11 prior at 4.0 + today at 4.0. Both signals on the boundary →
        // both scores exactly zero. Confirms the score formula is the same
        // "value/SMA - 1" for both signals (positive = above SMA).
        var decision = new LaaService().Decide(AsOf, LaaUniverse.Us, Prices(100m), UeHistory(4.0m));

        var spy = decision.Scores.Single(s => s.Ticker == "SPY");
        Assert.Equal(0m, spy.Score, precision: 10);

        var ue = decision.Scores.Single(s => s.Ticker == "UNRATE");
        Assert.Equal(0m, ue.Score, precision: 10);
    }

    [Fact]
    public void Decide_WrongPermanentCount_Throws()
    {
        var bad = LaaUniverse.Us with { Permanent = new[] { "IWD", "GLD" } };
        Assert.Throws<ArgumentException>(
            () => new LaaService().Decide(AsOf, bad, Prices(100m), UeHistory(4.0m)));
    }

    [Fact]
    public void Decide_MissingSignalEquityHistory_Throws()
    {
        var prices = new Dictionary<string, IReadOnlyList<DailyClose>>
        {
            ["IWD"] = FlatHistory(120m),
            ["GLD"] = FlatHistory(200m),
            ["IEF"] = FlatHistory(95m),
            ["QQQ"] = FlatHistory(450m),
            ["SHY"] = FlatHistory(82m),
            // No SPY.
        };

        Assert.Throws<InvalidOperationException>(
            () => new LaaService().Decide(AsOf, LaaUniverse.Us, prices, UeHistory(4.0m)));
    }

    [Fact]
    public void Decide_AcceptsCustomSignalEquityAndSeriesId()
    {
        // UK-style: same SPY / UNRATE signal, but rotating ticker is EQQQ.L
        // (Nasdaq UCITS) and cash is IBTS.L. Just exercising the universe
        // record's flexibility — the decision logic is identical.
        var universe = new LaaUniverse(
            Permanent:            new[] { "IUSV.L", "SGLN.L", "IBTM.L" },
            Risky:                "EQQQ.L",
            Cash:                 "IBTS.L",
            SignalEquity:         "SPY",
            UnemploymentSeriesId: "UNRATE");
        var prices = new Dictionary<string, IReadOnlyList<DailyClose>>
        {
            ["IUSV.L"] = FlatHistory(80m),
            ["SGLN.L"] = FlatHistory(35m),
            ["IBTM.L"] = FlatHistory(95m),
            ["EQQQ.L"] = FlatHistory(400m),
            ["IBTS.L"] = FlatHistory(82m),
            ["SPY"]    = FlatSpyHistory(95m),
        };

        var decision = new LaaService().Decide(AsOf, universe, prices, UeHistory(5.0m));

        Assert.Equal("Defensive", decision.ModeLabel);
        Assert.Equal(
            new[] { "IUSV.L", "SGLN.L", "IBTM.L", "IBTS.L" },
            decision.Allocations.Select(a => a.Ticker));
    }
}
