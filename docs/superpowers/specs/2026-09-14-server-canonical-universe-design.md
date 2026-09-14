# The canonical universe moves to the server

Design doc, 2026-09-14. Follows the phase 4 work
([stage 4](2026-09-13-phase-4-learn-course-design.md)) and the HAA/BAA
reconciliation (#18).

## Why

The backend holds a canonical universe per strategy — `VaaUniverse.Us`,
`BaaUniverse.Us`, and four more — and `PaperFingerprintTests` guards
them as the merge gate for *"does this site compute the strategy its
paper describes?"*

Nothing reads them:

```
$ grep -rn "Universe.Us\|Universe.Uk" backend/src/
(no matches)
```

Production takes its tickers from the query string. Every endpoint is
documented as deliberately caller-driven — `VaaUniverse.cs` says the
static records are *"NOT referenced from production code paths"* — so
the gate is green while validating constants no request touches.

Under that green gate, the two clients drifted apart. The app and the
site now compute different strategies through the same backend:

| BAA bucket | App sends | Paper / site |
|---|---|---|
| canary | `TIP IEF BIL` | `SPY VWO VEA BND` |
| risky | …`EEM`…`GSG`… | …`VWO`…`DBC`… |
| cash | `BIL IEF TLT BND LQD` | `TIP DBC BIL IEF TLT LQD BND` |

All three buckets. HAA differs too: the app sends `BIL` alone where the
paper's Fig 6 uses `BIL IEF` (ND=2, TD=1).

The canary is BAA's crash-protection mechanism, so this is not a rounding
difference — the app runs a strategy the site's published drawdown figure
does not describe.

**The fix is not to retype the app's arrays.** That leaves the structure
that allowed the drift. This document moves the universe to the server so
the gate covers the live path.

## What this is not

- **Not a move of the UK catalog.** Where the curated `ukAlternatives`
  list should live is a separate, still-open question. The app keeps it.
- **Not user accounts.** A user's chosen substitutions stay on their
  device, as today.
- **Not a region-aware backend.** The server gains a canonical universe
  and still knows nothing about US vs UK.

## The contract

All six endpoints take the same shape:

```
GET /api/baa/decision?asOf=2026-09-14
GET /api/baa/decision?asOf=2026-09-14&substitute=SPY:CSPX.L&substitute=IEF:IDTM.L
```

- `asOf` — required, unchanged.
- `substitute` — repeatable, optional. `originalTicker:replacementTicker`,
  split on the first colon.
- `a` — **kept on PAA only.** The protection factor is a user's choice of
  how cautious to be, not part of the universe.

Everything else goes: `offensive[]`, `defensive[]`, `canary[]`,
`risky[]`, `cash[]`, `permanent[]`, `signalEquity`,
`unemploymentSeriesId`. LAA's signal equity (`SPY`) and FRED series
(`UNRATE`) become canonical — Growth-Trend timing is a US business-cycle
indicator and stays US-anchored regardless of what the holder owns.

**This is a breaking change, taken deliberately.** The app has no users
and 1.1 is in review, so the contract is at its cheapest to change. See
"Release ordering" below.

### Resolution order

```
1. Load canonical universe        BaaUniverse.Us
2. Validate substitution keys     against SubstitutableTickers()
3. Apply substitutions            → effective universe
4. Fetch prices                   effective universe's AllTickers()
                                  (AllDailyTickers() for LAA)
5. Run the strategy               on the effective universe
```

Validation (2) reads the **canonical** set; fetching (4) reads the
**effective** one. In that order a typo'd substitution is rejected rather
than sent to Yahoo as a ticker nobody meant.

Prices come from the substituted ticker — that is the point. A holder of
`CSPX.L` needs momentum computed on `CSPX.L`'s own history. This already
happens today; what changes is who assembles the list.

### Substituting across buckets

A ticker appearing in more than one bucket is substituted in all of them.
DAA holds `LQD` in both risky and cash; BAA holds `SPY` in both canary
and risky. This matches the intent the app's catalog already records:

> a UK override on that class applies to both — that's intentional, since
> a user's "LQD → LQDA.L" preference is structural, not strategy-specific.

### What may be substituted

Each universe record gains `SubstitutableTickers()` alongside its
existing `AllTickers()` / `AllDailyTickers()`. For five strategies the
two are identical. **LAA is the exception**: it holds `IWD GLD IEF` plus
a rotating `QQQ`/`SHY`, and `SPY` appears only as the trend signal. With
`SubstitutableTickers()` defined as the held assets, `SPY` is simply not
in LAA's set, and `substitute=SPY:CSPX.L` is rejected there without a
special case.

This matters in practice rather than in theory. The app stores overrides
globally by asset class (`momentum:overrides:UK`), so a UK user who picks
`US_LARGE_CAP → CSPX.L` for VAA has that preference on file. Sending
overrides blindly per strategy would swap LAA's signal. Today
`resolveLaaUniverse` happens not to touch `signalEquity`; keying
substitution by ticker removes that accidental protection, so the
exclusion is made explicit and tested.

Canary assets stay substitutable. They are watched rather than bought,
but the app already ships UK alternatives for DAA's `VWO`/`BND` with a
note that `EMIM.L` *"affects DAA canary"*. That is a deliberate product
choice and this change does not revisit it.

### Errors

| Case | Response |
|---|---|
| No colon (`substitute=SPY`) | 400, malformed |
| Empty side (`substitute=SPY:`) | 400 |
| Key not in `SubstitutableTickers()` | 400, naming the ticker and the valid set |
| Same ticker substituted twice | 400 — last-one-wins is a silent bug |

Price-fetch failures gain a better message. Today every failure is
`"Failed to fetch one or more price histories."` The server can now tell
a canonical ticker from a substituted one, so a failure on a substituted
ticker can say so — which is what a holder of a delisted substitute
(`IUSV.L`, delisted 2026-06) needs in order to know where to look. Small,
and free at this point.

## Where the composition lives

`ETFConfigScreen` renders the strategy's buckets so a user can override
each asset, so the app needs the composition for its UI, not only for its
request. The web needs it too, for the ETF count in the comparison table.

A shared fixture, `shared/universes.json`, holds the canonical
composition. One generator, three consumers:

- **Backend** — a test pins the fixture against the live universe
  records.
- **Web** — a test pins `strategies.ts`'s `defaultUniverse` against the
  fixture. The count keeps rendering from local data, so the landing page
  still paints its comparison without a network call.
- **App** — a generated copy at `mobile/src/universes.generated.json` is
  the composition source, replacing the `VAA_OFFENSIVE` / `BAA_CANARY` /
  … arrays. A test pins it against `shared/universes.json`.

The app gets a copy rather than importing `shared/` directly because
Metro bundles from the project root; reaching outside it means
`watchFolders` configuration and an EAS build surface that is awkward to
verify remotely. Tests read across package boundaries freely — they run
in Node — so the copy is checked on every CI run and cannot drift
silently. The web needs no copy: its `defaultUniverse` is already
hand-written data, and the test simply pins it.

The fixture is **maintained by hand and pinned by test**, the same
discipline as `PaperFingerprintTests` rather than a new mechanism.
Changing a universe fails the test first; the developer then updates the
fixture deliberately. That gate has already earned its keep — it caught
both stale divergences during the HAA and BAA reconciliation before a
human did.

An endpoint serving the same data (`GET /api/strategies/universes`) is
the natural next step if the UK catalog ever moves server-side. It is not
needed for this change and is not built here.

### Fixture contents

Transcribed from the live records, which #18 reconciled with the papers:

| Strategy | Buckets |
|---|---|
| VAA | offensive `SPY EFA EEM AGG` · defensive `LQD IEF SHY` |
| DAA | canary `VWO BND` · risky `SPY IWM QQQ VGK EWJ VWO VNQ GSG GLD TLT HYG LQD` · cash `SHY IEF LQD` |
| PAA | risky `SPY IWM QQQ VGK EWJ EEM VNQ GSG GLD HYG LQD TLT` · cash `IEF SHY LQD` |
| HAA | risky `SPY IWM VEA VWO VNQ DBC IEF TLT` · canary `TIP` · cash `BIL IEF` |
| BAA | canary `SPY VWO VEA BND` · risky `SPY QQQ IWM VGK EWJ VWO VNQ DBC GLD TLT HYG LQD` · cash `TIP DBC BIL IEF TLT LQD BND` |
| LAA | permanent `IWD GLD IEF` · risky `QQQ` · cash `SHY` · signal `SPY` · macro `UNRATE` |

Every ticker here already has an asset class in the app's catalog —
`VEA` is `INTL_DEV_FTSE`, `DBC` is `COMMODITIES_BCOM`, `TIP` is `TIPS`,
because HAA already uses them. **The app sync is mostly deletion, not
addition.**

## What changes, by package

### Backend

- Endpoints read the canonical record instead of query parameters.
- Each universe record gains `SubstitutableTickers()` and
  `WithSubstitutions(map)`. `WithSubstitutions` returns the same record
  type, so bucket shape stays in the type system rather than in a
  dictionary.
- One shared helper parses and validates `substitute` pairs.
- **`XUniverse.Uk` records are deleted.** UK now unambiguously belongs to
  the app, and leaving curated UK tickers on the server invites the
  reading that the server knows about regions. The only reference is
  `VaaG4B3ServiceTests.cs:123`, which takes an inline fixture instead.

### Web

- `api/decisions.ts` loses its per-strategy ticker assembly; it sends
  `asOf`, plus `a` for PAA.
- `strategies.ts` keeps `defaultUniverse` for `fundsNeeded()`, now pinned
  to the fixture and documented as display data.

### App

- `universe.ts` (261 lines) collapses: six resolvers become one function
  building a substitution map from `(region, overrides)`. The join key
  already exists — `ASSET_CLASSES[code].usDefault` *is* the paper ticker.
- `etfCatalog.ts` keeps `ASSET_CLASSES` (labels, `usDefault`,
  `ukAlternatives`) and loses the composition arrays.
- `decisions.ts`'s six `DecisionRequest` variants collapse to one.
- `ETFConfigScreen` builds its sections from the fixture.

## Testing

| Package | Tests |
|---|---|
| Backend | Fixture matches live records · a request with no substitutions produces the paper decision · a substitution changes which tickers are fetched · the four 400 cases · `substitute=SPY:…` is rejected on LAA |
| Web | `decisions.ts` sends no tickers · `defaultUniverse` matches the fixture |
| App | `universes.generated.json` matches `shared/universes.json` · substitution map is built from overrides · **every fixture ticker maps to a known `AssetClassCode`** |

The last row is the guard that matters going forward: if the server ever
adds an asset the app cannot configure, that test fails rather than a UK
user silently losing the ability to substitute it.

`PaperFingerprintTests` is unchanged in form and finally load-bearing in
effect — the records it has always guarded are now the ones every request
runs on.

## Release ordering

The contract change is atomic across packages: the moment the backend
stops reading ticker parameters, every client that sends them is wrong.
An implementation plan can stage the work — fixture first, then backend,
then each client — but the three cannot land in separate releases.

The app in review still sends the old parameters, so deploying the
backend first breaks it.

1. Land and deploy the backend **and** the web together — the web is
   deployed from the same repo and must move with the contract.
2. Ship the app build carrying the new client.
3. Until step 2 lands, the previously-released app is broken against
   production.

With no users this is a scheduling detail rather than an incident. If
that changes before this ships, the backend keeps the old parameters as a
deprecated path for one release instead — a decision to revisit at
implementation time, not now.

## Open questions

1. **The UK catalog's home** — unchanged and still open. This design is
   compatible with either answer: the composition moves now, and the
   curated `ukAlternatives` list can follow later behind
   `GET /api/strategies/universes` without revisiting anything here.
2. **PAA and LAA remain deliberate divergences** — PAA adds `SHY`/`LQD`
   to the paper's single `IEF` cash asset; LAA times `SPY` on a 200-day
   SMA where the paper uses a 10-month SMA. Both are declared in
   `PaperFingerprintTests` and printed in each `variant` string. Whether
   to narrow them to the papers is a separate decision, untouched here.
