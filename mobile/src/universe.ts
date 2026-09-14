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
