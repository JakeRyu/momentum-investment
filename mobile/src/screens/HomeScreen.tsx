import { StatusBar } from 'expo-status-bar';
import {
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { CardState } from '../../App';
import { anyOutdated } from '../appVersion';
import StrategyDecisionCard from '../components/StrategyDecisionCard';
import UpdateBanner from '../components/UpdateBanner';
import { holdingHint, inForceMonthKey } from '../rebalance';
import { findStrategy, type StrategyId } from '../strategies';
import { WEB_BASE_URL } from '../webLinks';

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
            <Text style={styles.title}>Monthly Rule</Text>
            {/* The name only means something once it is spelled out: a
                decision made on a schedule by a rule, and cards that are
                already the answer to it. */}
            <Text style={styles.subtitle}>One decision a month, not a hunch.</Text>
            <Text style={styles.subtitleSecond}>Each card is this month&apos;s answer.</Text>
            <Text style={styles.credit}>Strategies by Wouter Keller</Text>
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

        {anyOutdated(Object.values(results)) && <UpdateBanner />}

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

        {/* A button, and the cards' own chevron: this one stays inside the
            app, unlike the link below it. Both said "→" before, which
            promised the same thing for a screen and for a browser. */}
        <TouchableOpacity onPress={onOpenSettings} activeOpacity={0.7} style={styles.manageRow}>
          <Text style={styles.manageRowText}>Manage my strategies</Text>
          <Text style={styles.manageRowChevron}>›</Text>
        </TouchableOpacity>

        {/* The app deliberately teaches nothing about choosing a strategy —
            that lives on the web. Without a way out, a reader who does not
            recognise these names has nowhere to go. */}
        <TouchableOpacity
          onPress={() => Linking.openURL(WEB_BASE_URL)}
          activeOpacity={0.7}
          style={styles.learnRow}
        >
          <Text style={styles.learnRowText}>How these strategies work ↗</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.disclaimer}>
          Computed from the published rules on live market data. Not investment
          advice.
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#161a1f',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  gearText: {
    color: '#cfd5dc',
    fontSize: 40,
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
  subtitleSecond: {
    color: '#8a93a0',
    fontSize: 14,
    marginTop: 2,
  },
  credit: {
    color: '#5e6671',
    fontSize: 12,
    marginTop: 8,
  },
  cardList: {
    gap: 12,
  },
  manageRow: {
    marginTop: 24,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2a2f37',
    backgroundColor: '#161a1f',
  },
  manageRowText: {
    color: '#7ed4a3',
    fontSize: 15,
    fontWeight: '600',
  },
  manageRowChevron: {
    color: '#7ed4a3',
    fontSize: 18,
  },
  learnRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  learnRowText: {
    color: '#8a93a0',
    fontSize: 13,
  },
  disclaimer: {
    color: '#5e6671',
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
});
