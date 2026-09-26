# Momentum Investment

Surfaces **Wouter Keller's momentum-based asset-allocation decisions** —
VAA, DAA, PAA, HAA, BAA and LAA — through an iOS/Android app and a public website,
both backed by one ASP.NET Core API. Each strategy is checked against the
paper it cites (`docs/papers/`) by a test that gates merges.

Live: web at `investment.ecomcraft.co.uk` (Azure Static Web Apps), API on
Azure Container Apps (uksouth). The app is live on the App Store at **1.4**
(iOS only). **1.5 ships iOS and Android together** — Android's first
release, on Google Play under the same EcomCraft Ltd organisation.

## Layout

```
backend/   ASP.NET Core 10 minimal API — decision engine, Yahoo + FRED clients, xUnit tests
mobile/    Expo SDK 54 / React Native iOS + Android app — Home / Settings / ETFConfig / Decision
web/       Vite + React 19 + react-router site — strategy pages, decision tool, /learn course
shared/    universes.json — the canonical ticker universe per strategy (fixture, see below)
scripts/   Python reference implementations of the momentum signals and strategy rules
infra/     azure-deploy.sh (idempotent provision + redeploy) and its playbook
docs/      papers/ (source PDFs), superpowers/specs + plans (design history, dated)
DESIGN.md  Web visual system ("Brutalist Quarterly") — read before touching web styling
```

## Build, test, run

### Backend (.NET 10 SDK)

```bash
cd backend
dotnet test                                        # ~150 xUnit tests
dotnet test --filter PaperFingerprintTests         # single test class
dotnet run --project src/MomentumInvestment.Api    # http://0.0.0.0:5050
```

Port **5050**, not 5000 (macOS AirPlay Receiver owns 5000). Containers
listen on 8080. LAA needs a FRED key:
`dotnet user-secrets set "Fred:ApiKey" "..."` locally, `Fred__ApiKey` when
deployed — see `backend/src/MomentumInvestment.Api/README.md` for all
config. Without it, only LAA fails.

Smoke test (the universe is the server's; only substitutions are sent):

```bash
curl 'http://localhost:5050/api/baa/decision?asOf=2026-09-14' | jq .
curl 'http://localhost:5050/api/vaa-g4b3/decision?asOf=2026-09-14&substitute=SPY:CSPX.L&substitute=IEF:IDTM.L' | jq .
curl 'http://localhost:5050/' | jq .    # lists every endpoint
```

### Mobile

```bash
cd mobile
npm install
npm test            # jest (jest-expo)
npm run tsc         # type check
npx expo start      # 'i' iOS simulator, 'a' Android emulator, or Expo Go on a device
```

For a physical device set `EXPO_PUBLIC_API_BASE_URL` in `mobile/.env` to the
dev machine's LAN IP (`http://192.168.x.x:5050`). Start dev servers yourself
in a terminal — they are interactive.

Before any EAS build/submit: `mobile/app.json` `version` must match the
version prepared in App Store Connect and in Play Console. Both stores ship
the **same version string** — `X-App-Version` carries no platform, so the
server's version line can't tell them apart. From 1.5 on, every release goes
to both stores at the same version; there is no Android build before 1.5.

```bash
eas build -p android --profile preview      # APK to sideload for testing
eas build -p android --profile production   # AAB for Google Play
eas submit -p android --latest              # Play internal track
eas build -p ios --profile production && eas submit -p ios --latest
```

`eas submit -p android` reads `mobile/google-play-service-account.json`
(gitignored — get it from Play Console → API access). The app must already
exist in Play Console; the first `eas submit` then creates its first
internal-testing release (a manual first upload is optional). Before
promoting beyond internal testing, Play Console needs the store listing,
the privacy policy URL, the Data safety form (the app requests INTERNET
only), content rating, target audience, and the **Financial features**
declaration.

### Web

```bash
cd web
npm install
npm run dev         # vite; copy .env.example to .env for VITE_API_BASE_URL
npm test            # vitest run
npm run lint
npm run build       # tsc -b && vite build
```

### Python references

```bash
python3 scripts/verify_13612w.py   # 13612W + date-aware lookback
python3 scripts/verify_paa.py      # SMA12 + PAA bond fraction
python3 scripts/verify_laa.py      # LAA Growth-Trend timing
python3 scripts/verify_haa.py      # HAA (pre-reconciliation rules — see Known drift)
python3 scripts/verify_baa.py      # BAA (pre-reconciliation rules — see Known drift)
```

The C# tests mirror these values; a divergence means one side is wrong.

### CI/CD (`.github/workflows/`)

- `ci.yml` — `dotnet test`, mobile `npm test` and web `npm test` on every PR
  and push to main.
- `deploy.yml` — push to main runs `infra/azure-deploy.sh` via OIDC
  federated identity (`az acr build`, no local Docker).
- `web-deploy.yml` — Static Web Apps build of `web/` on changes under
  `web/**`; PRs get preview environments.

## Architecture

### Request flow

```
app / web ──GET /api/<strategy>/decision?asOf=&substitute=ORIG:REPL──▶ Program.cs
   Program.cs: canonical <Strategy>Universe.Us
            → TickerSubstitution.Parse (400 on anything invalid)
            → universe.WithSubstitutions
            → FetchHistoriesAsync (Yahoo, IMemoryCache "daily:{ticker}", 6h)
            → <Strategy>Service.Decide(asOf, universe, prices)
            → WithClientStatus (X-App-Version → "current" | "outdated")
   ◀── AllocationDecision { allocations, scores[bucket], mode, reasoning, clientStatus, … }
```

Endpoints: `/api/vaa-g4b3`, `/api/daa-g12`, `/api/paa` (`&a=0|1|2`, default 2),
`/api/haa`, `/api/baa`, `/api/laa` — each `/decision` — plus
`/api/etf/probe?ticker=` for validating a user's custom ticker.

### The server owns the universe (since PR #20/#21, 2026-09-14)

`Strategies/<X>Universe.cs` holds `Us`, the paper's ticker universe. Clients
**cannot** send buckets — only `substitute=ORIGINAL:REPLACEMENT` pairs, where
ORIGINAL must be one of that strategy's `SubstitutableTickers()`. Every bad
pair is a 400, never ignored: a substitution that silently does nothing is
the bug this contract removed (the app and web had drifted into computing
different BAA strategies through the same backend).

The server is still **region-agnostic**: a substitution is an opaque pair of
strings. US/UK, the UCITS catalog (`mobile/src/etfCatalog.ts`) and user
overrides are client concepts. Don't add region awareness to C#.

LAA's `SignalEquity` (SPY) and `UNRATE` are not substitutable — Growth-Trend
timing stays US-anchored even for UK holders.

### The two merge gates

- **`PaperFingerprintTests`** — each strategy records the paper's
  configuration and ours. Fails on drift from live code, on an undeclared
  paper/implementation divergence, and on a declared divergence that no
  longer diverges. Changing a universe or constant means updating the
  fingerprint deliberately. Momentum-filter choice is recorded by hand
  (not structural), so filter swaps still need review.
  Background: `docs/superpowers/specs/2026-09-13-paper-implementation-audit.md`.
- **`UniverseFixtureTests`** — pins `shared/universes.json` to the
  `Universe.Us` records. The clients render strategy structure from that
  fixture. `mobile/src/universes.generated.json` is a byte-identical copy
  (Metro can't import outside `mobile/`); `mobile/src/__tests__/universes.test.ts`
  guards it. Universe change = edit C# record → `shared/universes.json` →
  `cp shared/universes.json mobile/src/universes.generated.json` → fingerprint.

### Version handshake

The app sends `X-App-Version`; `ClientVersion.Status` returns `outdated` when
it is below `ClientVersion.OldestTrusted` (currently 1.4 — every build before
the Monthly Rule rename is distrusted)
and the app shows `UpdateBanner`. Missing/unparseable header fails open
(`current`). Raise `OldestTrusted` only when an old version is genuinely
wrong, and **only after** the fixed version is live on both the App Store
and Google Play — otherwise the banner points at nothing to install.

### Backend code map (`backend/src/MomentumInvestment.Api/`)

- `Program.cs` — DI, CORS, all endpoints, fetch/caching helpers. Minimal API,
  no controllers. `JsonStringEnumConverter` is load-bearing (clients switch on
  `"Offensive"`/`"Defensive"`/`"Hybrid"` strings).
- `Strategies/IAllocationStrategy.cs` — `StrategyId` + `Decide(asOf, universe,
  dailyByTicker) → AllocationDecision`. LAA does **not** implement it (needs
  an extra UNRATE series argument) but returns the same shape.
- `Strategies/MomentumScoreCalculator.cs` — pure formulas. `MomentumScorer.cs`
  wraps them with lookup: `Score13612W`, `Score13612U`, `ScoreSMA12`. Pass the
  caller's `ILogger<T>`; don't reintroduce per-service `ScoreFor` helpers.
- `Strategies/LookbackPriceLookup.cs` — trading-day-on-or-before lookback.
  `SmaCalculator.cs` — LAA's daily/monthly SMAs (not momentum signals).
- `Strategies/TickerSubstitution.cs` — parse/apply `substitute=`.
- `YahooFinance/`, `Fred/` — HTTP clients. `ClientVersion.cs` — handshake.
- DI registers concrete services (`AddSingleton<VaaG4B3Service>()`); switch
  to interface registration only when something needs a list of strategies.

### Mobile (`mobile/`)

- **No React Navigation.** `App.tsx` routes with a `useState` discriminated
  union (`home | settings | config | decision`). App-level state — registered
  strategies, region, overrides, custom tickers, PAA `a`, done markers — lives
  in `App.tsx` and persists via AsyncStorage (`src/storage.ts`). Adopt a
  navigation library only when deep links / modal stacks are actually needed.
  Android's system back goes through `BackHandler` using `backTarget()` in
  `src/navigation.ts` (same target as each screen's "← Back"); a new screen
  needs an entry there.
- **Android layout.** The app draws edge-to-edge. Fixed bottom content (Home's
  footer, the ETF picker sheet) adds `useSafeAreaInsets().bottom` on Android
  only; iOS keeps its fixed spacing. The picker `Modal` is translucent over
  the system bars, so Android doesn't resize it for the keyboard — its
  `KeyboardAvoidingView` uses `padding` on both platforms.
- `src/appStore.ts` — `storeFor()` picks the App Store or Google Play listing
  for the update banner.
- `src/universe.ts` — turns (region, overrides) into substitutions: a pair is
  emitted where the resolved ticker differs from the asset class's
  `usDefault` (= the paper ticker).
- `src/etfCatalog.ts` — asset classes with `usDefault` + curated
  `ukAlternatives`. Asset classes are deliberately split where tickers differ
  (e.g. `EM` EEM vs `EM_FTSE` VWO, `INTL_DEV` EFA vs `INTL_DEV_FTSE` VEA,
  `COMMODITIES` GSG vs `COMMODITIES_BCOM` DBC) so one override doesn't leak
  into another strategy.
- `src/rebalance.ts` — the **in-force** decision comes from the last calendar
  day of the previous month (the backend resolves to the trading day). Today's
  reading is a preview, not what the user should hold.
- `src/decisions.ts`, `src/api/decisionClient.ts` — request building, fetch,
  version header.

### Web (`web/`)

react-router routes: `/`, `/strategies/:id`, `/learn`, `/learn/:slug`,
`/ko/learn`, `/ko/learn/:slug`, `/about`, `/privacy`. `src/strategies.ts` is the web catalog, including paper
backtest figures pinned by `strategies.test.ts`. `src/api/decisions.ts` is the
single decision client. Lessons live in `src/lessons/` (registered in
`index.ts`). The Korean course (`src/lessons/ko/`, `LESSONS_KO`) is a
Korean edition of each lesson, not a line-by-line translation: same slugs,
same facts and figures, its own wording, examples and tables. Site chrome
and figure components stay English. `lessons/courses.test.ts` fails if it
drifts from `LESSONS`, and terms are fixed in `src/lessons/ko/GLOSSARY.md`. Styling follows `DESIGN.md` — three colours, serif typography, no
shadows/gradients.

`npm run build` prerenders every URL in `public/sitemap.xml` to its own
`dist/<path>/index.html` (`scripts/prerender.mjs` via `src/entry-server.tsx`)
plus `404.html`; `main.tsx` hydrates it. There is **no SPA fallback** in
`staticwebapp.config.json`, so a new route must be added to the sitemap or
it 404s on direct load (`sitemap.test.ts` enforces this for lessons and
strategies). Per-page title, description, canonical and og tags come from
`components/PageMeta.tsx`.

### Deliberately absent

- **No database** — `IMemoryCache` only. Add SQLite/Azure SQL when a real
  persistence need appears (history view, cross-device sync).
- **No accounts** — user substitutions stay on the device.

## Strategies

Shared semantics:

- **13612W** = `12·(p0/p1−1) + 4·(p0/p3−1) + 2·(p0/p6−1) + (p0/p12−1)`.
  **13612U** = unweighted mean of the four returns.
  **SMA12** = `p0 / mean(p0..p11) − 1` (p0 included).
- **Lookback:** `p0` = trading day on or before `asOf`; `pN` = trading day on
  or before `asOf − N months`. **Don't reintroduce month-end logic.**
  (Verified: asOf 2026-05-04 → p1 = 2026-04-02 over Good Friday, p12 = 2025-05-02.)
- Zero is bad: a score of exactly 0 fails a canary/absolute-momentum test.
- A ticker in two buckets appears twice in `scores` with different `bucket`
  labels (and, in BAA, possibly different signals). Intentional; don't dedupe.

Universes are in `shared/universes.json`; the table below gives rules only.

| Strategy | Signal | Rule |
|---|---|---|
| **VAA-G4/B3** (Keller & Keuning 2017) | 13612W | Any offensive ≤ 0 → 100% top defensive; else 100% top offensive. |
| **DAA-G12** (2018) | 13612W | `b` = bad canaries (of 2). `b=0` top 6 risky @1/6; `b=1` top 3 @1/6 + 50% best cash (Hybrid); `b=2` 100% best cash. |
| **PAA-G12** a∈{0,1,2} (Keller & van Putten 2016) | SMA12 | `n` = risky > 0. `BF = clamp((N−n)/(N − a·N/4))`. Top T=6 risky each at `(1−BF)/6`; unfilled slots fold into cash. Response `strategyId` is `paa-g12-a{a}`. One picker entry; variant via segmented control. |
| **HAA-Balanced** (Keller & Keuning 2023) | 13612U everywhere | Canary TIP ≤ 0 → 100% better of BIL/IEF. Else top 4 risky @25%, and each top-4 slot with score ≤ 0 goes to that cash asset (Hybrid). |
| **BAA-G12** (Keller 2022) | canary 13612W; risky + cash SMA12 | All 4 canaries (SPY, VWO, VEA, BND) > 0 → top 6 risky @1/6. Else top 3 of 7 cash @1/3; a pick scoring below BIL becomes BIL (weights summed). |
| **LAA** (Keller 2019) | SPY vs SMA200, UNRATE vs SMA12 | IWD/GLD/IEF 25% each always. Risk-Off only if **both** SPY < SMA200 **and** UNRATE > SMA12 → SHY; else QQQ. `scores` holds the two signals (`bucket="Signal"`), not assets. |

PAA's only declared paper divergence and LAA's near-equivalence are
documented in the audit spec and in `PaperFingerprintTests`.

## Gotchas

- **Expo SDK pinned to 54** to match the test iPhone's Expo Go. Upgrade Expo
  Go first.
- **`babel-preset-expo` must stay an explicit dependency** — Metro can't
  resolve it transitively.
- **FRED: use `api.stlouisfed.org`, not `fred.stlouisfed.org`.** The CSV host's
  TLS handshake stalls from .NET/JVM on macOS. The FRED `HttpClient` is forced
  to HTTP/1.1 + TLS 1.2 with a 15s timeout for the same reason. Missing key →
  LAA 5xx `FRED API key is not configured`. FRED cached 24h as `fred:{seriesId}`.
- **Yahoo** v8 chart endpoint is unofficial and needs a `User-Agent`. `.L`
  (LSE UCITS) tickers work. Before the open there is no daily bar for today,
  and LSE opens ~6.5h before NYSE — don't treat that window as safe for UK
  tickers. Delisted substitutes (e.g. `IUSV.L`, 2026-06) surface as a fetch
  failure naming the substitution.
- **Cold start:** Container Apps runs `min-replicas 1` at 0.25 vCPU because
  scale-to-zero cost 22.6s on the once-a-month visit (0.49s warm). The
  create vs update branches in `azure-deploy.sh` both have to carry that
  setting — see the script header.
- **CORS:** dev allows any origin; prod reads `Cors:AllowedOrigins`. Native
  app fetches send no Origin, so CORS only affects browsers (the web site).
- **`new Date('YYYY-MM-DD')` parses as UTC** and shifts a day west of
  Greenwich — client date code splits strings instead.
- **iOS Simulator:** mouse click-drag on a `TouchableOpacity` inside a
  `ScrollView` registers as a tap. Simulator quirk, not a bug.
- **zsh** doesn't treat backslash-newline as a line continuation inside single
  quotes, so keep curl URLs on one line.

## Known drift (not yet fixed)

- `scripts/verify_haa.py` and `scripts/verify_baa.py` still encode the
  pre-reconciliation rules (HAA: 13612W, BIL-only cash, no dual momentum;
  BAA: TIP/IEF/BIL canary, 13612W risky, top-1 cash). The C# services and
  fingerprints are authoritative.
- `BaaService`'s class doc comment still describes the old TIP/IEF/BIL
  canary and top-1 cash rule.
- `README.md` still describes caller-supplied buckets, a region-agnostic
  "no substitution" backend, and 84 tests.

## Working conventions

- Design history lives in `docs/superpowers/specs/` (why) and `plans/` (how),
  dated. Read the relevant spec before reworking an area.
- Commit/PR titles are plain-English outcomes ("Say which close the reading
  actually used"); version bumps use `chore(mobile): …`.
