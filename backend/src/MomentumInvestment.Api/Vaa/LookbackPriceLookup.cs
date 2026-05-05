namespace MomentumInvestment.Api.Vaa;

/// <summary>
/// The five lookback prices used by the 13612W momentum formula:
///   p0 = on-or-before the as-of date
///   p1 = on-or-before (as-of − 1 month)
///   p3 = on-or-before (as-of − 3 months)
///   p6 = on-or-before (as-of − 6 months)
///   p12 = on-or-before (as-of − 12 months)
///
/// Each entry carries the actual trading day used (which may be earlier
/// than the calendar target if the target fell on a weekend or holiday).
/// </summary>
public sealed record LookbackPrices(
    DailyClose P0,
    DailyClose P1,
    DailyClose P3,
    DailyClose P6,
    DailyClose P12);

public static class LookbackPriceLookup
{
    /// <summary>
    /// Picks the five lookback prices for the given as-of date from a
    /// chronologically sorted (oldest → newest) daily close history.
    /// </summary>
    public static LookbackPrices FindLookbackPrices(
        DateOnly asOf,
        IReadOnlyList<DailyClose> chronologicalDaily)
    {
        return new LookbackPrices(
            P0:  FindOnOrBefore(asOf,                  chronologicalDaily),
            P1:  FindOnOrBefore(asOf.AddMonths(-1),    chronologicalDaily),
            P3:  FindOnOrBefore(asOf.AddMonths(-3),    chronologicalDaily),
            P6:  FindOnOrBefore(asOf.AddMonths(-6),    chronologicalDaily),
            P12: FindOnOrBefore(asOf.AddMonths(-12),   chronologicalDaily));
    }

    /// <summary>
    /// Returns the latest entry whose Date is &lt;= the target date.
    /// If the target falls on a non-trading day (weekend or holiday)
    /// the most recent trading day before the target is returned.
    /// Throws if no entry on or before the target exists.
    /// </summary>
    public static DailyClose FindOnOrBefore(
        DateOnly target,
        IReadOnlyList<DailyClose> chronologicalDaily)
    {
        for (int i = chronologicalDaily.Count - 1; i >= 0; i--)
        {
            if (chronologicalDaily[i].Date <= target)
            {
                return chronologicalDaily[i];
            }
        }

        throw new InvalidOperationException(
            $"No price data on or before {target:yyyy-MM-dd}.");
    }
}
