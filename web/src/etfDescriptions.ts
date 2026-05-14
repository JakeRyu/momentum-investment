/**
 * Short one-line descriptions for the tickers shown on strategy pages.
 * Used by ScoreSection's click-to-expand row to give context without
 * altering the default layout.
 *
 * Keep descriptions tight (~6-10 words). Goal is to disambiguate the
 * ticker, not to be a full prospectus.
 */
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
}

export function describeTicker(ticker: string): string | undefined {
  return DESCRIPTIONS[ticker]
}
