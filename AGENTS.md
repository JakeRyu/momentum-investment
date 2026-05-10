# Momentum Investment

Personal mobile app surfacing **Wouter Keller's momentum-based asset-allocation
decisions**. Phase 1 implements **VAA-G4/B3**, **DAA-G12**, **PAA-G12** (all
three protection factors a ∈ {0, 1, 2}), and **LAA** end-to-end; the remaining
Keller strategies (BAA, HAA) are listed in the mobile picker but route to a
"Coming soon" placeholder.

## Layout

```
backend/   ASP.NET Core 10 minimal API — momentum + VAA/DAA/PAA/LAA decision engine
mobile/    Expo (React Native) — Home / ETFConfig / Decision / NotImplemented
scripts/   Python reference implementations of 13612W, SMA12, and LAA GT timing
```

## Strategy: VAA-G4/B3

- **Offensive (G4):** SPY, EFA, EEM, AGG (US default; UK UCITS substitutes
  available via region picker / per-asset overrides).
- **Defensive (B3):** LQD, IEF, SHY (US default; UK UCITS substitutes likewise).
- **Rule:** if any G4 has 13612W momentum ≤ 0 → defensive mode (top B3 by
  momentum); otherwise offensive mode (top G4 by momentum).
- **13612W:** `12·(p0/p1 − 1) + 4·(p0/p3 − 1) + 2·(p0/p6 − 1) + (p0/p12 − 1)`
- **Lookback semantics:** `p0 = trading-day-on-or-before asOf`; `p_N =
  trading-day-on-or-before (asOf − N months)`. Falls back to most recent trading
  day when a target lands on a weekend or NYSE holiday. (This was refactored
  from a month-end definition; don't re-introduce month-end logic.)

Reference: Keller & Keuning, *Breadth Momentum and Vigilant Asset Allocation*, 2017.

## Strategy: DAA-G12

- **Canary (B=2):** VWO, BND.
- **Risky (T=6 of 12):** SPY, IWM, QQQ, VGK, EWJ, VWO, VNQ, GSG, GLD, TLT, HYG, LQD.
- **Cash:** SHY, IEF, LQD.
- **Rule (Keller & Keuning, 2018):** count `b` of canary assets with 13612W ≤ 0,
  then `CF = min(1, (1/T) · floor(b·T/B))` and `t = round((1−CF)·T)`. For
  G12 this collapses to three states:
  - `b=0` → `CF=0, t=6` → top 6 risky at 1/6 each (Offensive)
  - `b=1` → `CF=0.5, t=3` → top 3 risky at 1/6 each + 50% in best cash (Hybrid)
  - `b=2` → `CF=1, t=0` → 100% in best cash (Defensive)
- Per-asset risky weight is constant `1/T` for `b ∈ {0, 1}`; only the count of
  positions shrinks. Cash, when held, is concentrated in the single
  highest-momentum asset of the cash universe.
- Tickers shared across buckets (e.g. VWO is canary+risky, LQD is risky+cash)
  are scored once and reused.
- Region/override parity with VAA: DAA's universe is resolved on the
  mobile side via `resolveDaaG12Universe(region, overrides)` against the
  same shared `etfCatalog.ts` building blocks. Canary-specific tickers
  (VWO, BND) live in dedicated asset classes (`EM_FTSE`, `US_AGG_TOTAL`)
  so they don't perturb VAA's distinct EM/AGG mapping; everything else
  shares asset classes with VAA where the ticker matches (LQD ↔ IG_CORP,
  SHY ↔ TREASURY_SHORT, IEF ↔ TREASURY_7_10, SPY ↔ US_LARGE_CAP).

Reference: Keller & Keuning, *Breadth Momentum and the Canary Universe*, 2018.

## Strategy: PAA-G12/T6 (a ∈ {0, 1, 2})

- **Risky (T=6 of N=12):** SPY, IWM, QQQ, VGK, EWJ, EEM, VNQ, GSG, GLD, HYG, LQD, TLT.
- **Cash:** IEF, SHY, LQD (Keller's canonical cash is single-asset IEF; we
  accept a multi-asset list and pick top-by-momentum, so passing `cash=IEF`
  alone reproduces the original behaviour).
- **Momentum signal:** SMA(12), not 13612W —
  `momentum = p₀ / mean(p₀..p₁₁) − 1`. P₀ is *included* in the SMA per
  Keller's PAA paper definition.
- **Rule (Keller & van Putten, 2016):** count `n` of risky assets with
  momentum > 0. Bond fraction `BF = max(0, min(1, (N − n) / N1))` where
  `N1 = N − a·N/4`. For N=12 the three Keller-defined `a` variants are:
  - `a = 0` (Aggressive) → N1 = 12. Defensive only at `n = 0`; `n = k > 0`
    gives `BF = (12−k)/12` and partial risky exposure all the way down.
  - `a = 1` (Moderate)   → N1 =  9. Defensive at `n ≤ 3`; `n = k > 3` gives
    `BF = (12−k)/9` (capped at 1).
  - `a = 2` (Vigilant)   → N1 =  6. Defensive at `n ≤ 6`; `n = k > 6` gives
    `BF = (12−k)/6`. Keller's recommended baseline.
  All three: `n = 12` → `BF = 0` → top 6 risky at 1/6 each (Offensive).
- Each risky position holds `(1 − BF) / T` (fixed denominator T, not the
  smaller `t = min(n, T)`). For PAA0/PAA1 with `n < T = 6`, only `t` slots
  are filled and the leftover `(T − t)·(1 − BF)/T` collapses into cash on
  top of BF — PAA2 never exercises this path because `n > 6 ≥ T` is
  guaranteed whenever any risky exposure is held.
- **API surface:** `/api/paa/decision?...&a=0|1|2` (default `a = 2`).
  Response `strategyId` carries the variant suffix —
  `paa-g12-a0` / `paa-g12-a1` / `paa-g12-a2` — so a future history view can
  distinguish them. The class-level `PaaService.StrategyId` stays at
  `paa-g12` for DI/logging.
- **EM ticker note:** PAA's EM exposure is EEM (`EM` asset class, shared with
  VAA). DAA's canary EM is VWO (`EM_FTSE`, DAA-only). A UK override on `EM`
  applies to VAA + PAA but not DAA's canary.

Reference: Keller & van Putten, *Protective Asset Allocation: A Simple
Momentum-Based Alternative for Term Deposits*, 2016.

## Strategy: LAA (Lethargic Asset Allocation)

- **Permanent (75%):** IWD, GLD, IEF — held at 25% each unconditionally
  (US default; UK UCITS substitutes via region picker / per-asset overrides).
- **Rotating (25%):** QQQ in Risk-On regimes, replaced by SHY in Risk-Off.
- **Rule (Keller, 2019, Growth-Trend timing):** Risk-Off when **both** of:
  - `UNRATE_t > SMA12(UNRATE)` — US unemployment trend bearish
  - `SPY_t < SMA200(SPY)` — equity price-trend bearish

  Otherwise Risk-On. Either one bearish alone is not enough — the combined
  signal screens out technical-only corrections (SPY alone) and recovery
  blips (UE alone).
- **SMA convention:** both windows include the current observation, matching
  PAA's SMA12 (`p₀ + ... + p₁₁` / 12). For SPY this means the 200-day window
  is the trailing 200 daily closes ending at asOf (inclusive).
- **Macro data source:** FRED's official JSON API
  (`api.stlouisfed.org/fred/series/observations?series_id=UNRATE&file_type=json`),
  free API key required (set via `dotnet user-secrets set "Fred:ApiKey" "..."`
  for local dev, `Fred__ApiKey` env var in deployed environments — see
  `backend/src/MomentumInvestment.Api/README.md`). Cached 24h per series id.
  - We initially tried the keyless CSV download host
    (`fred.stlouisfed.org/graph/fredgraph.csv`), but on macOS .NET's TLS
    handshake to that hostname stalls (curl works, JVM/Netty also stalls
    with `PrematureCloseException`). Switching to `api.stlouisfed.org`
    bypasses the issue. Don't switch back to the CSV endpoint without
    re-testing TLS behaviour from a Mac.
- **Region note:** the GT signal stays US-anchored even in UK mode (SPY +
  UNRATE), since it's a US business-cycle indicator. Only the actual
  portfolio assets (IWD/GLD/IEF/QQQ/SHY) get remapped to UCITS substitutes.
- **Architecture deviation:** `LaaService` does **not** implement
  `IAllocationStrategy<TUniverse>`. The interface is for momentum-on-prices
  strategies; LAA needs an extra `IReadOnlyList<MonthlyObservation>`
  parameter for UNRATE, so its `Decide` signature differs. Program.cs wires
  the FRED fetch alongside the Yahoo fetch and invokes `LaaService` directly.
- **Score response:** `Allocations` is always 4 entries × 25%. `Scores`
  carries the two macro signals tagged `Bucket="Signal"` (`SPY` price trend,
  `UNRATE` rate trend) — no per-asset momentum, since LAA isn't a momentum
  strategy. ModeLabel reuses `"Offensive"` (Risk-On) / `"Defensive"`
  (Risk-Off) so the mobile DecisionScreen's existing badge colours apply.
- **New asset class:** `US_LARGE_VALUE` (Russell 1000 Value, IWD) is
  distinct from `US_LARGE_CAP` (S&P 500, SPY) — they're genuinely different
  indices. UK substitute: `IUSV.L` (S&P 500 Value, closest UCITS proxy).

Reference: Keller, *Growth-Trend Timing and 60-40 Variations: Lethargic
Asset Allocation (LAA)*, SSRN 3498092, 2019.

## Build and run

### Backend

```bash
cd backend
dotnet restore
dotnet build
dotnet test                        # ~70 unit tests across calculator, lookup, SMA, FRED parser, VAA, DAA, PAA, and LAA
dotnet run --project src/MomentumInvestment.Api
```

API listens on **port 5050** (NOT 5000 — macOS AirPlay Receiver squats on 5000).
Bound to `0.0.0.0:5050` so phones on the LAN can reach it.

Smoke-tests:

```bash
# VAA-G4/B3
curl 'http://localhost:5050/api/vaa-g4b3/decision?asOf=YYYY-MM-DD\
&offensive=SPY&offensive=EFA&offensive=EEM&offensive=AGG\
&defensive=LQD&defensive=IEF&defensive=SHY' | jq .

# DAA-G12
curl 'http://localhost:5050/api/daa-g12/decision?asOf=YYYY-MM-DD\
&canary=VWO&canary=BND\
&risky=SPY&risky=IWM&risky=QQQ&risky=VGK&risky=EWJ&risky=VWO\
&risky=VNQ&risky=GSG&risky=GLD&risky=TLT&risky=HYG&risky=LQD\
&cash=SHY&cash=IEF&cash=LQD' | jq .

# PAA-G12 — `a` selects protection factor (default 2 if omitted).
# Note: zsh treats backslash-newline literally inside single quotes, so
# in a real shell either keep the URL on one line or build it via $URL+=...
curl 'http://localhost:5050/api/paa/decision?asOf=YYYY-MM-DD&a=2&risky=SPY&risky=IWM&risky=QQQ&risky=VGK&risky=EWJ&risky=EEM&risky=VNQ&risky=GSG&risky=GLD&risky=HYG&risky=LQD&risky=TLT&cash=IEF&cash=SHY&cash=LQD' | jq .

# LAA — permanent[3] + 1 risky + 1 cash + signal config (signal/series default
# to SPY/UNRATE if omitted; FRED CSV is fetched server-side, no API key).
curl 'http://localhost:5050/api/laa/decision?asOf=YYYY-MM-DD&permanent=IWD&permanent=GLD&permanent=IEF&risky=QQQ&cash=SHY&signalEquity=SPY&unemploymentSeriesId=UNRATE' | jq .

# Custom-ticker probe (used by the mobile ETF override flow)
curl 'http://localhost:5050/api/etf/probe?ticker=EMIM.L' | jq .
```

### Mobile

```bash
cd mobile
npm install
npx expo start                     # then 'i' for iOS simulator, or scan QR with Expo Go
```

For a physical device, set `EXPO_PUBLIC_API_BASE_URL` in `mobile/.env` to the
dev machine's LAN IP (`http://192.168.x.x:5050`). For simulator, the default
`localhost:5050` works.

### Verification script

```bash
python3 scripts/verify_13612w.py
```

Independent Python reference for the 13612W formula and date-aware lookback.
The C# unit tests mirror its values, so any divergence means one of them is wrong.

```bash
python3 scripts/verify_paa.py
```

Same role for the SMA12 formula used by PAA, plus the bond-fraction
closed forms `BF = max(0, min(1, (N − n) / (N − a·N/4)))` for `a ∈ {0, 1, 2}`.
Note that decimal arithmetic truncates at ~28 digits, so the script compares
with a tolerance via `almost_equal(...)` — the C# tests do the same via
`Assert.Equal(..., precision: 18)`.

```bash
python3 scripts/verify_laa.py
```

Independent reference for LAA's GT timing rule (`SPY < SMA200(SPY)` AND
`UNRATE > SMA12(UNRATE)` → Risk-Off). Mirrors the synthetic fixtures used
in `LaaServiceTests`, so any divergence between Python and C# means one of
the two is wrong.

## Stack

- **Backend:** ASP.NET Core 10 (LTS); `.NET 10` SDK required.
- **Mobile:** Expo SDK 54, React Native 0.81 — pinned because the dev iPhone's
  Expo Go is SDK 54.
- **Data:** Yahoo Finance unofficial v8 chart endpoint
  (`query1.finance.yahoo.com/v8/finance/chart/{ticker}?range=2y&interval=1d`).
  Requires a `User-Agent` header. LSE-listed UCITS tickers (`.L` suffix) work
  in practice via the same endpoint, so VAA's UK universe runs against Yahoo
  without a separate vendor.
- **Macro data (LAA only):** FRED official JSON API
  (`api.stlouisfed.org/fred/series/observations?series_id={series}&file_type=json`).
  Requires a free API key — see
  `backend/src/MomentumInvestment.Api/README.md` for env-var contract
  on deploy and `dotnet user-secrets` flow for local dev.
- **Cache:** `IMemoryCache`, keyed per-ticker (`daily:{ticker}`) with a 6h
  TTL for prices. FRED series cache key is `fred:{seriesId}` with a 24h TTL
  (UNRATE only updates monthly so this can't miss more than one release).
  Neither cache key includes asOf — both inputs are asOf-independent.
- **Mobile persistence:** `AsyncStorage` via `mobile/src/storage.ts` —
  persists region (US/UK), per-asset-class ticker overrides (UK), and the
  user's custom tickers. Last-strategy-selection across launches is **not**
  persisted yet (deferred).

## Architecture conventions — do not violate without discussion

### `IAllocationStrategy<TUniverse>` is the strategy contract

`Strategies/IAllocationStrategy.cs` defines the common shape every
Keller-family momentum-on-prices strategy implements: a `StrategyId` and a
`Decide(asOf, universe, dailyByTicker) → AllocationDecision`. The interface
is generic over `TUniverse` because each strategy has a different bucket
shape (VAA's Offensive/Defensive, DAA's Canary/Risky/Cash, etc.) but the
return contract is uniform so the mobile renderer stays one path.

**LAA deviates** — its `Decide` takes an extra `IReadOnlyList<MonthlyObservation>`
for the UNRATE series, so it deliberately does not implement
`IAllocationStrategy<LaaUniverse>`. The trade-off is small: the only thing
the interface buys is the uniform return type, which `LaaService` still
honours by returning the same `AllocationDecision` shape. Any future macro-
aware strategy (BAA's yield filter, etc.) can either follow the same
pattern or extend the interface to take a generic context.

Shared per-ticker scoring lives in `Strategies/MomentumScorer.cs` —
`Score13612W` for VAA/DAA and `ScoreSMA12` for PAA. Both wrap
`Strategies/MomentumScoreCalculator.cs` (pure formula, no I/O) plus the
relevant lookup. Pure formula primitives:
`Calculate13612W(p0, p1, p3, p6, p12)` and
`CalculateSMAMomentum(monthlyClosesIncludingCurrent)`.

LAA's GT-timing primitives live separately in `Strategies/SmaCalculator.cs`
because they're not momentum signals — `DailySma(asOf, history, window)`
for the SPY 200-day price SMA and `MonthlySma(asOf, history, window)` for
the UNRATE 12-month SMA. Both follow the same trading-day-on-or-before
lookback as the momentum primitives.

Lookback helpers in `Strategies/LookbackPriceLookup.cs`:
`FindLookbackPrices` (P₀, P₁, P₃, P₆, P₁₂ for 13612W) and
`FindMonthlyLookbackPrices(asOf, history, monthsBack)` (consecutive
monthly closes for SMA-based strategies). Both use trading-day-on-or-before
semantics — don't introduce month-end logic.

Strategies pass their own `ILogger<T>` in to keep log lines categorised
under the calling service. Don't reintroduce a per-service `ScoreFor`
helper.

DI keeps the concrete service registrations (`AddSingleton<VaaG4B3Service>()`
etc.) because Program.cs injects the concretes directly — there's no
List-of-strategies use case yet. Switch to `AddSingleton<IAllocationStrategy<…>,
…>()` only when one appears.

### No DB

`IMemoryCache` only. Move to SQLite or Azure SQL only when persistence is
actually needed (e.g. history view, cross-device sync). Don't add it
proactively.

### No React Navigation

`useState`-based screen routing in `mobile/App.tsx`. State
(`selectedStrategyId`, `asOfDate`, region, overrides) is **lifted to
`App.tsx`** so navigating Home → ETFConfig → Decision → Back keeps the prior
selection. `HomeScreen` is fully controlled (no internal selection state).

If you find yourself wanting deep links, modal stacks, or back-button
hardware support, that is the trigger to evaluate React Navigation — not before.

### Mobile strategy registry

Mobile lists eight picker entries in `mobile/src/strategies.ts` — VAA, DAA,
PAA0/PAA1/PAA2 (Keller's three protection-factor variants share the same
risky+cash universe; only `a` differs at the API layer), LAA, BAA, HAA. The
first six have `implemented: true`; BAA/HAA do not. Tapping Confirm:

- Implemented strategy → `DecisionScreen` (calls backend with the resolved
  ticker universe — region default + any per-asset overrides).
- Unimplemented → `NotImplementedScreen` (placeholder).

When wiring a new backend strategy through, flip its `implemented` flag,
add its API client under `mobile/src/api/`, and ensure `DecisionScreen`
knows how to render its bucket layout.

### Region-agnostic backend

The backend takes the ticker universe as query parameters (e.g.
`?offensive=SPY&offensive=...&defensive=...`). All region/UK selection logic
lives on the mobile side; the backend stays agnostic about US vs UK and any
per-user overrides. **Do not** push region awareness into the C# layer.

### JSON contract

`Program.cs` registers `JsonStringEnumConverter` so the response `mode` field
is `"Offensive"` / `"Defensive"` / `"Hybrid"` (string), not an int. The
mobile client depends on the string form. Don't remove this converter.

## Verified end-to-end

- All four signal families (13612W, SMA12, daily 200d SMA, monthly 12mo SMA)
  verified independently in Python (`scripts/verify_13612w.py`,
  `scripts/verify_paa.py`, `scripts/verify_laa.py`).
- C# unit tests (~70 total) mirror the Python reference values across
  VAA-G4/B3, DAA-G12, PAA-G12, and LAA, plus dedicated tests for the SMA
  calculator and FRED CSV parser
  (`backend/tests/MomentumInvestment.Api.Tests/`).
- Live Yahoo Finance integration confirmed via iOS Simulator and iPhone (Expo Go)
  for both US and UK universes (VAA/DAA/PAA). LAA's live FRED + Yahoo
  integration is wired but should be smoke-tested with a real `asOf`.
- Date-aware lookback verified against hand-calculated NYSE Good Friday + weekend
  cases (e.g. asOf = 2026-05-04 → p1 = 2026-04-02, p12 = 2025-05-02).

## Gotchas (non-obvious things that have already burned us)

- **Port 5050, not 5000** — macOS Monterey+ AirPlay Receiver listens on 5000 by default.
- **Expo SDK pinned to 54.** Bumping the project to SDK 55+ requires the test
  iPhone's Expo Go to be on a matching SDK first, otherwise the loader rejects
  the bundle.
- **`babel-preset-expo`** must be in `package.json` explicitly even though
  Expo's docs imply it's transitive — Metro fails to resolve it otherwise.
- **iOS Simulator scroll quirk:** clicking-and-dragging with a mouse on a
  `TouchableOpacity` inside a `ScrollView` is interpreted as a tap, not a
  scroll. Trackpad two-finger gestures or drag-from-empty-area work. Real
  device touch is fine — this is a simulator quirk, not a code bug.
- **DateOnly query binding** in minimal API works out of the box in .NET 10;
  no custom binder needed.
- **Score-bucket duplicates in DAA responses are intentional.** A ticker that
  appears in two buckets (e.g. VWO in canary+risky) shows up twice in the
  `Scores` list with different `Bucket` labels — the mobile UI renders them
  per-bucket. Don't dedupe on the wire.
- **LAA's `Scores` only contains macro signals**, not the four allocated
  assets. The mobile DecisionScreen renders `Bucket="Signal"` rows with
  custom directional captions ("above 200d SMA · bullish") because the
  default "negative score = red" colouring used for momentum is misleading
  here — UNRATE positive is bearish, SPY negative is bearish.
- **fred.stlouisfed.org TLS hangs from .NET on macOS.** ClientHello sent,
  ServerHello never arrives — `EnsureFullTlsFrameAsync` blocks. curl on
  the same machine works (Secure Transport produces a different
  ClientHello). Rider's Netty client also fails (`PrematureCloseException`),
  so it's not a .NET-specific bug — looks like that hostname's TLS endpoint
  silently rejects OpenSSL/JVM-style ClientHellos. We side-stepped this
  by switching to the JSON API at `api.stlouisfed.org`. Don't migrate
  back to the CSV download host without re-testing TLS from a Mac.
- **FRED `Fred:ApiKey` is required.** Stored via `dotnet user-secrets`
  for local dev, env var `Fred__ApiKey` in deployed environments — see
  `backend/src/MomentumInvestment.Api/README.md`. Missing key → LAA
  endpoint returns 5xx with `FRED API key is not configured`.

## Roadmap (probable next directions)

- **BAA / HAA** — same `IAllocationStrategy<TUniverse>` + `MomentumScorer`
  + `etfCatalog` pattern. BAA/HAA bring canary-signal variants closer to
  DAA. If BAA's yield filter brings macro data along too, follow LAA's
  pattern: skip the interface, take an extra `Decide` parameter, wire the
  fetch in Program.cs.
- **Last-selection persistence** across app launches (extend `storage.ts`).
- **History view** of past decisions — would require persistence beyond
  AsyncStorage prefs (SQLite trigger).
- **Azure deployment** — user has monthly free credits; tighten CORS first.

## Imported Claude Cowork project instructions
