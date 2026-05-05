using MomentumInvestment.Api.Vaa;
using Xunit;

namespace MomentumInvestment.Api.Tests;

public sealed class VaaG4B3ServiceTests
{
    private static readonly DateOnly AsOf = new(2026, 1, 30);

    /// <summary>
    /// 5 daily entries placed exactly at the lookback targets. Score becomes
    /// 19·(currentRatio − 1) since p1 == p3 == p6 == p12 == 100 and p0 == 100·r.
    /// </summary>
    private static IReadOnlyList<DailyClose> History(decimal currentRatio)
    {
        return new List<DailyClose>
        {
            new(AsOf.AddMonths(-12), 100m),
            new(AsOf.AddMonths(-6),  100m),
            new(AsOf.AddMonths(-3),  100m),
            new(AsOf.AddMonths(-1),  100m),
            new(AsOf,                100m * currentRatio),
        };
    }

    private static IReadOnlyDictionary<string, IReadOnlyList<DailyClose>> Prices(
        decimal spy, decimal efa, decimal eem, decimal agg,
        decimal lqd, decimal ief, decimal shy)
    {
        return new Dictionary<string, IReadOnlyList<DailyClose>>
        {
            ["SPY"] = History(spy),
            ["EFA"] = History(efa),
            ["EEM"] = History(eem),
            ["AGG"] = History(agg),
            ["LQD"] = History(lqd),
            ["IEF"] = History(ief),
            ["SHY"] = History(shy),
        };
    }

    [Fact]
    public void Decide_AllOffensivePositive_GoesOffensive_PicksTopG4()
    {
        // Scores: SPY=0.95, EFA=0.76, EEM=0.57, AGG=0.38 → top = SPY.
        var prices = Prices(
            spy: 1.05m, efa: 1.04m, eem: 1.03m, agg: 1.02m,
            lqd: 1.04m, ief: 1.03m, shy: 1.02m);

        var decision = new VaaG4B3Service().Decide(AsOf, prices);

        Assert.Equal(VaaMode.Offensive, decision.Mode);
        Assert.Equal("SPY", decision.SelectedTicker);
        Assert.Equal(0.95m, decision.SelectedScore);
    }

    [Fact]
    public void Decide_OneOffensiveNegative_GoesDefensive_PicksTopB3()
    {
        // SPY negative → defensive trigger. B3 scores: LQD=0.76, IEF=0.57, SHY=0.38.
        var prices = Prices(
            spy: 0.95m, efa: 1.04m, eem: 1.03m, agg: 1.02m,
            lqd: 1.04m, ief: 1.03m, shy: 1.02m);

        var decision = new VaaG4B3Service().Decide(AsOf, prices);

        Assert.Equal(VaaMode.Defensive, decision.Mode);
        Assert.Equal("LQD", decision.SelectedTicker);
        Assert.Equal(0.76m, decision.SelectedScore);
    }

    [Fact]
    public void Decide_OneOffensiveZero_GoesDefensive_BoundaryIsInclusive()
    {
        // AGG flat (ratio 1.0 → score 0). Rule treats <= 0 as "bad".
        var prices = Prices(
            spy: 1.05m, efa: 1.04m, eem: 1.03m, agg: 1.00m,
            lqd: 1.04m, ief: 1.03m, shy: 1.02m);

        var decision = new VaaG4B3Service().Decide(AsOf, prices);

        Assert.Equal(VaaMode.Defensive, decision.Mode);
    }

    [Fact]
    public void Decide_ScoresIncludedForBothUniverses()
    {
        var prices = Prices(
            spy: 1.05m, efa: 1.04m, eem: 1.03m, agg: 1.02m,
            lqd: 1.04m, ief: 1.03m, shy: 1.02m);

        var decision = new VaaG4B3Service().Decide(AsOf, prices);

        Assert.Equal(4, decision.OffensiveScores.Count);
        Assert.Equal(3, decision.DefensiveScores.Count);
        Assert.Contains(decision.OffensiveScores, s => s.Ticker == "SPY" && s.Score == 0.95m);
        Assert.Contains(decision.DefensiveScores, s => s.Ticker == "LQD" && s.Score == 0.76m);
    }
}
