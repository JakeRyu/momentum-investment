import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { AllocationDecision, Region } from '../api/apiBase';
import type { PaaProtectionFactor } from '../api/paaClient';
import StrategyDecisionCard from '../components/StrategyDecisionCard';
import { buildDecisionRequest, fetchDecisionFor } from '../decisions';
import { holdingHint, inForceAsOf, inForceMonthKey } from '../rebalance';
import { loadDoneMarkers, saveDoneMarkers, type Overrides } from '../storage';
import { findStrategy, type StrategyId } from '../strategies';

export type HomeScreenProps = {
  registered: StrategyId[];
  region: Region;
  overrides: Overrides;
  paaA: PaaProtectionFactor;
  onOpenStrategy: (id: StrategyId) => void;
  onOpenSettings: () => void;
};

type CardState = { decision: AllocationDecision | null; error: string | null };

export default function HomeScreen({
  registered,
  region,
  overrides,
  paaA,
  onOpenStrategy,
  onOpenSettings,
}: HomeScreenProps) {
  const [results, setResults] = useState<Partial<Record<StrategyId, CardState>>>({});
  const [markers, setMarkers] = useState<Partial<Record<StrategyId, string>>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  // Loaded once — nothing else in this screen mutates markers except the
  // toggle handler below, which writes through immediately.
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
  // just because `overrides` is a fresh object identity from App's state.
  const overridesKey = JSON.stringify(overrides);

  useEffect(() => {
    let cancelled = false;
    const asOf = inForceAsOf();
    (async () => {
      await Promise.all(
        registered.map(async (id) => {
          try {
            const request = buildDecisionRequest(id, region, overrides);
            const decision = await fetchDecisionFor(request, asOf, paaA);
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
  }, [registered.join(','), region, paaA, overridesKey, reloadToken]);

  const handleToggleDone = (id: StrategyId) => {
    const monthKey = inForceMonthKey();
    const next = { ...markers };
    if (next[id] === monthKey) {
      delete next[id];
    } else {
      next[id] = monthKey;
    }
    setMarkers(next);
    void saveDoneMarkers(next);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setReloadToken((t) => t + 1);
  };

  const holdingLine = holdingHint();
  const monthKey = inForceMonthKey();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Momentum Investment</Text>
            <Text style={styles.subtitle}>Wouter Keller momentum strategies</Text>
          </View>
          <TouchableOpacity
            style={styles.gearButton}
            onPress={onOpenSettings}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Text style={styles.gearText}>⚙︎</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardList}>
          {registered.map((id) => {
            const state = results[id] ?? { decision: null, error: null };
            return (
              <StrategyDecisionCard
                key={id}
                strategy={findStrategy(id)}
                decision={state.decision}
                error={state.error}
                holdingLine={holdingLine}
                done={markers[id] === monthKey}
                onToggleDone={() => handleToggleDone(id)}
                onPress={() => onOpenStrategy(id)}
              />
            );
          })}
        </View>

        <TouchableOpacity onPress={onOpenSettings} activeOpacity={0.7} style={styles.addRow}>
          <Text style={styles.addRowText}>Add another strategy →</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.disclaimer}>
          Educational tool — not investment advice. Past performance is not
          indicative of future results.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0b0d10',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 64,
    paddingBottom: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: '#0b0d10',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2a2f37',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  headerTextWrap: {
    flex: 1,
  },
  gearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161a1f',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  gearText: {
    color: '#cfd5dc',
    fontSize: 20,
  },
  title: {
    color: '#f4f6f8',
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    color: '#8a93a0',
    fontSize: 14,
    marginTop: 4,
  },
  cardList: {
    gap: 12,
  },
  addRow: {
    marginTop: 20,
    alignItems: 'center',
  },
  addRowText: {
    color: '#7ed4a3',
    fontSize: 14,
    fontWeight: '600',
  },
  disclaimer: {
    color: '#5e6671',
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
});
