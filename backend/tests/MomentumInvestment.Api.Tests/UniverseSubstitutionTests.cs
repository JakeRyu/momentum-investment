using MomentumInvestment.Api.Strategies;
using Xunit;

namespace MomentumInvestment.Api.Tests;

public sealed class UniverseSubstitutionTests
{
    private static readonly Dictionary<string, string> SpyToCspx =
        new(StringComparer.OrdinalIgnoreCase) { ["SPY"] = "CSPX.L" };

    [Fact]
    public void ReplacesTheTickerInEveryBucketItAppearsIn()
    {
        // BAA holds SPY in canary AND risky. A holder's substitution is a
        // property of the asset, not of the slot.
        var baa = BaaUniverse.Us.WithSubstitutions(SpyToCspx);
        Assert.Contains("CSPX.L", baa.Canary);
        Assert.Contains("CSPX.L", baa.Risky);
        Assert.DoesNotContain("SPY", baa.Canary);
        Assert.DoesNotContain("SPY", baa.Risky);
    }

    [Fact]
    public void LeavesOtherTickersAlone()
    {
        var vaa = VaaUniverse.Us.WithSubstitutions(SpyToCspx);
        Assert.Equal(new[] { "CSPX.L", "EFA", "EEM", "AGG" }, vaa.Offensive);
        Assert.Equal(VaaUniverse.Us.Defensive, vaa.Defensive);
    }

    [Fact]
    public void LaaDoesNotOfferItsSignalEquityForSubstitution()
    {
        // SPY is LAA's Growth-Trend signal and nothing else — it is not
        // held. A UK user's US_LARGE_CAP override must not move it.
        Assert.DoesNotContain("SPY", LaaUniverse.Us.SubstitutableTickers());
        Assert.Contains("QQQ", LaaUniverse.Us.SubstitutableTickers());
        Assert.Contains("IWD", LaaUniverse.Us.SubstitutableTickers());
    }

    [Fact]
    public void LaaSubstitutionLeavesTheSignalUntouched()
    {
        var laa = LaaUniverse.Us.WithSubstitutions(
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["QQQ"] = "EQQQ.L",
            });
        Assert.Equal("EQQQ.L", laa.Risky);
        Assert.Equal("SPY", laa.SignalEquity);
        Assert.Equal("UNRATE", laa.UnemploymentSeriesId);
    }

    [Fact]
    public void SubstitutableTickersAreTheUnionOfBuckets()
    {
        Assert.Equal(
            BaaUniverse.Us.AllTickers().OrderBy(t => t),
            BaaUniverse.Us.SubstitutableTickers().OrderBy(t => t));
    }

    [Fact]
    public void HaaSubstitutesItsSingleCanary()
    {
        var haa = HaaUniverse.Us.WithSubstitutions(
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["TIP"] = "ITPS.L",
            });
        Assert.Equal("ITPS.L", haa.Canary);
    }
}
