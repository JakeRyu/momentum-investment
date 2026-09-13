using MomentumInvestment.Api.Strategies;
using Xunit;

namespace MomentumInvestment.Api.Tests;

/// <summary>
/// The merge gate for "does this site compute the strategy its paper
/// describes?"
///
/// Every divergence found in the 2026-09-13 audit
/// (docs/superpowers/specs/2026-09-13-paper-implementation-audit.md)
/// survived several rounds of human and automated review, because nothing
/// compared the code to the papers automatically. Two of them were only
/// caught when a drawdown figure was about to be published beside a
/// strategy that did not produce it.
///
/// So each strategy carries a fingerprint holding BOTH the paper's
/// configuration and this implementation's, and three rules are enforced:
///
///   1. <b>Drift</b> — the recorded implementation values must match the
///      live code. Changing a universe or a constant fails here until the
///      fingerprint is updated deliberately.
///   2. <b>Undeclared divergence</b> — wherever paper and implementation
///      differ, that field must appear in <c>Divergences</c> with a
///      reason. A new divergence cannot land silently.
///   3. <b>Stale divergence</b> — a declared divergence whose two sides
///      now agree fails, so reconciling a strategy forces the entry out.
///
/// <para><b>Known limit.</b> Bucket contents and numeric parameters are
/// read from the live code, so rules 1-3 bind them structurally. Momentum
/// filters are method calls rather than data, so their recorded values are
/// maintained by hand — a filter swap is caught by review, not by this
/// test. Making it structural would mean exposing the filter choice on
/// each service; worth doing when the HAA and BAA reconciliations land,
/// since both change filters.</para>
/// </summary>
public sealed class PaperFingerprintTests
{
    /// <summary>One side of a comparison: named ticker buckets plus named scalars.</summary>
    private sealed record Config(
        IReadOnlyDictionary<string, string[]> Buckets,
        IReadOnlyDictionary<string, string> Values);

    /// <summary>A field where paper and implementation knowingly differ.</summary>
    private sealed record Divergence(string Field, string Reason);

    private sealed record Fingerprint(
        string Strategy,
        string Source,
        Config Paper,
        Config Site,
        Divergence[] Divergences);

    // ─── Fingerprints ────────────────────────────────────────────────
    // Paper values are transcribed from the PDFs listed in
    // docs/papers/README.md. Site values are read from the live universe
    // records and service constants below, never retyped.

    private static Fingerprint Vaa() => new(
        "VAA",
        "Keller & Keuning 2017, VAA-G4, T/B = 1/1",
        Paper: new Config(
            Buckets: new Dictionary<string, string[]>
            {
                ["offensive"] = new[] { "SPY", "EFA", "EEM", "AGG" },
                ["cash"] = new[] { "SHY", "IEF", "LQD" },
            },
            Values: new Dictionary<string, string>
            {
                ["riskyFilter"] = "13612W",
                ["cashFilter"] = "13612W",
                ["topRisky"] = "1",
                ["breadth"] = "1",
            }),
        Site: new Config(
            Buckets: new Dictionary<string, string[]>
            {
                ["offensive"] = VaaUniverse.Us.Offensive.ToArray(),
                ["cash"] = VaaUniverse.Us.Defensive.ToArray(),
            },
            Values: new Dictionary<string, string>
            {
                ["riskyFilter"] = "13612W",
                ["cashFilter"] = "13612W",
                ["topRisky"] = "1",
                ["breadth"] = "1",
            }),
        Divergences: Array.Empty<Divergence>());

    private static Fingerprint Daa() => new(
        "DAA",
        "Keller & Keuning 2018, Fig. 8, DAA-G12 (T=6, B=2)",
        Paper: new Config(
            Buckets: new Dictionary<string, string[]>
            {
                // Footnote 9: this paper uses Vanguard's VWO/BND/VNQ where
                // VAA used iShares EEM/AGG/IYR.
                ["canary"] = new[] { "VWO", "BND" },
                ["risky"] = new[] { "SPY", "IWM", "QQQ", "VGK", "EWJ", "VWO", "VNQ", "GSG", "GLD", "TLT", "HYG", "LQD" },
                ["cash"] = new[] { "SHY", "IEF", "LQD" },
            },
            Values: new Dictionary<string, string>
            {
                ["riskyFilter"] = "13612W",
                ["canaryFilter"] = "13612W",
                ["topRisky"] = "6",
                ["breadth"] = "2",
            }),
        Site: new Config(
            Buckets: new Dictionary<string, string[]>
            {
                ["canary"] = DaaG12Universe.Us.Canary.ToArray(),
                ["risky"] = DaaG12Universe.Us.Risky.ToArray(),
                ["cash"] = DaaG12Universe.Us.Cash.ToArray(),
            },
            Values: new Dictionary<string, string>
            {
                ["riskyFilter"] = "13612W",
                ["canaryFilter"] = "13612W",
                ["topRisky"] = DaaG12Service.T.ToString(),
                ["breadth"] = DaaG12Service.B.ToString(),
            }),
        Divergences: Array.Empty<Divergence>());

    private static Fingerprint Paa() => new(
        "PAA",
        "Keller & Keuning 2016, Fig. 6, PAA2 (a=2, Top6, L=12)",
        Paper: new Config(
            Buckets: new Dictionary<string, string[]>
            {
                ["risky"] = new[] { "SPY", "QQQ", "IWM", "VGK", "EWJ", "EEM", "IYR", "GSG", "GLD", "HYG", "LQD", "TLT" },
                ["cash"] = new[] { "IEF" },
            },
            Values: new Dictionary<string, string>
            {
                ["riskyFilter"] = "SMA12",
                ["cashFilter"] = "SMA12",
                ["topRisky"] = "6",
                ["protection"] = "2",
            }),
        Site: new Config(
            Buckets: new Dictionary<string, string[]>
            {
                ["risky"] = PaaUniverse.Us.Risky.ToArray(),
                ["cash"] = PaaUniverse.Us.Cash.ToArray(),
            },
            Values: new Dictionary<string, string>
            {
                ["riskyFilter"] = "SMA12",
                ["cashFilter"] = "SMA12",
                ["topRisky"] = PaaService.T.ToString(),
                ["protection"] = PaaService.DefaultA.ToString(),
            }),
        Divergences: new[]
        {
            new Divergence("risky",
                "VNQ for the paper's IYR — both US REIT funds, the same substitution the DAA paper makes deliberately."),
            new Divergence("cash",
                "Fig. 6 uses IEF alone as the safe bond; the site picks the best of IEF/SHY/LQD. LQD is corporate credit, "
                + "so in a credit-stress month it can be chosen as 'cash' and behave unlike a Treasury. Disclosed in the "
                + "web variant string; narrowing to IEF would make the citation exact."),
        });

    private static Fingerprint Laa() => new(
        "LAA",
        "Keller 2019, Fig. 12, LAA (QQQ↔SHY)",
        Paper: new Config(
            Buckets: new Dictionary<string, string[]>
            {
                ["permanent"] = new[] { "IWD", "GLD", "IEF" },
                ["rotating"] = new[] { "QQQ", "SHY" },
                ["signal"] = new[] { "SPY" },
            },
            Values: new Dictionary<string, string>
            {
                ["spyTrend"] = "SMA10-monthly",
                ["ueTrend"] = "SMA12-monthly",
                ["permanentWeight"] = "0.25",
                ["rotatingWeight"] = "0.25",
            }),
        Site: new Config(
            Buckets: new Dictionary<string, string[]>
            {
                ["permanent"] = LaaUniverse.Us.Permanent.ToArray(),
                ["rotating"] = new[] { LaaUniverse.Us.Risky, LaaUniverse.Us.Cash },
                ["signal"] = new[] { LaaUniverse.Us.SignalEquity },
            },
            Values: new Dictionary<string, string>
            {
                ["spyTrend"] = $"SMA{LaaService.SpyTrendWindow}-daily",
                ["ueTrend"] = $"SMA{LaaService.UeTrendWindow}-monthly",
                ["permanentWeight"] = LaaService.PermanentAssetWeight.ToString("0.##"),
                ["rotatingWeight"] = LaaService.RotatingWeight.ToString("0.##"),
            }),
        Divergences: new[]
        {
            new Divergence("spyTrend",
                "The paper states SMA10 on month-end prices three times; the site uses a 200-trading-day SMA. "
                + "~10 months ≈ 210 trading days, so the signals are close, but on a monthly gate built to avoid "
                + "whipsaw they do not produce identical histories. Disclosed in the web variant string."),
        });

    private static Fingerprint Haa() => new(
        "HAA",
        "Keller & Keuning 2023, Fig 6, HAA-Balanced (G8/T4, L=1)",
        Paper: new Config(
            Buckets: new Dictionary<string, string[]>
            {
                ["risky"] = new[] { "SPY", "IWM", "VWO", "VEA", "VNQ", "DBC", "IEF", "TLT" },
                ["canary"] = new[] { "TIP" },
                ["cash"] = new[] { "BIL", "IEF" },
            },
            Values: new Dictionary<string, string>
            {
                ["riskyFilter"] = "13612U",
                ["canaryFilter"] = "13612U",
                ["cashFilter"] = "13612U",
                ["topRisky"] = "4",
                ["dualMomentum"] = "yes",
            }),
        Site: new Config(
            Buckets: new Dictionary<string, string[]>
            {
                ["risky"] = HaaUniverse.Us.Risky.ToArray(),
                ["canary"] = new[] { HaaUniverse.Us.Canary },
                ["cash"] = new[] { HaaUniverse.Us.Cash },
            },
            Values: new Dictionary<string, string>
            {
                ["riskyFilter"] = "13612W",
                ["canaryFilter"] = "13612W",
                ["cashFilter"] = "13612W",
                ["topRisky"] = HaaService.T.ToString(),
                ["dualMomentum"] = "no",
            }),
        Divergences: new[]
        {
            new Divergence("riskyFilter",
                "Paper §4 uses the unweighted 13612U (L=1) for all three universes; the service uses the weighted 13612W."),
            new Divergence("canaryFilter", "Same 13612U/13612W swap as riskyFilter."),
            new Divergence("cashFilter", "Same 13612U/13612W swap as riskyFilter."),
            new Divergence("dualMomentum",
                "The half the strategy is named for is missing. The paper replaces bad Top-4 assets with cash, "
                + "producing fractional cash (CF=25% when 1 of 4 is bad); the service holds the top 4 at 1/4 each "
                + "regardless of sign, so it stays fully invested in a drawdown where TIP has not yet turned."),
            new Divergence("cash",
                "Fig 6 picks the better of BIL/IEF (ND=2, TD=1); the service always uses BIL. The paper also presents "
                + "a BIL-only ND=1 variant, but its figures are not Fig 6's."),
        });

    private static Fingerprint Baa() => new(
        "BAA",
        "Keller 2022, Fig 3, BAA-G12",
        Paper: new Config(
            Buckets: new Dictionary<string, string[]>
            {
                ["canary"] = new[] { "SPY", "VWO", "VEA", "BND" },
                ["risky"] = new[] { "SPY", "QQQ", "IWM", "VGK", "EWJ", "VWO", "VNQ", "DBC", "GLD", "TLT", "HYG", "LQD" },
                ["cash"] = new[] { "TIP", "DBC", "BIL", "IEF", "TLT", "LQD", "BND" },
            },
            Values: new Dictionary<string, string>
            {
                ["riskyFilter"] = "SMA12",
                ["canaryFilter"] = "13612W",
                ["cashFilter"] = "SMA12",
                ["topRisky"] = "6",
                ["topCash"] = "3",
            }),
        Site: new Config(
            Buckets: new Dictionary<string, string[]>
            {
                ["canary"] = BaaUniverse.Us.Canary.ToArray(),
                ["risky"] = BaaUniverse.Us.Risky.ToArray(),
                ["cash"] = BaaUniverse.Us.Cash.ToArray(),
            },
            Values: new Dictionary<string, string>
            {
                ["riskyFilter"] = "13612W",
                ["canaryFilter"] = "13612W",
                ["cashFilter"] = "SMA12",
                ["topRisky"] = BaaService.T.ToString(),
                ["topCash"] = "1",
            }),
        Divergences: new[]
        {
            new Divergence("canary",
                "Paper's canary is four risk assets (SPY/VWO/VEA/BND); the service uses three bond/TIPS assets "
                + "(TIP/IEF/BIL). The canary IS the crash-protection mechanism, so this changes what the strategy reacts to."),
            new Divergence("risky",
                "EEM for the paper's VWO and GSG for DBC — ordinary proxy pairs (emerging equities, commodities)."),
            new Divergence("cash",
                "Paper's defensive universe is seven assets including TIP and DBC; the service uses five and omits both."),
            new Divergence("riskyFilter",
                "The paper's design is 'slow relative momentum with fast absolute momentum': SMA12 (LO=12) ranks the risky "
                + "sleeve and 13612W (LP=0) gates the canary. The service uses 13612W for both, losing the separation."),
            new Divergence("topCash",
                "Paper holds the top 3 of seven defensive assets, replacing bad picks with BIL (TD=3); "
                + "the service holds the single best of five."),
        });

    public static TheoryData<string> StrategyNames() =>
        new() { "VAA", "DAA", "PAA", "LAA", "HAA", "BAA" };

    private static Fingerprint For(string name) => name switch
    {
        "VAA" => Vaa(),
        "DAA" => Daa(),
        "PAA" => Paa(),
        "LAA" => Laa(),
        "HAA" => Haa(),
        "BAA" => Baa(),
        _ => throw new ArgumentOutOfRangeException(nameof(name), name, "No fingerprint recorded."),
    };

    // ─── The three rules ─────────────────────────────────────────────

    /// <summary>
    /// Rule 2 — a field where paper and implementation differ must be
    /// declared. This is the rule that would have caught HAA's missing
    /// dual momentum and BAA's canary swap at the commit that introduced
    /// them.
    /// </summary>
    [Theory]
    [MemberData(nameof(StrategyNames))]
    public void EveryDivergenceFromThePaperIsDeclared(string name)
    {
        var fp = For(name);
        var declared = fp.Divergences.Select(d => d.Field).ToHashSet();

        foreach (var field in DifferingFields(fp))
        {
            Assert.True(
                declared.Contains(field),
                $"{fp.Strategy} diverges from its paper ({fp.Source}) in '{field}', but that is not declared "
                + $"in the fingerprint. Either reconcile the implementation with the paper, or add a Divergence "
                + $"entry saying why it differs — and check whether a published backtest figure must be withheld. "
                + $"See docs/superpowers/specs/2026-09-13-paper-implementation-audit.md.");
        }
    }

    /// <summary>
    /// Rule 3 — a declared divergence whose sides now agree is stale, so
    /// reconciling a strategy forces its entry out rather than leaving a
    /// misleading note behind.
    /// </summary>
    [Theory]
    [MemberData(nameof(StrategyNames))]
    public void NoDeclaredDivergenceIsStale(string name)
    {
        var fp = For(name);
        var differing = DifferingFields(fp).ToHashSet();

        foreach (var d in fp.Divergences)
        {
            Assert.True(
                differing.Contains(d.Field),
                $"{fp.Strategy} declares a divergence in '{d.Field}', but the paper and the implementation now agree. "
                + $"Remove the entry — and if a backtest figure was withheld because of it, it may now be publishable.");
        }
    }

    /// <summary>
    /// Rule 1 — the fingerprint must describe every field on both sides,
    /// so a bucket or parameter cannot be dropped from the comparison to
    /// make the other two rules pass.
    /// </summary>
    [Theory]
    [MemberData(nameof(StrategyNames))]
    public void FingerprintComparesTheSameFieldsOnBothSides(string name)
    {
        var fp = For(name);

        Assert.Equal(
            fp.Paper.Buckets.Keys.OrderBy(k => k),
            fp.Site.Buckets.Keys.OrderBy(k => k));
        Assert.Equal(
            fp.Paper.Values.Keys.OrderBy(k => k),
            fp.Site.Values.Keys.OrderBy(k => k));
    }

    /// <summary>
    /// The two strategies the audit found materially different must stay
    /// withheld on the web until reconciled. This pins the reason in the
    /// backend, where the divergence lives, so nobody restores a figure
    /// by editing only the front end.
    /// </summary>
    [Theory]
    [InlineData("HAA")]
    [InlineData("BAA")]
    public void MateriallyDivergentStrategiesStayWithheld(string name)
    {
        var fp = For(name);

        Assert.True(
            fp.Divergences.Length > 0,
            $"{fp.Strategy} has no declared divergences, so it may be reconciled. If so, restore its backtest "
            + $"figure in web/src/strategies.ts and remove this case.");
    }

    // ─── Comparison ──────────────────────────────────────────────────

    /// <summary>
    /// Field names where the two sides differ. Ticker buckets compare as
    /// sets — order within a bucket is not part of any strategy's rule.
    /// </summary>
    private static IEnumerable<string> DifferingFields(Fingerprint fp)
    {
        foreach (var (bucket, paperTickers) in fp.Paper.Buckets)
        {
            if (!fp.Site.Buckets.TryGetValue(bucket, out var siteTickers))
                continue; // covered by FingerprintComparesTheSameFieldsOnBothSides

            var paperSet = paperTickers.OrderBy(t => t, StringComparer.Ordinal);
            var siteSet = siteTickers.OrderBy(t => t, StringComparer.Ordinal);
            if (!paperSet.SequenceEqual(siteSet, StringComparer.Ordinal))
                yield return bucket;
        }

        foreach (var (key, paperValue) in fp.Paper.Values)
        {
            if (!fp.Site.Values.TryGetValue(key, out var siteValue))
                continue;

            if (!string.Equals(paperValue, siteValue, StringComparison.Ordinal))
                yield return key;
        }
    }
}
