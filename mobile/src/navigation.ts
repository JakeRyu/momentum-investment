import type { Strategy, StrategyId } from './strategies';

export type Screen =
  | { kind: 'home' }
  | { kind: 'settings' }
  | { kind: 'config'; strategyId: StrategyId }
  | { kind: 'decision'; strategy: Strategy };

/**
 * Where Android's system back goes: the same screen as each screen's own
 * "← Back". Null on Home, where back leaves the app as Android users expect.
 *
 * Nothing is lost by going back from any screen — every setting is saved as
 * it changes — so back never needs to ask first.
 */
export function backTarget(screen: Screen): Screen | null {
  switch (screen.kind) {
    case 'home':
      return null;
    case 'settings':
    case 'decision':
      return { kind: 'home' };
    case 'config':
      return { kind: 'settings' };
  }
}
