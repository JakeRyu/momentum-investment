namespace MomentumInvestment.Api.Strategies;

/// <summary>
/// The set of tickers that DAA-G12 evaluates on a single request.
///
/// DAA splits its universe into three buckets, unlike VAA's two:
///   - <see cref="Canary"/>: assets whose breadth signals crash protection.
///     Default in Keller 2018: VWO, BND.
///   - <see cref="Risky"/>: the offensive opportunity set. Default G12:
///     SPY, IWM, QQQ, VGK, EWJ, VWO, VNQ, GSG, GLD, TLT, HYG, LQD.
///   - <see cref="Cash"/>: defensive assets used when canary breadth
///     signals risk. Default: SHY, IEF, LQD.
///
/// Note: a single ticker may appear in multiple buckets (VWO is canary AND
/// risky in the default; LQD is risky AND cash). <see cref="AllTickers"/>
/// dedups so the caller fetches each ticker exactly once.
///
/// As with <see cref="VaaUniverse"/>, the static <see cref="Us"/> factory
/// is for tests and documentation only — production tickers are supplied
/// by the mobile caller so region selection / user overrides stay there.
/// </summary>
public sealed record DaaG12Universe(
    IReadOnlyList<string> Canary,
    IReadOnlyList<string> Risky,
    IReadOnlyList<string> Cash)
{
    public IEnumerable<string> AllTickers() =>
        Canary.Concat(Risky).Concat(Cash).Distinct();

    /// <summary>
    /// Original Keller 2018 universe — US-listed ETFs.
    /// </summary>
    public static readonly DaaG12Universe Us = new(
        Canary: new[] { "VWO", "BND" },
        Risky:  new[] { "SPY", "IWM", "QQQ", "VGK", "EWJ", "VWO", "VNQ", "GSG", "GLD", "TLT", "HYG", "LQD" },
        Cash:   new[] { "SHY", "IEF", "LQD" });
}
