/**
 * Catalog of asset classes used by VAA-G4/B3, plus the curated US default
 * and UK UCITS alternatives for each. The first entry of `ukAlternatives`
 * is the default UK ticker; subsequent entries are user-selectable swaps.
 *
 * NOTE: UK tickers are starting points — verify with your broker / iShares
 * / Vanguard product pages before relying on them. In particular check:
 *   - Inception date (need 12+ months of history for 13612W momentum)
 *   - Currency (USD-denominated keeps maths consistent with US universe)
 *   - Acc vs Dist (Acc preferred so distributions don't distort price-only
 *     momentum)
 *   - PRIIPs/UCITS availability on your specific platform
 */

export type AssetClassCode =
  | 'US_LARGE_CAP'
  | 'INTL_DEV'
  | 'EM'
  | 'US_AGG'
  | 'IG_CORP'
  | 'TREASURY_7_10'
  | 'TREASURY_SHORT';

export type EtfOption = {
  ticker: string;
  name: string;
  ccy: 'USD' | 'GBP';
  dist: 'Acc' | 'Dist';
  note?: string;
};

export type AssetClassDefinition = {
  code: AssetClassCode;
  label: string;
  description: string;
  usDefault: string;
  ukAlternatives: EtfOption[]; // first entry is the curated default
};

/** VAA-G4/B3 strategy composition. */
export const VAA_OFFENSIVE: AssetClassCode[] = ['US_LARGE_CAP', 'INTL_DEV', 'EM', 'US_AGG'];
export const VAA_DEFENSIVE: AssetClassCode[] = ['IG_CORP', 'TREASURY_7_10', 'TREASURY_SHORT'];

export const ASSET_CLASSES: Record<AssetClassCode, AssetClassDefinition> = {
  US_LARGE_CAP: {
    code: 'US_LARGE_CAP',
    label: 'US Large Cap',
    description: 'S&P 500 / large-cap US equities',
    usDefault: 'SPY',
    ukAlternatives: [
      { ticker: 'VUAG.L', name: 'Vanguard S&P 500 UCITS', ccy: 'GBP', dist: 'Acc' },
      { ticker: 'CSPX.L', name: 'iShares Core S&P 500 UCITS', ccy: 'USD', dist: 'Acc' },
      { ticker: 'VUSA.L', name: 'Vanguard S&P 500 UCITS', ccy: 'GBP', dist: 'Dist' },
      { ticker: 'SPXP.L', name: 'Invesco S&P 500 UCITS', ccy: 'USD', dist: 'Acc' },
    ],
  },
  INTL_DEV: {
    code: 'INTL_DEV',
    label: 'Intl Developed',
    description: 'EAFE / developed markets ex-US',
    usDefault: 'EFA',
    ukAlternatives: [
      {
        ticker: 'EXUS.L',
        name: 'iShares MSCI World ex-USA UCITS',
        ccy: 'USD',
        dist: 'Acc',
        note: 'Closest to EAFE (includes Canada)',
      },
      {
        ticker: 'IWDA.L',
        name: 'iShares Core MSCI World UCITS',
        ccy: 'USD',
        dist: 'Acc',
        note: 'Includes US — not pure EAFE',
      },
      { ticker: 'IDEV.L', name: 'iShares Core MSCI EAFE IMI UCITS', ccy: 'USD', dist: 'Acc' },
      { ticker: 'VEVE.L', name: 'Vanguard FTSE Developed World UCITS', ccy: 'GBP', dist: 'Dist' },
      { ticker: 'SWLD.L', name: 'SPDR MSCI World UCITS', ccy: 'USD', dist: 'Acc', note: 'Includes US' },
    ],
  },
  EM: {
    code: 'EM',
    label: 'Emerging Markets',
    description: 'MSCI Emerging Markets',
    usDefault: 'EEM',
    ukAlternatives: [
      {
        ticker: 'EMIM.L',
        name: 'iShares Core MSCI EM IMI UCITS',
        ccy: 'USD',
        dist: 'Acc',
        note: 'Includes small-cap (IMI)',
      },
      { ticker: 'EIMI.L', name: 'iShares Core MSCI EM IMI UCITS', ccy: 'USD', dist: 'Acc' },
      { ticker: 'VFEM.L', name: 'Vanguard FTSE Emerging Markets UCITS', ccy: 'GBP', dist: 'Dist' },
      { ticker: 'HMEF.L', name: 'HSBC MSCI Emerging Markets UCITS', ccy: 'USD', dist: 'Dist' },
    ],
  },
  US_AGG: {
    code: 'US_AGG',
    label: 'US Aggregate Bond',
    description: 'Broad US investment-grade bonds',
    usDefault: 'AGG',
    ukAlternatives: [
      { ticker: 'IUAA.L', name: 'iShares $ Aggregate Bond UCITS', ccy: 'USD', dist: 'Acc' },
      {
        ticker: 'AGGU.L',
        name: 'iShares Core Global Agg Bond GBP-Hedged UCITS',
        ccy: 'GBP',
        dist: 'Acc',
        note: 'Global, not US-only',
      },
      { ticker: 'IGLT.L', name: 'iShares Core UK Gilts UCITS', ccy: 'GBP', dist: 'Dist', note: 'UK Gilts only' },
    ],
  },
  IG_CORP: {
    code: 'IG_CORP',
    label: 'IG Corporate Bond',
    description: 'USD investment-grade corporate bonds',
    usDefault: 'LQD',
    ukAlternatives: [
      { ticker: 'LQDA.L', name: 'iShares $ Corp Bond UCITS', ccy: 'USD', dist: 'Acc' },
      { ticker: 'LQDH.L', name: 'iShares $ Corp Bond GBP-Hedged UCITS', ccy: 'GBP', dist: 'Acc' },
      { ticker: 'CRPS.L', name: 'Invesco $ Corp Bond UCITS', ccy: 'USD', dist: 'Acc' },
    ],
  },
  TREASURY_7_10: {
    code: 'TREASURY_7_10',
    label: '7-10y Treasury',
    description: 'US Treasuries, 7-10 year maturity',
    usDefault: 'IEF',
    ukAlternatives: [
      { ticker: 'IDTM.L', name: 'iShares $ Treasury 7-10y UCITS', ccy: 'USD', dist: 'Acc' },
      { ticker: 'IBTM.L', name: 'iShares $ Treasury 7-10y UCITS', ccy: 'USD', dist: 'Dist' },
    ],
  },
  TREASURY_SHORT: {
    code: 'TREASURY_SHORT',
    label: 'Short Treasury',
    description: 'US Treasuries, short maturity (cash proxy)',
    usDefault: 'SHY',
    ukAlternatives: [
      { ticker: 'IBTS.L', name: 'iShares $ Treasury 1-3y UCITS', ccy: 'USD', dist: 'Dist' },
      { ticker: 'IDTS.L', name: 'iShares $ Treasury 1-3y UCITS', ccy: 'USD', dist: 'Acc' },
      { ticker: 'IB01.L', name: 'iShares $ Treasury 0-1y UCITS', ccy: 'USD', dist: 'Acc' },
    ],
  },
};

export function getDefaultUkTicker(code: AssetClassCode): string {
  return ASSET_CLASSES[code].ukAlternatives[0].ticker;
}

export function findEtfOption(code: AssetClassCode, ticker: string): EtfOption | undefined {
  return ASSET_CLASSES[code].ukAlternatives.find((o) => o.ticker === ticker);
}

/**
 * Whether `ticker` already appears in the curated UK alternatives for
 * `code`. Used to dedupe when the user tries to add a custom ticker
 * that's actually a curated default.
 */
export function isTickerInCurated(code: AssetClassCode, ticker: string): boolean {
  return ASSET_CLASSES[code].ukAlternatives.some(
    (o) => o.ticker.toUpperCase() === ticker.toUpperCase(),
  );
}
