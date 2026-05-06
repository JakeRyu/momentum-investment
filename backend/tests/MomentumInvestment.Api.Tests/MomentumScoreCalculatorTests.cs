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

    /// <summary>
    /// All 12 monthly closes equal → SMA = current → ratio = 1 → momentum = 0.
    /// </summary>
    [Fact]
    public void CalculateSMAMomentum_FlatPrices_ReturnsZero()
    {
        var closes = Enumerable.Repeat(100m, 12).ToList();
        Assert.Equal(0m, MomentumScoreCalculator.CalculateSMAMomentum(closes));
    }

    /// <summary>
    /// P₀ = 110, P₁..P₁₁ = 100 (12 closes total).
    /// SMA = (110 + 11·100) / 12 = 1210/12.
    /// Momentum = 110 / (1210/12) − 1 = 1320/1210 − 1 = 110/1210 = 1/11.
    /// Compared with a tolerance because two-step decimal division
    /// (`p₀/sma − 1`) and one-step (`1m/11m`) truncate differently in the
    /// last digit; same situation `verify_paa.py` handles via
    /// `almost_equal`.
    /// </summary>
    [Fact]
    public void CalculateSMAMomentum_OnlyP0Lifted_GivesOneEleventh()
    {
        var closes = new[] { 110m }.Concat(Enumerable.Repeat(100m, 11)).ToList();

        var score = MomentumScoreCalculator.CalculateSMAMomentum(closes);

        Assert.Equal(1m / 11m, score, precision: 18);
    }

    /// <summary>
    /// Symmetric drop: P₀ = 90, P₁..P₁₁ = 100.
    /// SMA = (90 + 1100)/12 = 1190/12.
    /// Momentum = 90 / (1190/12) − 1 = 1080/1190 − 1 = −110/1190.
    /// </summary>
    [Fact]
    public void CalculateSMAMomentum_OnlyP0Dropped_GivesNegativeRatio()
    {
        var closes = new[] { 90m }.Concat(Enumerable.Repeat(100m, 11)).ToList();

        var score = MomentumScoreCalculator.CalculateSMAMomentum(closes);

        Assert.Equal(-110m / 1190m, score, precision: 18);
    }

    /// <summary>
    /// Hand-checked closed-form: P₀ = 130, P₁..P₁₁ = 100.
    /// SMA = 1230/12 = 102.5 (exact). 130/102.5 = 52/41. − 1 = 11/41.
    /// </summary>
    [Fact]
    public void CalculateSMAMomentum_HandCheckedRatio_GivesElevenForty1ths()
    {
        var closes = new[] { 130m }.Concat(Enumerable.Repeat(100m, 11)).ToList();

        var score = MomentumScoreCalculator.CalculateSMAMomentum(closes);

        Assert.Equal(11m / 41m, score, precision: 18);
    }

    [Fact]
    public void CalculateSMAMomentum_EmptyList_Throws()
    {
        Assert.Throws<ArgumentException>(
            () => MomentumScoreCalculator.CalculateSMAMomentum(Array.Empty<decimal>()));
    }
}
