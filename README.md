# Keller Momentum App

> Keller's published momentum strategies, runnable on your phone.

A personal mobile app to compute Wouter Keller's momentum signals and surface
monthly asset-allocation decisions.

![Home screen](/docs/screenshots/app.png)

## Strategies

| Strategy | Variant | Status | Paper |
| --- | --- | --- | --- |
| **VAA-G4/B3** | conservative | ✅ Implemented | Keller & Keuning (2017), *Breadth Momentum and Vigilant Asset Allocation* |
| **DAA-G12** | canonical | ✅ Implemented | Keller & Keuning (2018), *Breadth Momentum and the Canary Universe* |
| **PAA-G12** | a = 2 (vigilant) | ✅ Implemented | Keller & van Putten (2016), *Protective Asset Allocation* |
| **BAA / HAA / LAA** | — | ⏳ Picker placeholder | — |

The three implemented strategies share an `IAllocationStrategy<TUniverse>`
contract plus a single momentum scorer (`13612W` for VAA/DAA, `SMA12` for
PAA), so adding the remaining variants is a focused extension rather than a
rewrite.

## Stack

- **Backend** — ASP.NET Core 10 minimal API. Pure functions for the momentum
  maths, `IMemoryCache` over a Yahoo Finance client, no database.
- **Mobile** — Expo SDK 54 / React Native 0.81 with TypeScript. Home / ETF
  Config / Decision screens, AsyncStorage persistence for region (US/UK) and
  per-asset-class ticker overrides.
- **Data** — Yahoo Finance unofficial v8 chart endpoint. LSE-listed UCITS
  tickers (`.L` suffix) work via the same endpoint, so the UK universe runs
  without a separate vendor.
- **Verification** — independent Python references for both momentum signals
  (`scripts/verify_13612w.py`, `scripts/verify_paa.py`); 34 C# unit tests
  mirror their values.

## Region support

Each strategy ships with the original Keller US ticker universe plus a
curated set of UK-listed UCITS substitutes. The mobile app lets you switch
regions with one tap and override individual asset classes with custom Yahoo
tickers, validated server-side via `/api/etf/probe`. Overrides are scoped
per asset class — setting `IG_CORP → LQDA.L` once applies wherever LQD shows
up across strategies.

## Layout

```
backend/    ASP.NET Core 10 minimal API (decision engine + Yahoo client)
mobile/     Expo / React Native app
scripts/    Python reference implementations of 13612W and SMA12
CLAUDE.md   Internal architecture conventions and gotchas
```

`CLAUDE.md` is the deeper read for contributors — it documents each
strategy's formula, the lookback semantics, the asset-class sharing rules,
and the conventions the codebase deliberately follows (no DB, no React
Navigation, region-agnostic backend).

## Backend — running locally

Requires .NET 10 SDK.

```bash
cd backend
dotnet restore
dotnet build
dotnet test           # 34 tests across calculator, lookup, VAA, DAA, PAA
dotnet run --project src/MomentumInvestment.Api
```

API listens on `http://0.0.0.0:5050` (port 5000 collides with macOS AirPlay
Receiver, so the bind is explicit). Smoke-test:

```bash
curl 'http://localhost:5050/api/vaa-g4b3/decision?asOf=2026-05-04&offensive=SPY&offensive=EFA&offensive=EEM&offensive=AGG&defensive=LQD&defensive=IEF&defensive=SHY' | jq .
```

See `CLAUDE.md` for the DAA and PAA endpoint examples.

## Mobile — running locally

Requires Node 20+ and Expo CLI.

```bash
cd mobile
npm install
npx expo start
```

For a physical device, set `EXPO_PUBLIC_API_BASE_URL` in `mobile/.env` to
the dev machine's LAN IP. For the iOS simulator the default
`http://localhost:5050` works.

## Verification scripts

```bash
python3 scripts/verify_13612w.py   # VAA / DAA momentum signal
python3 scripts/verify_paa.py      # PAA momentum signal
```

These are the source of truth for the momentum maths — the C# tests are
checked against the values they print.

## Disclaimer

This project is a **personal implementation** of published academic
strategies. It is not investment advice, not a recommendation, and comes
with no warranty. Backtested returns from the source papers do not predict
future performance, the Yahoo Finance data this app relies on is unofficial
and unsupported, and momentum strategies can and do underperform for
extended periods. Do your own research before allocating capital.

## References

- Keller, W. & Keuning, J. (2017). *Breadth Momentum and Vigilant Asset Allocation (VAA): Winning More by Losing Less.* SSRN [2964091](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2964091).
- Keller, W. & Keuning, J. (2018). *Breadth Momentum and the Canary Universe: Defensive Asset Allocation (DAA).* SSRN [3212862](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3212862).
- Keller, W. & van Putten, J. W. (2016). *Protective Asset Allocation (PAA): A Simple Momentum-Based Alternative for Term Deposits.* SSRN [2759734](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2759734).

## License

See [`LICENSE`](LICENSE).
