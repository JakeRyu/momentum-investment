import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import type { AllocationDecision } from '../api/apiBase';
import type { Strategy } from '../strategies';

export type StrategyDecisionCardProps = {
  strategy: Strategy;
  /** null while loading. */
  decision: AllocationDecision | null;
  /** Non-null when this card's fetch failed; the card shows it inline. */
  error: string | null;
  /** Output of holdingHint() — the same line on every card. */
  holdingLine: string;
  done: boolean;
  onToggleDone: () => void;
  onPress: () => void;
};

// Same map as DecisionScreen's mode badge.
const MODE_BADGE_COLOR: Record<string, string> = {
  Offensive: '#7ed4a3',
  Defensive: '#ffb37e',
  Hybrid: '#ffd980',
};

function formatPercent(weight: number): string {
  // 16.67% style. 1.0 → "100%" (no decimals when integer to keep VAA's
  // single-asset case clean). Matches DecisionScreen's formatPercent.
  const pct = weight * 100;
  return Number.isInteger(pct) ? `${pct.toFixed(0)}%` : `${pct.toFixed(2)}%`;
}

export default function StrategyDecisionCard({
  strategy,
  decision,
  error,
  holdingLine,
  done,
  onToggleDone,
  onPress,
}: StrategyDecisionCardProps) {
  const modeColor = decision ? MODE_BADGE_COLOR[decision.modeLabel] ?? '#8a93a0' : '#8a93a0';

  return (
    <Pressable
      style={[styles.card, done ? styles.cardDone : styles.cardPending]}
      onPress={onPress}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.shortName}>{strategy.shortName}</Text>
          <Text style={styles.fullName} numberOfLines={1}>
            {strategy.fullName}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {decision && (
            <Text style={[styles.modeBadge, { color: modeColor }]}>
              {decision.modeLabel.toUpperCase()}
            </Text>
          )}
          {/* The card is the only route to the fund names, the mode caption
              and the link out to the web, so it has to look like a door. */}
          <Text style={styles.chevron}>›</Text>
        </View>
      </View>

      <Text style={styles.holdingLine}>{holdingLine}</Text>

      {error !== null ? (
        <Text style={styles.errorText}>Could not load</Text>
      ) : decision !== null ? (
        <View style={styles.allocList}>
          {decision.allocations.map((a) => (
            <View key={a.ticker} style={styles.allocRow}>
              <View style={styles.allocRowLeft}>
                <Text style={styles.allocTicker}>{a.ticker}</Text>
              </View>
              <Text style={styles.allocWeight}>{formatPercent(a.weight)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Skeleton />
      )}

      <View style={styles.footerRow}>
        <Pressable
          style={[styles.donePill, done && styles.donePillDone]}
          onPress={(e) => {
            e.stopPropagation();
            onToggleDone();
          }}
          hitSlop={8}
        >
          <Text style={[styles.doneText, done && styles.doneTextDone]}>
            {done ? '✓ Rebalanced' : 'Mark as rebalanced'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

// Skeleton placeholder shown while a card's decision is loading. Pulses the
// bars (breathing, not blinking) so a multi-second wait doesn't read as a
// stall, and names what's actually happening behind it.
function Skeleton() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.allocList}>
      <Text style={styles.skeletonLabel}>Analysing 12 months of live prices</Text>
      <Animated.View style={[styles.skeletonBar, { width: '60%', opacity: pulse }]} />
      <Animated.View style={[styles.skeletonBar, { width: '45%', opacity: pulse }]} />
      <Animated.View style={[styles.skeletonBar, { width: '52%', opacity: pulse }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161a1f',
    borderRadius: 16,
    padding: 16,
  },
  cardPending: {
    borderWidth: 1,
    borderColor: '#2a2f37',
  },
  cardDone: {
    borderWidth: 1,
    borderColor: 'transparent',
    opacity: 0.65,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    paddingRight: 12,
  },
  shortName: {
    color: '#f4f6f8',
    fontSize: 16,
    fontWeight: '700',
  },
  fullName: {
    color: '#8a93a0',
    fontSize: 13,
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeBadge: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  chevron: {
    color: '#5e6671',
    fontSize: 20,
    lineHeight: 20,
  },
  holdingLine: {
    color: '#8a93a0',
    fontSize: 12,
    marginTop: 4,
  },
  allocList: {
    marginTop: 12,
    gap: 6,
  },
  allocRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  allocRowLeft: {
    flex: 1,
    paddingRight: 12,
  },
  allocTicker: {
    color: '#f4f6f8',
    fontSize: 16,
    fontWeight: '600',
  },
  allocWeight: {
    color: '#cfd5dc',
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  skeletonLabel: {
    color: '#8a93a0',
    fontSize: 12,
  },
  skeletonBar: {
    height: 16,
    borderRadius: 4,
    backgroundColor: '#2a2f37',
  },
  errorText: {
    color: '#ff8a8a',
    fontSize: 13,
    marginTop: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
  },
  // Emphasis runs the opposite way to a selected control: the pending pill is
  // the outstanding action and should pull the eye, while the done pill is a
  // receipt. The card itself already drops to 0.65 opacity when done, so this
  // only has to avoid fighting that.
  donePill: {
    borderWidth: 1,
    borderColor: '#7ed4a3',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  donePillDone: {
    borderColor: '#2a2f37',
  },
  doneText: {
    color: '#7ed4a3',
    fontSize: 13,
    fontWeight: '600',
  },
  doneTextDone: {
    color: '#8a93a0',
  },
});
