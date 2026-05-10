/**
 * Wouter Keller's momentum-based asset allocation strategies.
 *
 * VAA / DAA / PAA / LAA are wired through to the backend; BAA / HAA are
 * listed but route to a "not yet implemented" placeholder when selected.
 *
 * PAA is split into three picker entries (`paa-a0` / `paa-a1` / `paa-a2`)
 * because Keller's paper treats them as distinct portfolios. They share
 * the same risky+cash universe and the same SMA12 momentum signal — only
 * the protection factor `a` differs, controlling how aggressively the
 * bond fraction shifts toward cash as the breadth signal weakens.
 */

export type StrategyId =
  | 'vaa'
  | 'paa-a0'
  | 'paa-a1'
  | 'paa-a2'
  | 'daa'
  | 'baa'
  | 'haa'
  | 'laa';

export type Strategy = {
  id: StrategyId;
  shortName: string;
  fullName: string;
  blurb: string;
  implemented: boolean;
};

export const STRATEGIES: readonly Strategy[] = [
  {
    id: 'vaa',
    shortName: 'VAA',
    fullName: 'Vigilant Asset Allocation',
    blurb: 'Aggressive dual-momentum with crash protection (Keller & Keuning, 2017)',
    implemented: true,
  },
  {
    id: 'paa-a0',
    shortName: 'PAA0',
    fullName: 'Protective Asset Allocation — Aggressive (a=0)',
    blurb: 'SMA12 breadth, no protection floor — defensive only when zero risky assets are good',
    implemented: true,
  },
  {
    id: 'paa-a1',
    shortName: 'PAA1',
    fullName: 'Protective Asset Allocation — Moderate (a=1)',
    blurb: 'SMA12 breadth with mid-strength protection — defensive at n ≤ 3 of 12 good',
    implemented: true,
  },
  {
    id: 'paa-a2',
    shortName: 'PAA2',
    fullName: 'Protective Asset Allocation — Vigilant (a=2)',
    blurb: "Keller's recommended baseline — defensive at n ≤ 6 of 12 good",
    implemented: true,
  },
  {
    id: 'daa',
    shortName: 'DAA',
    fullName: 'Defensive Asset Allocation',
    blurb: "Adds a 'canary' universe to VAA for crash signalling (Keller & Keuning, 2018)",
    implemented: true,
  },
  {
    id: 'baa',
    shortName: 'BAA',
    fullName: 'Bold Asset Allocation',
    blurb: 'Relative + absolute momentum tuned for rising/low yields (Keller, 2022)',
    implemented: false,
  },
  {
    id: 'haa',
    shortName: 'HAA',
    fullName: 'Hybrid Asset Allocation',
    blurb: 'Canary signal + dual momentum, designed for rising-yield regimes (Keller & Keuning, 2023)',
    implemented: false,
  },
  {
    id: 'laa',
    shortName: 'LAA',
    fullName: 'Lethargic Asset Allocation',
    blurb: 'Permanent sleeve + GT timing on US unemployment & SPY trend (Keller, 2019)',
    implemented: true,
  },
];

export const DEFAULT_STRATEGY_ID: StrategyId = 'vaa';

export function findStrategy(id: StrategyId): Strategy {
  const s = STRATEGIES.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown strategy id: ${id}`);
  return s;
}

/**
 * Maps a PAA picker id to its protection factor. Returns `null` for
 * non-PAA ids so callers can use it as a discriminator. Keeping the
 * mapping in one place avoids string parsing scattered across App.tsx /
 * DecisionScreen / clients.
 */
export function paaProtectionFactor(id: StrategyId): 0 | 1 | 2 | null {
  switch (id) {
    case 'paa-a0':
      return 0;
    case 'paa-a1':
      return 1;
    case 'paa-a2':
      return 2;
    default:
      return null;
  }
}
