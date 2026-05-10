/**
 * Strategy catalog — the single source of truth for the web frontend.
 *
 * Standalone snapshot: ticker arrays are copied verbatim from
 * `mobile/src/etfCatalog.ts` (US `usDefault` per asset class). The web
 * app does not yet support region switching or per-class overrides, so
 * cross-package sharing would buy nothing today.
 */

export type StrategyId = 'vaa' | 'daa' | 'paa' | 'haa' | 'baa' | 'laa';

export type StrategyKind =
  | { kind: 'vaa'; offensive: string[]; defensive: string[] }
  | { kind: 'daa'; canary: string[]; risky: string[]; cash: string[] }
  | { kind: 'paa'; risky: string[]; cash: string[] }
  | { kind: 'haa'; risky: string[]; canary: string; cash: string }
  | { kind: 'baa'; canary: string[]; risky: string[]; cash: string[] }
  | {
      kind: 'laa';
      permanent: string[];
      risky: string;
      cash: string;
      signalEquity: string;
      unemploymentSeriesId: string;
    };

export type Strategy = {
  id: StrategyId;
  shortName: string;
  fullName: string;
  blurb: string;
  longDescription: string[];
  paperTitle: string;
  paperUrl: string;
  paperYear: number;
  defaultUniverse: StrategyKind;
};

export const STRATEGIES: readonly Strategy[] = [
  {
    id: 'vaa',
    shortName: 'VAA',
    fullName: 'Vigilant Asset Allocation',
    blurb: 'Aggressive dual-momentum with crash protection (Keller & Keuning, 2017).',
    longDescription: [
      'VAA splits its universe into four offensive assets (US large cap, international developed, emerging markets, US aggregate bonds) and three defensive assets (corporate bonds, intermediate Treasuries, short Treasuries). Each month it scores every asset using the 13612W momentum signal — a weighted blend of 1-, 3-, 6-, and 12-month returns.',
      'The strategy goes fully into the single best-scoring offensive asset whenever all four offensive assets show positive momentum. As soon as even one offensive asset prints a non-positive score, VAA rotates entirely into the best-scoring defensive asset. The aggressive concentration plus the strict "all-positive" gate gives VAA its characteristic profile: high upside in trending markets, fast retreat at the first sign of breadth deterioration.',
    ],
    paperTitle: 'Breadth Momentum and Vigilant Asset Allocation (VAA): Winning More by Losing Less',
    paperUrl: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2964091',
    paperYear: 2017,
    defaultUniverse: {
      kind: 'vaa',
      offensive: ['SPY', 'EFA', 'EEM', 'AGG'],
      defensive: ['LQD', 'IEF', 'SHY'],
    },
  },
  {
    id: 'daa',
    shortName: 'DAA',
    fullName: 'Defensive Asset Allocation',
    blurb: "Adds a 'canary' universe to VAA for crash signalling (Keller & Keuning, 2018).",
    longDescription: [
      "DAA introduces the canary-universe idea: a tiny two-asset bellwether basket — emerging-market equities (VWO) and total US bonds (BND) — sits outside the main 12-asset risky universe and acts purely as a regime gate. Each month, count how many of the two canaries have non-positive 13612W momentum.",
      'Zero bad canaries → fully offensive (top six risky assets at 1/6 each). One bad canary → half-defensive (three risky + half cash). Two bad canaries → fully defensive (single best cash asset, IEF/SHY/LQD). The breadth count, not the individual scores of the risky assets, drives the offensive/defensive split — that is the breadth-momentum innovation.',
    ],
    paperTitle: 'Breadth Momentum and the Canary Universe: Defensive Asset Allocation (DAA)',
    paperUrl: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3212862',
    paperYear: 2018,
    defaultUniverse: {
      kind: 'daa',
      canary: ['VWO', 'BND'],
      risky: ['SPY', 'IWM', 'QQQ', 'VGK', 'EWJ', 'VWO', 'VNQ', 'GSG', 'GLD', 'TLT', 'HYG', 'LQD'],
      cash: ['SHY', 'IEF', 'LQD'],
    },
  },
  {
    id: 'paa',
    shortName: 'PAA',
    fullName: 'Protective Asset Allocation',
    blurb:
      'SMA12 breadth with selectable protection level a ∈ {0, 1, 2} (Keller & van Putten, 2016).',
    longDescription: [
      "PAA scores the 12 risky assets using a simpler signal than VAA/DAA: each asset's current price relative to its 12-month simple moving average (SMA12). The count of risky assets above their SMA12 (call it n) drives a bond fraction — the share of the portfolio rotated into the best-scoring cash asset.",
      "The protection factor a chooses how cautious the rotation is: a=0 (Aggressive) only goes fully defensive when zero risky assets are bullish; a=1 (Moderate) ramps defensive at n ≤ 3; a=2 (Vigilant, Keller's recommended baseline) ramps defensive at n ≤ 6. Higher a means earlier de-risking. The page below lets you toggle between the three variants and see how the allocation changes.",
    ],
    paperTitle:
      'Protective Asset Allocation (PAA): A Simple Momentum-Based Alternative for Term Deposits',
    paperUrl: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2759734',
    paperYear: 2016,
    defaultUniverse: {
      kind: 'paa',
      risky: ['SPY', 'IWM', 'QQQ', 'VGK', 'EWJ', 'EEM', 'VNQ', 'GSG', 'GLD', 'HYG', 'LQD', 'TLT'],
      cash: ['IEF', 'SHY', 'LQD'],
    },
  },
  {
    id: 'haa',
    shortName: 'HAA',
    fullName: 'Hybrid Asset Allocation',
    blurb:
      '8-risky universe with TIP canary; defensive when rising-yield regime kicks in (Keller & Keuning, 2023).',
    longDescription: [
      "HAA balances four asset categories — US and foreign equities, real assets (REITs, commodities), and Treasuries — across an eight-asset risky universe. A single canary asset, TIP (US TIPS), gates the regime: when TIP's 13612W goes non-positive, HAA reads it as a 'rising-yield' shock and rotates fully into BIL (1-3 month T-bills).",
      "When the canary stays bullish, HAA holds the top four risky assets by 13612W at 1/4 each — a more diversified offensive sleeve than VAA's single-asset bet. The TIPS-canary gate makes HAA particularly responsive to the kind of inflation/yield regime change that hurt traditional 60/40 portfolios in 2022.",
    ],
    paperTitle:
      'Relative and Absolute Momentum in Times of Rising/Low Yields: Hybrid Asset Allocation (HAA)',
    paperUrl: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4346906',
    paperYear: 2023,
    defaultUniverse: {
      kind: 'haa',
      risky: ['SPY', 'IWM', 'VEA', 'VWO', 'VNQ', 'DBC', 'IEF', 'TLT'],
      canary: 'TIP',
      cash: 'BIL',
    },
  },
  {
    id: 'baa',
    shortName: 'BAA',
    fullName: 'Bold Asset Allocation',
    blurb:
      'Unanimous-AND canary gate (TIP/IEF/BIL); fully defensive on a single bearish signal (Keller, 2022).',
    longDescription: [
      "BAA tightens DAA's canary gate into a 'unanimous AND' rule: all three canaries (TIP, IEF, BIL) must show positive 13612W momentum to enter offensive mode. A single bearish canary forces the strategy to 100% in the single best-scoring cash asset, ranked by SMA12 momentum across BIL, IEF, TLT, BND, and LQD.",
      'When all three canaries are bullish, BAA holds the top six of twelve risky assets at 1/6 each — same risky universe as DAA-G12. The dual-signal design (13612W for canary/risky, SMA12 for cash) and the strict canary gate combine to produce more defensive activations than DAA, which is the whole point: aggressive in clear uptrends, decisively defensive at the first hint of macro stress.',
    ],
    paperTitle: 'Bold Asset Allocation: A Tactical Asset Allocation Strategy with Aggressive Crash Protection',
    paperUrl: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4166845',
    paperYear: 2022,
    defaultUniverse: {
      kind: 'baa',
      canary: ['TIP', 'IEF', 'BIL'],
      risky: ['SPY', 'IWM', 'QQQ', 'VGK', 'EWJ', 'EEM', 'VNQ', 'GSG', 'GLD', 'TLT', 'HYG', 'LQD'],
      cash: ['BIL', 'IEF', 'TLT', 'BND', 'LQD'],
    },
  },
  {
    id: 'laa',
    shortName: 'LAA',
    fullName: 'Lethargic Asset Allocation',
    blurb:
      'Permanent sleeve + GT timing on US unemployment & SPY trend (Keller, 2019).',
    longDescription: [
      "LAA is the odd one out: 75% of the portfolio sits in a fixed permanent sleeve (Russell 1000 Value, gold, intermediate Treasuries — IWD/GLD/IEF, equal-weighted) that never rebalances tactically. Only the remaining 25% rotates between a single risky asset (QQQ) and a single cash asset (SHY).",
      "The rotation gate is Growth-Trend (GT) timing — a macro check rather than asset momentum. Risk-Off only triggers when both signals fire bearishly: SPY below its 200-day SMA AND US unemployment (FRED's UNRATE series) above its 12-month SMA. Either signal alone keeps the rotating sleeve in QQQ. Because both conditions rarely co-occur outside genuine recessions, LAA spends most of its time in 75% permanent + 25% QQQ, and only retreats to cash on broad business-cycle deterioration.",
    ],
    paperTitle: 'Growth-Trend Timing and 60-40 Variations: Lethargic Asset Allocation (LAA)',
    paperUrl: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3498092',
    paperYear: 2019,
    defaultUniverse: {
      kind: 'laa',
      permanent: ['IWD', 'GLD', 'IEF'],
      risky: 'QQQ',
      cash: 'SHY',
      signalEquity: 'SPY',
      unemploymentSeriesId: 'UNRATE',
    },
  },
];

export function findStrategy(id: string): Strategy | undefined {
  return STRATEGIES.find((s) => s.id === id);
}
