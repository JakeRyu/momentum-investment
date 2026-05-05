import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { fetchVaaDecision, getApiBaseUrl, type VaaDecision } from '../api/vaaClient';
import type { Strategy } from '../strategies';

function formatScore(score: number): string {
  return (score >= 0 ? '+' : '') + score.toFixed(4);
}

export type DecisionScreenProps = {
  strategy: Strategy;
  asOf: string;
  onBack: () => void;
};

export default function DecisionScreen({ strategy, asOf, onBack }: DecisionScreenProps) {
  const [decision, setDecision] = useState<VaaDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchVaaDecision(asOf);
      setDecision(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asOf]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} hitSlop={12}>
            <Text style={styles.back}>← 뒤로</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>{strategy.shortName}-G4/B3</Text>
        <Text style={styles.subtitle}>As of {asOf}</Text>

        {loading && !decision && (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.muted}>Fetching decision…</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Could not load decision</Text>
            <Text style={styles.errorBody}>{error}</Text>
            <Text style={styles.muted}>API: {getApiBaseUrl()}</Text>
          </View>
        )}

        {decision && (
          <View style={styles.card}>
            <Text style={styles.modeLabel}>{decision.mode.toUpperCase()} MODE</Text>
            <Text style={styles.ticker}>{decision.selectedTicker}</Text>
            <Text style={styles.score}>{formatScore(decision.selectedScore)}</Text>
            <Text style={styles.reasoning}>{decision.reasoning}</Text>

            <Section
              title="Offensive (G4)"
              rows={decision.offensiveScores}
              highlight={decision.selectedTicker}
            />
            <Section
              title="Defensive (B3)"
              rows={decision.defensiveScores}
              highlight={decision.selectedTicker}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  rows,
  highlight,
}: {
  title: string;
  rows: { ticker: string; score: number }[];
  highlight: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {rows.map((r) => (
        <View key={r.ticker} style={styles.row}>
          <Text style={[styles.rowTicker, r.ticker === highlight && styles.rowTickerHighlight]}>
            {r.ticker}
          </Text>
          <Text style={[styles.rowScore, r.score < 0 && styles.rowScoreNegative]}>
            {formatScore(r.score)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0b0d10',
  },
  content: {
    padding: 24,
    paddingTop: 64,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  back: {
    color: '#7ed4a3',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#f4f6f8',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#8a93a0',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 24,
  },
  center: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  muted: {
    color: '#8a93a0',
    fontSize: 13,
  },
  errorBox: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#311b1b',
    gap: 6,
  },
  errorTitle: {
    color: '#ff8a8a',
    fontWeight: '600',
  },
  errorBody: {
    color: '#f4d6d6',
    fontSize: 13,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#161a1f',
    gap: 8,
  },
  modeLabel: {
    color: '#8a93a0',
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  ticker: {
    color: '#f4f6f8',
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: 1,
  },
  score: {
    color: '#7ed4a3',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  reasoning: {
    color: '#cfd5dc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  section: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2a2f37',
  },
  sectionTitle: {
    color: '#8a93a0',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rowTicker: {
    color: '#cfd5dc',
    fontSize: 16,
    fontWeight: '500',
  },
  rowTickerHighlight: {
    color: '#7ed4a3',
    fontWeight: '700',
  },
  rowScore: {
    color: '#cfd5dc',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  rowScoreNegative: {
    color: '#ff8a8a',
  },
});
