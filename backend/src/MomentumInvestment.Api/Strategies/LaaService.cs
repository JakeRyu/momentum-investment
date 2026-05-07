using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using MomentumInvestment.Api.Fred;

namespace MomentumInvestment.Api.Strategies;

/// <summary>
/// LAA (Lethargic Asset Allocation, Wouter Keller 2019).
///
/// Structurally LAA is a 75/25 buy-and-hold + tactical hybrid, not a
/// breadth-momentum strategy. The portfolio is:
///
///   - 75% Permanent sleeve: three assets at 25% each (default IWD, GLD,
///     IEF). Held unconditionally.
///   - 25% Rotating sleeve: risky in normal regimes (default QQQ),
///     replaced by cash (default SHY) when the Growth-Trend (GT) timing
///     rule signals bearish.
///
/// GT rule (Philosophical Economics, adopted by Keller for LAA):
///   bear = (UE_t &gt; SMA12(UE)) AND (SPY_t &lt; SMA200(SPY))
///
/// where UE_t is the latest released US unemployment rate (FRED UNRATE),
/// SMA12(UE) is the 12-month SMA of UE, SPY_t is SPY's adj-close on
/// asOf, and SMA200(SPY) is the 200-trading-day SMA. Both conditions
/// must trigger together for risk-off — UE rising alone (recent recovery
/// blip) or SPY drawdown alone (technical correction) are not enough.
///
/// LAA does not implement <see cref="IAllocationStrategy{TUniverse}"/>:
/// it requires macro data (UNRATE observations) outside the daily-price
/// universe, so its <see cref="Decide"/> takes an extra parameter the
/// other strategies don't need. Program.cs wires the FRED fetch in
/// alongside the Yahoo fetch, then invokes this service directly.
/// </summary>
public sealed class LaaService
{
    public string StrategyId => "laa";

    /// <summary>SPY trend lookback (trading days).</summary>
    public const int SpyTrendWindow = 200;

    /// <summary>UNRATE trend lookback (months).</summary>
    public const int UeTrendWindow = 12;

    /// <summary>Permanent sleeve weight per asset (3 × 0.25 = 0.75).</summary>
    public const decimal PermanentAssetWeight = 0.25m;

    /// <summary>Rotating sleeve weight (single asset, risky or cash).</summary>
    public const decimal RotatingWeight = 0.25m;

    private readonly ILogger<LaaService> _logger;

    public LaaService(ILogger<LaaService>? logger = null)
    {
        _logger = logger ?? NullLogger<LaaService>.Instance;
    }

    /// <summary>
    /// Compute the LAA allocation decision for <paramref name="asOf"/>.
    /// All three buckets of price history (permanent, risky, cash) plus
    /// the signal equity must be present in <paramref name="dailyByTicker"/>.
    /// </summary>
    /// <param name="asOf">Decision date.</param>
    /// <param name="universe">Asset and signal configuration.</param>
    /// <param name="dailyByTicker">
    /// Adjusted-close histories for every ticker returned by
    /// <see cref="LaaUniverse.AllDailyTickers"/>.
    /// </param>
    /// <param name="unemployment">
    /// Chronologically sorted UNRATE observations from FRED.
    /// </param>
    public AllocationDecision Decide(
        DateOnly asOf,
        LaaUniverse universe,
        IReadOnlyDictionary<string, IReadOnlyList<DailyClose>> dailyByTicker,
        IReadOnlyList<MonthlyObservation> unemployment)
    {
        if (universe.Permanent.Count != 3)
        {
            throw new ArgumentException(
                $"LAA expects exactly 3 permanent assets, got {universe.Permanent.Count}.",
                nameof(universe));
        }

        // ---------- 1. Equity-trend signal (SPY vs SMA200) ----------
        if (!dailyByTicker.TryGetValue(universe.SignalEquity, out var spyHistory))
        {
            throw new InvalidOperationException(
                $"Missing daily history for signal equity '{universe.SignalEquity}'.");
        }

        decimal spyClose = SmaCalculator.DailyValueAsOf(asOf, spyHistory);
        decimal spySma = SmaCalculator.DailySma(asOf, spyHistory, SpyTrendWindow);
        // Positive = above SMA (bullish), negative = below (bearish trigger).
        decimal spyTrend = spyClose / spySma - 1m;
        bool spyBearish = spyClose < spySma;

        _logger.LogInformation(
            "LAA SPY signal: {Ticker} close={Close,9:F4} SMA{Window}={Sma,9:F4} trend={Trend,9:F4} bearish={Bearish}",
            universe.SignalEquity, spyClose, SpyTrendWindow, spySma, spyTrend, spyBearish);

        // ---------- 2. UE-trend signal (UNRATE vs SMA12) ----------
        decimal ueValue = SmaCalculator.MonthlyValueAsOf(asOf, unemployment);
        decimal ueSma = SmaCalculator.MonthlySma(asOf, unemployment, UeTrendWindow);
        // Positive = UE above SMA (bearish trigger), negative = below (bullish).
        decimal ueTrend = ueValue / ueSma - 1m;
        bool ueBearish = ueValue > ueSma;

        _logger.LogInformation(
            "LAA UE signal:  {SeriesId} value={Value,8:F4} SMA{Window}={Sma,8:F4} trend={Trend,9:F4} bearish={Bearish}",
            universe.UnemploymentSeriesId, ueValue, UeTrendWindow, ueSma, ueTrend, ueBearish);

        // ---------- 3. GT timing decision ----------
        bool riskOff = spyBearish && ueBearish;

        // ---------- 4. Compose allocations ----------
        var allocations = new List<Allocation>(4);
        foreach (var t in universe.Permanent)
        {
            // Throw early if the permanent ticker history is missing — keeps
            // the failure surface in one place rather than buried in a later
            // calculation.
            if (!dailyByTicker.ContainsKey(t))
            {
                throw new InvalidOperationException(
                    $"Missing daily history for permanent ticker '{t}'.");
            }
            allocations.Add(new Allocation(t, PermanentAssetWeight));
        }

        string rotatingTicker = riskOff ? universe.Cash : universe.Risky;
        if (!dailyByTicker.ContainsKey(rotatingTicker))
        {
            throw new InvalidOperationException(
                $"Missing daily history for rotating ticker '{rotatingTicker}'.");
        }
        allocations.Add(new Allocation(rotatingTicker, RotatingWeight));

        // ---------- 5. Score response ----------
        // LAA isn't a momentum strategy, so the per-asset Score field has
        // no analogue for the permanent/rotating tickers. Instead we emit
        // the two macro signals as Bucket="Signal" rows so the mobile UI
        // can render them in a dedicated section. spyTrend uses the same
        // "fraction above SMA" convention as ueTrend so they read
        // consistently (positive = above SMA in both cases).
        var scores = new List<AssetMomentum>
        {
            new(universe.SignalEquity,         spyTrend, Bucket: "Signal"),
            new(universe.UnemploymentSeriesId, ueTrend,  Bucket: "Signal"),
        };

        // ---------- 6. Mode label + reasoning ----------
        // Reuse "Offensive" / "Defensive" so the mobile DecisionScreen's
        // existing badge colours apply without per-strategy theming.
        string modeLabel = riskOff ? "Defensive" : "Offensive";

        string spyDirection = spyBearish ? "below" : "above";
        string ueDirection = ueBearish ? "above" : "below";
        string reasoning = riskOff
            ? $"GT timing both signals bearish: {universe.SignalEquity} {spyDirection} SMA{SpyTrendWindow} " +
              $"({spyClose:F2} vs {spySma:F2}) AND {universe.UnemploymentSeriesId} {ueDirection} SMA{UeTrendWindow} " +
              $"({ueValue:F2} vs {ueSma:F2}). " +
              $"Risk-Off: 25% each in {string.Join(", ", universe.Permanent)} (permanent sleeve) " +
              $"plus 25% in {universe.Cash} (cash, replacing {universe.Risky})."
            : $"GT timing not both bearish: {universe.SignalEquity} {spyDirection} SMA{SpyTrendWindow} " +
              $"({spyClose:F2} vs {spySma:F2}); {universe.UnemploymentSeriesId} {ueDirection} SMA{UeTrendWindow} " +
              $"({ueValue:F2} vs {ueSma:F2}). " +
              $"Risk-On: 25% each in {string.Join(", ", universe.Permanent)} (permanent sleeve) " +
              $"plus 25% in {universe.Risky}.";

        return new AllocationDecision(
            StrategyId: StrategyId,
            AsOf: asOf,
            ModeLabel: modeLabel,
            Allocations: allocations,
            Scores: scores,
            Reasoning: reasoning);
    }
}
