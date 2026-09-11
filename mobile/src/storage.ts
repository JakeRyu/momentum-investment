/**
 * Persists user preferences across app launches via AsyncStorage. Seven
 * pieces of state live here:
 *
 *   - region                     'US' | 'UK'
 *   - overrides:UK               which curated/custom ticker is active per asset class
 *   - customs:UK                 user-added tickers per asset class (catalog extension)
 *   - selectedStrategyId         last picked strategy
 *   - paaA                       last picked PAA protection factor (0|1|2)
 *   - registeredStrategies       the strategies the user actually runs, shown on Home
 *   - done                       per strategy, the in-force month ticked off
 *
 * Note: asOfDate is gone — with the date picker removed, `asOf` is always
 * either the in-force month-end or today, so there is nothing to persist.
 *
 * All keys are namespaced with `momentum:` so they don't collide with
 * anything else in the same Expo Go shell.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PaaProtectionFactor } from './api/paaClient';
import type { Region } from './api/vaaClient';
import type { AssetClassCode } from './etfCatalog';
import { STRATEGIES, type StrategyId } from './strategies';

export type Overrides = { [K in AssetClassCode]?: string };

export type CustomEtfEntry = {
  ticker: string;
  name: string;
  ccy?: string;
  exchange?: string;
  addedAt: string; // ISO timestamp
};

export type CustomTickers = { [K in AssetClassCode]?: CustomEtfEntry[] };

const KEY_REGION = 'momentum:region';
const KEY_OVERRIDES_UK = 'momentum:overrides:UK';
const KEY_CUSTOMS_UK = 'momentum:customs:UK';
const KEY_SELECTED_STRATEGY = 'momentum:selectedStrategy';
const KEY_PAA_A = 'momentum:paaA';
const KEY_REGISTERED = 'momentum:registeredStrategies';
const KEY_DONE = 'momentum:done';

// ----------------------------------------------------------------------
// Region

export async function loadRegion(): Promise<Region> {
  const v = await AsyncStorage.getItem(KEY_REGION);
  return v === 'UK' ? 'UK' : 'US';
}

export async function saveRegion(r: Region): Promise<void> {
  await AsyncStorage.setItem(KEY_REGION, r);
}

// ----------------------------------------------------------------------
// Overrides

export async function loadOverrides(region: Region): Promise<Overrides> {
  if (region !== 'UK') return {};
  const raw = await AsyncStorage.getItem(KEY_OVERRIDES_UK);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Overrides) : {};
  } catch {
    return {};
  }
}

export async function saveOverrides(region: Region, overrides: Overrides): Promise<void> {
  if (region !== 'UK') return;
  await AsyncStorage.setItem(KEY_OVERRIDES_UK, JSON.stringify(overrides));
}

export async function clearOverrides(region: Region): Promise<void> {
  if (region !== 'UK') return;
  await AsyncStorage.removeItem(KEY_OVERRIDES_UK);
}

// ----------------------------------------------------------------------
// Custom tickers

export async function loadCustomTickers(region: Region): Promise<CustomTickers> {
  if (region !== 'UK') return {};
  const raw = await AsyncStorage.getItem(KEY_CUSTOMS_UK);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as CustomTickers) : {};
  } catch {
    return {};
  }
}

export async function saveCustomTickers(
  region: Region,
  customs: CustomTickers,
): Promise<void> {
  if (region !== 'UK') return;
  await AsyncStorage.setItem(KEY_CUSTOMS_UK, JSON.stringify(customs));
}

// ----------------------------------------------------------------------
// Selected strategy (last user pick on HomeScreen)

export async function loadSelectedStrategyId(
  fallback: StrategyId,
): Promise<StrategyId> {
  const v = await AsyncStorage.getItem(KEY_SELECTED_STRATEGY);
  if (!v) return fallback;
  // Defensive parse — if a previously-saved id is no longer in the
  // current STRATEGIES list (e.g. we renamed `paa-a2` → `paa` in this
  // refactor; or we drop a strategy in a future revision), drop it
  // silently and fall back to the default.
  return STRATEGIES.some((s) => s.id === v) ? (v as StrategyId) : fallback;
}

export async function saveSelectedStrategyId(id: StrategyId): Promise<void> {
  await AsyncStorage.setItem(KEY_SELECTED_STRATEGY, id);
}

// ----------------------------------------------------------------------
// PAA protection factor (a ∈ {0, 1, 2}). Defaults to Vigilant (a=2),
// Keller's recommended baseline.

export async function loadPaaProtectionFactor(): Promise<PaaProtectionFactor> {
  const v = await AsyncStorage.getItem(KEY_PAA_A);
  if (v === '0') return 0;
  if (v === '1') return 1;
  // '2', null, or any other unexpected value → default Vigilant.
  return 2;
}

export async function savePaaProtectionFactor(
  a: PaaProtectionFactor,
): Promise<void> {
  await AsyncStorage.setItem(KEY_PAA_A, String(a));
}

// ----------------------------------------------------------------------
// Registered strategies — the ones the user actually runs, shown on Home.
// A newcomer starts with VAA alone so the home screen is never empty and
// never asks for a choice the app cannot help with.

export const DEFAULT_REGISTERED: StrategyId[] = ['vaa'];

export async function loadRegisteredStrategies(): Promise<StrategyId[]> {
  const raw = await AsyncStorage.getItem(KEY_REGISTERED);
  if (!raw) return [...DEFAULT_REGISTERED];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_REGISTERED];
    // Same defensive filter as loadSelectedStrategyId: an id we no longer
    // ship is dropped rather than crashing a screen that maps over it.
    const known = parsed.filter((id): id is StrategyId =>
      STRATEGIES.some((s) => s.id === id),
    );
    return known.length > 0 ? known : [...DEFAULT_REGISTERED];
  } catch {
    return [...DEFAULT_REGISTERED];
  }
}

export async function saveRegisteredStrategies(ids: StrategyId[]): Promise<void> {
  await AsyncStorage.setItem(KEY_REGISTERED, JSON.stringify(ids));
}

// ----------------------------------------------------------------------
// Done markers — per strategy, the in-force month the user ticked off
// (e.g. "2026-08"). When the month rolls over the stored key stops matching
// the current in-force month and the card reverts to pending on its own.

export async function loadDoneMarkers(): Promise<Partial<Record<StrategyId, string>>> {
  const raw = await AsyncStorage.getItem(KEY_DONE);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveDoneMarker(id: StrategyId, monthKey: string): Promise<void> {
  const markers = await loadDoneMarkers();
  markers[id] = monthKey;
  await AsyncStorage.setItem(KEY_DONE, JSON.stringify(markers));
}

export async function clearDoneMarker(id: StrategyId): Promise<void> {
  const markers = await loadDoneMarkers();
  delete markers[id];
  await AsyncStorage.setItem(KEY_DONE, JSON.stringify(markers));
}
