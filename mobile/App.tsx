import { useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';

import type { AllocationDecision, Region } from './src/api/apiBase';
import type { PaaProtectionFactor } from './src/api/paaTypes';
import { buildDecisionRequest, fetchDecisionFor } from './src/decisions';
import { type AssetClassCode } from './src/etfCatalog';
import { backTarget, type Screen } from './src/navigation';
import { inForceAsOf, inForceMonthKey } from './src/rebalance';
import DecisionScreen from './src/screens/DecisionScreen';
import ETFConfigScreen from './src/screens/ETFConfigScreen';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import {
  clearOverrides as persistClearOverrides,
  loadCustomTickers,
  loadDoneMarkers,
  loadOverrides,
  loadPaaProtectionFactor,
  loadRegion,
  loadRegisteredStrategies,
  saveCustomTickers as persistCustomTickers,
  saveDoneMarkers,
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
  type StrategyId,
} from './src/strategies';

export type CardState = { decision: AllocationDecision | null; error: string | null };

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

  // Fetched decisions per registered strategy, plus the done-markers and
  // pull-to-refresh state that go with them. Lives here (rather than in
  // HomeScreen) so navigating Home → Decision → Back doesn't unmount the
  // fetch and replay the whole loading state — the in-force decision is
  // computed from the last month-end and doesn't change for the rest of
  // the calendar month.
  const [results, setResults] = useState<Partial<Record<StrategyId, CardState>>>({});
  const [markers, setMarkers] = useState<Partial<Record<StrategyId, string>>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

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

  // Android's system back (edge swipe or ◁) would otherwise leave the app
  // from any screen, because nothing here is a native screen stack.
  // Returning false on Home hands it back to Android. A no-op on iOS.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const target = backTarget(screen);
      if (!target) return false;
      setScreen(target);
      return true;
    });
    return () => sub.remove();
  }, [screen]);

  // Loaded once — nothing else mutates markers except handleToggleDone
  // below, which writes through immediately.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadDoneMarkers();
      if (!cancelled) setMarkers(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // A stable string so the effect below doesn't re-fire on every render
  // just because `overrides` is a fresh object identity.
  const overridesKey = JSON.stringify(overrides);

  useEffect(() => {
    // Don't fetch until storage has hydrated — otherwise this fires once
    // with the default region/registered set, then immediately refetches
    // once the real values load.
    if (!hydrated) return;
    let cancelled = false;
    const asOf = inForceAsOf();
    // Drop results for strategies no longer registered, so unregistering
    // then later re-registering shows a skeleton instead of the stale
    // allocation from before (e.g. fetched under a different region).
    setResults((prev) => {
      const next: Partial<Record<StrategyId, CardState>> = {};
      for (const id of registered) {
        if (prev[id]) next[id] = prev[id];
      }
      return next;
    });
    (async () => {
      await Promise.all(
        registered.map(async (id) => {
          try {
            const request = buildDecisionRequest(id, region, overrides);
            const decision = await fetchDecisionFor(request, asOf, paaProtectionFactor);
            if (!cancelled) {
              setResults((prev) => ({ ...prev, [id]: { decision, error: null } }));
            }
          } catch (e) {
            if (!cancelled) {
              setResults((prev) => ({
                ...prev,
                [id]: { decision: null, error: e instanceof Error ? e.message : String(e) },
              }));
            }
          }
        }),
      );
      if (!cancelled) setRefreshing(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, registered.join(','), region, paaProtectionFactor, overridesKey, reloadToken]);

  const handleToggleDone = (id: StrategyId) => {
    const monthKey = inForceMonthKey();
    setMarkers((prev) => {
      const next = { ...prev };
      if (next[id] === monthKey) {
        delete next[id];
      } else {
        next[id] = monthKey;
      }
      void saveDoneMarkers(next);
      return next;
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    setReloadToken((t) => t + 1);
  };

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
    // A strategy that leaves the list drops its rebalanced marker with it.
    // Coming back is a fresh addition, not a resumption — the user was not
    // holding it in between, so the old claim no longer describes anything.
    setMarkers((prev) => {
      const next: Partial<Record<StrategyId, string>> = {};
      for (const id of ids) {
        if (prev[id] !== undefined) next[id] = prev[id];
      }
      void saveDoneMarkers(next);
      return next;
    });
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
        results={results}
        markers={markers}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onToggleDone={handleToggleDone}
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
