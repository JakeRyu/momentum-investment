# Momentum Investment

A personal mobile app to compute Wouter Keller's momentum signals and surface
monthly asset-allocation decisions.

**Phase 1:** VAA-G4/B3 (conservative variant), US ETFs, Yahoo Finance data.

## Layout

```
backend/   ASP.NET Core 10 Web API — momentum + VAA decision engine
mobile/    Expo (React Native) app — single-screen decision view
```

## VAA-G4/B3 strategy

- **Offensive (G4):** SPY, EFA, EEM, AGG
- **Defensive (B3):** LQD, IEF, SHY
- **Rule:** If any G4 has negative 13612W momentum → defensive mode
  (pick top-1 of B3 by momentum). Otherwise → offensive mode (top-1 of G4).
- **13612W momentum:** `12·(p0/p1−1) + 4·(p0/p3−1) + 2·(p0/p6−1) + (p0/p12−1)`

Reference: Keller & Keuning, *Breadth Momentum and Vigilant Asset Allocation*, 2017.

## Backend — running locally

Requires .NET 10 SDK (LTS).

```bash
cd backend
dotnet restore
dotnet build
dotnet test
dotnet run --project src/MomentumInvestment.Api
```

API listens on `http://localhost:5050` by default. Try:

```bash
curl 'http://localhost:5050/api/vaa-g4b3/decision?asOf=2026-04-30'
```

## Mobile — running locally

Requires Node 20+ and Expo CLI.

```bash
cd mobile
npm install
npx expo start
```
