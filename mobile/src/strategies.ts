/**
 * Wouter Keller's momentum-based asset allocation strategies.
 *
 * All six (VAA / DAA / PAA / BAA / HAA / LAA) are wired through to the
 * backend.
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
  /**
   * One plain line on the home card, for a reader who registered this
   * strategy and needs reminding what they picked. Says how it behaves, not
   * how it is computed — the mechanism is the web's job, and the paper
   * language these replaced ("SMA12 breadth", "unanimous-AND canary gate")
   * told a newcomer nothing.
   */
  tagline: string;
};

export const STRATEGIES: readonly Strategy[] = [
  {
    id: 'vaa',
    shortName: 'VAA',
    fullName: 'Vigilant Asset Allocation',
    tagline: 'All-in on one winner, out at the first bad sign',
  },
  {
    id: 'paa',
    shortName: 'PAA',
    fullName: 'Protective Asset Allocation',
    tagline: 'Eases out of risk as fewer assets trend up',
  },
  {
    id: 'daa',
    shortName: 'DAA',
    fullName: 'Defensive Asset Allocation',
    tagline: 'Two bellwether assets decide when to take cover',
  },
  {
    id: 'baa',
    shortName: 'BAA',
    fullName: 'Bold Asset Allocation',
    tagline: "Strictest guard: one warning and it's fully out",
  },
  {
    id: 'haa',
    shortName: 'HAA',
    fullName: 'Hybrid Asset Allocation',
    tagline: 'Four assets at once, out on an inflation warning',
  },
  {
    id: 'laa',
    shortName: 'LAA',
    fullName: 'Lethargic Asset Allocation',
    tagline: 'Mostly buy-and-hold, one slow economic switch',
  },
];

export const DEFAULT_STRATEGY_ID: StrategyId = 'vaa';

export function findStrategy(id: StrategyId): Strategy {
  const s = STRATEGIES.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown strategy id: ${id}`);
  return s;
}
