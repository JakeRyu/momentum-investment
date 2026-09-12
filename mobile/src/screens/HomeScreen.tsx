import { StatusBar } from 'expo-status-bar';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { CardState } from '../../App';
import StrategyDecisionCard from '../components/StrategyDecisionCard';
import { holdingHint, inForceMonthKey } from '../rebalance';
import { findStrategy, type StrategyId } from '../strategies';

export type HomeScreenProps = {
  registered: StrategyId[];
  results: Partial<Record<StrategyId, CardState>>;
  markers: Partial<Record<StrategyId, string>>;
  refreshing: boolean;
  onRefresh: () => void;
  onToggleDone: (id: StrategyId) => void;
  onOpenStrategy: (id: StrategyId) => void;
  onOpenSettings: () => void;
};

export default function HomeScreen({
  registered,
  results,
  markers,
  refreshing,
  onRefresh,
  onToggleDone,
  onOpenStrategy,
  onOpenSettings,
}: HomeScreenProps) {
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
                onToggleDone={() => onToggleDone(id)}
                onPress={() => onOpenStrategy(id)}
              />
            );
          })}
        </View>

        <TouchableOpacity onPress={onOpenSettings} activeOpacity={0.7} style={styles.manageRow}>
          <Text style={styles.manageRowText}>Manage my strategies →</Text>
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
  manageRow: {
    marginTop: 20,
    alignItems: 'center',
  },
  manageRowText: {
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
