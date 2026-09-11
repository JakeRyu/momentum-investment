/**
 * User-facing one-liners for the tickers shown on the decision screen.
 *
 * US entries are copied verbatim from `web/src/etfDescriptions.ts` so both
 * surfaces describe the same ticker the same way. UK UCITS tickers are not
 * listed here — they resolve through the ETF catalog, which already carries
 * a product name per alternative.
 *
 * The catalog's own `description` field is deliberately not used: it is
 * written for maintainers ("VAA EEM-style", "DAA canary (BND)") rather than
 * for someone deciding what to buy.
 */
import { ASSET_CLASSES } from './etfCatalog';

const DESCRIPTIONS: Record<string, string> = {
  // Equities — US
  SPY: 'S&P 500 — US large-cap equities',
  IWM: 'Russell 2000 — US small-cap equities',
  QQQ: 'Nasdaq 100 — US tech-heavy large caps',
  IWD: 'Russell 1000 Value — US large-cap value',

  // Equities — international
  EFA: 'MSCI EAFE — developed equities ex-US/Canada',
  VEA: 'Developed equities ex-US (Vanguard)',
  EEM: 'MSCI Emerging Markets — EM equities',
  VWO: 'Emerging-market equities (Vanguard)',
  VGK: 'Developed European equities',
  EWJ: 'Japanese equities',

  // Real assets
  VNQ: 'US real estate (REITs)',
  GSG: 'Broad commodities (S&P GSCI)',
  DBC: 'Diversified commodities (Deutsche Bank)',
  GLD: 'Physical gold',

  // Fixed income
  AGG: 'US aggregate investment-grade bonds',
  BND: 'Total US bond market (Vanguard)',
  LQD: 'Investment-grade US corporate bonds',
  HYG: 'US high-yield corporate bonds',
  TIP: 'US Treasury Inflation-Protected Securities',
  IEF: '7–10 year US Treasuries',
  TLT: '20+ year US Treasuries',
  SHY: '1–3 year US Treasuries',
  BIL: '1–3 month US Treasury bills',

  // Macro signals (LAA)
  UNRATE: 'US unemployment rate — FRED monthly series',
};

export function describeTicker(ticker: string): string | undefined {
  const upper = ticker.toUpperCase();
  const curated = DESCRIPTIONS[upper];
  if (curated) return curated;

  for (const definition of Object.values(ASSET_CLASSES)) {
    const option = definition.ukAlternatives.find(
      (o) => o.ticker.toUpperCase() === upper,
    );
    if (option) return option.name;
  }

  return undefined;
}
