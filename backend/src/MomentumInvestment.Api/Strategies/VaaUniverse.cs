namespace MomentumInvestment.Api.Strategies;

/// <summary>
/// The set of tickers VAA-G4/B3 evaluates on a single request.
///
/// <see cref="Us"/> is the canonical universe — Keller's original,
/// pinned by PaperFingerprintTests and read directly by the endpoint.
/// A caller substitutes the tickers it holds locally via
/// <see cref="WithSubstitutions"/>; the server has no notion of region.
/// </summary>
public sealed record VaaUniverse(
    IReadOnlyList<string> Offensive,
    IReadOnlyList<string> Defensive)
{
    public IEnumerable<string> AllTickers() => Offensive.Concat(Defensive).Distinct();

    public IEnumerable<string> SubstitutableTickers() => AllTickers();

    public VaaUniverse WithSubstitutions(IReadOnlyDictionary<string, string> map) => new(
        Offensive: Offensive.Select(t => TickerSubstitution.Apply(map, t)).ToArray(),
        Defensive: Defensive.Select(t => TickerSubstitution.Apply(map, t)).ToArray());

    /// <summary>
    /// Original Keller universe — US-listed ETFs.
    /// </summary>
    public static readonly VaaUniverse Us = new(
        Offensive: new[] { "SPY", "EFA", "EEM", "AGG" },
        Defensive: new[] { "LQD", "IEF", "SHY" });
}
