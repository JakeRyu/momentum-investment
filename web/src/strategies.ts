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
  | { kind: 'haa'; risky: string[]; canary: string; cash: string[] }
  | { kind: 'baa'; canary: string[]; risky: string[]; cash: string[] }
  | {
      kind: 'laa';
      permanent: string[];
      risky: string;
      cash: string;
      signalEquity: string;
      unemploymentSeriesId: string;
    };

/**
 * A figure reported by the strategy's source paper, for the variant this
 * site actually implements. Transcribed from the PDFs in `docs/papers/`
 * and pinned by `strategies.test.ts`.
 *
 * `maxDrawdownPct` is the paper's D: the worst peak-to-trough fall
 * measured at month-end, as a positive magnitude. Intra-month falls are
 * deeper; `BacktestFigure` says so wherever this renders.
 *
 * Absent when the site's implementation diverges from the paper the
 * figure came from — publishing it would be a false citation.
 */
export type Backtest = {
  variant: string;
  periodStart: string; // YYYY-MM
  periodEnd: string; // YYYY-MM
  cagrPct: number;
  maxDrawdownPct: number;
  sourceLabel: string;
};

export type Strategy = {
  id: StrategyId;
  shortName: string;
  fullName: string;
  /**
   * One line on what the strategy does, in words a beginner can act on.
   * Not a paper citation — attribution lives on the paper line, and
   * `strategies.test.ts` keeps author names and years out of here.
   */
  tagline: string;
  /**
   * Mechanical facts for the home comparison. Deliberately not ratings
   * and deliberately not performance: `deRisks` is the "aggressiveness"
   * axis restated as a property of the rule, so the reader draws the
   * conclusion and the site asserts nothing. A ranked comparison
   * published by a UK company reads as a financial promotion.
   */
  comparison: {
    holds: string;
    deRisks: string;
  };
  longDescription: string[];
  paperTitle: string;
  paperUrl: string;
  paperYear: number;
  defaultUniverse: StrategyKind;
  backtest?: Backtest;
};

export const STRATEGIES: readonly Strategy[] = [
  {
    id: 'vaa',
    shortName: 'VAA',
    fullName: 'Vigilant Asset Allocation',
    tagline: 'All-in on one winner, out at the first bad sign',
    comparison: {
      holds: '1',
      deRisks: 'all at once',
    },
    longDescription: [
      'VAA splits its universe into four offensive assets (US large cap, international developed, emerging markets, US aggregate bonds) and three defensive assets (corporate bonds, intermediate Treasuries, short Treasuries). Each month it scores every asset using the 13612W momentum signal — a weighted blend of 1-, 3-, 6-, and 12-month returns.',
      'The strategy goes fully into the single best-scoring offensive asset whenever all four offensive assets show positive momentum. As soon as even one offensive asset prints a non-positive score, VAA rotates entirely into the best-scoring defensive asset. The aggressive concentration plus the strict "all-positive" gate gives VAA its characteristic profile: high upside in trending markets, fast retreat at the first sign of breadth deterioration.',
    ],
    paperTitle: 'Breadth Momentum and Vigilant Asset Allocation (VAA): Winning More by Losing Less',
    paperUrl: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3002624',
    paperYear: 2017,
    defaultUniverse: {
      kind: 'vaa',
      offensive: ['SPY', 'EFA', 'EEM', 'AGG'],
      defensive: ['LQD', 'IEF', 'SHY'],
    },
    // Table 8's 18.9%/13.0% is the paper's backtest on VEA/VWO/BND, not
    // this site's ticker set (note 13). Note 16 reruns VAA-G4 on
    // SPY/EFA/EEM/AGG — the universe this site runs — giving the figures
    // below.
    backtest: {
      variant: 'VAA-G4 on SPY/EFA/EEM/AGG',
      periodStart: '1970-12',
      periodEnd: '2016-12',
      cagrPct: 18.8,
      maxDrawdownPct: 16.4,
      sourceLabel: 'note 16',
    },
  },
  {
    id: 'daa',
    shortName: 'DAA',
    fullName: 'Defensive Asset Allocation',
    tagline: 'Two bellwether assets decide when to take cover',
    comparison: {
      holds: '1 · 4 · 6',
      deRisks: 'in three steps',
    },
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
    backtest: {
      variant: 'DAA-G12 (T=6, B=2)',
      periodStart: '1970-12',
      periodEnd: '2018-03',
      cagrPct: 16.0,
      maxDrawdownPct: 10.6,
      sourceLabel: 'Fig. 8',
    },
  },
  {
    id: 'paa',
    shortName: 'PAA',
    fullName: 'Protective Asset Allocation',
    tagline: 'Eases out of risk as fewer assets trend up',
    comparison: {
      holds: 'up to 7',
      deRisks: 'gradually',
    },
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
    backtest: {
      variant: 'PAA2 (a=2, Top6, L=12); site adds SHY and LQD to the cash sleeve',
      periodStart: '1970-12',
      periodEnd: '2015-12',
      cagrPct: 13.7,
      maxDrawdownPct: 10.4,
      sourceLabel: 'Fig. 6',
    },
  },
  {
    id: 'haa',
    shortName: 'HAA',
    fullName: 'Hybrid Asset Allocation',
    tagline: 'Four assets at once, out on an inflation warning',
    comparison: {
      holds: '1 or 4',
      deRisks: 'all at once',
    },
    longDescription: [
      "HAA balances four asset categories — US and foreign equities, real assets (REITs, commodities), and Treasuries — across an eight-asset risky universe. A single canary asset, TIP (US TIPS), gates the regime: when TIP's 13612U momentum goes non-positive, HAA reads it as a 'rising-yield' shock and rotates fully into cash — the better of BIL (1-3 month T-bills) and IEF (intermediate Treasuries).",
      "When the canary stays bullish, HAA holds the top four risky assets by 13612U at 1/4 each — but this is where the 'hybrid' in its name comes from: any of those four whose own momentum is non-positive is replaced by cash, so a month can be part invested and part defensive. One bad asset in the top four means 25% cash. The TIPS-canary gate makes HAA particularly responsive to the kind of inflation/yield regime change that hurt traditional 60/40 portfolios in 2022.",
    ],
    paperTitle:
      'Relative and Absolute Momentum in Times of Rising/Low Yields: Hybrid Asset Allocation (HAA)',
    paperUrl: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4346906',
    paperYear: 2023,
    defaultUniverse: {
      kind: 'haa',
      risky: ['SPY', 'IWM', 'VEA', 'VWO', 'VNQ', 'DBC', 'IEF', 'TLT'],
      canary: 'TIP',
      cash: ['BIL', 'IEF'],
    },
    backtest: {
      variant: 'HAA-Balanced (G8/T4, L=1)',
      periodStart: '1970-12',
      periodEnd: '2022-12',
      cagrPct: 15.9,
      maxDrawdownPct: 9.7,
      sourceLabel: 'Fig 6',
    },
  },
  {
    id: 'baa',
    shortName: 'BAA',
    fullName: 'Bold Asset Allocation',
    tagline: "Strictest guard: one warning and it's fully out",
    comparison: {
      holds: '1 or 6',
      deRisks: 'all at once',
    },
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
    // No backtest row: BaaService's canary/ranking/breadth diverge from
    // Fig 3's BAA-G12, and the canary universe is the crash-protection
    // mechanism, so the paper's figure doesn't describe what this site
    // computes.
    //   - Canary: paper uses SPY/VWO/VEA/BND (NP=4); site uses TIP/IEF/BIL.
    //   - Ranking: paper ranks risky assets by SMA12 (LO=12); site uses
    //     13612W.
    //   - Defensive breadth: paper takes top-3 of a 7-asset defensive set
    //     (ND=7, TD=3); site takes top-1 of 5.
    // Restore the paper's Fig 3 figures (R 14.6%, D 8.7%, Dec 1970 – Jun
    // 2022) only once BaaService is reconciled with these three.
  },
  {
    id: 'laa',
    shortName: 'LAA',
    fullName: 'Lethargic Asset Allocation',
    tagline: 'Mostly buy-and-hold, one slow economic switch',
    comparison: {
      holds: '4',
      deRisks: 'a quarter of the portfolio',
    },
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
    backtest: {
      variant: 'LAA (QQQ↔SHY); site times SPY with a 200-day SMA, the paper with a 10-month SMA',
      periodStart: '1949-02',
      periodEnd: '2019-10',
      cagrPct: 10.5,
      maxDrawdownPct: 15.0,
      sourceLabel: 'Fig. 12',
    },
  },
];

export function findStrategy(id: string): Strategy | undefined {
  return STRATEGIES.find((s) => s.id === id);
}

/**
 * How many distinct ETFs a broker has to support to run the strategy —
 * the third comparison column.
 *
 * Only assets the strategy can actually allocate to are counted. Canary
 * assets and trend signals are read every month and never bought, so
 * they do not constrain your broker: DAA watches BND, HAA and BAA watch
 * TIP, LAA watches SPY. Where a signal asset also appears in a holding
 * bucket it is counted there, once.
 *
 * Derived rather than stored because a hand-typed count drifts from the
 * universe beside it — the first version of this data counted canaries
 * for DAA, HAA and BAA but excluded LAA's signal.
 */
export function fundsNeeded(universe: StrategyKind): number {
  const held = ((): string[] => {
    switch (universe.kind) {
      case 'vaa':
        return [...universe.offensive, ...universe.defensive];
      case 'daa':
      case 'baa':
      case 'paa':
        return [...universe.risky, ...universe.cash];
      case 'haa':
        return [...universe.risky, ...universe.cash];
      case 'laa':
        return [...universe.permanent, universe.risky, universe.cash];
    }
  })();

  return new Set(held).size;
}
