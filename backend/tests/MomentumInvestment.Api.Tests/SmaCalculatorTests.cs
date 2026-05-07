using MomentumInvestment.Api.Fred;
using MomentumInvestment.Api.Strategies;
using Xunit;

namespace MomentumInvestment.Api.Tests;

/// <summary>
/// Trailing-window SMA primitives used by LAA's two GT-timing signals
/// (200-day SPY SMA, 12-month UNRATE SMA).
///
/// Same trading-day-on-or-before semantics as the existing lookback
/// primitives — a target on a non-trading day rolls back to the most
/// recent entry, and the SMA window is the <c>window</c> consecutive
/// observations ending at that entry.
/// </summary>
public sealed class SmaCalculatorTests
{
    // ----------------------------------------------------------------
    // DailySma

    [Fact]
    public void DailySma_FlatPrices_EqualsThatPrice()
    {
        var asOf = new DateOnly(2026, 5, 4);
        var history = new List<DailyClose>();
        for (int i = 199; i >= 0; i--)
        {
            history.Add(new DailyClose(asOf.AddDays(-i), 100m));
        }

        var sma = SmaCalculator.DailySma(asOf, history, window: 200);

        Assert.Equal(100m, sma);
    }

    [Fact]
    public void DailySma_ArithmeticProgression_KnownClosedForm()
    {
        // 200 trading days, prices = day index (1..200). Mean = (1+200)/2 = 100.5.
        var asOf = new DateOnly(2026, 5, 4);
        var history = new List<DailyClose>();
        for (int i = 0; i < 200; i++)
        {
            history.Add(new DailyClose(asOf.AddDays(i - 199), i + 1));
        }

        var sma = SmaCalculator.DailySma(asOf, history, window: 200);

        Assert.Equal(100.5m, sma);
    }

    [Fact]
    public void DailySma_TargetOnGap_RollsBackToLatestPriorEntry()
    {
        // window=3 over [day1=10, day2=20, day3=30, gap, day10=999].
        // asOf=day9 (gap) → end = day3 → SMA over (10, 20, 30) = 20.
        var history = new List<DailyClose>
        {
            new(new DateOnly(2026, 1, 1), 10m),
            new(new DateOnly(2026, 1, 2), 20m),
            new(new DateOnly(2026, 1, 3), 30m),
            new(new DateOnly(2026, 1, 10), 999m),  // outside the window we'd pick
        };

        var sma = SmaCalculator.DailySma(new DateOnly(2026, 1, 9), history, window: 3);

        Assert.Equal(20m, sma);
    }

    [Fact]
    public void DailySma_NotEnoughHistory_Throws()
    {
        var history = new List<DailyClose>
        {
            new(new DateOnly(2026, 1, 1), 100m),
            new(new DateOnly(2026, 1, 2), 101m),
        };

        Assert.Throws<InvalidOperationException>(
            () => SmaCalculator.DailySma(new DateOnly(2026, 1, 2), history, window: 200));
    }

    [Fact]
    public void DailySma_NoEntryOnOrBefore_Throws()
    {
        var history = new List<DailyClose>
        {
            new(new DateOnly(2026, 5, 1), 100m),
        };

        Assert.Throws<InvalidOperationException>(
            () => SmaCalculator.DailySma(new DateOnly(2025, 12, 31), history, window: 1));
    }

    // ----------------------------------------------------------------
    // MonthlySma

    [Fact]
    public void MonthlySma_FlatValues_EqualsThatValue()
    {
        var asOf = new DateOnly(2026, 5, 7);
        var history = new List<MonthlyObservation>();
        for (int m = 11; m >= 0; m--)
        {
            history.Add(new MonthlyObservation(new DateOnly(asOf.Year, asOf.Month, 1).AddMonths(-m), 4.0m));
        }

        var sma = SmaCalculator.MonthlySma(asOf, history, window: 12);

        Assert.Equal(4.0m, sma);
    }

    [Fact]
    public void MonthlySma_ArithmeticProgression_KnownClosedForm()
    {
        // 12 months, values = 1..12. Mean = (1+12)/2 = 6.5.
        var asOf = new DateOnly(2026, 5, 7);
        var history = new List<MonthlyObservation>();
        for (int i = 0; i < 12; i++)
        {
            // observation_date is the 1st of each month, oldest first
            history.Add(new MonthlyObservation(new DateOnly(2025, 6, 1).AddMonths(i), i + 1));
        }
        // Last entry is May 2026 (date 2026-05-01). asOf 2026-05-07 picks it.

        var sma = SmaCalculator.MonthlySma(asOf, history, window: 12);

        Assert.Equal(6.5m, sma);
    }

    [Fact]
    public void MonthlySma_RollsBackWhenLatestNotYetReleased()
    {
        // FRED publishes month M's value on the first Friday of M+1. If asOf
        // lands before the release, we expect the SMA to use the previous
        // 12 months ending at the most recent published month.
        // Here: April 2026 not released yet, latest is March 2026.
        var asOf = new DateOnly(2026, 5, 1); // Pre-release date.
        var history = new List<MonthlyObservation>();
        for (int i = 0; i < 12; i++)
        {
            // Months Apr 2025 (value 1) through Mar 2026 (value 12).
            history.Add(new MonthlyObservation(new DateOnly(2025, 4, 1).AddMonths(i), i + 1));
        }

        var sma = SmaCalculator.MonthlySma(asOf, history, window: 12);

        Assert.Equal(6.5m, sma);
    }

    [Fact]
    public void MonthlyValueAsOf_PicksLatestPublishedAtAsOf()
    {
        var history = new List<MonthlyObservation>
        {
            new(new DateOnly(2026, 1, 1), 4.0m),
            new(new DateOnly(2026, 2, 1), 4.1m),
            new(new DateOnly(2026, 3, 1), 4.2m),
        };

        Assert.Equal(4.2m, SmaCalculator.MonthlyValueAsOf(new DateOnly(2026, 4, 30), history));
        Assert.Equal(4.1m, SmaCalculator.MonthlyValueAsOf(new DateOnly(2026, 2, 28), history));
        Assert.Equal(4.0m, SmaCalculator.MonthlyValueAsOf(new DateOnly(2026, 1, 1),  history));
        Assert.Throws<InvalidOperationException>(
            () => SmaCalculator.MonthlyValueAsOf(new DateOnly(2025, 12, 31), history));
    }
}
