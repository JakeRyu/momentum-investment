# Momentum Investment

Personal mobile app surfacing **Wouter Keller's momentum-based asset-allocation
decisions**. Phase 1 implements **VAA-G4/B3** (conservative variant) end-to-end;
the other Keller strategies (PAA, DAA, BAA, HAA, LAA) are listed in the mobile
picker but route to a "Coming soon" placeholder.

## Layout

```
backend/   ASP.NET Core 10 minimal API — momentum + VAA decision engine
mobile/    Expo (React Native) — Home / Decision / NotImplemented screens
scripts/   Python reference implementation of 13612W (verification)
```

## Strategy: VAA-G4/B3

- **Offensive (G4):** SPY, EFA, EEM, AGG
- **Defensive (B3):** LQD, IEF, SHY
- **Rule:** if any G4 has 13612W momentum ≤ 0 → defensive mode (top B3 by
  momentum); otherwise offensive mode (top G4 by momentum).
- **13612W:** `12·(p0/p1 − 1) + 4·(p0/p3 − 1) + 2·(p0/p6 − 1) + (p0/p12 − 1)`
- **Lookback semantics:** `p0 = trading-day-on-or-before asOf`; `p_N =
  trading-day-on-or-before (asOf − N months)`. Falls back to most recent trading
  day when a target lands on a weekend or NYSE holiday. (This was refactored
  from a month-end definition; don't re-introduce month-end logic.)

Reference: Keller & Keuning, *Breadth Momentum and Vigilant Asset Allocation*, 2017.

## Build and run

### Backend

```bash
cd backend
dotnet restore
dotnet build
dotnet test                        # 9 unit tests across calculator, lookup, and service
dotnet run --project src/MomentumInvestment.Api
```

API listens on **port 5050** (NOT 5000 — macOS AirPlay Receiver squats on 5000).
Bound to `0.0.0.0:5050` so phones on the LAN can reach it.

Smoke-test:

```bash
curl 'http://localhost:5050/api/vaa-g4b3/decision?asOf=YYYY-MM-DD' | jq .
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

## Stack

- **Backend:** ASP.NET Core 10 (LTS); `.NET 10` SDK required.
- **Mobile:** Expo SDK 54, React Native 0.81 — pinned because the dev iPhone's
  Expo Go is SDK 54.
- **Data:** Yahoo Finance unofficial v8 chart endpoint
  (`query1.finance.yahoo.com/v8/finance/chart/{ticker}?range=2y&interval=1d`).
  Requires a `User-Agent` header.
- **Cache:** `IMemoryCache`, keyed per-ticker (`daily:{ticker}`), 6h TTL.
  Daily data is asOf-independent, so asOf is not part of the cache key.

## Architecture conventions — do not violate without discussion

### No `IAllocationStrategy` interface yet

`VaaG4B3Service` is a concrete class. Premature abstraction was discussed and
explicitly rejected. Extract the interface only when a **second concrete
implementation** is being added (DAA is the planned trigger). At that point the
right shape will be clear from two real call sites; speculating now will produce
a misshapen interface that has to be reworked.

### No DB

`IMemoryCache` only. Move to SQLite or Azure SQL only when persistence is
actually needed (e.g. history view, cross-device sync). Don't add it
proactively.

### No React Navigation

`useState`-based screen routing in `mobile/App.tsx`. State
(`selectedStrategyId`, `asOfDate`) is **lifted to `App.tsx`** so navigating
Home → Decision → Back keeps the prior selection. `HomeScreen` is fully
controlled (no internal selection state).

If you find yourself wanting deep links, modal stacks, or back-button
hardware support, that is the trigger to evaluate React Navigation — not before.

### Mobile strategy registry

Mobile lists six strategies in `mobile/src/strategies.ts`. Only VAA has
`implemented: true`. Tapping Confirm:

- Implemented strategy → `DecisionScreen` (calls backend)
- Unimplemented → `NotImplementedScreen` (placeholder)

When wiring a new backend strategy through, flip its `implemented` flag and
ensure the API client routes the new path.

### JSON contract

`Program.cs` registers `JsonStringEnumConverter` so the response `mode` field
is `"Offensive"` / `"Defensive"` (string), not an int. The mobile client
depends on the string form. Don't remove this converter.

## Verified end-to-end

- Algorithm verified independently in Python (`scripts/verify_13612w.py`).
- C# unit tests mirror the Python reference values
  (`backend/tests/MomentumInvestment.Api.Tests/`).
- Live Yahoo Finance integration confirmed via iOS Simulator and iPhone (Expo Go).
- Date-aware lookback verified against hand-calculated NYSE Good Friday + weekend
  cases (e.g. asOf = 2026-05-04 → p1 = 2026-04-02, p12 = 2025-05-02).

## Gotchas (non-obvious things that have already burned us)

- **Port 5050, not 5000** — macOS Monterey+ AirPlay Receiver listens on 5000 by default.
- **`backend/src/MomentumInvestment.Api/Vaa/MonthEndClose.cs` is a placeholder.**
  Contains only a comment; the type was replaced by `DailyClose`. The dev
  sandbox at the time couldn't delete files. Safe to delete from any IDE.
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

## Roadmap (probable next directions)

- **DAA implementation** → triggers the `IAllocationStrategy` extraction.
- **UK ETF support** (LSE-listed equivalents) — Yahoo's LSE coverage is patchy
  and may require a different data vendor.
- **Azure deployment** — user has monthly free credits.
- **Last-selection persistence** across app launches (AsyncStorage) —
  explicitly deferred during Phase 1.
- **History view** of past decisions — would require persistence.
