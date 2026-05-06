using Microsoft.Extensions.Logging;

namespace MomentumInvestment.Api.Strategies;

/// <summary>
/// Shared 13612W scoring used by every Keller-family strategy. Looks up
/// the lookback prices for the given <paramref name="asOf"/>, applies the
/// formula, and optionally logs a per-ticker breakdown for debugging.
///
/// Pulled out of the individual strategy services once
/// <see cref="VaaG4B3Service"/> and <see cref="DaaG12Service"/> turned out
/// to share an identical <c>ScoreFor</c> helper. Keeping it static means
/// no extra DI hop; pass the calling service's <see cref="ILogger"/> in
/// if you want the per-ticker log lines categorised under that service.
/// </summary>
public static class MomentumScorer
{
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
}
