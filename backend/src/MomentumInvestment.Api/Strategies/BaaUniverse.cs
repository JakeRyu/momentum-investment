namespace MomentumInvestment.Api.Strategies;

/// <summary>
/// The set of tickers BAA-G12 (Bold Asset Allocation, Keller 2022)
/// evaluates on a single request. Three role buckets:
///
///   - <see cref="Canary"/>: 3 canaries (TIP, IEF, BIL by Keller's
///     defaults). The strategy is offensive only when ALL canaries have
///     positive 13612W — a much stricter gate than DAA's count-based
///     breadth check, hence the "Bold" name.
///   - <see cref="Risky"/>: 12-asset offensive universe (same composition
///     as DAA-G12 risky). When the canaries unanimously confirm, top
///     T=6 by 13612W are held at 1/T each.
///   - <see cref="Cash"/>: defensive candidates (BIL, IEF, TLT, BND, LQD
///     by default). Selected by SMA12 — Keller's PAA-style cash ranking,
///     not the 13612W used elsewhere — and the single top-scorer is held
///     100% when defensive.
///
/// Tickers may overlap across buckets (e.g. IEF in canary + cash, LQD
/// in risky + cash). <see cref="AllTickers"/> dedups so each is fetched
/// once.
/// </summary>
public sealed record BaaUniverse(
    IReadOnlyList<string> Canary,
    IReadOnlyList<string> Risky,
    IReadOnlyList<string> Cash)
{
    public IEnumerable<string> AllTickers() =>
        Canary.Concat(Risky).Concat(Cash).Distinct();

    /// <summary>
    /// Original Keller 2022 universe — US-listed ETFs.
    /// </summary>
    public static readonly BaaUniverse Us = new(
        Canary: new[] { "TIP", "IEF", "BIL" },
        Risky:  new[]
        {
            "SPY", "IWM", "QQQ", "VGK", "EWJ", "EEM",
            "VNQ", "GSG", "GLD", "TLT", "HYG", "LQD",
        },
        Cash:   new[] { "BIL", "IEF", "TLT", "BND", "LQD" });
}
