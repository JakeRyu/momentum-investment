/**
 * Resolves a (region, overrides) selection into the concrete ticker lists
 * that get sent to the backend. Frontend-only concern — the backend
 * receives explicit ticker arrays and is region-agnostic.
 *
 * One resolver per strategy, sharing the same `pickTicker` building block
 * so US default / UK curated default / per-asset-class override semantics
 * stay consistent across strategies.
 */
import type { Region } from './api/vaaClient';
import {
  ASSET_CLASSES,
  DAA_G12_CANARY,
  DAA_G12_CASH,
  DAA_G12_RISKY,
  LAA_CASH,
  LAA_PERMANENT,
  LAA_RISKY,
  PAA_CASH,
  PAA_RISKY,
  VAA_DEFENSIVE,
  VAA_OFFENSIVE,
  type AssetClassCode,
} from './etfCatalog';
import type { Overrides } from './storage';

export type ResolvedAsset = {
  code: AssetClassCode;
  ticker: string;
};

export type ResolvedUniverse = {
  offensive: ResolvedAsset[];
  defensive: ResolvedAsset[];
};

export type ResolvedDaaG12Universe = {
  canary: ResolvedAsset[];
  risky: ResolvedAsset[];
  cash: ResolvedAsset[];
};

export type ResolvedPaaUniverse = {
  risky: ResolvedAsset[];
  cash: ResolvedAsset[];
};

/**
 * LAA's resolved universe is intentionally asymmetric to the breadth-
 * momentum strategies: only three permanent assets, one rotating risky,
 * one rotating cash, plus two region-agnostic signal identifiers
 * (signal equity and FRED unemployment series). The signal config is
 * carried through alongside the asset selection so the API call has
 * everything it needs in one struct.
 */
export type ResolvedLaaUniverse = {
  permanent: ResolvedAsset[];
  risky: ResolvedAsset;
  cash: ResolvedAsset;
  signalEquity: string;          // SPY — region-agnostic GT trend signal
  unemploymentSeriesId: string;  // UNRATE — FRED series id
};

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

// ---------------------------------------------------------------------------
// VAA-G4/B3

export function resolveUniverse(region: Region, overrides: Overrides): ResolvedUniverse {
  return {
    offensive: VAA_OFFENSIVE.map((code) => ({ code, ticker: pickTicker(code, region, overrides) })),
    defensive: VAA_DEFENSIVE.map((code) => ({ code, ticker: pickTicker(code, region, overrides) })),
  };
}

export function tickerArrays(u: ResolvedUniverse): {
  offensive: string[];
  defensive: string[];
} {
  return {
    offensive: u.offensive.map((x) => x.ticker),
    defensive: u.defensive.map((x) => x.ticker),
  };
}

// ---------------------------------------------------------------------------
// DAA-G12

export function resolveDaaG12Universe(
  region: Region,
  overrides: Overrides,
): ResolvedDaaG12Universe {
  return {
    canary: DAA_G12_CANARY.map((code) => ({ code, ticker: pickTicker(code, region, overrides) })),
    risky: DAA_G12_RISKY.map((code) => ({ code, ticker: pickTicker(code, region, overrides) })),
    cash: DAA_G12_CASH.map((code) => ({ code, ticker: pickTicker(code, region, overrides) })),
  };
}

export function daaG12TickerArrays(u: ResolvedDaaG12Universe): {
  canary: string[];
  risky: string[];
  cash: string[];
} {
  return {
    canary: u.canary.map((x) => x.ticker),
    risky: u.risky.map((x) => x.ticker),
    cash: u.cash.map((x) => x.ticker),
  };
}

// ---------------------------------------------------------------------------
// PAA-G12

export function resolvePaaUniverse(
  region: Region,
  overrides: Overrides,
): ResolvedPaaUniverse {
  return {
    risky: PAA_RISKY.map((code) => ({ code, ticker: pickTicker(code, region, overrides) })),
    cash: PAA_CASH.map((code) => ({ code, ticker: pickTicker(code, region, overrides) })),
  };
}

export function paaTickerArrays(u: ResolvedPaaUniverse): {
  risky: string[];
  cash: string[];
} {
  return {
    risky: u.risky.map((x) => x.ticker),
    cash: u.cash.map((x) => x.ticker),
  };
}

// ---------------------------------------------------------------------------
// LAA

/**
 * Resolves LAA's asset universe for the given region/overrides. The
 * signal equity and FRED unemployment series are *not* affected by region
 * — Keller's GT timing rule is anchored to US macro data, and the user
 * decision was that UK users get the same signal applied to UK UCITS
 * substitutes for the actual portfolio assets.
 */
export function resolveLaaUniverse(
  region: Region,
  overrides: Overrides,
): ResolvedLaaUniverse {
  return {
    permanent: LAA_PERMANENT.map((code) => ({ code, ticker: pickTicker(code, region, overrides) })),
    risky: { code: LAA_RISKY, ticker: pickTicker(LAA_RISKY, region, overrides) },
    cash:  { code: LAA_CASH,  ticker: pickTicker(LAA_CASH,  region, overrides) },
    signalEquity: 'SPY',
    unemploymentSeriesId: 'UNRATE',
  };
}

export function laaTickerArrays(u: ResolvedLaaUniverse): {
  permanent: string[];
  risky: string;
  cash: string;
  signalEquity: string;
  unemploymentSeriesId: string;
} {
  return {
    permanent: u.permanent.map((x) => x.ticker),
    risky: u.risky.ticker,
    cash:  u.cash.ticker,
    signalEquity: u.signalEquity,
    unemploymentSeriesId: u.unemploymentSeriesId,
  };
}
