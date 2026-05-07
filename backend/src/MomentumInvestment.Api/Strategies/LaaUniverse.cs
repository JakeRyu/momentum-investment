namespace MomentumInvestment.Api.Strategies;

/// <summary>
/// The set of tickers that LAA evaluates on a single request.
///
/// LAA (Keller, 2019, "Lethargic Asset Allocation") is structurally
/// different from the breadth-momentum strategies in this codebase:
///
///   - 75% of the portfolio is a fixed "permanent" sleeve — three assets
///     held at 25% each regardless of market conditions. Default IWD,
///     GLD, IEF.
///   - The remaining 25% rotates between a single risky asset (default
///     QQQ) and a single cash asset (default SHY).
///   - The rotation is driven by Growth-Trend (GT) timing, a two-signal
///     macro rule: switch to <c>Cash</c> when BOTH the unemployment rate
///     is rising (vs its 12-month SMA) AND the equity-trend signal is
///     bearish (SPY below its 200-day SMA).
///
/// Because the GT signal depends on macro data (US unemployment) outside
/// the daily price universe, LAA's universe carries the FRED series ID
/// in addition to the asset tickers. The signal equity ticker (default
/// SPY) is also explicit so the UK region can keep using SPY as the
/// market-trend signal even when the actual portfolio assets are mapped
/// to UK UCITS substitutes (per the agreed region-handling rule).
/// </summary>
/// <param name="Permanent">
/// The three permanent-sleeve tickers, held at 25% each. Default
/// (Keller 2019): <c>IWD</c> (US large-cap value), <c>GLD</c> (gold),
/// <c>IEF</c> (7–10y US Treasuries).
/// </param>
/// <param name="Risky">The risky rotating ticker (default QQQ). Held at 25% in Risk-On.</param>
/// <param name="Cash">The cash rotating ticker (default SHY). Held at 25% in Risk-Off.</param>
/// <param name="SignalEquity">The market-trend signal equity (default SPY). 200-day SMA threshold.</param>
/// <param name="UnemploymentSeriesId">FRED series ID for the unemployment-trend signal (default UNRATE).</param>
public sealed record LaaUniverse(
    IReadOnlyList<string> Permanent,
    string Risky,
    string Cash,
    string SignalEquity,
    string UnemploymentSeriesId)
{
    /// <summary>
    /// All distinct tickers whose daily history must be fetched for a
    /// decision: the three permanent assets, the rotating risky/cash
    /// pair, and the signal equity. Deduped — the signal equity is often
    /// also one of the permanent assets in alternative LAA spec'ings,
    /// though the canonical SPY/IWD pairing keeps them distinct.
    /// </summary>
    public IEnumerable<string> AllDailyTickers()
        => Permanent
            .Concat(new[] { Risky, Cash, SignalEquity })
            .Distinct(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Original Keller 2019 universe — US-listed ETFs.
    /// Permanent: IWD, GLD, IEF · Risky: QQQ · Cash: SHY · Signal: SPY · Macro: UNRATE.
    /// </summary>
    public static readonly LaaUniverse Us = new(
        Permanent:             new[] { "IWD", "GLD", "IEF" },
        Risky:                 "QQQ",
        Cash:                  "SHY",
        SignalEquity:          "SPY",
        UnemploymentSeriesId:  "UNRATE");
}
