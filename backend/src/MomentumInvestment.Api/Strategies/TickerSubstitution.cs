namespace MomentumInvestment.Api.Strategies;

/// <summary>
/// Ticker substitution — the one thing a caller may change about a
/// universe. A holder of CSPX.L rather than SPY must be scored on
/// CSPX.L's own history, so the substitution is applied before prices
/// are fetched.
/// </summary>
public static partial class TickerSubstitution
{
    /// <summary>
    /// The replacement for <paramref name="ticker"/>, or the ticker
    /// itself. Case-insensitive on the key; the replacement is used
    /// exactly as the caller supplied it.
    /// </summary>
    public static string Apply(IReadOnlyDictionary<string, string> map, string ticker) =>
        map.TryGetValue(ticker, out var replacement) ? replacement : ticker;
}
