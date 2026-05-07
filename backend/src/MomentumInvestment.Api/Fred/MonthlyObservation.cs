namespace MomentumInvestment.Api.Fred;

/// <summary>
/// One monthly observation from a FRED economic series.
///
/// FRED publishes monthly series with the observation date set to the
/// first day of the month it represents. For example, the April 2026
/// unemployment rate has <see cref="ObservationDate"/> = 2026-04-01 and
/// is typically released on the first Friday of May 2026.
///
/// "Trading-day-on-or-before" semantics work naturally here: to find the
/// most recent UE rate as of a given <c>asOf</c>, take the latest entry
/// whose <see cref="ObservationDate"/> ≤ <c>asOf</c>.
/// </summary>
public sealed record MonthlyObservation(DateOnly ObservationDate, decimal Value);
