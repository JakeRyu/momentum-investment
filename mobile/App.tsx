import { useEffect, useState } from 'react';
import { View } from 'react-native';

import type { Region } from './src/api/apiBase';
import { type AssetClassCode } from './src/etfCatalog';
import DecisionScreen, { type DecisionRequest } from './src/screens/DecisionScreen';
import ETFConfigScreen from './src/screens/ETFConfigScreen';
import HomeScreen from './src/screens/HomeScreen';
import NotImplementedScreen from './src/screens/NotImplementedScreen';
import {
  clearOverrides as persistClearOverrides,
  loadCustomTickers,
  loadOverrides,
  loadRegion,
  saveCustomTickers as persistCustomTickers,
  saveOverrides as persistOverrides,
  saveRegion as persistRegion,
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
import {
  daaG12TickerArrays,
  paaTickerArrays,
  resolveDaaG12Universe,
  resolvePaaUniverse,
  resolveUniverse,
  tickerArrays,
} from './src/universe';
import { formatYmd } from './src/utils';

type Screen =
  | { kind: 'home' }
  | { kind: 'config' }
  | {
      kind: 'decision';
      strategy: Strategy;
      asOf: string;
      region: Region;
      request: DecisionRequest;
    }
  | { kind: 'notImplemented'; strategy: Strategy };

export default function App() {
  // Selection state lives at the App level so it's preserved when the user
  // navigates Home → Decision → Back → Home.
  const [selectedStrategyId, setSelectedStrategyId] = useState<StrategyId>(DEFAULT_STRATEGY_ID);
  const [asOfDate, setAsOfDate] = useState<Date>(() => new Date());
  const [region, setRegion] = useState<Region>('US');
  const [overrides, setOverrides] = useState<Overrides>({});
  const [customs, setCustoms] = useState<CustomTickers>({});
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });
  const [hydrated, setHydrated] = useState(false);

  // Rehydrate persisted preferences on mount. While loading we render a
  // dark blank screen so a UK user doesn't see a brief US flash.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await loadRegion();
      const [o, c] = await Promise.all([loadOverrides(r), loadCustomTickers(r)]);
      if (cancelled) return;
      setRegion(r);
      setOverrides(o);
      setCustoms(c);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const handleConfirm = () => {
    const strategy = findStrategy(selectedStrategyId);
    const asOf = formatYmd(asOfDate);
    if (!strategy.implemented) {
      setScreen({ kind: 'notImplemented', strategy });
      return;
    }

    // Strategy-specific universe resolution. VAA / DAA / PAA each have
    // their own resolver but share the same region + per-asset-class
    // override semantics under the hood.
    let request: DecisionRequest;
    if (strategy.id === 'daa') {
      const universe = resolveDaaG12Universe(region, overrides);
      const { canary, risky, cash } = daaG12TickerArrays(universe);
      request = { kind: 'daa-g12', canary, risky, cash };
    } else if (strategy.id === 'paa') {
      const universe = resolvePaaUniverse(region, overrides);
      const { risky, cash } = paaTickerArrays(universe);
      request = { kind: 'paa', risky, cash };
    } else {
      const universe = resolveUniverse(region, overrides);
      const { offensive, defensive } = tickerArrays(universe);
      request = { kind: 'vaa', offensive, defensive };
    }

    setScreen({ kind: 'decision', strategy, asOf, region, request });
  };

  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: '#0b0d10' }} />;
  }

  if (screen.kind === 'home') {
    return (
      <HomeScreen
        selectedStrategyId={selectedStrategyId}
        onStrategyChange={setSelectedStrategyId}
        asOfDate={asOfDate}
        onAsOfChange={setAsOfDate}
        region={region}
        onRegionChange={handleRegionChange}
        onConfirm={handleConfirm}
        onOpenConfig={() => setScreen({ kind: 'config' })}
      />
    );
  }

  if (screen.kind === 'config') {
    return (
      <ETFConfigScreen
        strategyId={selectedStrategyId}
        region={region}
        overrides={overrides}
        customs={customs}
        onOverrideChange={handleOverrideChange}
        onAddCustom={handleAddCustom}
        onRemoveCustom={handleRemoveCustom}
        onReset={handleResetOverrides}
        onBack={() => setScreen({ kind: 'home' })}
      />
    );
  }

  if (screen.kind === 'decision') {
    return (
      <DecisionScreen
        strategy={screen.strategy}
        asOf={screen.asOf}
        region={screen.region}
        request={screen.request}
        onBack={() => setScreen({ kind: 'home' })}
      />
    );
  }

  return (
    <NotImplementedScreen
      strategy={screen.strategy}
      onBack={() => setScreen({ kind: 'home' })}
    />
  );
}
