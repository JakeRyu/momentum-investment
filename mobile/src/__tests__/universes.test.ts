import { readFileSync } from 'fs';
import { join } from 'path';

import {
  ASSET_CLASSES,
  codeForPaperTicker,
  type AssetClassCode,
} from '../etfCatalog';
import UNIVERSES from '../universes.generated.json';

/**
 * Metro bundles from the project root, so the app carries a copy of
 * shared/universes.json rather than reaching outside it. Tests run in
 * Node and can read across package boundaries, so the copy is checked
 * on every CI run and cannot drift silently.
 */
describe('the bundled universe fixture', () => {
  it('is identical to the shared fixture', () => {
    const shared = readFileSync(
      join(__dirname, '../../../shared/universes.json'),
      'utf8',
    );
    expect(JSON.parse(shared)).toEqual(UNIVERSES);
  });

  it('maps every ticker to an asset class the user can configure', () => {
    // The guard that matters going forward: if the server adds an asset
    // the catalog has no entry for, a UK holder silently loses the
    // ability to substitute it. Fail here instead.
    const byPaperTicker = new Set(
      Object.values(ASSET_CLASSES).map((d) => d.usDefault),
    );
    const unmapped: string[] = [];
    for (const [id, strategy] of Object.entries(UNIVERSES)) {
      for (const [bucket, tickers] of Object.entries(
        (strategy as { buckets: Record<string, string[]> }).buckets,
      )) {
        for (const ticker of tickers) {
          if (!byPaperTicker.has(ticker)) unmapped.push(`${id}.${bucket}: ${ticker}`);
        }
      }
    }
    expect(unmapped).toEqual([]);
  });

  it('gives each asset class a distinct paper ticker', () => {
    // usDefault is the join key between the catalog and the fixture, so
    // two classes sharing one would make the reverse lookup ambiguous.
    const seen = new Map<string, AssetClassCode>();
    const collisions: string[] = [];
    for (const def of Object.values(ASSET_CLASSES)) {
      const owner = seen.get(def.usDefault);
      if (owner) collisions.push(`${def.usDefault} on ${def.code} and ${owner}`);
      seen.set(def.usDefault, def.code);
    }
    expect(collisions).toEqual([]);
  });
});

describe('codeForPaperTicker', () => {
  it('maps a paper ticker back to its asset class', () => {
    expect(codeForPaperTicker('SPY')).toBe('US_LARGE_CAP');
    expect(codeForPaperTicker('VEA')).toBe('INTL_DEV_FTSE');
    expect(codeForPaperTicker('DBC')).toBe('COMMODITIES_BCOM');
  });

  it('throws on a ticker with no asset class', () => {
    // Better a crash in development than a config screen that silently
    // omits an asset the server is scoring.
    expect(() => codeForPaperTicker('NOPE')).toThrow(/NOPE/);
  });
});
