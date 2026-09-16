namespace MomentumInvestment.Api.Strategies;

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
    /// The date of the most recent close the reading could actually reach.
    ///
    /// Asking for a date is not the same as getting it. Before the US open,
    /// Yahoo publishes no bar for the current session at all (checked
    /// directly on 2026-09-16: ten tickers, no bar for that day), and a
    /// weekend or holiday as-of has none either — so a decision requested
    /// "today" is routinely computed from yesterday's close. Callers report
    /// this alongside the requested date rather than in place of it: the
    /// request is what the lookback anchors are measured from, this is what
    /// the prices are.
    ///
    /// Tickers are taken at their latest, not their earliest. On one
    /// exchange calendar they agree; where they do not, the laggard is a
    /// gap in one ticker's data rather than a different reading date.
    /// </summary>
    public static DateOnly ResolvePriceDate(
        DateOnly asOf,
        IReadOnlyDictionary<string, IReadOnlyList<DailyClose>> dailyByTicker)
    {
        DateOnly? latest = null;
        foreach (var history in dailyByTicker.Values)
        {
            var used = FindOnOrBefore(asOf, history).Date;
            if (latest is null || used > latest) latest = used;
        }

        return latest ?? throw new InvalidOperationException(
            $"No price histories to resolve a reading date for {asOf:yyyy-MM-dd}.");
    }

    /// <summary>
    /// Picks consecutive monthly lookback prices for the given as-of date.
    /// Returns a list of length <c>monthsBack + 1</c>: index 0 is P₀
    /// (on-or-before <paramref name="asOf"/>), index 1 is P₁
    /// (on-or-before asOf − 1 month), ..., index <c>monthsBack</c> is the
    /// price on-or-before asOf − <c>monthsBack</c> months.
    ///
    /// Same trading-day-on-or-before semantics as <see cref="FindLookbackPrices"/>:
    /// when a target lands on a weekend or holiday, the most recent trading
    /// day before the target is used. Used by SMA-based momentum (e.g. PAA's
    /// SMA12 momentum: p₀ / mean(p₀..p₁₁) − 1, monthsBack = 11).
    /// </summary>
    public static IReadOnlyList<DailyClose> FindMonthlyLookbackPrices(
        DateOnly asOf,
        IReadOnlyList<DailyClose> chronologicalDaily,
        int monthsBack)
    {
        if (monthsBack < 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(monthsBack),
                monthsBack,
                "monthsBack must be non-negative.");
        }

        var prices = new DailyClose[monthsBack + 1];
        for (int m = 0; m <= monthsBack; m++)
        {
            prices[m] = FindOnOrBefore(asOf.AddMonths(-m), chronologicalDaily);
        }
        return prices;
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
