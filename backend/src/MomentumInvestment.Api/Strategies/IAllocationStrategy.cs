namespace MomentumInvestment.Api.Strategies;

/// <summary>
/// Common contract for Keller-family momentum strategies.
///
/// The universe shape varies per strategy (VAA: Offensive/Defensive;
/// DAA: Canary/Risky/Cash; PAA et al. will introduce more), so this is
/// generic over the universe type. Every strategy returns the same
/// <see cref="AllocationDecision"/> shape so the mobile client can
/// render any of them with a single rendering path.
///
/// Extracted once a second concrete implementation arrived (DAA-G12);
/// see CLAUDE.md "Architecture conventions" for the rationale on not
/// abstracting earlier.
/// </summary>
public interface IAllocationStrategy<in TUniverse>
{
    /// <summary>
    /// Stable identifier echoed back in <see cref="AllocationDecision.StrategyId"/>.
    /// Mirrors the URL slug for the strategy's HTTP endpoint where possible
    /// (e.g. <c>"vaa-g4b3"</c> ↔ <c>/api/vaa-g4b3/decision</c>).
    /// </summary>
    string StrategyId { get; }

    /// <summary>
    /// Compute the allocation decision for <paramref name="asOf"/> from the
    /// supplied <paramref name="universe"/> and pre-fetched daily-close
    /// histories. Implementations assume all tickers reachable from
    /// <c>universe.AllTickers()</c> are present in
    /// <paramref name="dailyByTicker"/>; missing tickers throw.
    /// </summary>
    AllocationDecision Decide(
        DateOnly asOf,
        TUniverse universe,
        IReadOnlyDictionary<string, IReadOnlyList<DailyClose>> dailyByTicker);
}
