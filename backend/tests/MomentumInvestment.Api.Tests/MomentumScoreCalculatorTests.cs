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

    /// <summary>
    /// 13612U — the unweighted sibling of 13612W, used by HAA for all
    /// three of its universes (the paper denotes it L=1). Plain mean of
    /// the 1-, 3-, 6- and 12-month total returns.
    /// </summary>
    [Fact]
    public void Calculate13612U_AveragesTheFourReturnsEqually()
    {
        // p0/p1 = 1.10, p0/p3 = 1.20, p0/p6 = 1.30, p0/p12 = 1.40
        // returns: 0.10, 0.20, 0.30, 0.40 -> mean 0.25
        var score = MomentumScoreCalculator.Calculate13612U(
            p0: 110m, p1: 100m, p3: 110m / 1.20m, p6: 110m / 1.30m, p12: 110m / 1.40m);

        Assert.Equal(0.25m, score, precision: 6);
    }

    [Fact]
    public void Calculate13612U_WeightsNoLookbackMoreThanAnother()
    {
        // A gain confined to the most recent month moves 13612W far more
        // than 13612U, because 13612W weights it 12x. Same inputs, and
        // the unweighted score must be the smaller of the two.
        decimal p0 = 110m, p1 = 100m, p3 = 100m, p6 = 100m, p12 = 100m;

        var weighted = MomentumScoreCalculator.Calculate13612W(p0, p1, p3, p6, p12);
        var unweighted = MomentumScoreCalculator.Calculate13612U(p0, p1, p3, p6, p12);

        Assert.Equal(0.10m, unweighted, precision: 6);
        Assert.True(unweighted < weighted);
    }

    [Fact]
    public void Calculate13612U_IsNegativeWhenEveryLookbackIsDown()
    {
        var score = MomentumScoreCalculator.Calculate13612U(
            p0: 90m, p1: 100m, p3: 100m, p6: 100m, p12: 100m);

        Assert.True(score < 0m);
    }
}
