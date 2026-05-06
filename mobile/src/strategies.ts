/**
 * Wouter Keller's momentum-based asset allocation strategies.
 *
 * Only VAA is wired through to the backend in Phase 1; the others are
 * listed in the picker but route to a "not yet implemented" placeholder
 * when selected.
 */

export type StrategyId = 'vaa' | 'paa' | 'daa' | 'baa' | 'haa' | 'laa';

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
    id: 'paa',
    shortName: 'PAA',
    fullName: 'Protective Asset Allocation',
    blurb: 'Breadth-momentum protection with crash-protection scaling (Keller & Keuning, 2016)',
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
    blurb: 'Low-turnover defensive variant with broad momentum filter',
    implemented: false,
  },
];

export const DEFAULT_STRATEGY_ID: StrategyId = 'vaa';

export function findStrategy(id: StrategyId): Strategy {
  const s = STRATEGIES.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown strategy id: ${id}`);
  return s;
}
