using MomentumInvestment.Api.Strategies;
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

        var decision = new VaaG4B3Service().Decide(AsOf, VaaUniverse.Us, prices);

        Assert.Equal("vaa-g4b3", decision.StrategyId);
        Assert.Equal("Offensive", decision.ModeLabel);
        Assert.Single(decision.Allocations);
        Assert.Equal("SPY", decision.Allocations[0].Ticker);
        Assert.Equal(1.0m, decision.Allocations[0].Weight);
    }

    [Fact]
    public void Decide_OneOffensiveNegative_GoesDefensive_PicksTopB3()
    {
        // SPY negative → defensive trigger. B3 scores: LQD=0.76, IEF=0.57, SHY=0.38.
        var prices = Prices(
            spy: 0.95m, efa: 1.04m, eem: 1.03m, agg: 1.02m,
            lqd: 1.04m, ief: 1.03m, shy: 1.02m);

        var decision = new VaaG4B3Service().Decide(AsOf, VaaUniverse.Us, prices);

        Assert.Equal("Defensive", decision.ModeLabel);
        Assert.Single(decision.Allocations);
        Assert.Equal("LQD", decision.Allocations[0].Ticker);
        Assert.Equal(1.0m, decision.Allocations[0].Weight);
    }

    [Fact]
    public void Decide_OneOffensiveZero_GoesDefensive_BoundaryIsInclusive()
    {
        // AGG flat (ratio 1.0 → score 0). Rule treats <= 0 as "bad".
        var prices = Prices(
            spy: 1.05m, efa: 1.04m, eem: 1.03m, agg: 1.00m,
            lqd: 1.04m, ief: 1.03m, shy: 1.02m);

        var decision = new VaaG4B3Service().Decide(AsOf, VaaUniverse.Us, prices);

        Assert.Equal("Defensive", decision.ModeLabel);
    }

    [Fact]
    public void Decide_ScoresIncludedForBothBuckets()
    {
        var prices = Prices(
            spy: 1.05m, efa: 1.04m, eem: 1.03m, agg: 1.02m,
            lqd: 1.04m, ief: 1.03m, shy: 1.02m);

        var decision = new VaaG4B3Service().Decide(AsOf, VaaUniverse.Us, prices);

        var offensiveScores = decision.Scores.Where(s => s.Bucket == "Offensive").ToList();
        var defensiveScores = decision.Scores.Where(s => s.Bucket == "Defensive").ToList();

        Assert.Equal(4, offensiveScores.Count);
        Assert.Equal(3, defensiveScores.Count);
        Assert.Contains(offensiveScores, s => s.Ticker == "SPY" && s.Score == 0.95m);
        Assert.Contains(defensiveScores, s => s.Ticker == "LQD" && s.Score == 0.76m);
    }

    [Fact]
    public void Decide_UkUniverse_UsesUkTickers()
    {
        // Same momentum shape as the offensive test, but priced against the
        // UK UCITS substitutes. Verifies that the universe parameter is
        // honoured all the way through to the returned tickers.
        var prices = new Dictionary<string, IReadOnlyList<DailyClose>>
        {
            ["CSPX.L"] = History(1.05m),
            ["IWDA.L"] = History(1.04m),
            ["EIMI.L"] = History(1.03m),
            ["AGGU.L"] = History(1.02m),
            ["LQDA.L"] = History(1.04m),
            ["IDTM.L"] = History(1.03m),
            ["IBTS.L"] = History(1.02m),
        };

        var decision = new VaaG4B3Service().Decide(AsOf, VaaUniverse.Uk, prices);

        Assert.Equal("Offensive", decision.ModeLabel);
        Assert.Equal("CSPX.L", decision.Allocations[0].Ticker);
        Assert.All(decision.Scores, s => Assert.EndsWith(".L", s.Ticker));
    }
}
