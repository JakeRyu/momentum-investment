/**
 * Persists user preferences across app launches via AsyncStorage. Three
 * pieces of state live here:
 *
 *   - region                     'US' | 'UK'
 *   - overrides:UK               which curated/custom ticker is active per asset class
 *   - customs:UK                 user-added tickers per asset class (catalog extension)
 *
 * All keys are namespaced with `momentum:` so they don't collide with
 * anything else in the same Expo Go shell.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Region } from './api/vaaClient';
import type { AssetClassCode } from './etfCatalog';

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
