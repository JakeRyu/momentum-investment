/**
 * Catalog of asset classes used by VAA-G4/B3 and DAA-G12, plus the curated US
 * default and UK UCITS alternatives for each. The first entry of
 * `ukAlternatives` is the default UK ticker; subsequent entries are
 * user-selectable swaps.
 *
 * NOTE: UK tickers are starting points — verify with your broker / iShares
 * / Vanguard product pages before relying on them. In particular check:
 *   - Inception date (need 12+ months of history for 13612W momentum)
 *   - Currency (USD-denominated keeps maths consistent with US universe)
 *   - Acc vs Dist (Acc preferred so distributions don't distort price-only
 *     momentum)
 *   - PRIIPs/UCITS availability on your specific platform
 *
 * Asset classes are strategy-agnostic building blocks. A strategy
 * composition (e.g. `VAA_OFFENSIVE`, `DAA_G12_CANARY`) is just an ordered
 * list of `AssetClassCode`s. When two strategies share an asset class
 * (e.g. VAA defensive's IG_CORP and DAA cash's IG_CORP both = LQD), a UK
 * override on that class applies to both — that's intentional, since a
 * user's "LQD → LQDA.L" preference is structural, not strategy-specific.
 *
 * Tickers that *only* appear in one strategy (VWO and BND, used as DAA's
 * canary) get their own dedicated asset classes (`EM_FTSE`, `US_AGG_TOTAL`)
 * so VAA's distinct EM/US-AGG mapping isn't perturbed.
 */

export type AssetClassCode =
  // Shared / VAA-original
  | 'US_LARGE_CAP'
  | 'INTL_DEV'
  | 'EM'
  | 'US_AGG'
  | 'IG_CORP'
  | 'TREASURY_7_10'
  | 'TREASURY_SHORT'
  // DAA-canary specific (FTSE-tracking VWO, BND aggregate — distinct from
  // VAA's MSCI EM (EEM) and AGG)
  | 'EM_FTSE'
  | 'US_AGG_TOTAL'
  // DAA-risky additions
  | 'US_SMALL_CAP'
  | 'US_NASDAQ'
  | 'EU_DEV'
  | 'JAPAN'
  | 'US_REIT'
  | 'COMMODITIES'
  | 'GOLD'
  | 'TREASURY_LONG'
  | 'HIGH_YIELD'
  // LAA-permanent specific (Russell 1000 Value — distinct from VAA's
  // S&P 500 US_LARGE_CAP)
  | 'US_LARGE_VALUE'
  // HAA-specific additions. Each is split off from a similar-sounding
  // existing class because Keller's HAA uses a different underlying
  // index (FTSE vs MSCI, Bloomberg Commodity vs S&P GSCI) or a different
  // duration bucket (1-3 month T-bills vs 1-3 year). Sharing the
  // existing classes would mean a UK override on VAA's EFA/PAA's GSG
  // accidentally applying to HAA's VEA/DBC, which isn't what the user
  // would expect.
  | 'INTL_DEV_FTSE'    // VEA  (FTSE Developed ex-NA)
  | 'COMMODITIES_BCOM' // DBC  (Bloomberg Commodity index)
  | 'TIPS'             // TIP  (inflation-protected treasuries — HAA canary)
  | 'T_BILL';          // BIL  (1-3 month T-bills — HAA defensive cash)

export type EtfOption = {
  ticker: string;
  name: string;
  ccy: 'USD' | 'GBP' | 'EUR';
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

/**
 * DAA-G12 strategy composition (Keller & Keuning, 2018).
 *
 * Same building-block contract as VAA: each entry is an `AssetClassCode`,
 * the resolver picks the actual ticker via `ASSET_CLASSES[code].usDefault`
 * (US) or the user's override / curated UK default (UK).
 *
 * Note that `EM_FTSE` (VWO) appears in both canary and risky — the
 * shared asset class means a UK user's VWO override (e.g. → VFEM.L)
 * applies in both slots, which matches Keller's original intent of
 * scoring the same EM exposure twice. Likewise `IG_CORP` (LQD) appears
 * in both risky and cash.
 */
export const DAA_G12_CANARY: AssetClassCode[] = ['EM_FTSE', 'US_AGG_TOTAL'];
export const DAA_G12_RISKY: AssetClassCode[] = [
  'US_LARGE_CAP', 'US_SMALL_CAP', 'US_NASDAQ',
  'EU_DEV', 'JAPAN', 'EM_FTSE',
  'US_REIT', 'COMMODITIES', 'GOLD',
  'TREASURY_LONG', 'HIGH_YIELD', 'IG_CORP',
];
export const DAA_G12_CASH: AssetClassCode[] = ['TREASURY_SHORT', 'TREASURY_7_10', 'IG_CORP'];

/**
 * PAA-G12 strategy composition (Keller & van Putten, 2016) — the PAA2
 * variant (a = 2, T = 6).
 *
 * Reuses asset classes already in the catalog (no new entries needed).
 * Note that PAA's EM exposure is `EM` (MSCI EEM, shared with VAA), not
 * `EM_FTSE` (VWO, DAA-only) — Keller's PAA paper uses EEM, so the UK
 * override on `EM` (e.g. EMIM.L) applies symmetrically to VAA and PAA
 * but not to DAA's canary/risky.
 */
export const PAA_RISKY: AssetClassCode[] = [
  'US_LARGE_CAP',  // SPY
  'US_SMALL_CAP',  // IWM
  'US_NASDAQ',     // QQQ
  'EU_DEV',        // VGK
  'JAPAN',         // EWJ
  'EM',            // EEM
  'US_REIT',       // VNQ
  'COMMODITIES',   // GSG
  'GOLD',          // GLD
  'HIGH_YIELD',    // HYG
  'IG_CORP',       // LQD
  'TREASURY_LONG', // TLT
];
export const PAA_CASH: AssetClassCode[] = [
  'TREASURY_7_10',  // IEF (Keller's canonical single cash asset)
  'TREASURY_SHORT', // SHY
  'IG_CORP',        // LQD
];

/**
 * LAA-G strategy composition (Keller, 2019) — Lethargic Asset Allocation.
 *
 * Structurally different from breadth-momentum: 75% of the portfolio is a
 * fixed permanent sleeve, 25% rotates between a risky and cash asset based
 * on Growth-Trend (GT) timing (SPY 200d SMA + UNRATE 12mo SMA).
 *
 * Region note: the rotating asset and permanent sleeve are remapped to UK
 * UCITS substitutes via the shared per-asset-class override mechanism.
 * The signal equity (SPY) and macro series (UNRATE) stay US-anchored —
 * GT timing is a US business-cycle indicator, so the signal is the same
 * regardless of which assets the UK user actually holds.
 */
export const LAA_PERMANENT: AssetClassCode[] = [
  'US_LARGE_VALUE', // IWD (Russell 1000 Value)
  'GOLD',           // GLD
  'TREASURY_7_10',  // IEF
];
export const LAA_RISKY: AssetClassCode = 'US_NASDAQ';     // QQQ
export const LAA_CASH: AssetClassCode = 'TREASURY_SHORT'; // SHY

/**
 * HAA strategy composition (Keller & Keuning, 2023).
 *
 * 8 risky assets across 4 categories (US/foreign equities, real assets,
 * treasuries), one canary (TIP — TIPS-class), one cash (BIL — short
 * T-bills). Top T=4 risky by 13612W are held when canary is bullish;
 * else 100% in cash.
 *
 * Note: HAA's foreign-equity sleeve (VEA, VWO) uses FTSE indices, so
 * `INTL_DEV_FTSE` (VEA) and `EM_FTSE` (VWO) are reused — same FTSE EM
 * exposure as DAA's canary, but the developed-ex-NA slot is HAA-specific.
 * The commodity sleeve uses DBC (Bloomberg Commodity), a different index
 * from PAA/DAA's GSG (S&P GSCI), hence its own asset class.
 */
export const HAA_RISKY: AssetClassCode[] = [
  'US_LARGE_CAP',      // SPY
  'US_SMALL_CAP',      // IWM
  'INTL_DEV_FTSE',     // VEA
  'EM_FTSE',           // VWO
  'US_REIT',           // VNQ
  'COMMODITIES_BCOM',  // DBC
  'TREASURY_7_10',     // IEF
  'TREASURY_LONG',     // TLT
];
export const HAA_CANARY: AssetClassCode = 'TIPS';   // TIP
export const HAA_CASH:   AssetClassCode = 'T_BILL'; // BIL

/**
 * BAA-G12 strategy composition (Keller, 2022).
 *
 * Reuses asset classes already in the catalog — no new entries needed.
 * Note that BAA's EM exposure is `EM` (MSCI EEM, shared with VAA/PAA),
 * NOT `EM_FTSE` (VWO, used by DAA's canary). A UK override on `EM`
 * applies symmetrically to VAA/PAA/BAA but not to DAA's canary.
 *
 * Canary set (TIP/IEF/BIL) is the unanimous-AND gate — a single
 * non-positive 13612W flips the strategy fully defensive. Cash uses
 * SMA12 (PAA-style) for ranking, distinct from canary/risky which use
 * 13612W; this dual-signal design is in Keller's paper.
 */
export const BAA_CANARY: AssetClassCode[] = [
  'TIPS',           // TIP
  'TREASURY_7_10',  // IEF
  'T_BILL',         // BIL
];
export const BAA_RISKY: AssetClassCode[] = [
  'US_LARGE_CAP',   // SPY
  'US_SMALL_CAP',   // IWM
  'US_NASDAQ',      // QQQ
  'EU_DEV',         // VGK
  'JAPAN',          // EWJ
  'EM',             // EEM
  'US_REIT',        // VNQ
  'COMMODITIES',    // GSG
  'GOLD',           // GLD
  'TREASURY_LONG',  // TLT
  'HIGH_YIELD',     // HYG
  'IG_CORP',        // LQD
];
export const BAA_CASH: AssetClassCode[] = [
  'T_BILL',         // BIL
  'TREASURY_7_10',  // IEF
  'TREASURY_LONG',  // TLT
  'US_AGG_TOTAL',   // BND
  'IG_CORP',        // LQD
];

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
    label: 'Emerging Markets (MSCI)',
    description: 'MSCI Emerging Markets — VAA EEM-style',
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
      { ticker: 'HMEF.L', name: 'HSBC MSCI Emerging Markets UCITS', ccy: 'USD', dist: 'Dist' },
    ],
  },
  US_AGG: {
    code: 'US_AGG',
    label: 'US Aggregate Bond',
    description: 'Broad US investment-grade bonds — VAA AGG-style',
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
  // ---------------------------------------------------------------------
  // DAA-canary specific
  EM_FTSE: {
    code: 'EM_FTSE',
    label: 'Emerging Markets (FTSE)',
    description: 'EM equities for DAA canary/risky — VWO/FTSE in US, MSCI EM IMI in UK',
    usDefault: 'VWO',
    ukAlternatives: [
      {
        ticker: 'EMIM.L',
        name: 'iShares Core MSCI EM IMI UCITS',
        ccy: 'USD',
        dist: 'Acc',
        note: 'MSCI EM IMI — includes Korea (FTSE classifies Korea as Developed); affects DAA canary',
      },
      {
        ticker: 'VFEM.L',
        name: 'Vanguard FTSE Emerging Markets UCITS',
        ccy: 'GBP',
        dist: 'Dist',
        note: 'Same FTSE EM index as VWO; closest match to Keller original',
      },
    ],
  },
  US_AGG_TOTAL: {
    code: 'US_AGG_TOTAL',
    label: 'US Agg Bond (Total)',
    description: 'Total US investment-grade bonds — DAA canary (BND)',
    usDefault: 'BND',
    ukAlternatives: [
      {
        ticker: 'IUAA.L',
        name: 'iShares $ Aggregate Bond UCITS',
        ccy: 'USD',
        dist: 'Acc',
        note: 'US-only IG bonds — closest BND proxy',
      },
      {
        ticker: 'AGGU.L',
        name: 'iShares Core Global Agg Bond GBP-Hedged UCITS',
        ccy: 'GBP',
        dist: 'Acc',
        note: 'Global, not US-only',
      },
    ],
  },
  // ---------------------------------------------------------------------
  // DAA-risky additions
  US_SMALL_CAP: {
    code: 'US_SMALL_CAP',
    label: 'US Small Cap',
    description: 'Russell 2000 / US small-cap equities (IWM)',
    usDefault: 'IWM',
    ukAlternatives: [
      {
        ticker: 'R2SC.L',
        name: 'Invesco Russell 2000 UCITS',
        ccy: 'USD',
        dist: 'Acc',
        note: 'Same Russell 2000 index as IWM',
      },
      { ticker: 'XRSU.L', name: 'Xtrackers Russell 2000 UCITS', ccy: 'USD', dist: 'Acc' },
    ],
  },
  US_NASDAQ: {
    code: 'US_NASDAQ',
    label: 'US Nasdaq 100',
    description: 'Nasdaq 100 / US tech-heavy equities (QQQ)',
    usDefault: 'QQQ',
    ukAlternatives: [
      {
        ticker: 'EQQQ.L',
        name: 'Invesco EQQQ Nasdaq 100 UCITS',
        ccy: 'USD',
        dist: 'Dist',
        note: 'Most-traded Nasdaq 100 UCITS in UK',
      },
      { ticker: 'CNDX.L', name: 'iShares Nasdaq 100 UCITS', ccy: 'USD', dist: 'Acc' },
      { ticker: 'EQAC.L', name: 'Invesco EQQQ Nasdaq 100 UCITS', ccy: 'USD', dist: 'Acc' },
    ],
  },
  EU_DEV: {
    code: 'EU_DEV',
    label: 'Europe Developed',
    description: 'MSCI Europe / FTSE Developed Europe (VGK)',
    usDefault: 'VGK',
    ukAlternatives: [
      { ticker: 'IMEU.L', name: 'iShares Core MSCI Europe UCITS', ccy: 'EUR', dist: 'Acc' },
      { ticker: 'VEUR.L', name: 'Vanguard FTSE Developed Europe UCITS', ccy: 'GBP', dist: 'Dist' },
    ],
  },
  JAPAN: {
    code: 'JAPAN',
    label: 'Japan',
    description: 'MSCI Japan / FTSE Japan equities (EWJ)',
    usDefault: 'EWJ',
    ukAlternatives: [
      {
        ticker: 'SJPA.L',
        name: 'iShares Core MSCI Japan IMI UCITS',
        ccy: 'GBP',
        dist: 'Acc',
        note: 'GBp-listed Acc share class; IMI includes small-caps',
      },
      {
        ticker: 'CSJP.L',
        name: 'iShares Core MSCI Japan IMI UCITS',
        ccy: 'USD',
        dist: 'Acc',
        note: 'Same fund as SJPA.L, USD listing',
      },
      { ticker: 'IJPN.L', name: 'iShares MSCI Japan UCITS', ccy: 'USD', dist: 'Dist' },
      { ticker: 'VJPN.L', name: 'Vanguard FTSE Japan UCITS', ccy: 'GBP', dist: 'Dist' },
    ],
  },
  US_REIT: {
    code: 'US_REIT',
    label: 'US REIT',
    description: 'US real estate investment trusts (VNQ)',
    usDefault: 'VNQ',
    ukAlternatives: [
      {
        ticker: 'IUSP.L',
        name: 'iShares US Property Yield UCITS',
        ccy: 'USD',
        dist: 'Dist',
        note: 'Closest UK proxy — verify with broker',
      },
    ],
  },
  COMMODITIES: {
    code: 'COMMODITIES',
    label: 'Commodities (Broad)',
    description: 'Broad-basket commodities (GSG = S&P GSCI)',
    usDefault: 'GSG',
    ukAlternatives: [
      {
        ticker: 'CMFP.L',
        name: 'L&G Longer Dated All Commodities UCITS',
        ccy: 'GBP',
        dist: 'Acc',
        note: 'Bloomberg Commodity index, longer-dated futures roll — reduces contango drag vs front-month',
      },
      {
        ticker: 'CMOD.L',
        name: 'L&G All Commodities UCITS',
        ccy: 'USD',
        dist: 'Acc',
        note: 'Bloomberg Commodity index — not GSCI; closest broad-commodity UCITS',
      },
      {
        ticker: 'CMCP.L',
        name: 'WisdomTree Enhanced Commodity UCITS',
        ccy: 'USD',
        dist: 'Acc',
        note: 'Bloomberg Commodity, enhanced roll',
      },
    ],
  },
  GOLD: {
    code: 'GOLD',
    label: 'Gold',
    description: 'Physical gold (GLD)',
    usDefault: 'GLD',
    ukAlternatives: [
      { ticker: 'SGLN.L', name: 'iShares Physical Gold ETC', ccy: 'USD', dist: 'Acc' },
      { ticker: 'PHGP.L', name: 'WisdomTree Physical Gold GBP-Hedged', ccy: 'GBP', dist: 'Acc' },
      { ticker: 'IGLN.L', name: 'iShares Physical Gold ETC', ccy: 'USD', dist: 'Acc' },
    ],
  },
  TREASURY_LONG: {
    code: 'TREASURY_LONG',
    label: '20+y Treasury',
    description: 'US Treasuries, 20+ year maturity (TLT)',
    usDefault: 'TLT',
    ukAlternatives: [
      { ticker: 'IDTL.L', name: 'iShares $ Treasury 20+y UCITS', ccy: 'USD', dist: 'Dist' },
      { ticker: 'DTLA.L', name: 'iShares $ Treasury 20+y UCITS', ccy: 'USD', dist: 'Acc' },
    ],
  },
  HIGH_YIELD: {
    code: 'HIGH_YIELD',
    label: 'High Yield Corp',
    description: 'USD high-yield corporate bonds (HYG)',
    usDefault: 'HYG',
    ukAlternatives: [
      { ticker: 'IHYU.L', name: 'iShares $ High Yield Corp Bond UCITS', ccy: 'USD', dist: 'Dist' },
      { ticker: 'SHYU.L', name: 'SPDR Bloomberg USD HY Bond UCITS', ccy: 'USD', dist: 'Acc' },
    ],
  },
  // ---------------------------------------------------------------------
  // LAA-permanent specific
  US_LARGE_VALUE: {
    code: 'US_LARGE_VALUE',
    label: 'US Large Cap Value',
    description: 'Russell 1000 Value (large-cap value tilt) — LAA permanent (IWD)',
    usDefault: 'IWD',
    ukAlternatives: [
      {
        ticker: 'IUSV.L',
        name: 'iShares S&P 500 Value UCITS',
        ccy: 'USD',
        dist: 'Acc',
        note: 'S&P 500 Value, not Russell 1000 Value — closest UCITS proxy',
      },
      {
        ticker: 'IWVL.L',
        name: 'iShares Edge MSCI World Value Factor UCITS',
        ccy: 'USD',
        dist: 'Acc',
        note: 'Global value, not US-only',
      },
    ],
  },
  // ---------------------------------------------------------------------
  // HAA-specific additions
  INTL_DEV_FTSE: {
    code: 'INTL_DEV_FTSE',
    label: 'Intl Developed (FTSE)',
    description: 'FTSE Developed Markets ex-North America — HAA (VEA)',
    usDefault: 'VEA',
    ukAlternatives: [
      {
        ticker: 'VEUR.L',
        name: 'Vanguard FTSE Developed Europe UCITS',
        ccy: 'GBP',
        dist: 'Dist',
        note: 'Europe only — no direct VEA UCITS equivalent (verify with broker)',
      },
      {
        ticker: 'VEVE.L',
        name: 'Vanguard FTSE Developed World UCITS',
        ccy: 'GBP',
        dist: 'Dist',
        note: 'Includes US — not pure developed-ex-NA',
      },
      {
        ticker: 'IWDA.L',
        name: 'iShares Core MSCI World UCITS',
        ccy: 'USD',
        dist: 'Acc',
        note: 'MSCI World incl. US — closest broad-developed proxy',
      },
    ],
  },
  COMMODITIES_BCOM: {
    code: 'COMMODITIES_BCOM',
    label: 'Commodities (BCOM)',
    description: 'Bloomberg Commodity index — HAA (DBC)',
    usDefault: 'DBC',
    ukAlternatives: [
      {
        ticker: 'CMOD.L',
        name: 'L&G All Commodities UCITS',
        ccy: 'USD',
        dist: 'Acc',
        note: 'Bloomberg Commodity index — closest DBC analogue',
      },
      {
        ticker: 'CMFP.L',
        name: 'L&G Longer Dated All Commodities UCITS',
        ccy: 'GBP',
        dist: 'Acc',
        note: 'BCOM with longer-dated futures roll (lower contango drag)',
      },
      {
        ticker: 'CMCP.L',
        name: 'WisdomTree Enhanced Commodity UCITS',
        ccy: 'USD',
        dist: 'Acc',
      },
    ],
  },
  TIPS: {
    code: 'TIPS',
    label: 'TIPS (Inflation-Protected)',
    description: 'US TIPS — HAA canary (TIP). Signals rising-yield regime',
    usDefault: 'TIP',
    ukAlternatives: [
      {
        ticker: 'ITPS.L',
        name: 'iShares $ TIPS UCITS',
        ccy: 'USD',
        dist: 'Dist',
        note: 'USD-denominated — matches TIP best',
      },
      {
        ticker: 'TI5G.L',
        name: 'iShares $ TIPS 0-5 UCITS',
        ccy: 'USD',
        dist: 'Acc',
        note: 'Short-dated TIPS — different duration profile',
      },
    ],
  },
  T_BILL: {
    code: 'T_BILL',
    label: 'T-Bills (1-3 mo)',
    description: 'Ultra-short US T-bills — HAA defensive cash (BIL)',
    usDefault: 'BIL',
    ukAlternatives: [
      {
        ticker: 'IB01.L',
        name: 'iShares $ Treasury 0-1y UCITS',
        ccy: 'USD',
        dist: 'Acc',
        note: 'Closest UCITS to BIL (ultra-short)',
      },
      {
        ticker: 'CSH2.L',
        name: 'Lyxor Smart Overnight Return UCITS',
        ccy: 'EUR',
        dist: 'Acc',
        note: 'EUR cash equivalent — verify currency match',
      },
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
