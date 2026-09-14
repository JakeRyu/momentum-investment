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

    /// <summary>
    /// Parses the repeatable <c>substitute=ORIGINAL:REPLACEMENT</c> query
    /// parameter into a map, validated against the tickers the strategy
    /// actually holds.
    ///
    /// Every failure is rejected rather than ignored. A substitution that
    /// silently does nothing is the exact shape of the bug this contract
    /// exists to remove: the holder believes they are being scored on
    /// CSPX.L while the server scores SPY.
    /// </summary>
    /// <returns>
    /// The map, or an error message for the caller to return as a 400.
    /// Exactly one of the two is non-null.
    /// </returns>
    public static (Dictionary<string, string>? Map, string? Error) Parse(
        string[]? raw,
        IEnumerable<string> substitutable)
    {
        var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (raw is null || raw.Length == 0) return (map, null);

        var allowed = new HashSet<string>(substitutable, StringComparer.OrdinalIgnoreCase);

        foreach (var pair in raw)
        {
            var colon = pair.IndexOf(':');
            if (colon < 0)
            {
                return (null, $"Query parameter 'substitute' must be ORIGINAL:REPLACEMENT — got '{pair}'.");
            }

            var original = pair[..colon].Trim();
            var replacement = pair[(colon + 1)..].Trim();

            if (original.Length == 0 || replacement.Length == 0)
            {
                return (null, $"Query parameter 'substitute' must be ORIGINAL:REPLACEMENT — got '{pair}'.");
            }
            if (!allowed.Contains(original))
            {
                return (null,
                    $"'{original}' is not a substitutable ticker for this strategy. " +
                    $"Valid: {string.Join(", ", allowed.OrderBy(t => t))}.");
            }
            if (map.ContainsKey(original))
            {
                return (null, $"Ticker '{original}' was substituted more than once.");
            }

            map[original] = replacement;
        }

        return (map, null);
    }
}
