using MomentumInvestment.Api;
using Xunit;

namespace MomentumInvestment.Api.Tests;

public sealed class ClientVersionTests
{
    // These pin the comparison, not the policy. OldestTrusted moves when a
    // version is condemned; the tests below state it explicitly so raising
    // it is a deliberate edit here too, rather than a silent behaviour change.
    private const string Below = "0.9";
    private const string AtTheLine = "1.0";
    private const string Above = "1.3";

    [Fact]
    public void OldestTrusted_StartsAtTheFirstRelease_SoNothingShippedIsCondemned()
    {
        Assert.Equal(new Version(1, 0), ClientVersion.OldestTrusted);
    }

    [Theory]
    [InlineData(AtTheLine)]
    [InlineData(Above)]
    [InlineData("2.0")]
    public void AtOrAboveTheLine_IsCurrent(string reported)
    {
        Assert.Equal(ClientVersion.Current, ClientVersion.Status(reported));
    }

    [Fact]
    public void BelowTheLine_IsOutdated()
    {
        Assert.Equal(ClientVersion.Outdated, ClientVersion.Status(Below));
    }

    [Fact]
    public void ComparesNumerically_NotAsText()
    {
        // The trap: "1.10" sorts BEFORE "1.9" as text, so a string
        // comparison would call the tenth release older than the ninth.
        // The line is passed in here because the real one (1.0) sits below
        // everything, where text and numeric ordering happen to agree — a
        // broken comparison would pass every other test in this file.
        var line = new Version(1, 10);

        Assert.Equal(ClientVersion.Outdated, ClientVersion.Status("1.9", line));
        Assert.Equal(ClientVersion.Current, ClientVersion.Status("1.10", line));
        Assert.Equal(ClientVersion.Current, ClientVersion.Status("1.11", line));
    }

    [Theory]
    [InlineData(null)]          // the website, which sends no version
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("not-a-version")]
    [InlineData("1.2.3.4.5")]
    public void MissingOrUnparseable_FailsOpen(string? header)
    {
        // A check that bricks the app when it misfires is worse than no
        // check. Absence of evidence is not evidence of staleness.
        Assert.Equal(ClientVersion.Current, ClientVersion.Status(header));
    }

    [Fact]
    public void Whitespace_IsTolerated()
    {
        Assert.Equal(ClientVersion.Current, ClientVersion.Status(" 1.3 "));
    }
}
