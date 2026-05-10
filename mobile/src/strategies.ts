/**
 * Wouter Keller's momentum-based asset allocation strategies.
 *
 * VAA / DAA / PAA / LAA are wired through to the backend; BAA / HAA are
 * listed but route to a "not yet implemented" placeholder when selected.
 *
 * PAA's three protection-factor variants (a ∈ {0, 1, 2}) are NOT separate
 * picker entries — they share one card, and the variant is selected via a
 * segmented control on the DecisionScreen (default a = 2, Vigilant).
 * Rationale: same universe, same SMA12 signal, same fetch path — variants
 * are a setting on the same method, not separate methods. Splitting them
 * across three picker rows made the strategy list visually misleading.
 * Backend still distinguishes them in the response StrategyId
 * (`paa-g12-a0|a1|a2`) so a future history view can tell which protection
 * level produced a given decision.
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
    blurb:
      'SMA12 breadth with selectable protection level a ∈ {0, 1, 2} (Keller & van Putten, 2016)',
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
