# Momentum Investment

Personal mobile app surfacing **Wouter Keller's momentum-based asset-allocation
decisions**. Phase 1 implements **VAA-G4/B3**, **DAA-G12**, and **PAA-G12 (a=2)**
end-to-end; the other Keller strategies (BAA, HAA, LAA) are listed in the mobile
picker but route to a "Coming soon" placeholder.

## Layout

```
backend/   ASP.NET Core 10 minimal API — momentum + VAA/DAA/PAA decision engine
mobile/    Expo (React Native) — Home / ETFConfig / Decision / NotImplemented
scripts/   Python reference implementations of 13612W and SMA12 (verification)
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

## Strategy: PAA-G12/T6 (a=2)

- **Risky (T=6 of N=12):** SPY, IWM, QQQ, VGK, EWJ, EEM, VNQ, GSG, GLD, HYG, LQD, TLT.
- **Cash:** IEF, SHY, LQD (Keller's canonical cash is single-asset IEF; we
  accept a multi-asset list and pick top-by-momentum, so passing `cash=IEF`
  alone reproduces the original behaviour).
- **Momentum signal:** SMA(12), not 13612W —
  `momentum = p₀ / mean(p₀..p₁₁) − 1`. P₀ is *included* in the SMA per
  Keller's PAA paper definition.
- **Rule (Keller & van Putten, 2016, with a=2):** count `n` of risky assets
  with momentum > 0. Bond fraction `BF = max(0, min(1, (N − n) / N1))` where
  `N1 = N − a·N/4`. For N=12, a=2 → N1 = 6, so:
  - `n ≤ 6` → BF = 1 → 100% in top cash (Defensive)
  - `n = 7..11` → BF = (12−n)/6 → top T=6 risky at `(1−BF)/T` each + BF in top cash (Hybrid)
  - `n = 12` → BF = 0 → top 6 risky at 1/6 each (Offensive)
- Each risky position holds `(1 − BF) / T` (fixed denominator T, not the
  smaller `t = min(n, T)`). For PAA2 this only matters with PAA0/PAA1 since
  any non-zero risky exposure already implies n > 6 ≥ T; the expression is
  written to scale to any future `a`.
- **EM ticker note:** PAA's EM exposure is EEM (`EM` asset class, shared with
  VAA). DAA's canary EM is VWO (`EM_FTSE`, DAA-only). A UK override on `EM`
  applies to VAA + PAA but not DAA's canary.

Reference: Keller & van Putten, *Protective Asset Allocation: A Simple
Momentum-Based Alternative for Term Deposits*, 2016.

## Build and run

### Backend

```bash
cd backend
dotnet restore
dotnet build
dotnet test                        # 34 unit tests across calculator, lookup, VAA, DAA, and PAA
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

# PAA-G12 (a=2 hardcoded server-side)
# Note: zsh treats backslash-newline literally inside single quotes, so
# in a real shell either keep the URL on one line or build it via $URL+=...
curl 'http://localhost:5050/api/paa/decision?asOf=YYYY-MM-DD&risky=SPY&risky=IWM&risky=QQQ&risky=VGK&risky=EWJ&risky=EEM&risky=VNQ&risky=GSG&risky=GLD&risky=HYG&risky=LQD&risky=TLT&cash=IEF&cash=SHY&cash=LQD' | jq .

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

Same role for the SMA12 formula used by PAA. Note that decimal arithmetic
truncates at ~28 digits, so the script compares with a tolerance via
`almost_equal(...)` — the C# tests do the same via `Assert.Equal(..., precision: 18)`.

## Stack

- **Backend:** ASP.NET Core 10 (LTS); `.NET 10` SDK required.
- **Mobile:** Expo SDK 54, React Native 0.81 — pinned because the dev iPhone's
  Expo Go is SDK 54.
- **Data:** Yahoo Finance unofficial v8 chart endpoint
  (`query1.finance.yahoo.com/v8/finance/chart/{ticker}?range=2y&interval=1d`).
  Requires a `User-Agent` header. LSE-listed UCITS tickers (`.L` suffix) work
  in practice via the same endpoint, so VAA's UK universe runs against Yahoo
  without a separate vendor.
- **Cache:** `IMemoryCache`, keyed per-ticker (`daily:{ticker}`), 6h TTL.
  Daily data is asOf-independent, so asOf is not part of the cache key.
- **Mobile persistence:** `AsyncStorage` via `mobile/src/storage.ts` —
  persists region (US/UK), per-asset-class ticker overrides (UK), and the
  user's custom tickers. Last-strategy-selection across launches is **not**
  persisted yet (deferred).

## Architecture conventions — do not violate without discussion

### `IAllocationStrategy<TUniverse>` is the strategy contract

`Strategies/IAllocationStrategy.cs` defines the common shape every
Keller-family strategy implements: a `StrategyId` and a
`Decide(asOf, universe, dailyByTicker) → AllocationDecision`. The interface
is generic over `TUniverse` because each strategy has a different bucket
shape (VAA's Offensive/Defensive, DAA's Canary/Risky/Cash, etc.) but the
return contract is uniform so the mobile renderer stays one path.

Shared per-ticker scoring lives in `Strategies/MomentumScorer.cs` —
`Score13612W` for VAA/DAA and `ScoreSMA12` for PAA. Both wrap
`Strategies/MomentumScoreCalculator.cs` (pure formula, no I/O) plus the
relevant lookup. Pure formula primitives:
`Calculate13612W(p0, p1, p3, p6, p12)` and
`CalculateSMAMomentum(monthlyClosesIncludingCurrent)`.

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

Mobile lists six strategies in `mobile/src/strategies.ts`. VAA, DAA, and PAA
have `implemented: true`; BAA/HAA/LAA do not. Tapping Confirm:

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

- Both momentum signals (13612W, SMA12) verified independently in Python
  (`scripts/verify_13612w.py`, `scripts/verify_paa.py`).
- C# unit tests (34 total) mirror the Python reference values across
  VAA-G4/B3, DAA-G12, and PAA-G12
  (`backend/tests/MomentumInvestment.Api.Tests/`).
- Live Yahoo Finance integration confirmed via iOS Simulator and iPhone (Expo Go)
  for both US and UK universes.
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

## Roadmap (probable next directions)

- **PAA0 / PAA1 variants** — currently only PAA2 (a=2). Adding the other
  two is mechanical: either expose `a` as a query param of `/api/paa/decision`
  (and a mobile picker), or register `paa-a0`/`paa-a1` as separate
  `StrategyId`s. PaaService already keeps the formula generic over `a`
  via the `n1` derivation; only the constant needs to flow in.
- **BAA / HAA / LAA** — same `IAllocationStrategy<TUniverse>` +
  `MomentumScorer` + `etfCatalog` pattern. BAA/HAA bring canary-signal
  variants closer to DAA; LAA is a low-turnover defensive variant.
- **Last-selection persistence** across app launches (extend `storage.ts`).
- **History view** of past decisions — would require persistence beyond
  AsyncStorage prefs (SQLite trigger).
- **Azure deployment** — user has monthly free credits; tighten CORS first.
