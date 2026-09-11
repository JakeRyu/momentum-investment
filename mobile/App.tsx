import { useEffect, useState } from 'react';
import { View } from 'react-native';

import type { Region } from './src/api/apiBase';
import type { PaaProtectionFactor } from './src/api/paaClient';
import { type AssetClassCode } from './src/etfCatalog';
import DecisionScreen from './src/screens/DecisionScreen';
import ETFConfigScreen from './src/screens/ETFConfigScreen';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import {
  clearOverrides as persistClearOverrides,
  loadCustomTickers,
  loadOverrides,
  loadPaaProtectionFactor,
  loadRegion,
  loadRegisteredStrategies,
  saveCustomTickers as persistCustomTickers,
  saveOverrides as persistOverrides,
  savePaaProtectionFactor as persistPaaA,
  saveRegion as persistRegion,
  saveRegisteredStrategies as persistRegisteredStrategies,
  type CustomEtfEntry,
  type CustomTickers,
  type Overrides,
} from './src/storage';
import {
  DEFAULT_STRATEGY_ID,
  findStrategy,
  type Strategy,
  type StrategyId,
} from './src/strategies';

type Screen =
  | { kind: 'home' }
  | { kind: 'settings' }
  | { kind: 'config'; strategyId: StrategyId }
  | { kind: 'decision'; strategy: Strategy };

export default function App() {
  // Selection state lives at the App level so it's preserved when the user
  // navigates Home → Decision → Back → Home.
  const [registered, setRegistered] = useState<StrategyId[]>([DEFAULT_STRATEGY_ID]);
  const [region, setRegion] = useState<Region>('US');
  const [overrides, setOverrides] = useState<Overrides>({});
  const [customs, setCustoms] = useState<CustomTickers>({});
  // PAA's protection factor lives at App level (not in the Screen
  // discriminated union) so the segmented control on DecisionScreen can
  // toggle it freely without recreating the screen state. Default to
  // Keller's recommended baseline (Vigilant).
  const [paaProtectionFactor, setPaaProtectionFactor] =
    useState<PaaProtectionFactor>(2);
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });
  const [hydrated, setHydrated] = useState(false);

  // Rehydrate persisted preferences on mount. While loading we render a
  // dark blank screen so a UK user doesn't see a brief US flash and so the
  // registered strategy list doesn't appear to "jump" after the home
  // screen mounts.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await loadRegion();
      const [o, c, savedRegistered, savedPaaA] = await Promise.all([
        loadOverrides(r),
        loadCustomTickers(r),
        loadRegisteredStrategies(),
        loadPaaProtectionFactor(),
      ]);
      if (cancelled) return;
      setRegion(r);
      setOverrides(o);
      setCustoms(c);
      setRegistered(savedRegistered);
      setPaaProtectionFactor(savedPaaA);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Wrapped setters that persist alongside updating local state. Kept as
  // tiny handlers (rather than `useEffect` watching the state) so a
  // navigation/Confirm doesn't trigger redundant writes when nothing
  // changed.
  const handlePaaAChange = (a: PaaProtectionFactor) => {
    setPaaProtectionFactor(a);
    void persistPaaA(a);
  };

  const handleRegisteredChange = (ids: StrategyId[]) => {
    setRegistered(ids);
    void persistRegisteredStrategies(ids);
  };

  const handleRegionChange = (r: Region) => {
    setRegion(r);
    void persistRegion(r);
    if (r === 'UK') {
      // Both overrides and customs are UK-scoped; reload from storage.
      void Promise.all([loadOverrides('UK'), loadCustomTickers('UK')]).then(([o, c]) => {
        setOverrides(o);
        setCustoms(c);
      });
    } else {
      // US has no override / custom concept.
      setOverrides({});
      setCustoms({});
    }
  };

  const handleOverrideChange = (code: AssetClassCode, ticker: string) => {
    const next: Overrides = { ...overrides, [code]: ticker };
    setOverrides(next);
    void persistOverrides(region, next);
  };

  const handleResetOverrides = () => {
    setOverrides({});
    void persistClearOverrides(region);
  };

  const handleAddCustom = (code: AssetClassCode, entry: CustomEtfEntry) => {
    // Append to per-asset-class custom list, dedup by ticker.
    const existing = customs[code] ?? [];
    const dedup = existing.filter(
      (e) => e.ticker.toUpperCase() !== entry.ticker.toUpperCase(),
    );
    const nextCustoms: CustomTickers = { ...customs, [code]: [...dedup, entry] };
    setCustoms(nextCustoms);
    void persistCustomTickers(region, nextCustoms);

    // Make the newly-added ticker the active override for this asset class.
    handleOverrideChange(code, entry.ticker);
  };

  const handleRemoveCustom = (code: AssetClassCode, ticker: string) => {
    const existing = customs[code] ?? [];
    const filtered = existing.filter(
      (e) => e.ticker.toUpperCase() !== ticker.toUpperCase(),
    );
    const nextCustoms: CustomTickers =
      filtered.length === 0
        ? Object.fromEntries(Object.entries(customs).filter(([k]) => k !== code))
        : { ...customs, [code]: filtered };
    setCustoms(nextCustoms);
    void persistCustomTickers(region, nextCustoms);

    // If the removed ticker is currently the active override, fall back to
    // the curated default by clearing the override for that asset class.
    if (overrides[code]?.toUpperCase() === ticker.toUpperCase()) {
      const { [code]: _removed, ...rest } = overrides;
      setOverrides(rest);
      void persistOverrides(region, rest);
    }
  };

  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: '#0b0d10' }} />;
  }

  if (screen.kind === 'home') {
    return (
      <HomeScreen
        registered={registered}
        region={region}
        overrides={overrides}
        paaA={paaProtectionFactor}
        onOpenStrategy={(id) => setScreen({ kind: 'decision', strategy: findStrategy(id) })}
        onOpenSettings={() => setScreen({ kind: 'settings' })}
      />
    );
  }

  if (screen.kind === 'settings') {
    return (
      <SettingsScreen
        registered={registered}
        onRegisteredChange={handleRegisteredChange}
        region={region}
        onRegionChange={handleRegionChange}
        onOpenEtfConfig={(strategyId) => setScreen({ kind: 'config', strategyId })}
        onBack={() => setScreen({ kind: 'home' })}
      />
    );
  }

  if (screen.kind === 'config') {
    return (
      <ETFConfigScreen
        strategyId={screen.strategyId}
        region={region}
        overrides={overrides}
        customs={customs}
        onOverrideChange={handleOverrideChange}
        onAddCustom={handleAddCustom}
        onRemoveCustom={handleRemoveCustom}
        onReset={handleResetOverrides}
        onBack={() => setScreen({ kind: 'settings' })}
      />
    );
  }

  return (
    <DecisionScreen
      strategy={screen.strategy}
      region={region}
      overrides={overrides}
      paaA={paaProtectionFactor}
      onPaaAChange={handlePaaAChange}
      onBack={() => setScreen({ kind: 'home' })}
    />
  );
}
