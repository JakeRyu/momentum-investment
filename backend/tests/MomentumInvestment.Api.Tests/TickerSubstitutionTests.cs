using MomentumInvestment.Api.Strategies;
using Xunit;

namespace MomentumInvestment.Api.Tests;

public sealed class TickerSubstitutionTests
{
    private static readonly string[] Allowed = { "SPY", "EFA", "EEM", "AGG", "LQD", "IEF", "SHY" };

    [Fact]
    public void NoParametersMeansNoSubstitutions()
    {
        var (map, error) = TickerSubstitution.Parse(null, Allowed);
        Assert.Null(error);
        Assert.Empty(map!);
    }

    [Fact]
    public void ParsesAPair()
    {
        var (map, error) = TickerSubstitution.Parse(new[] { "SPY:CSPX.L" }, Allowed);
        Assert.Null(error);
        Assert.Equal("CSPX.L", map!["SPY"]);
    }

    [Fact]
    public void MatchesTheKeyCaseInsensitively()
    {
        var (map, error) = TickerSubstitution.Parse(new[] { "spy:CSPX.L" }, Allowed);
        Assert.Null(error);
        Assert.Equal("CSPX.L", map!["SPY"]);
    }

    [Fact]
    public void RejectsAPairWithNoColon()
    {
        var (map, error) = TickerSubstitution.Parse(new[] { "SPY" }, Allowed);
        Assert.Null(map);
        Assert.Contains("ORIGINAL:REPLACEMENT", error);
    }

    [Fact]
    public void RejectsAnEmptySide()
    {
        Assert.NotNull(TickerSubstitution.Parse(new[] { "SPY:" }, Allowed).Error);
        Assert.NotNull(TickerSubstitution.Parse(new[] { ":CSPX.L" }, Allowed).Error);
        Assert.NotNull(TickerSubstitution.Parse(new[] { "SPY:   " }, Allowed).Error);
    }

    [Fact]
    public void RejectsATickerThisStrategyDoesNotHold()
    {
        // The failure mode this whole change exists to remove: a
        // substitution that silently does nothing while the holder
        // believes it applied.
        var (map, error) = TickerSubstitution.Parse(new[] { "QQQ:EQQQ.L" }, Allowed);
        Assert.Null(map);
        Assert.Contains("QQQ", error);
        Assert.Contains("SPY", error); // the valid set is named
    }

    [Fact]
    public void RejectsTheSameTickerTwice()
    {
        var (map, error) = TickerSubstitution.Parse(
            new[] { "SPY:CSPX.L", "SPY:VUAG.L" }, Allowed);
        Assert.Null(map);
        Assert.Contains("more than once", error);
    }

    [Fact]
    public void SplitsOnTheFirstColonOnly()
    {
        var (map, error) = TickerSubstitution.Parse(new[] { "SPY:A:B" }, Allowed);
        Assert.Null(error);
        Assert.Equal("A:B", map!["SPY"]);
    }
}
