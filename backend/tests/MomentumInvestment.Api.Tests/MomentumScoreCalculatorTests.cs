using MomentumInvestment.Api.Strategies;
using Xunit;

namespace MomentumInvestment.Api.Tests;

public sealed class MomentumScoreCalculatorTests
{
    /// <summary>
    /// p0 == p1 == p3 == p6 == p12 → all (p0/pN − 1) terms are zero.
    /// </summary>
    [Fact]
    public void Calculate13612W_FlatPrices_ReturnsZero()
    {
        Assert.Equal(0m, MomentumScoreCalculator.Calculate13612W(100m, 100m, 100m, 100m, 100m));
    }

    /// <summary>
    /// p1 == p3 == p6 == p12 == 100 and p0 == 100·r gives
    /// score = (12 + 4 + 2 + 1)·(r − 1) = 19·(r − 1) — exact in decimal.
    /// </summary>
    [Theory]
    [InlineData("1.01",  "0.19")]
    [InlineData("0.99", "-0.19")]
    [InlineData("1.05",  "0.95")]
    [InlineData("0.95", "-0.95")]
    public void Calculate13612W_FlatThenSingleBump_EqualsNineteenTimesRatioMinusOne(string ratio, string expected)
    {
        var r = decimal.Parse(ratio);
        var exp = decimal.Parse(expected);

        Assert.Equal(exp, MomentumScoreCalculator.Calculate13612W(100m * r, 100m, 100m, 100m, 100m));
    }
}
