namespace MomentumInvestment.Api.Strategies;

/// <summary>
/// The set of tickers that PAA-G12 evaluates on a single request.
///
/// PAA splits its universe into two buckets:
///   - <see cref="Risky"/>: the offensive opportunity set. Default G12
///     (Keller 2016): SPY, IWM, QQQ, VGK, EWJ, EEM, VNQ, GSG, GLD, HYG,
///     LQD, TLT.
///   - <see cref="Cash"/>: defensive assets used when the breadth signal
///     forces protection. PAA's original paper uses a single cash asset
///     (IEF); we accept a multi-asset list and pick the highest-momentum
///     entry, mirroring the DAA contract for consistency. Pass a
///     single-element list to recover the canonical PAA behaviour.
///
/// Unlike DAA, PAA has no separate canary universe — the breadth signal
/// comes from the risky universe itself (count of assets with positive
/// SMA12 momentum).
///
/// As with the other Keller universes, the static <see cref="Us"/>
/// factory is for tests and documentation only; production tickers come
/// from the mobile caller so region/UK selection lives there.
/// </summary>
public sealed record PaaUniverse(
    IReadOnlyList<string> Risky,
    IReadOnlyList<string> Cash)
{
    public IEnumerable<string> AllTickers() => Risky.Concat(Cash).Distinct();

    /// <summary>
    /// Original Keller 2016 universe — US-listed ETFs.
    /// </summary>
    public static readonly PaaUniverse Us = new(
        Risky: new[] { "SPY", "IWM", "QQQ", "VGK", "EWJ", "EEM", "VNQ", "GSG", "GLD", "HYG", "LQD", "TLT" },
        Cash:  new[] { "IEF", "SHY", "LQD" });
}
