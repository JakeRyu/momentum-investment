using MomentumInvestment.Api.Vaa;
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
}
