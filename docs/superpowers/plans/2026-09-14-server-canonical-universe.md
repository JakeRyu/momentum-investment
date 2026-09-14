# Server-Canonical Universe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the backend own the strategy universe so `PaperFingerprintTests` guards the path every request actually runs on, and clients send only user-chosen substitutions.

**Architecture:** The six `XUniverse.Us` records become load-bearing. Endpoints drop their ticker parameters and take a repeatable `substitute=ORIGINAL:REPLACEMENT` instead. A shared fixture, `shared/universes.json`, carries the composition to the two clients for display purposes, pinned by a test in each package.

**Tech Stack:** .NET 10 minimal APIs, xUnit; React 19 + Vite + Vitest; Expo React Native + Jest.

**Spec:** [2026-09-14-server-canonical-universe-design.md](../specs/2026-09-14-server-canonical-universe-design.md)

## Status

**Tasks 1–3 are done and merged** (PR #20, branch `feat/server-canonical-universe`). They were split off because they are purely additive: the fixture exists, universes can be substituted, and `substitute` can be parsed — but nothing calls any of it, so the API contract is unchanged and both clients still work.

**Resume at Task 4.** From there the change is atomic: Task 4 breaks the contract, and Tasks 6, 9 and 10 are what make the clients work again. Tasks 4–10 must land in one PR.

To pick up in a fresh session:

```bash
git checkout main && git pull
git checkout -b feat/server-canonical-universe-contract
cd backend && dotnet test    # expect 127 passing before you start
```

Then read this plan from Task 4 and the spec it argues from. What already exists on `main` and Task 4 depends on:

| Symbol | Where |
|---|---|
| `shared/universes.json` | repo root |
| `TickerSubstitution.Parse` / `.Apply` | `backend/src/MomentumInvestment.Api/Strategies/TickerSubstitution.cs` |
| `SubstitutableTickers()` / `WithSubstitutions()` | all six `*Universe.cs` records |

## Global Constraints

- **The contract change is atomic.** Backend and web deploy together; the app build follows. No task may leave `main` with a client sending parameters the backend no longer reads — the tasks are ordered so the backend switches only after both clients are ready to stop sending.
- **`substitute` syntax:** `ORIGINAL:REPLACEMENT`, split on the **first** colon. Repeatable.
- **Four 400 cases:** no colon; either side empty after trim; key not in `SubstitutableTickers()`; the same key given twice.
- **LAA's signal equity is not substitutable.** `SPY` appears in LAA only as the Growth-Trend signal and must stay US-anchored.
- **PAA keeps `a`.** The protection factor is a user choice, not part of the universe.
- **The fixture is hand-maintained and test-pinned**, the same discipline as `PaperFingerprintTests`. No code generation.
- **`PaperFingerprintTests` must keep passing untouched** at every step.

## Fixture shape

`shared/universes.json`. Substitutable tickers are the distinct union of `buckets`; anything outside `buckets` (LAA's `signalEquity`, `unemploymentSeriesId`) is therefore excluded by construction.

```json
{
  "laa": {
    "buckets": { "permanent": ["IWD", "GLD", "IEF"], "risky": ["QQQ"], "cash": ["SHY"] },
    "signalEquity": "SPY",
    "unemploymentSeriesId": "UNRATE"
  }
}
```

## File structure

| File | Responsibility |
|---|---|
| `shared/universes.json` | The canonical composition, read by all three packages |
| `backend/.../Strategies/*Universe.cs` | Gain `SubstitutableTickers()` and `WithSubstitutions()`; lose `Uk` |
| `backend/.../Strategies/TickerSubstitution.cs` | Parse and validate `substitute` pairs |
| `backend/tests/.../UniverseFixtureTests.cs` | Pins the fixture to the live records |
| `backend/tests/.../TickerSubstitutionTests.cs` | The four 400 cases, and LAA's exclusion |
| `backend/.../Program.cs` | Endpoints read canonical records |
| `web/src/api/decisions.ts` | Sends `asOf` (+ `a`), no tickers |
| `web/src/strategies.test.ts` | Pins `defaultUniverse` to the fixture |
| `mobile/src/universes.generated.json` | Copy of the fixture, bundled by Metro |
| `mobile/src/universe.ts` | Six resolvers → one substitution-map builder |
| `mobile/src/api/decisionClient.ts` | Six clients → one |
| `mobile/src/screens/ETFConfigScreen.tsx` | Sections built from the fixture |

---

## Package 1 — Shared fixture

### Task 1: The fixture, pinned to the live records

Nothing else can be written until the fixture exists and is proven to match the backend.

**Files:**
- Create: `shared/universes.json`
- Test: `backend/tests/MomentumInvestment.Api.Tests/UniverseFixtureTests.cs`

**Interfaces:**
- Produces: `shared/universes.json` with top-level keys `vaa`, `daa`, `paa`, `haa`, `baa`, `laa`. Each has `buckets` (object of name → ticker array). `laa` also has `signalEquity` and `unemploymentSeriesId` strings.

- [x] **Step 1: Write the fixture**

Create `shared/universes.json`:

```json
{
  "vaa": {
    "buckets": {
      "offensive": ["SPY", "EFA", "EEM", "AGG"],
      "defensive": ["LQD", "IEF", "SHY"]
    }
  },
  "daa": {
    "buckets": {
      "canary": ["VWO", "BND"],
      "risky": ["SPY", "IWM", "QQQ", "VGK", "EWJ", "VWO", "VNQ", "GSG", "GLD", "TLT", "HYG", "LQD"],
      "cash": ["SHY", "IEF", "LQD"]
    }
  },
  "paa": {
    "buckets": {
      "risky": ["SPY", "IWM", "QQQ", "VGK", "EWJ", "EEM", "VNQ", "GSG", "GLD", "HYG", "LQD", "TLT"],
      "cash": ["IEF", "SHY", "LQD"]
    }
  },
  "haa": {
    "buckets": {
      "risky": ["SPY", "IWM", "VEA", "VWO", "VNQ", "DBC", "IEF", "TLT"],
      "canary": ["TIP"],
      "cash": ["BIL", "IEF"]
    }
  },
  "baa": {
    "buckets": {
      "canary": ["SPY", "VWO", "VEA", "BND"],
      "risky": ["SPY", "QQQ", "IWM", "VGK", "EWJ", "VWO", "VNQ", "DBC", "GLD", "TLT", "HYG", "LQD"],
      "cash": ["TIP", "DBC", "BIL", "IEF", "TLT", "LQD", "BND"]
    }
  },
  "laa": {
    "buckets": {
      "permanent": ["IWD", "GLD", "IEF"],
      "risky": ["QQQ"],
      "cash": ["SHY"]
    },
    "signalEquity": "SPY",
    "unemploymentSeriesId": "UNRATE"
  }
}
```

- [x] **Step 2: Write the failing test**

Create `backend/tests/MomentumInvestment.Api.Tests/UniverseFixtureTests.cs`:

```csharp
using System.Text.Json;
using MomentumInvestment.Api.Strategies;
using Xunit;

namespace MomentumInvestment.Api.Tests;

/// <summary>
/// Pins shared/universes.json to the live universe records.
///
/// The fixture is what the two clients read to render a strategy's
/// structure — the app's ETF config screen and the web's fund count. It
/// is maintained by hand on purpose, the same way PaperFingerprintTests
/// records its configurations: a universe change fails here first, and
/// updating the fixture is then a deliberate act rather than a silent
/// consequence.
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
```

- [x] **Step 3: Run the tests**

Run: `cd backend && dotnet test --filter UniverseFixtureTests`
Expected: PASS — the fixture was transcribed from these records. A failure here means a transcription error; fix the JSON, not the record.

- [x] **Step 4: Commit**

```bash
git add shared/universes.json backend/tests/MomentumInvestment.Api.Tests/UniverseFixtureTests.cs
git commit -m "feat(shared): the canonical universe as a fixture the clients can read

One file, three consumers. The backend pins it to the live records, and
the two clients will read it for the structure they render. LAA's signal
equity sits outside the buckets on purpose — the substitutable set is the
union of buckets, so that placement is what keeps the Growth-Trend gate
US-anchored."
```

---

## Package 2 — Backend

### Task 2: Substitution on the universe records

**Files:**
- Create: `backend/src/MomentumInvestment.Api/Strategies/TickerSubstitution.cs` (Task 3 adds `Parse` to the same class)
- Modify: `backend/src/MomentumInvestment.Api/Strategies/VaaUniverse.cs`, `DaaG12Universe.cs`, `PaaUniverse.cs`, `HaaUniverse.cs`, `BaaUniverse.cs`, `LaaUniverse.cs`
- Test: `backend/tests/MomentumInvestment.Api.Tests/UniverseSubstitutionTests.cs`

**Interfaces:**
- Produces on every universe record:
  - `IEnumerable<string> SubstitutableTickers()` — the distinct union of the record's holding buckets.
  - `<TRecord> WithSubstitutions(IReadOnlyDictionary<string, string> map)` — the same record type with every bucket ticker replaced where the map has a key. Case-insensitive on lookup; the replacement is used verbatim.

- [x] **Step 1: Write the failing test**

Create `backend/tests/MomentumInvestment.Api.Tests/UniverseSubstitutionTests.cs`:

```csharp
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
```

- [x] **Step 2: Run it to make sure it fails**

Run: `cd backend && dotnet test --filter UniverseSubstitutionTests`
Expected: FAIL — compile error, no `SubstitutableTickers` or `WithSubstitutions`.

- [x] **Step 3: Create the shared per-ticker helper**

Create `backend/src/MomentumInvestment.Api/Strategies/TickerSubstitution.cs`. Task 3 adds `Parse` to this same class; for now it holds only the substitution itself, so no universe record has to own a helper the other five call.

```csharp
namespace MomentumInvestment.Api.Strategies;

/// <summary>
/// Ticker substitution — the one thing a caller may change about a
/// universe. A holder of CSPX.L rather than SPY must be scored on
/// CSPX.L's own history, so the substitution is applied before prices
/// are fetched.
/// </summary>
public static partial class TickerSubstitution
{
    /// <summary>
    /// The replacement for <paramref name="ticker"/>, or the ticker
    /// itself. Case-insensitive on the key; the replacement is used
    /// exactly as the caller supplied it.
    /// </summary>
    public static string Apply(IReadOnlyDictionary<string, string> map, string ticker) =>
        map.TryGetValue(ticker, out var replacement) ? replacement : ticker;
}
```

- [x] **Step 4: Add the two members to each record**

In `VaaUniverse.cs`, inside the record body:

```csharp
    public IEnumerable<string> SubstitutableTickers() => AllTickers();

    public VaaUniverse WithSubstitutions(IReadOnlyDictionary<string, string> map) => new(
        Offensive: Offensive.Select(t => TickerSubstitution.Apply(map, t)).ToArray(),
        Defensive: Defensive.Select(t => TickerSubstitution.Apply(map, t)).ToArray());
```

In `DaaG12Universe.cs`:

```csharp
    public IEnumerable<string> SubstitutableTickers() => AllTickers();

    public DaaG12Universe WithSubstitutions(IReadOnlyDictionary<string, string> map) => new(
        Canary: Canary.Select(t => TickerSubstitution.Apply(map, t)).ToArray(),
        Risky:  Risky.Select(t => TickerSubstitution.Apply(map, t)).ToArray(),
        Cash:   Cash.Select(t => TickerSubstitution.Apply(map, t)).ToArray());
```

In `PaaUniverse.cs`:

```csharp
    public IEnumerable<string> SubstitutableTickers() => AllTickers();

    public PaaUniverse WithSubstitutions(IReadOnlyDictionary<string, string> map) => new(
        Risky: Risky.Select(t => TickerSubstitution.Apply(map, t)).ToArray(),
        Cash:  Cash.Select(t => TickerSubstitution.Apply(map, t)).ToArray());
```

In `HaaUniverse.cs`:

```csharp
    public IEnumerable<string> SubstitutableTickers() => AllTickers();

    public HaaUniverse WithSubstitutions(IReadOnlyDictionary<string, string> map) => new(
        Risky:  Risky.Select(t => TickerSubstitution.Apply(map, t)).ToArray(),
        Canary: TickerSubstitution.Apply(map, Canary),
        Cash:   Cash.Select(t => TickerSubstitution.Apply(map, t)).ToArray());
```

In `BaaUniverse.cs`:

```csharp
    public IEnumerable<string> SubstitutableTickers() => AllTickers();

    public BaaUniverse WithSubstitutions(IReadOnlyDictionary<string, string> map) => new(
        Canary: Canary.Select(t => TickerSubstitution.Apply(map, t)).ToArray(),
        Risky:  Risky.Select(t => TickerSubstitution.Apply(map, t)).ToArray(),
        Cash:   Cash.Select(t => TickerSubstitution.Apply(map, t)).ToArray());
```

In `LaaUniverse.cs` — note this one does **not** delegate to `AllDailyTickers()`:

```csharp
    /// <summary>
    /// The tickers a holder may substitute: the permanent sleeve plus the
    /// rotating pair. <see cref="SignalEquity"/> is deliberately absent —
    /// Growth-Trend timing is a US business-cycle indicator and stays
    /// US-anchored whatever the holder actually owns. Adding it here would
    /// let a UK user's US_LARGE_CAP override move the gate.
    /// </summary>
    public IEnumerable<string> SubstitutableTickers()
        => Permanent
            .Concat(new[] { Risky, Cash })
            .Distinct(StringComparer.OrdinalIgnoreCase);

    public LaaUniverse WithSubstitutions(IReadOnlyDictionary<string, string> map) => new(
        Permanent:            Permanent.Select(t => TickerSubstitution.Apply(map, t)).ToArray(),
        Risky:                TickerSubstitution.Apply(map, Risky),
        Cash:                 TickerSubstitution.Apply(map, Cash),
        SignalEquity:         SignalEquity,
        UnemploymentSeriesId: UnemploymentSeriesId);
```

- [x] **Step 5: Run the tests**

Run: `cd backend && dotnet test`
Expected: PASS, including `PaperFingerprintTests` and `UniverseFixtureTests` untouched.

- [x] **Step 6: Commit**

```bash
git add backend/src/MomentumInvestment.Api/Strategies/ backend/tests/MomentumInvestment.Api.Tests/UniverseSubstitutionTests.cs
git commit -m "feat(api): let a universe be substituted, and say what may be

WithSubstitutions returns the same record type, so bucket shape stays in
the type system rather than degrading to a dictionary. A ticker in two
buckets is replaced in both — a holder's choice is a property of the
asset, not of the slot.

LAA is the one record where SubstitutableTickers() is not AllDailyTickers():
SPY is its Growth-Trend signal and is never held, so it is not offered."
```

### Task 3: Parsing and validating `substitute`

**Files:**
- Modify: `backend/src/MomentumInvestment.Api/Strategies/TickerSubstitution.cs` — Task 2 created it with `Apply`; this adds `Parse` beside it
- Test: `backend/tests/MomentumInvestment.Api.Tests/TickerSubstitutionTests.cs`

**Interfaces:**
- Produces: `TickerSubstitution.Parse(string[]? raw, IEnumerable<string> substitutable)` returning `(Dictionary<string,string>? Map, string? Error)`. `Error` non-null means the caller returns `Results.BadRequest(Error)`.

- [x] **Step 1: Write the failing test**

Create `backend/tests/MomentumInvestment.Api.Tests/TickerSubstitutionTests.cs`:

```csharp
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
```

- [x] **Step 2: Run it to make sure it fails**

Run: `cd backend && dotnet test --filter TickerSubstitutionTests`
Expected: FAIL — `TickerSubstitution` does not exist.

- [x] **Step 3: Write the parser**

Add `Parse` to the existing `TickerSubstitution` class created in Task 2, inside the same file:

```csharp
/// <summary>
/// Parsing half of <see cref="TickerSubstitution"/>: the repeatable
/// <c>substitute=ORIGINAL:REPLACEMENT</c> query parameter becomes a map,
/// validated against the tickers the strategy actually holds.
///
/// Every failure is rejected rather than ignored. A substitution that
/// silently does nothing is the exact shape of the bug this change
/// exists to remove: the holder believes they are being scored on
/// CSPX.L while the server scores SPY.
/// </summary>
public static partial class TickerSubstitution
{
    public static (Dictionary<string, string>? Map, string? Error) Parse(
        string[]? raw,
        IEnumerable<string> substitutable)
    {
        var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (raw is null || raw.Length == 0) return (map, null);

        var allowed = new HashSet<string>(substitutable, StringComparer.OrdinalIgnoreCase);

        foreach (var pair in raw)
        {
            var colon = pair.IndexOf(':');
            if (colon < 0)
            {
                return (null, $"Query parameter 'substitute' must be ORIGINAL:REPLACEMENT — got '{pair}'.");
            }

            var original = pair[..colon].Trim();
            var replacement = pair[(colon + 1)..].Trim();

            if (original.Length == 0 || replacement.Length == 0)
            {
                return (null, $"Query parameter 'substitute' must be ORIGINAL:REPLACEMENT — got '{pair}'.");
            }
            if (!allowed.Contains(original))
            {
                return (null,
                    $"'{original}' is not a substitutable ticker for this strategy. " +
                    $"Valid: {string.Join(", ", allowed.OrderBy(t => t))}.");
            }
            if (map.ContainsKey(original))
            {
                return (null, $"Ticker '{original}' was substituted more than once.");
            }

            map[original] = replacement;
        }

        return (map, null);
    }
}
```

- [x] **Step 4: Run the tests**

Run: `cd backend && dotnet test`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add backend/src/MomentumInvestment.Api/Strategies/TickerSubstitution.cs backend/tests/MomentumInvestment.Api.Tests/TickerSubstitutionTests.cs
git commit -m "feat(api): parse and validate ticker substitutions

Four rejections, all of them loud: no colon, an empty side, a ticker the
strategy does not hold, and the same ticker twice. A silently-ignored
substitution would leave a holder believing they are scored on CSPX.L
while the server scores SPY — the failure this change exists to remove."
```

### Task 4: Endpoints read the canonical universe

This is the breaking step. Web and app are updated in later tasks; nothing deploys until all of them land.

**Files:**
- Modify: `backend/src/MomentumInvestment.Api/Program.cs` — all six decision endpoints

**Interfaces:**
- Consumes: `TickerSubstitution.Parse`, each record's `SubstitutableTickers()` and `WithSubstitutions()`.
- Produces: the endpoint contract in the spec — `asOf`, repeatable `substitute`, plus `a` on PAA only.

- [ ] **Step 1: Rewrite the VAA endpoint**

Replace the `/api/vaa-g4b3/decision` handler and its comment block:

```csharp
// VAA-G4/B3 decision.
//
// The universe is the server's: VaaUniverse.Us, guarded by
// PaperFingerprintTests. A caller may substitute tickers it holds
// locally — a UK holder of CSPX.L rather than SPY — and nothing else.
// The server stays region-agnostic: a substitution is an opaque pair of
// strings and US-vs-UK remains entirely the client's concept.
//
// Example:
//   /api/vaa-g4b3/decision?asOf=2026-09-14
//     &substitute=SPY:CSPX.L&substitute=IEF:IDTM.L
app.MapGet("/api/vaa-g4b3/decision", async (
    DateOnly asOf,
    string[]? substitute,
    YahooFinanceClient yahoo,
    VaaG4B3Service vaa,
    IMemoryCache cache,
    CancellationToken ct) =>
{
    var canonical = VaaUniverse.Us;
    var (map, error) = TickerSubstitution.Parse(substitute, canonical.SubstitutableTickers());
    if (error is not null) return Results.BadRequest(error);

    var universe = canonical.WithSubstitutions(map!);
    var prices = await FetchHistoriesAsync(universe.AllTickers(), yahoo, cache, ct);
    if (prices is null) return Results.Problem(FetchFailure(map!));

    var decision = vaa.Decide(asOf, universe, prices);
    return Results.Ok(decision);
});
```

- [ ] **Step 2: Add the shared failure message helper**

Next to `FetchHistoriesAsync` in `Program.cs`:

```csharp
// A fetch failure used to be indistinguishable from a bad substitution,
// because every ticker came from the caller. Now the server knows which
// ones the holder replaced, so it can point at the setting to check —
// what someone holding a delisted substitute (IUSV.L, delisted 2026-06)
// needs in order to know where to look.
static string FetchFailure(IReadOnlyDictionary<string, string> substitutions)
    => substitutions.Count == 0
        ? "Failed to fetch one or more price histories."
        : "Failed to fetch one or more price histories. Substituted tickers in this request: "
          + string.Join(", ", substitutions.Select(kv => $"{kv.Key}→{kv.Value}"))
          + ". Check those substitutions are still listed.";
```

- [ ] **Step 3: Rewrite the DAA endpoint**

```csharp
app.MapGet("/api/daa-g12/decision", async (
    DateOnly asOf,
    string[]? substitute,
    YahooFinanceClient yahoo,
    DaaG12Service daa,
    IMemoryCache cache,
    CancellationToken ct) =>
{
    var canonical = DaaG12Universe.Us;
    var (map, error) = TickerSubstitution.Parse(substitute, canonical.SubstitutableTickers());
    if (error is not null) return Results.BadRequest(error);

    var universe = canonical.WithSubstitutions(map!);
    var prices = await FetchHistoriesAsync(universe.AllTickers(), yahoo, cache, ct);
    if (prices is null) return Results.Problem(FetchFailure(map!));

    var decision = daa.Decide(asOf, universe, prices);
    return Results.Ok(decision);
});
```

- [ ] **Step 4: Rewrite the PAA endpoint — `a` stays**

```csharp
app.MapGet("/api/paa/decision", async (
    DateOnly asOf,
    int? a,
    string[]? substitute,
    YahooFinanceClient yahoo,
    PaaService paa,
    IMemoryCache cache,
    CancellationToken ct) =>
{
    var canonical = PaaUniverse.Us;
    var (map, error) = TickerSubstitution.Parse(substitute, canonical.SubstitutableTickers());
    if (error is not null) return Results.BadRequest(error);

    int protectionFactor = a ?? PaaService.DefaultA;
    if (protectionFactor is < 0 or > 2)
    {
        return Results.BadRequest(
            "Query parameter 'a' must be 0 (Aggressive), 1 (Moderate), or 2 (Vigilant).");
    }

    var universe = canonical.WithSubstitutions(map!);
    var prices = await FetchHistoriesAsync(universe.AllTickers(), yahoo, cache, ct);
    if (prices is null) return Results.Problem(FetchFailure(map!));

    var decision = paa.Decide(asOf, universe, prices, protectionFactor);
    return Results.Ok(decision);
});
```

The `a` validation above is the existing handler's, carried across unchanged — only the universe parameters are being replaced.

- [ ] **Step 5: Rewrite the HAA endpoint**

```csharp
app.MapGet("/api/haa/decision", async (
    DateOnly asOf,
    string[]? substitute,
    YahooFinanceClient yahoo,
    HaaService haa,
    IMemoryCache cacheStore,
    CancellationToken ct) =>
{
    var canonical = HaaUniverse.Us;
    var (map, error) = TickerSubstitution.Parse(substitute, canonical.SubstitutableTickers());
    if (error is not null) return Results.BadRequest(error);

    var universe = canonical.WithSubstitutions(map!);
    var prices = await FetchHistoriesAsync(universe.AllTickers(), yahoo, cacheStore, ct);
    if (prices is null) return Results.Problem(FetchFailure(map!));

    var decision = haa.Decide(asOf, universe, prices);
    return Results.Ok(decision);
});
```

- [ ] **Step 6: Rewrite the BAA endpoint**

```csharp
app.MapGet("/api/baa/decision", async (
    DateOnly asOf,
    string[]? substitute,
    YahooFinanceClient yahoo,
    BaaService baa,
    IMemoryCache cacheStore,
    CancellationToken ct) =>
{
    var canonical = BaaUniverse.Us;
    var (map, error) = TickerSubstitution.Parse(substitute, canonical.SubstitutableTickers());
    if (error is not null) return Results.BadRequest(error);

    var universe = canonical.WithSubstitutions(map!);
    var prices = await FetchHistoriesAsync(universe.AllTickers(), yahoo, cacheStore, ct);
    if (prices is null) return Results.Problem(FetchFailure(map!));

    var decision = baa.Decide(asOf, universe, prices);
    return Results.Ok(decision);
});
```

- [ ] **Step 7: Rewrite the LAA endpoint**

The FRED block below is unchanged; only the universe construction changes.

```csharp
app.MapGet("/api/laa/decision", async (
    DateOnly asOf,
    string[]? substitute,
    YahooFinanceClient yahoo,
    FredClient fred,
    LaaService laa,
    IMemoryCache cacheStore,
    CancellationToken ct) =>
{
    var canonical = LaaUniverse.Us;
    var (map, error) = TickerSubstitution.Parse(substitute, canonical.SubstitutableTickers());
    if (error is not null) return Results.BadRequest(error);

    var universe = canonical.WithSubstitutions(map!);
    var prices = await FetchHistoriesAsync(universe.AllDailyTickers(), yahoo, cacheStore, ct);
    if (prices is null) return Results.Problem(FetchFailure(map!));

    var fredKey = $"fred:{universe.UnemploymentSeriesId}";
    var unemployment = await cacheStore.GetOrCreateAsync(fredKey, async entry =>
    {
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24);
        return await fred.GetMonthlySeriesAsync(universe.UnemploymentSeriesId, ct);
    });
    if (unemployment is null)
    {
        return Results.Problem($"Failed to fetch FRED series '{universe.UnemploymentSeriesId}'.");
    }

    var decision = laa.Decide(asOf, universe, prices, unemployment);
    return Results.Ok(decision);
});
```

- [ ] **Step 8: Run the tests and build**

Run: `cd backend && dotnet build && dotnet test`
Expected: PASS, all suites. The service-level tests construct universes directly and are unaffected.

- [ ] **Step 9: Verify by hand against the running API**

```bash
cd backend && dotnet run --project src/MomentumInvestment.Api &
sleep 8
# Canonical — no tickers supplied
curl -s "http://localhost:5050/api/baa/decision?asOf=2026-09-14" | head -c 400
# A substitution
curl -s "http://localhost:5050/api/vaa-g4b3/decision?asOf=2026-09-14&substitute=SPY:CSPX.L" | head -c 400
# Rejected: LAA does not hold SPY
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:5050/api/laa/decision?asOf=2026-09-14&substitute=SPY:CSPX.L"
```

Expected: the first two return decisions; the BAA scores name `SPY VWO VEA BND` in the canary bucket; the third prints `400`.

- [ ] **Step 10: Commit**

```bash
git add backend/src/MomentumInvestment.Api/Program.cs
git commit -m "feat(api)!: the server owns the universe

Endpoints read XUniverse.Us instead of the query string, so the records
PaperFingerprintTests has always guarded are now the ones every request
runs on. Callers send only substitutions for tickers they hold locally.

BREAKING: offensive/defensive/canary/risky/cash/permanent/signalEquity/
unemploymentSeriesId are gone. PAA keeps 'a' — a protection factor is a
user's choice, not part of the universe. Web and app follow in this same
branch; nothing deploys until all three land."
```

### Task 5: Delete the UK records

**Files:**
- Modify: `backend/src/MomentumInvestment.Api/Strategies/VaaUniverse.cs` — remove `Uk`
- Modify: `backend/tests/MomentumInvestment.Api.Tests/VaaG4B3ServiceTests.cs:123`

**Interfaces:**
- Consumes: nothing new.
- Produces: `VaaUniverse.Uk` no longer exists. (`VaaUniverse` is the only record that has a `Uk`; a grep confirms before removal.)

- [ ] **Step 1: Confirm the blast radius**

Run: `grep -rn "Universe\.Uk" backend/`
Expected: exactly one hit, `VaaG4B3ServiceTests.cs:123`. If there are more, update each the same way.

- [ ] **Step 2: Give the test its own fixture**

In `VaaG4B3ServiceTests.cs`, above the test class's use at line 123, add:

```csharp
    /// <summary>
    /// LSE-listed UCITS substitutes, inline because this is a fixture for
    /// "the service does not care what the tickers are", not a statement
    /// about what UK holders should buy. That list belongs to the app.
    /// </summary>
    private static readonly VaaUniverse UkFixture = new(
        Offensive: new[] { "CSPX.L", "IWDA.L", "EIMI.L", "AGGU.L" },
        Defensive: new[] { "LQDA.L", "IDTM.L", "IBTS.L" });
```

and change line 123's `VaaUniverse.Uk` to `UkFixture`.

- [ ] **Step 3: Remove the record**

In `VaaUniverse.cs`, delete the `Uk` static field and its doc comment, and amend the class doc comment, which currently describes both factories:

```csharp
/// <summary>
/// The set of tickers VAA-G4/B3 evaluates on a single request.
///
/// <see cref="Us"/> is the canonical universe — Keller's original,
/// pinned by PaperFingerprintTests and read directly by the endpoint.
/// A caller substitutes the tickers it holds locally via
/// <see cref="WithSubstitutions"/>; the server has no notion of region.
/// </summary>
```

- [ ] **Step 4: Run the tests**

Run: `cd backend && dotnet test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/MomentumInvestment.Api/Strategies/VaaUniverse.cs backend/tests/MomentumInvestment.Api.Tests/VaaG4B3ServiceTests.cs
git commit -m "refactor(api): drop the UK universe from the server

Curated UK tickers on the server invite the reading that the server knows
about regions, which it does not and should not. UK belongs to the app,
which owns the catalog, the alternatives and the user's choice. The one
test that used the record takes an inline fixture instead."
```

---

## Package 3 — Web

### Task 6: The web stops sending a universe

**Files:**
- Modify: `web/src/api/decisions.ts`
- Modify: `web/src/strategies.ts` — doc comment on `defaultUniverse`
- Test: `web/src/strategies.test.ts`, `web/src/api/decisions.test.ts` (create)

**Interfaces:**
- Consumes: `shared/universes.json` (test-time only, via Node `fs`).
- Produces: `fetchDecision(strategy, asOf, paaA)` keeps its signature; only the URL it builds changes.

- [ ] **Step 1: Write the failing tests**

Create `web/src/api/decisions.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it, vi, afterEach } from 'vitest'

import { STRATEGIES } from '../strategies'

import { fetchDecision } from './decisions'

function capture() {
  const calls: string[] = []
  vi.stubGlobal('fetch', (url: string) => {
    calls.push(url)
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ strategyId: 'x', asOf: '', modeLabel: '', allocations: [], scores: [], reasoning: '' }),
    } as Response)
  })
  return calls
}

afterEach(() => vi.unstubAllGlobals())

describe('the web decision client', () => {
  it('sends no tickers — the universe is the server’s', async () => {
    const fixture = JSON.parse(
      readFileSync(join(__dirname, '../../../shared/universes.json'), 'utf8'),
    )
    const everyTicker = new Set<string>(
      Object.values(fixture).flatMap((s: any) =>
        Object.values(s.buckets).flat() as string[],
      ),
    )

    for (const s of STRATEGIES) {
      const calls = capture()
      await fetchDecision(s, '2026-09-14')
      const url = calls[0]
      expect(url, s.id).not.toMatch(/[?&](offensive|defensive|canary|risky|cash|permanent|signalEquity|unemploymentSeriesId)=/)
      for (const t of everyTicker) {
        expect(url, `${s.id} leaked ${t}`).not.toContain(`=${t}`)
      }
      vi.unstubAllGlobals()
    }
  })

  it('still sends asOf, and the protection factor for PAA', async () => {
    const paa = STRATEGIES.find((s) => s.id === 'paa')!
    const calls = capture()
    await fetchDecision(paa, '2026-09-14', 1)
    expect(calls[0]).toContain('asOf=2026-09-14')
    expect(calls[0]).toContain('a=1')
  })
})
```

Add to `web/src/strategies.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('the shared universe fixture', () => {
  const fixture = JSON.parse(
    readFileSync(join(__dirname, '../../shared/universes.json'), 'utf8'),
  )

  it('matches every strategy’s displayed universe', () => {
    // defaultUniverse no longer drives the request — it drives the ETF
    // count in the comparison. This keeps that count honest without a
    // network call on the landing page.
    for (const s of STRATEGIES) {
      const buckets: Record<string, string[]> = fixture[s.id].buckets
      const u = s.defaultUniverse
      switch (u.kind) {
        case 'vaa':
          expect(u.offensive, s.id).toEqual(buckets.offensive)
          expect(u.defensive, s.id).toEqual(buckets.defensive)
          break
        case 'daa':
        case 'baa':
          expect(u.canary, s.id).toEqual(buckets.canary)
          expect(u.risky, s.id).toEqual(buckets.risky)
          expect(u.cash, s.id).toEqual(buckets.cash)
          break
        case 'paa':
          expect(u.risky, s.id).toEqual(buckets.risky)
          expect(u.cash, s.id).toEqual(buckets.cash)
          break
        case 'haa':
          expect(u.risky, s.id).toEqual(buckets.risky)
          expect([u.canary], s.id).toEqual(buckets.canary)
          expect(u.cash, s.id).toEqual(buckets.cash)
          break
        case 'laa':
          expect(u.permanent, s.id).toEqual(buckets.permanent)
          expect([u.risky], s.id).toEqual(buckets.risky)
          expect([u.cash], s.id).toEqual(buckets.cash)
          expect(u.signalEquity, s.id).toEqual(fixture.laa.signalEquity)
          expect(u.unemploymentSeriesId, s.id).toEqual(fixture.laa.unemploymentSeriesId)
          break
      }
    }
  })
})
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `cd web && npx vitest run src/api/decisions.test.ts src/strategies.test.ts`
Expected: FAIL — the client still appends tickers. The fixture test may already pass; that is fine, it is a guard.

- [ ] **Step 3: Simplify the client**

Replace the body of `fetchDecision` in `web/src/api/decisions.ts`, keeping the file's top-of-file doc comment updated:

```ts
/**
 * Unified decision client. One `fetchDecision` covers all six Keller
 * strategies.
 *
 * The universe is the server's — it reads its own canonical records, so
 * nothing here sends tickers. This site runs the papers' US universe as
 * published and has no substitutions to make; the iPhone app is what
 * sends `substitute` pairs for a holder's local UCITS alternatives.
 */
export async function fetchDecision(
  strategy: Strategy,
  asOf: string,
  paaA: PaaProtectionFactor = 2,
): Promise<AllocationDecision> {
  const params = new URLSearchParams({ asOf })
  if (strategy.defaultUniverse.kind === 'paa') params.append('a', String(paaA))

  const res = await fetch(`${API_BASE}${PATHS[strategy.id]}?${params}`)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  return (await res.json()) as AllocationDecision
}

const PATHS: Record<StrategyId, string> = {
  vaa: '/api/vaa-g4b3/decision',
  daa: '/api/daa-g12/decision',
  paa: '/api/paa/decision',
  haa: '/api/haa/decision',
  baa: '/api/baa/decision',
  laa: '/api/laa/decision',
}
```

Add `StrategyId` to the type import at the top of the file.

- [ ] **Step 4: Mark `defaultUniverse` as display data**

In `web/src/strategies.ts`, amend the `defaultUniverse` field's context by updating the `Strategy` type's doc for it:

```ts
  /**
   * The strategy's composition, for display only — it drives
   * `fundsNeeded()` in the comparison table. The server owns the
   * universe it computes on; `strategies.test.ts` pins this against
   * `shared/universes.json` so the count cannot drift from it.
   */
  defaultUniverse: StrategyKind;
```

- [ ] **Step 5: Run the tests, lint and build**

Run: `cd web && npx vitest run && npm run lint && npm run build`
Expected: PASS, clean.

- [ ] **Step 6: Commit**

```bash
git add web/src/api/decisions.ts web/src/strategies.ts web/src/strategies.test.ts web/src/api/decisions.test.ts
git commit -m "feat(web)!: stop sending a universe the server already owns

The per-strategy ticker assembly is gone; the client sends asOf, plus the
protection factor for PAA. defaultUniverse stays for the comparison's ETF
count and is now pinned to shared/universes.json, so a display number
cannot drift from what the server computes."
```

---

## Package 4 — App

### Task 7: The fixture, bundled and guarded

**Files:**
- Create: `mobile/src/universes.generated.json` — byte-identical copy of `shared/universes.json`
- Test: `mobile/src/__tests__/universes.test.ts`

**Interfaces:**
- Produces: `mobile/src/universes.generated.json`, importable by Metro; `CODE_BY_PAPER_TICKER` is added in Task 8.

- [ ] **Step 1: Copy the fixture**

```bash
cp shared/universes.json mobile/src/universes.generated.json
```

- [ ] **Step 2: Write the failing test**

Create `mobile/src/__tests__/universes.test.ts`:

```ts
import { readFileSync } from 'fs';
import { join } from 'path';

import { ASSET_CLASSES, type AssetClassCode } from '../etfCatalog';
import UNIVERSES from '../universes.generated.json';

/**
 * Metro bundles from the project root, so the app carries a copy of
 * shared/universes.json rather than reaching outside it. Tests run in
 * Node and can read across package boundaries, so the copy is checked
 * on every CI run and cannot drift silently.
 */
describe('the bundled universe fixture', () => {
  it('is identical to the shared fixture', () => {
    const shared = readFileSync(
      join(__dirname, '../../../shared/universes.json'),
      'utf8',
    );
    expect(JSON.parse(shared)).toEqual(UNIVERSES);
  });

  it('maps every ticker to an asset class the user can configure', () => {
    // The guard that matters going forward: if the server adds an asset
    // the catalog has no entry for, a UK holder silently loses the
    // ability to substitute it. Fail here instead.
    const byPaperTicker = new Set(
      Object.values(ASSET_CLASSES).map((d) => d.usDefault),
    );
    for (const [id, strategy] of Object.entries(UNIVERSES)) {
      for (const [bucket, tickers] of Object.entries(
        (strategy as { buckets: Record<string, string[]> }).buckets,
      )) {
        for (const ticker of tickers) {
          expect(byPaperTicker.has(ticker), `${id}.${bucket}: ${ticker}`).toBe(true);
        }
      }
    }
  });

  it('gives each asset class a distinct paper ticker', () => {
    // usDefault is the join key between the catalog and the fixture, so
    // two classes sharing one would make the reverse lookup ambiguous.
    const seen = new Map<string, AssetClassCode>();
    for (const def of Object.values(ASSET_CLASSES)) {
      expect(seen.has(def.usDefault), `${def.usDefault} on ${def.code} and ${seen.get(def.usDefault)}`).toBe(false);
      seen.set(def.usDefault, def.code);
    }
  });
});
```

- [ ] **Step 3: Run it**

Run: `cd mobile && npx jest src/__tests__/universes.test.ts`
Expected: PASS on all three. If the second fails, the catalog is missing an asset class for a ticker the papers use — add it before continuing, since Task 9 depends on the mapping being total.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/universes.generated.json mobile/src/__tests__/universes.test.ts
git commit -m "feat(mobile): bundle the shared universe fixture

Metro bundles from the project root, so the app keeps a copy rather than
reaching outside it — watchFolders is awkward to verify on a remote EAS
build. The copy is pinned to shared/universes.json by a test, along with
the two properties the next tasks rely on: every fixture ticker has an
asset class, and usDefault is unique across classes."
```

### Task 8: One substitution map replaces six resolvers

**Files:**
- Modify: `mobile/src/universe.ts`
- Test: `mobile/src/__tests__/universe.test.ts` (create)

**Interfaces:**
- Consumes: `pickTicker` (unchanged), `ASSET_CLASSES`, `UNIVERSES`.
- Produces:
  - `substitutableTickers(id: StrategyId): string[]` — the distinct union of that strategy's fixture buckets.
  - `buildSubstitutions(id: StrategyId, region: Region, overrides: Overrides): Record<string, string>` — paper ticker → holder's ticker, filtered to that strategy's substitutable set.

- [ ] **Step 1: Write the failing test**

Create `mobile/src/__tests__/universe.test.ts`:

```ts
import { buildSubstitutions, substitutableTickers } from '../universe';

describe('buildSubstitutions', () => {
  it('sends nothing in the US region — the server universe is the US one', () => {
    expect(buildSubstitutions('vaa', 'US', {})).toEqual({});
  });

  it('keys a substitution by the paper ticker', () => {
    const subs = buildSubstitutions('vaa', 'UK', { US_LARGE_CAP: 'CSPX.L' });
    expect(subs.SPY).toBe('CSPX.L');
  });

  it('includes the curated UK default even with no explicit override', () => {
    // A UK user who has changed nothing still holds UCITS substitutes.
    const subs = buildSubstitutions('vaa', 'UK', {});
    expect(Object.keys(subs)).toContain('SPY');
  });

  it('omits tickers the strategy does not hold', () => {
    // The backend 400s on an unknown key, so an override for an asset
    // outside this strategy must never be sent.
    const subs = buildSubstitutions('vaa', 'UK', { US_NASDAQ: 'EQQQ.L' });
    expect(subs).not.toHaveProperty('QQQ');
  });

  it('never substitutes LAA’s signal equity', () => {
    // SPY is LAA's Growth-Trend signal and is not held, so it is not in
    // LAA's substitutable set. Overrides are stored globally by asset
    // class, so without this filter a UK user's VAA choice would move
    // the macro gate.
    const subs = buildSubstitutions('laa', 'UK', { US_LARGE_CAP: 'CSPX.L' });
    expect(subs).not.toHaveProperty('SPY');
    expect(substitutableTickers('laa')).not.toContain('SPY');
    expect(substitutableTickers('laa')).toContain('QQQ');
  });

  it('substitutes a ticker that appears in two buckets once', () => {
    const subs = buildSubstitutions('baa', 'UK', { US_LARGE_CAP: 'CSPX.L' });
    expect(subs.SPY).toBe('CSPX.L');
    expect(Object.keys(subs).filter((k) => k === 'SPY')).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `cd mobile && npx jest src/__tests__/universe.test.ts`
Expected: FAIL — neither export exists.

- [ ] **Step 3: Replace the resolvers**

Rewrite `mobile/src/universe.ts`. Keep `pickTicker` exactly as it is; delete `ResolvedUniverse` and the five other resolved types, the six `resolve*` functions, and the six `*TickerArrays` functions. The file becomes:

```ts
/**
 * Turns a (region, overrides) selection into the substitutions the
 * backend needs.
 *
 * The backend owns the universe — which assets, in which buckets, with
 * which parameters — and reads it from its own canonical records. All
 * this module decides is which of those tickers the holder owns
 * something else instead of.
 *
 * The join key already existed: `ASSET_CLASSES[code].usDefault` *is* the
 * paper's ticker, so a substitution is simply the pair where the
 * resolved ticker differs from it.
 */
import type { Region } from './api/apiBase';
import { ASSET_CLASSES, type AssetClassCode } from './etfCatalog';
import type { Overrides } from './storage';
import type { StrategyId } from './strategies';
import UNIVERSES from './universes.generated.json';

type Fixture = Record<string, { buckets: Record<string, string[]> }>;

export function pickTicker(
  code: AssetClassCode,
  region: Region,
  overrides: Overrides,
): string {
  if (region === 'US') {
    return ASSET_CLASSES[code].usDefault;
  }
  // UK: user override wins, otherwise the curated default (first alt entry).
  const overridden = overrides[code];
  if (overridden) return overridden;
  return ASSET_CLASSES[code].ukAlternatives[0].ticker;
}

/**
 * The tickers a holder may substitute for this strategy: the distinct
 * union of its buckets. Anything outside the buckets — LAA's signal
 * equity and FRED series — is excluded by construction, which is what
 * keeps Growth-Trend timing US-anchored.
 */
export function substitutableTickers(id: StrategyId): string[] {
  const buckets = (UNIVERSES as Fixture)[id].buckets;
  return [...new Set(Object.values(buckets).flat())];
}

export function buildSubstitutions(
  id: StrategyId,
  region: Region,
  overrides: Overrides,
): Record<string, string> {
  if (region === 'US') return {};

  const wanted = new Set(substitutableTickers(id));
  const subs: Record<string, string> = {};

  for (const code of Object.keys(ASSET_CLASSES) as AssetClassCode[]) {
    const paperTicker = ASSET_CLASSES[code].usDefault;
    if (!wanted.has(paperTicker)) continue;

    const held = pickTicker(code, region, overrides);
    if (held !== paperTicker) subs[paperTicker] = held;
  }

  return subs;
}
```

- [ ] **Step 4: Run the tests**

Run: `cd mobile && npx jest src/__tests__/universe.test.ts`
Expected: PASS. Other suites will fail to compile until Task 9 — that is expected and fixed there.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/universe.ts mobile/src/__tests__/universe.test.ts
git commit -m "feat(mobile): build substitutions instead of resolving universes

Six resolvers and six ticker-array helpers become two functions. The join
key was already there — ASSET_CLASSES[code].usDefault is the paper's
ticker, so a substitution is just the pair where the holder's resolved
ticker differs.

Filtering to the strategy's own buckets is load-bearing rather than
tidy: overrides are stored globally by asset class, the backend 400s on
a ticker the strategy does not hold, and LAA's signal equity sits outside
the buckets so a UK user's SPY choice cannot move the macro gate."
```

### Task 9: One decision client

**Files:**
- Create: `mobile/src/api/decisionClient.ts`
- Delete: `mobile/src/api/vaaClient.ts`, `daaClient.ts`, `paaClient.ts`, `haaClient.ts`, `baaClient.ts`, `laaClient.ts`
- Modify: `mobile/src/decisions.ts`, and every file importing a deleted client
- Test: `mobile/src/__tests__/decisions.test.ts`

**Interfaces:**
- Consumes: `buildSubstitutions`, `baseUrl` and the shared types from `./apiBase`.
- Produces: `fetchDecision(id: StrategyId, asOf: string, substitutions: Record<string,string>, paaA?: PaaProtectionFactor, signal?: AbortSignal): Promise<AllocationDecision>`, and `DecisionRequest = { id: StrategyId; substitutions: Record<string, string> }`.

- [ ] **Step 1: Find every importer before deleting**

```bash
grep -rln "vaaClient\|daaClient\|paaClient\|haaClient\|baaClient\|laaClient" mobile/src/
```

Several screens re-import shared types through `vaaClient` (it re-exports `Region`, `AllocationDecision` and `getApiBaseUrl` for exactly that reason). Those imports move to `./api/apiBase`, which is where the types live.

- [ ] **Step 2: Write the failing test**

Replace the body of `mobile/src/__tests__/decisions.test.ts` with tests for the new shape, keeping any existing cases that do not mention ticker arrays:

```ts
import { buildDecisionRequest } from '../decisions';

describe('buildDecisionRequest', () => {
  it('carries the strategy and its substitutions, and no tickers', () => {
    const req = buildDecisionRequest('baa', 'UK', { US_LARGE_CAP: 'CSPX.L' });
    expect(req.id).toBe('baa');
    expect(req.substitutions.SPY).toBe('CSPX.L');
    expect(req).not.toHaveProperty('canary');
    expect(req).not.toHaveProperty('risky');
    expect(req).not.toHaveProperty('cash');
  });

  it('is empty for a US holder', () => {
    expect(buildDecisionRequest('vaa', 'US', {}).substitutions).toEqual({});
  });
});
```

- [ ] **Step 3: Run it to make sure it fails**

Run: `cd mobile && npx jest src/__tests__/decisions.test.ts`
Expected: FAIL — `buildDecisionRequest` still returns the six-variant union.

- [ ] **Step 4: Write the single client**

Create `mobile/src/api/decisionClient.ts`:

```ts
/**
 * One client for all six strategies.
 *
 * The backend owns each universe, so a request carries the date, the
 * holder's substitutions, and — for PAA alone — the protection factor.
 * Six near-identical clients existed only to assemble six different
 * ticker parameter sets that no longer exist.
 */
import { baseUrl, type AllocationDecision } from './apiBase';
import type { PaaProtectionFactor } from './paaTypes';
import type { StrategyId } from '../strategies';

const PATHS: Record<StrategyId, string> = {
  vaa: '/api/vaa-g4b3/decision',
  daa: '/api/daa-g12/decision',
  paa: '/api/paa/decision',
  haa: '/api/haa/decision',
  baa: '/api/baa/decision',
  laa: '/api/laa/decision',
};

export async function fetchDecision(
  id: StrategyId,
  asOf: string,
  substitutions: Record<string, string>,
  paaA: PaaProtectionFactor = 2,
  signal?: AbortSignal,
): Promise<AllocationDecision> {
  const params = new URLSearchParams();
  params.set('asOf', asOf);
  if (id === 'paa') params.set('a', String(paaA));
  for (const [original, replacement] of Object.entries(substitutions)) {
    params.append('substitute', `${original}:${replacement}`);
  }

  const res = await fetch(`${baseUrl}${PATHS[id]}?${params.toString()}`, { signal });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}): ${body || res.statusText}`);
  }
  return (await res.json()) as AllocationDecision;
}
```

Move `PaaProtectionFactor` out of the deleted `paaClient.ts` into a new `mobile/src/api/paaTypes.ts`:

```ts
/** PAA's protection factor: how many bad assets before going defensive. */
export type PaaProtectionFactor = 0 | 1 | 2;
```

- [ ] **Step 5: Collapse `decisions.ts`**

In `mobile/src/decisions.ts`, replace the six-variant `DecisionRequest`, `buildDecisionRequest` and `fetchDecisionFor`:

```ts
import { fetchDecision } from './api/decisionClient';
import type { PaaProtectionFactor } from './api/paaTypes';
import type { AllocationDecision, Region } from './api/apiBase';
import type { Overrides } from './storage';
import type { StrategyId } from './strategies';
import { buildSubstitutions } from './universe';

export type DecisionRequest = {
  id: StrategyId;
  substitutions: Record<string, string>;
};

export function buildDecisionRequest(
  id: StrategyId,
  region: Region,
  overrides: Overrides,
): DecisionRequest {
  return { id, substitutions: buildSubstitutions(id, region, overrides) };
}

export function fetchDecisionFor(
  request: DecisionRequest,
  asOf: string,
  paaA: PaaProtectionFactor,
  signal?: AbortSignal,
): Promise<AllocationDecision> {
  return fetchDecision(request.id, asOf, request.substitutions, paaA, signal);
}
```

- [ ] **Step 6: Update the importers**

The grep in Step 1 finds these five (besides the clients themselves and `decisions.ts`, handled above). Change each to take shared types from `./api/apiBase` — adjusting the relative path per file — and `PaaProtectionFactor` from `./api/paaTypes`:

| File | Currently imports from a client |
|---|---|
| `mobile/src/storage.ts` | `Region` from `./api/vaaClient`, `PaaProtectionFactor` from `./api/paaClient` |
| `mobile/src/universe.ts` | `Region` from `./api/vaaClient` — already switched to `./api/apiBase` in Task 8; confirm |
| `mobile/src/screens/DecisionScreen.tsx` | shared decision types |
| `mobile/src/screens/ETFConfigScreen.tsx` | `Region` from `../api/vaaClient` |
| `mobile/src/api/etfProbeClient.ts` | shared types |

Then delete the six client files:

```bash
cd mobile && rm src/api/vaaClient.ts src/api/daaClient.ts src/api/paaClient.ts \
  src/api/haaClient.ts src/api/baaClient.ts src/api/laaClient.ts
grep -rn "vaaClient\|daaClient\|paaClient\|haaClient\|baaClient\|laaClient" src/
```

Expected: no output from the grep.

- [ ] **Step 7: Run the suite and typecheck**

Run: `cd mobile && npx tsc --noEmit && npx jest`
Expected: PASS, all suites.

- [ ] **Step 8: Commit**

```bash
git add mobile/src/api/ mobile/src/decisions.ts mobile/src/__tests__/decisions.test.ts
git commit -m "feat(mobile)!: one decision client for all six strategies

Six near-identical clients existed to assemble six different ticker
parameter sets. Those parameters are gone, so a request is now the date,
the holder's substitutions, and PAA's protection factor.

Shared types move to apiBase and paaTypes, which is where they belonged —
vaaClient was re-exporting them so screens could avoid importing a
strategy-specific module for a shared type."
```

### Task 10: The config screen reads the fixture

**Files:**
- Modify: `mobile/src/screens/ETFConfigScreen.tsx`
- Modify: `mobile/src/etfCatalog.ts` — delete the composition arrays
- Test: `mobile/src/__tests__/universes.test.ts` — extend

**Interfaces:**
- Consumes: `UNIVERSES`, `ASSET_CLASSES`.
- Produces: `codeForPaperTicker(ticker: string): AssetClassCode` exported from `mobile/src/etfCatalog.ts`.

- [ ] **Step 1: Write the failing test**

Add to `mobile/src/__tests__/universes.test.ts`:

```ts
import { codeForPaperTicker } from '../etfCatalog';

describe('codeForPaperTicker', () => {
  it('maps a paper ticker back to its asset class', () => {
    expect(codeForPaperTicker('SPY')).toBe('US_LARGE_CAP');
    expect(codeForPaperTicker('VEA')).toBe('INTL_DEV_FTSE');
    expect(codeForPaperTicker('DBC')).toBe('COMMODITIES_BCOM');
  });

  it('throws on a ticker with no asset class', () => {
    // Better a crash in development than a config screen that silently
    // omits an asset the server is scoring.
    expect(() => codeForPaperTicker('NOPE')).toThrow(/NOPE/);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `cd mobile && npx jest src/__tests__/universes.test.ts`
Expected: FAIL — no such export.

- [ ] **Step 3: Add the reverse lookup**

At the end of `mobile/src/etfCatalog.ts`:

```ts
/**
 * Paper ticker → asset class. The reverse of `usDefault`, used to turn
 * the server's universe fixture back into configurable rows. Uniqueness
 * of `usDefault` is asserted in `__tests__/universes.test.ts`, because
 * this lookup depends on it.
 */
const CODE_BY_PAPER_TICKER: Record<string, AssetClassCode> = Object.fromEntries(
  Object.values(ASSET_CLASSES).map((d) => [d.usDefault, d.code]),
);

export function codeForPaperTicker(ticker: string): AssetClassCode {
  const code = CODE_BY_PAPER_TICKER[ticker];
  if (!code) throw new Error(`No asset class for paper ticker '${ticker}'`);
  return code;
}
```

- [ ] **Step 4: Build the sections from the fixture**

In `ETFConfigScreen.tsx`, replace the hard-coded `Section` tables. Delete the imports of `BAA_CANARY`, `BAA_CASH`, `BAA_RISKY`, `DAA_G12_CANARY`, `DAA_G12_CASH`, `DAA_G12_RISKY`, `HAA_CANARY`, `HAA_CASH`, `HAA_RISKY`, `LAA_CASH`, `LAA_PERMANENT`, `LAA_RISKY`, `PAA_CASH`, `PAA_RISKY`, `VAA_DEFENSIVE`, `VAA_OFFENSIVE` and add:

```tsx
import { codeForPaperTicker } from '../etfCatalog';
import UNIVERSES from '../universes.generated.json';

/** Bucket key → the label the user sees. */
const BUCKET_LABELS: Record<string, string> = {
  offensive: 'Offensive',
  defensive: 'Defensive',
  canary: 'Canary',
  risky: 'Risky',
  cash: 'Cash',
  permanent: 'Permanent',
};

/**
 * The strategy's structure, read from the server's universe rather than
 * restated here. The same asset class can appear in two sections (DAA's
 * IG_CORP is risky and cash); overrides are keyed on the class, so
 * changing it in one place applies in both — which is what the user
 * expects and what the backend does.
 */
function sectionsFor(id: StrategyId): Section[] {
  const buckets = (UNIVERSES as Record<string, { buckets: Record<string, string[]> }>)[id].buckets;
  return Object.entries(buckets).map(([key, tickers]) => ({
    label: BUCKET_LABELS[key] ?? key,
    codes: tickers.map(codeForPaperTicker),
  }));
}
```

Delete the `STRATEGY_SECTIONS` table (`ETFConfigScreen.tsx:62`) and its doc comment, and change its one consumer at line 140:

```tsx
  const sections = sectionsFor(strategyId);
```

Everything downstream — `codesInStrategy` at line 144 and the `sections.map` render at line 164 — keeps working unchanged, because `sectionsFor` returns the same `Section[]` shape.

- [ ] **Step 5: Delete the composition arrays**

From `mobile/src/etfCatalog.ts`, delete `VAA_OFFENSIVE`, `VAA_DEFENSIVE`, `DAA_G12_CANARY`, `DAA_G12_RISKY`, `DAA_G12_CASH`, `PAA_RISKY`, `PAA_CASH`, `LAA_PERMANENT`, `LAA_RISKY`, `LAA_CASH`, `HAA_RISKY`, `HAA_CANARY`, `HAA_CASH`, `BAA_CANARY`, `BAA_RISKY`, `BAA_CASH` and their doc comments. Keep `ASSET_CLASSES`, `getDefaultUkTicker`, `findEtfOption`, `isTickerInCurated` and the new `codeForPaperTicker`.

Then confirm nothing still references them:

```bash
grep -rn "VAA_OFFENSIVE\|DAA_G12_\|PAA_RISKY\|LAA_PERMANENT\|HAA_RISKY\|BAA_CANARY" mobile/src/
```

Expected: no output.

- [ ] **Step 6: Run everything**

Run: `cd mobile && npx tsc --noEmit && npx jest`
Expected: PASS.

- [ ] **Step 7: Verify the app against the running backend**

Start the backend, then `cd mobile && npx expo start`. On a simulator:

- Home shows a decision for each registered strategy.
- Open BAA's detail screen — the canary bucket must now show `SPY VWO VEA BND`, not `TIP IEF BIL`. **This is the bug the whole change exists to fix; confirm it visually.**
- Settings → an ETF config screen: the sections match the strategy's real buckets, and overriding an asset changes the decision.
- Switch region to UK and confirm a decision still returns (the substitutions are accepted).

- [ ] **Step 8: Commit**

```bash
git add mobile/src/screens/ETFConfigScreen.tsx mobile/src/etfCatalog.ts mobile/src/__tests__/universes.test.ts
git commit -m "feat(mobile): the config screen reads the server's universe

The screen restated each strategy's composition, which is how the app
came to offer a BAA canary of TIP/IEF/BIL while the server scored
SPY/VWO/VEA/BND. It now builds its sections from the fixture, so a UK
holder can configure exactly the assets being scored and no others.

The catalog keeps what is genuinely the app's — labels, UK alternatives,
the user's choice — and loses the sixteen composition arrays."
```

---

## Done when

- `dotnet test`, `cd web && npm test`, `cd mobile && npx jest` all pass; web lint and build clean; `npx tsc --noEmit` clean in mobile.
- `grep -rn "Universe.Us" backend/src/` now returns hits in `Program.cs` — the records are load-bearing.
- `PaperFingerprintTests` passes unchanged.
- BAA's decision on the app and on the site are the same decision, with a canary of `SPY VWO VEA BND`.
- A UK region decision still returns from the app, and `substitute=SPY:CSPX.L` is rejected on `/api/laa/decision`.

## Out of scope

- **The UK catalog's home.** `ukAlternatives` stays in the app; `GET /api/strategies/universes` is not built.
- **PAA and LAA's declared divergences.** Both stay as they are, declared in `PaperFingerprintTests` and printed in each `variant` string.
- **Endpoint-level HTTP tests.** The 400 paths are covered through `TickerSubstitution` as a pure function; wiring each handler to `Results.BadRequest` is verified by the curl checks in Task 4 rather than by a `WebApplicationFactory` harness, which the project does not currently have.
