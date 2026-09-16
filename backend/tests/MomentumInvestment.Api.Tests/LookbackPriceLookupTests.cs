using MomentumInvestment.Api.Strategies;
using Xunit;

namespace MomentumInvestment.Api.Tests;

public sealed class LookbackPriceLookupTests
{
    [Fact]
    public void FindOnOrBefore_ExactDateMatch_ReturnsThatEntry()
    {
        var history = new List<DailyClose>
        {
            new(new DateOnly(2026, 1, 2),  100m),
            new(new DateOnly(2026, 1, 5),  101m),
            new(new DateOnly(2026, 1, 6),  102m),
        };

        var hit = LookbackPriceLookup.FindOnOrBefore(new DateOnly(2026, 1, 5), history);

        Assert.Equal(new DateOnly(2026, 1, 5), hit.Date);
        Assert.Equal(101m, hit.AdjClose);
    }

    [Fact]
    public void FindOnOrBefore_TargetOnNonTradingDay_ReturnsLastEntryBefore()
    {
        // Target Sunday 2026-01-04 has no trading. Friday Jan 2 is the latest
        // entry before it; expect Friday's entry.
        var history = new List<DailyClose>
        {
            new(new DateOnly(2026, 1, 2),  100m),  // Friday
            new(new DateOnly(2026, 1, 5),  101m),  // Monday
        };

        var hit = LookbackPriceLookup.FindOnOrBefore(new DateOnly(2026, 1, 4), history);

        Assert.Equal(new DateOnly(2026, 1, 2), hit.Date);
        Assert.Equal(100m, hit.AdjClose);
    }

    [Fact]
    public void FindOnOrBefore_TargetBeforeAllData_Throws()
    {
        var history = new List<DailyClose>
        {
            new(new DateOnly(2026, 1, 5),  100m),
        };

        Assert.Throws<InvalidOperationException>(
            () => LookbackPriceLookup.FindOnOrBefore(new DateOnly(2025, 12, 31), history));
    }

    [Fact]
    public void FindLookbackPrices_PicksAllFiveTargets()
    {
        var asOf = new DateOnly(2026, 5, 4);

        // Entries exactly at each lookback target.
        var history = new List<DailyClose>
        {
            new(asOf.AddMonths(-12), 50m),
            new(asOf.AddMonths(-6),  60m),
            new(asOf.AddMonths(-3),  70m),
            new(asOf.AddMonths(-1),  80m),
            new(asOf,                90m),
        };

        var p = LookbackPriceLookup.FindLookbackPrices(asOf, history);

        Assert.Equal(asOf,                  p.P0.Date);
        Assert.Equal(90m,                   p.P0.AdjClose);
        Assert.Equal(asOf.AddMonths(-1),    p.P1.Date);
        Assert.Equal(80m,                   p.P1.AdjClose);
        Assert.Equal(asOf.AddMonths(-3),    p.P3.Date);
        Assert.Equal(70m,                   p.P3.AdjClose);
        Assert.Equal(asOf.AddMonths(-6),    p.P6.Date);
        Assert.Equal(60m,                   p.P6.AdjClose);
        Assert.Equal(asOf.AddMonths(-12),   p.P12.Date);
        Assert.Equal(50m,                   p.P12.AdjClose);
    }

    [Fact]
    public void FindMonthlyLookbackPrices_ReturnsConsecutiveMonths_InOrderP0First()
    {
        var asOf = new DateOnly(2026, 5, 4);

        // One entry exactly at each monthly lookback target, asOf and 11
        // months back (12 total). Price encodes month-offset so we can
        // assert order at every index.
        var history = new List<DailyClose>();
        for (int m = 11; m >= 0; m--)
        {
            history.Add(new DailyClose(asOf.AddMonths(-m), 100m + m));
        }

        var prices = LookbackPriceLookup.FindMonthlyLookbackPrices(asOf, history, monthsBack: 11);

        Assert.Equal(12, prices.Count);
        Assert.Equal(asOf,                prices[0].Date);
        Assert.Equal(100m,                prices[0].AdjClose);
        Assert.Equal(asOf.AddMonths(-1),  prices[1].Date);
        Assert.Equal(101m,                prices[1].AdjClose);
        Assert.Equal(asOf.AddMonths(-11), prices[11].Date);
        Assert.Equal(111m,                prices[11].AdjClose);
    }

    [Fact]
    public void FindMonthlyLookbackPrices_HonoursOnOrBeforeSemantics_ForWeekendTarget()
    {
        // asOf = Wed 2026-04-15. Lookback −1 month = Sun 2026-03-15, which
        // is not a trading day; the latest trading entry before it is
        // Fri 2026-03-13. The lookup should skip back to that entry.
        var asOf = new DateOnly(2026, 4, 15);
        var history = new List<DailyClose>
        {
            new(new DateOnly(2026, 3, 13), 95m),   // Fri
            new(new DateOnly(2026, 4, 15), 100m),  // Wed
        };

        var prices = LookbackPriceLookup.FindMonthlyLookbackPrices(asOf, history, monthsBack: 1);

        Assert.Equal(2, prices.Count);
        Assert.Equal(new DateOnly(2026, 4, 15), prices[0].Date);
        Assert.Equal(new DateOnly(2026, 3, 13), prices[1].Date);
    }

    [Fact]
    public void FindMonthlyLookbackPrices_NegativeMonthsBack_Throws()
    {
        var history = new List<DailyClose> { new(new DateOnly(2026, 5, 4), 100m) };

        Assert.Throws<ArgumentOutOfRangeException>(
            () => LookbackPriceLookup.FindMonthlyLookbackPrices(
                new DateOnly(2026, 5, 4), history, monthsBack: -1));
    }

    private static IReadOnlyDictionary<string, IReadOnlyList<DailyClose>> Histories(
        params (string Ticker, DateOnly Last)[] entries)
    {
        return entries.ToDictionary(
            e => e.Ticker,
            e => (IReadOnlyList<DailyClose>)new List<DailyClose>
            {
                new(e.Last.AddDays(-7), 100m),
                new(e.Last,             101m),
            });
    }

    [Fact]
    public void ResolvePriceDate_AsOfIsATradingDay_ReturnsThatDay()
    {
        var prices = Histories(("SPY", new DateOnly(2026, 9, 15)));

        Assert.Equal(
            new DateOnly(2026, 9, 15),
            LookbackPriceLookup.ResolvePriceDate(new DateOnly(2026, 9, 15), prices));
    }

    [Fact]
    public void ResolvePriceDate_BeforeTheOpen_ReturnsThePreviousClose()
    {
        // The case measured against Yahoo on 2026-09-16: before the US open
        // there is no bar for the current session, so a decision asked for
        // "today" is computed from yesterday's close.
        var prices = Histories(
            ("SPY", new DateOnly(2026, 9, 15)),
            ("EFA", new DateOnly(2026, 9, 15)),
            ("AGG", new DateOnly(2026, 9, 15)));

        Assert.Equal(
            new DateOnly(2026, 9, 15),
            LookbackPriceLookup.ResolvePriceDate(new DateOnly(2026, 9, 16), prices));
    }

    [Fact]
    public void ResolvePriceDate_OverAWeekend_ReturnsTheFridayClose()
    {
        // Friday 2026-09-11 is the last close before Sunday the 13th.
        var prices = Histories(("SPY", new DateOnly(2026, 9, 11)));

        Assert.Equal(
            new DateOnly(2026, 9, 11),
            LookbackPriceLookup.ResolvePriceDate(new DateOnly(2026, 9, 13), prices));
    }

    [Fact]
    public void ResolvePriceDate_OneTickerLagsTheRest_TakesTheLatest()
    {
        // A laggard is a gap in one ticker's data, not an earlier reading
        // date for the decision as a whole.
        var prices = Histories(
            ("SPY", new DateOnly(2026, 9, 15)),
            ("EFA", new DateOnly(2026, 9, 11)));

        Assert.Equal(
            new DateOnly(2026, 9, 15),
            LookbackPriceLookup.ResolvePriceDate(new DateOnly(2026, 9, 16), prices));
    }

    [Fact]
    public void ResolvePriceDate_NoHistories_Throws()
    {
        var empty = new Dictionary<string, IReadOnlyList<DailyClose>>();

        Assert.Throws<InvalidOperationException>(
            () => LookbackPriceLookup.ResolvePriceDate(new DateOnly(2026, 9, 16), empty));
    }
}
