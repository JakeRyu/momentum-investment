using MomentumInvestment.Api.Fred;

namespace MomentumInvestment.Api.Strategies;

/// <summary>
/// Pure simple-moving-average primitives shared by trend-based strategies
/// (currently LAA: 200-day SMA on daily SPY closes, 12-month SMA on
/// monthly UNRATE observations).
///
/// Lookback semantics match the rest of the codebase: every input series
/// is treated as chronologically sorted, and "as of <c>asOf</c>" means
/// the most recent observation whose date ≤ asOf, falling back to the
/// nearest earlier entry if asOf lands on a gap. This is the same
/// trading-day-on-or-before rule used in <see cref="LookbackPriceLookup"/>.
/// </summary>
public static class SmaCalculator
{
    /// <summary>
    /// Mean of the trailing <paramref name="window"/> daily closes ending
    /// on the latest entry whose date ≤ <paramref name="asOf"/>. The
    /// returned value is a simple unweighted average of
    /// <paramref name="window"/> consecutive entries from the supplied
    /// chronologically-sorted history.
    ///
    /// Used by LAA's SPY 200-day SMA signal: pass <c>window: 200</c>.
    ///
    /// Throws when:
    ///   - <paramref name="chronologicalDaily"/> has no entry ≤ asOf
    ///   - the trailing window doesn't fit (history shorter than
    ///     <paramref name="window"/> entries up to that point)
    /// </summary>
    public static decimal DailySma(
        DateOnly asOf,
        IReadOnlyList<DailyClose> chronologicalDaily,
        int window)
    {
        if (window <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(window), window, "window must be positive.");
        }
        if (chronologicalDaily.Count == 0)
        {
            throw new InvalidOperationException("Daily history is empty.");
        }

        // Find the latest index whose date ≤ asOf (trading-day-on-or-before).
        int endIndex = -1;
        for (int i = chronologicalDaily.Count - 1; i >= 0; i--)
        {
            if (chronologicalDaily[i].Date <= asOf)
            {
                endIndex = i;
                break;
            }
        }
        if (endIndex < 0)
        {
            throw new InvalidOperationException(
                $"No daily close on or before {asOf:yyyy-MM-dd}.");
        }

        int startIndex = endIndex - window + 1;
        if (startIndex < 0)
        {
            throw new InvalidOperationException(
                $"Need {window} daily closes ending {chronologicalDaily[endIndex].Date:yyyy-MM-dd}, only {endIndex + 1} available.");
        }

        decimal sum = 0m;
        for (int i = startIndex; i <= endIndex; i++)
        {
            sum += chronologicalDaily[i].AdjClose;
        }
        return sum / window;
    }

    /// <summary>
    /// Mean of the trailing <paramref name="window"/> monthly observations
    /// ending on the latest entry whose <see cref="MonthlyObservation.ObservationDate"/>
    /// ≤ <paramref name="asOf"/>.
    ///
    /// Used by LAA's UNRATE 12-month SMA signal: pass <c>window: 12</c>.
    /// FRED publishes UNRATE with the observation date set to the first
    /// of the represented month, so the most recent <c>≤ asOf</c> entry
    /// is the latest released monthly value.
    /// </summary>
    public static decimal MonthlySma(
        DateOnly asOf,
        IReadOnlyList<MonthlyObservation> chronologicalMonthly,
        int window)
    {
        if (window <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(window), window, "window must be positive.");
        }
        if (chronologicalMonthly.Count == 0)
        {
            throw new InvalidOperationException("Monthly history is empty.");
        }

        int endIndex = -1;
        for (int i = chronologicalMonthly.Count - 1; i >= 0; i--)
        {
            if (chronologicalMonthly[i].ObservationDate <= asOf)
            {
                endIndex = i;
                break;
            }
        }
        if (endIndex < 0)
        {
            throw new InvalidOperationException(
                $"No monthly observation on or before {asOf:yyyy-MM-dd}.");
        }

        int startIndex = endIndex - window + 1;
        if (startIndex < 0)
        {
            throw new InvalidOperationException(
                $"Need {window} monthly observations ending {chronologicalMonthly[endIndex].ObservationDate:yyyy-MM-dd}, only {endIndex + 1} available.");
        }

        decimal sum = 0m;
        for (int i = startIndex; i <= endIndex; i++)
        {
            sum += chronologicalMonthly[i].Value;
        }
        return sum / window;
    }

    /// <summary>
    /// Returns the daily close on <paramref name="asOf"/> (or the most
    /// recent earlier trading day). Convenience wrapper around
    /// <see cref="LookbackPriceLookup.FindOnOrBefore"/> for symmetry with
    /// <see cref="DailySma"/> at the call site.
    /// </summary>
    public static decimal DailyValueAsOf(
        DateOnly asOf,
        IReadOnlyList<DailyClose> chronologicalDaily)
        => LookbackPriceLookup.FindOnOrBefore(asOf, chronologicalDaily).AdjClose;

    /// <summary>
    /// Returns the monthly observation as of <paramref name="asOf"/>
    /// (latest entry whose observation date ≤ asOf).
    /// </summary>
    public static decimal MonthlyValueAsOf(
        DateOnly asOf,
        IReadOnlyList<MonthlyObservation> chronologicalMonthly)
    {
        for (int i = chronologicalMonthly.Count - 1; i >= 0; i--)
        {
            if (chronologicalMonthly[i].ObservationDate <= asOf)
            {
                return chronologicalMonthly[i].Value;
            }
        }
        throw new InvalidOperationException(
            $"No monthly observation on or before {asOf:yyyy-MM-dd}.");
    }
}
