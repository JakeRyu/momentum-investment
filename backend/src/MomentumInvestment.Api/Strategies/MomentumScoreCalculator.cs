namespace MomentumInvestment.Api.Strategies;

/// <summary>
/// Pure momentum-formula primitives used by the Keller-family strategies.
///
/// The formulas live here (no I/O, no lookback search) so they can be
/// unit-tested with hand-picked numeric inputs without setting up a
/// price history fixture. <see cref="MomentumScorer"/> is the wrapper
/// that adds the lookback step and per-ticker logging.
/// </summary>
public static class MomentumScoreCalculator
{
    /// <summary>
    /// 13612W momentum (Keller, VAA 2017):
    ///   score = 12·(p0/p1 − 1) + 4·(p0/p3 − 1) + 2·(p0/p6 − 1) + 1·(p0/p12 − 1)
    ///
    /// where p0 is the price on the as-of date and p1/p3/p6/p12 are the closes
    /// 1/3/6/12 months earlier (or the most recent trading day before each
    /// calendar target if it falls on a non-trading day). The weights
    /// annualise each lagged return so the score has units of "average
    /// annualised return".
    /// </summary>
    public static decimal Calculate13612W(
        decimal p0,
        decimal p1,
        decimal p3,
        decimal p6,
        decimal p12)
    {
        return 12m * (p0 / p1 - 1m)
             +  4m * (p0 / p3 - 1m)
             +  2m * (p0 / p6 - 1m)
             +  1m * (p0 / p12 - 1m);
    }

    /// <summary>
    /// SMA12 momentum (Keller, PAA 2016):
    ///   momentum = p₀ / SMA(p₀..p₁₁) − 1
    ///   SMA(p₀..p₁₁) = (p₀ + p₁ + … + p₁₁) / 12
    ///
    /// where p₀ is the price on the as-of date and p₁..p₁₁ are the eleven
    /// preceding monthly closes (trading-day-on-or-before semantics, same
    /// as 13612W). Note that p₀ is *included* in the SMA — Keller's PAA
    /// paper defines SMA12_t = (1/12)·Σ_{i=0}^{11} p_{t−i}.
    ///
    /// Generic over the prior count so future SMA-based strategies (e.g.
    /// SMA10) can reuse this; pass <paramref name="monthlyClosesIncludingCurrent"/>
    /// of any positive length and the formula scales to that window.
    /// </summary>
    public static decimal CalculateSMAMomentum(
        IReadOnlyList<decimal> monthlyClosesIncludingCurrent)
    {
        if (monthlyClosesIncludingCurrent.Count == 0)
        {
            throw new ArgumentException(
                "Need at least one monthly close.",
                nameof(monthlyClosesIncludingCurrent));
        }

        decimal sum = 0m;
        foreach (var p in monthlyClosesIncludingCurrent) sum += p;
        decimal sma = sum / monthlyClosesIncludingCurrent.Count;

        return monthlyClosesIncludingCurrent[0] / sma - 1m;
    }
}
