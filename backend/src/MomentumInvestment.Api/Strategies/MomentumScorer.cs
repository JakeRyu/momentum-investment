using Microsoft.Extensions.Logging;

namespace MomentumInvestment.Api.Strategies;

/// <summary>
/// Shared per-ticker scoring helpers used by every Keller-family strategy.
/// Each method looks up the relevant lookback prices for the given
/// <paramref name="asOf"/>, applies the corresponding formula from
/// <see cref="MomentumScoreCalculator"/>, and optionally logs a per-ticker
/// breakdown for debugging.
///
/// Static so each strategy can share scoring without an extra DI hop.
/// Pass an <see cref="ILogger"/> from the calling service if you want
/// the per-ticker log lines categorised under that service.
/// </summary>
public static class MomentumScorer
{
    /// <summary>
    /// 13612W momentum score for a single ticker (Keller VAA 2017).
    /// Used by VAA-G4/B3 and DAA-G12.
    /// </summary>
    public static decimal Score13612W(
        string ticker,
        DateOnly asOf,
        IReadOnlyDictionary<string, IReadOnlyList<DailyClose>> dailyByTicker,
        ILogger? logger = null)
    {
        if (!dailyByTicker.TryGetValue(ticker, out var history))
        {
            throw new InvalidOperationException($"Missing daily history for ticker '{ticker}'.");
        }

        var p = LookbackPriceLookup.FindLookbackPrices(asOf, history);
        var score = MomentumScoreCalculator.Calculate13612W(
            p.P0.AdjClose, p.P1.AdjClose, p.P3.AdjClose, p.P6.AdjClose, p.P12.AdjClose);

        logger?.LogInformation(
            "13612W {Ticker,-6} p0={P0,9:F4} ({D0:yyyy-MM-dd}) p1={P1,9:F4} ({D1:yyyy-MM-dd}) p3={P3,9:F4} ({D3:yyyy-MM-dd}) p6={P6,9:F4} ({D6:yyyy-MM-dd}) p12={P12,9:F4} ({D12:yyyy-MM-dd}) -> score={Score,8:F4}",
            ticker,
            p.P0.AdjClose, p.P0.Date,
            p.P1.AdjClose, p.P1.Date,
            p.P3.AdjClose, p.P3.Date,
            p.P6.AdjClose, p.P6.Date,
            p.P12.AdjClose, p.P12.Date,
            score);

        return score;
    }

    /// <summary>
    /// SMA12 momentum score for a single ticker (Keller PAA 2016):
    ///   momentum = p₀ / mean(p₀..p₁₁) − 1
    ///
    /// Used by PAA-G12 and any future SMA-based strategy. Same lookback
    /// semantics as <see cref="Score13612W"/> — trading-day-on-or-before
    /// for each (asOf − i months), i ∈ [0, 11].
    /// </summary>
    public static decimal ScoreSMA12(
        string ticker,
        DateOnly asOf,
        IReadOnlyDictionary<string, IReadOnlyList<DailyClose>> dailyByTicker,
        ILogger? logger = null)
    {
        if (!dailyByTicker.TryGetValue(ticker, out var history))
        {
            throw new InvalidOperationException($"Missing daily history for ticker '{ticker}'.");
        }

        var prices = LookbackPriceLookup.FindMonthlyLookbackPrices(asOf, history, monthsBack: 11);

        // Project to decimals for the calculator; we still need DailyClose
        // for the log line below.
        var closes = new decimal[prices.Count];
        for (int i = 0; i < prices.Count; i++) closes[i] = prices[i].AdjClose;

        var score = MomentumScoreCalculator.CalculateSMAMomentum(closes);

        logger?.LogInformation(
            "SMA12  {Ticker,-6} p0={P0,9:F4} ({D0:yyyy-MM-dd}) p11={P11,9:F4} ({D11:yyyy-MM-dd}) n={N} -> mom={Score,8:F4}",
            ticker,
            prices[0].AdjClose, prices[0].Date,
            prices[^1].AdjClose, prices[^1].Date,
            prices.Count,
            score);

        return score;
    }
}
