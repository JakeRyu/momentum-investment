/**
 * Resolves a (region, overrides) selection into the concrete ticker lists
 * that get sent to the backend. Frontend-only concern — the backend now
 * receives explicit ticker arrays and is region-agnostic.
 */
import type { Region } from './api/vaaClient';
import {
  ASSET_CLASSES,
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
