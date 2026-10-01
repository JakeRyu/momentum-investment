namespace MomentumInvestment.Api.Strategies;

/// <summary>
/// The set of tickers that HAA (Hybrid Asset Allocation, Keller &amp;
/// Keuning 2023) evaluates on a single request.
///
/// HAA splits its universe into three roles:
///   - <see cref="Risky"/>: the offensive opportunity set. Default is
///     8 ETFs spanning four categories (US equities, foreign equities,
///     real assets, treasuries): SPY, IWM, VEA, VWO, VNQ, DBC, IEF, TLT.
///     The strategy holds the top T=4 by 13612U when the canary is
///     bullish.
///   - <see cref="Canary"/>: a single TIPS-class signal asset (TIP). Its
///     13612U score gates the offensive/defensive switch — Keller's
///     "rising-yield filter".
///   - <see cref="Cash"/>: two defensive candidates (BIL, IEF). The one
///     with the higher 13612U is this month's cash — 100% of the
///     portfolio when the canary is bearish, and the replacement for any
///     Top-4 slot with non-positive momentum.
///
/// Unlike DAA (multi-asset canary), HAA uses a single canary asset.
///
/// As with the other Keller universes, <see cref="Us"/> is the canonical
/// universe read directly by the endpoint. A caller substitutes the
/// tickers it holds locally via <see cref="WithSubstitutions"/>; the
/// server has no notion of region.
/// </summary>
public sealed record HaaUniverse(
    IReadOnlyList<string> Risky,
    string Canary,
    IReadOnlyList<string> Cash)
{
    public IEnumerable<string> AllTickers()
    {
        var seen = new HashSet<string>(Risky, StringComparer.OrdinalIgnoreCase);
        foreach (var t in Risky) yield return t;
        if (seen.Add(Canary)) yield return Canary;
        foreach (var c in Cash)
        {
            if (seen.Add(c)) yield return c;
        }
    }

    public IEnumerable<string> SubstitutableTickers() => AllTickers();

    public HaaUniverse WithSubstitutions(IReadOnlyDictionary<string, string> map) => new(
        Risky:  Risky.Select(t => TickerSubstitution.Apply(map, t)).ToArray(),
        Canary: TickerSubstitution.Apply(map, Canary),
        Cash:   Cash.Select(t => TickerSubstitution.Apply(map, t)).ToArray());

    /// <summary>
    /// Original Keller 2023 universe — US-listed ETFs. The 8 risky
    /// tickers are paired by category but the strategy treats them as
    /// a flat top-T selection, not per-pair.
    /// </summary>
    public static readonly HaaUniverse Us = new(
        Risky: new[] { "SPY", "IWM", "VEA", "VWO", "VNQ", "DBC", "IEF", "TLT" },
        Canary: "TIP",
        // ND=2, TD=1: the better of BIL/IEF by 13612U becomes "cash".
        Cash: new[] { "BIL", "IEF" });
}
