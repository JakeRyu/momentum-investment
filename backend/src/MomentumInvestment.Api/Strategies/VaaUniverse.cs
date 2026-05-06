namespace MomentumInvestment.Api.Strategies;

/// <summary>
/// The set of tickers that VAA-G4/B3 evaluates on a single request.
///
/// The backend is region-agnostic: the caller (mobile app) decides which
/// tickers to evaluate (US-listed defaults, LSE-listed UCITS substitutes,
/// or a user-customised mix) and supplies them explicitly. This type is
/// just a typed wrapper around the two ticker lists.
///
/// The static <see cref="Us"/> and <see cref="Uk"/> factories exist mainly
/// as test fixtures and as a documented record of curated defaults — they
/// are NOT referenced from production code paths since the API endpoint
/// now takes the lists directly from the caller.
/// </summary>
public sealed record VaaUniverse(
    IReadOnlyList<string> Offensive,
    IReadOnlyList<string> Defensive)
{
    public IEnumerable<string> AllTickers() => Offensive.Concat(Defensive).Distinct();

    /// <summary>
    /// Original Keller universe — US-listed ETFs.
    /// </summary>
    public static readonly VaaUniverse Us = new(
        Offensive: new[] { "SPY", "EFA", "EEM", "AGG" },
        Defensive: new[] { "LQD", "IEF", "SHY" });

    /// <summary>
    /// Curated LSE-listed UCITS substitutes for UK-resident investors.
    /// Kept here for reference / test fixtures only — the live mapping
    /// (including user overrides) is owned by the mobile client.
    /// </summary>
    public static readonly VaaUniverse Uk = new(
        Offensive: new[] { "CSPX.L", "IWDA.L", "EIMI.L", "AGGU.L" },
        Defensive: new[] { "LQDA.L", "IDTM.L", "IBTS.L" });
}
