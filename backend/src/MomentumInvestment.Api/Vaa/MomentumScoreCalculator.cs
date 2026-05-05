namespace MomentumInvestment.Api.Vaa;

/// <summary>
/// 13612W momentum score (Wouter Keller, Vigilant Asset Allocation, 2017).
///
///   score = 12·(p0/p1 − 1) + 4·(p0/p3 − 1) + 2·(p0/p6 − 1) + 1·(p0/p12 − 1)
///
/// where p0 is the price on the as-of date and p1, p3, p6, p12 are the
/// closes 1, 3, 6, and 12 months earlier (or the most recent trading day
/// before each calendar target if it falls on a non-trading day). The
/// weights annualize each lagged return so the score has units of
/// "average annualized return".
/// </summary>
public static class MomentumScoreCalculator
{
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
}
