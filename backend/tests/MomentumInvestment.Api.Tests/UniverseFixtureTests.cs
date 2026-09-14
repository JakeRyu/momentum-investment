using System.Text.Json;
using MomentumInvestment.Api.Strategies;
using Xunit;

namespace MomentumInvestment.Api.Tests;

/// <summary>
/// Pins shared/universes.json to the live universe records.
///
/// The fixture is what the two clients read to render a strategy's
/// structure — the app's ETF config screen and the web's fund count. It
/// is maintained by hand on purpose, the same way
/// <see cref="PaperFingerprintTests"/> records its configurations: a
/// universe change fails here first, and updating the fixture is then a
/// deliberate act rather than a silent consequence.
/// </summary>
public sealed class UniverseFixtureTests
{
    private static JsonElement Fixture()
    {
        // tests/<proj>/bin/Debug/net10.0 → repo root
        var path = Path.Combine(
            AppContext.BaseDirectory, "..", "..", "..", "..", "..", "..",
            "shared", "universes.json");
        return JsonDocument.Parse(File.ReadAllText(Path.GetFullPath(path))).RootElement;
    }

    private static string[] Bucket(string strategy, string bucket) =>
        Fixture().GetProperty(strategy).GetProperty("buckets").GetProperty(bucket)
            .EnumerateArray().Select(e => e.GetString()!).ToArray();

    [Fact]
    public void VaaMatchesTheRecord()
    {
        Assert.Equal(VaaUniverse.Us.Offensive, Bucket("vaa", "offensive"));
        Assert.Equal(VaaUniverse.Us.Defensive, Bucket("vaa", "defensive"));
    }

    [Fact]
    public void DaaMatchesTheRecord()
    {
        Assert.Equal(DaaG12Universe.Us.Canary, Bucket("daa", "canary"));
        Assert.Equal(DaaG12Universe.Us.Risky, Bucket("daa", "risky"));
        Assert.Equal(DaaG12Universe.Us.Cash, Bucket("daa", "cash"));
    }

    [Fact]
    public void PaaMatchesTheRecord()
    {
        Assert.Equal(PaaUniverse.Us.Risky, Bucket("paa", "risky"));
        Assert.Equal(PaaUniverse.Us.Cash, Bucket("paa", "cash"));
    }

    [Fact]
    public void HaaMatchesTheRecord()
    {
        Assert.Equal(HaaUniverse.Us.Risky, Bucket("haa", "risky"));
        Assert.Equal(new[] { HaaUniverse.Us.Canary }, Bucket("haa", "canary"));
        Assert.Equal(HaaUniverse.Us.Cash, Bucket("haa", "cash"));
    }

    [Fact]
    public void BaaMatchesTheRecord()
    {
        Assert.Equal(BaaUniverse.Us.Canary, Bucket("baa", "canary"));
        Assert.Equal(BaaUniverse.Us.Risky, Bucket("baa", "risky"));
        Assert.Equal(BaaUniverse.Us.Cash, Bucket("baa", "cash"));
    }

    [Fact]
    public void LaaMatchesTheRecord()
    {
        Assert.Equal(LaaUniverse.Us.Permanent, Bucket("laa", "permanent"));
        Assert.Equal(new[] { LaaUniverse.Us.Risky }, Bucket("laa", "risky"));
        Assert.Equal(new[] { LaaUniverse.Us.Cash }, Bucket("laa", "cash"));
        Assert.Equal(
            LaaUniverse.Us.SignalEquity,
            Fixture().GetProperty("laa").GetProperty("signalEquity").GetString());
        Assert.Equal(
            LaaUniverse.Us.UnemploymentSeriesId,
            Fixture().GetProperty("laa").GetProperty("unemploymentSeriesId").GetString());
    }

    [Fact]
    public void LaaSignalEquityIsOutsideTheBuckets()
    {
        // Substitutable tickers are the union of buckets, so keeping the
        // signal equity out of them is what makes it non-substitutable.
        // If someone adds a "signal" bucket, a UK user's SPY override
        // would start moving the Growth-Trend gate.
        var buckets = Fixture().GetProperty("laa").GetProperty("buckets");
        var all = buckets.EnumerateObject()
            .SelectMany(p => p.Value.EnumerateArray().Select(e => e.GetString()!))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        Assert.DoesNotContain(LaaUniverse.Us.SignalEquity, all);
    }
}
