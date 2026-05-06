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

import { getApiBaseUrl, type AllocationDecision, type AssetMomentum, type Region } from '../api/apiBase';
import { fetchDaaG12Decision } from '../api/daaClient';
import { fetchVaaDecision } from '../api/vaaClient';
import type { Strategy } from '../strategies';

/**
 * Discriminated union of the strategy-specific query parameters. Any new
 * Keller strategy (PAA / BAA / HAA / ...) adds a variant here and the
 * matching `fetchXxxDecision` call site below.
 */
export type DecisionRequest =
  | { kind: 'vaa'; offensive: string[]; defensive: string[] }
  | { kind: 'daa-g12'; canary: readonly string[]; risky: readonly string[]; cash: readonly string[] };

export type DecisionScreenProps = {
  strategy: Strategy;
  asOf: string;
  /** Used for the header subtitle on region-aware strategies (VAA). DAA ignores this in Phase 1. */
  region: Region;
  request: DecisionRequest;
  onBack: () => void;
};

const REGION_FLAG: Record<Region, string> = {
  US: '🇺🇸',
  UK: '🇬🇧',
};

/**
 * Display label per backend `strategyId`. Lets the title ("VAA-G4/B3" /
 * "DAA-G12") come from the response so we don't have to keep two sources
 * of truth in sync.
 */
const STRATEGY_LABELS: Record<string, string> = {
  'vaa-g4b3': 'VAA-G4/B3',
  'daa-g12': 'DAA-G12',
};

const MODE_BADGE_COLOR: Record<string, string> = {
  Offensive: '#7ed4a3',
  Defensive: '#ffb37e',
  Hybrid: '#ffd980',
};

function formatScore(score: number): string {
  return (score >= 0 ? '+' : '') + score.toFixed(4);
}

function formatPercent(weight: number): string {
  // 16.67% style. 1.0 → "100%" (no decimals when integer to keep VAA's
  // single-asset case clean).
  const pct = weight * 100;
  return Number.isInteger(pct) ? `${pct.toFixed(0)}%` : `${pct.toFixed(2)}%`;
}

export default function DecisionScreen({
  strategy,
  asOf,
  region,
  request,
  onBack,
}: DecisionScreenProps) {
  const [decision, setDecision] = useState<AllocationDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Stable string key over the request payload so useEffect re-fires only
  // when the actual ticker lists change (not on every parent re-render).
  const requestKey =
    request.kind === 'vaa'
      ? `vaa:${request.offensive.join(',')}|${request.defensive.join(',')}`
      : `daa-g12:${request.canary.join(',')}|${request.risky.join(',')}|${request.cash.join(',')}`;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const d =
        request.kind === 'vaa'
          ? await fetchVaaDecision(asOf, request.offensive, request.defensive)
          : await fetchDaaG12Decision(asOf, request.canary, request.risky, request.cash);
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
  }, [asOf, requestKey]);

  const title = decision
    ? STRATEGY_LABELS[decision.strategyId] ?? strategy.shortName
    : strategy.shortName;

  // VAA's universe is region-aware; DAA's Phase-1 universe is US-only and
  // not user-configurable, so the region tag would be misleading there.
  const showRegion = request.kind === 'vaa';
  const subtitle = showRegion
    ? `As of ${asOf}  ·  ${REGION_FLAG[region]} ${region} universe`
    : `As of ${asOf}`;

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

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

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

        {decision && <DecisionCard decision={decision} />}
      </ScrollView>
    </View>
  );
}

function DecisionCard({ decision }: { decision: AllocationDecision }) {
  const allocatedTickers = new Set(decision.allocations.map((a) => a.ticker));
  const modeColor = MODE_BADGE_COLOR[decision.modeLabel] ?? '#8a93a0';

  // Distinct buckets in the order they were emitted by the backend (canary,
  // risky, cash for DAA; offensive, defensive for VAA).
  const bucketOrder: string[] = [];
  for (const s of decision.scores) {
    if (!bucketOrder.includes(s.bucket)) bucketOrder.push(s.bucket);
  }

  return (
    <View style={styles.card}>
      <Text style={[styles.modeLabel, { color: modeColor }]}>
        {decision.modeLabel.toUpperCase()} MODE
      </Text>

      <AllocationsBlock allocations={decision.allocations} accent={modeColor} />

      <Text style={styles.reasoning}>{decision.reasoning}</Text>

      {bucketOrder.map((bucket) => (
        <ScoreSection
          key={bucket}
          title={bucket}
          rows={decision.scores.filter((s) => s.bucket === bucket)}
          allocatedTickers={allocatedTickers}
        />
      ))}
    </View>
  );
}

function AllocationsBlock({
  allocations,
  accent,
}: {
  allocations: AllocationDecision['allocations'];
  accent: string;
}) {
  // Single-asset case (VAA, or DAA's b=2 path): hero treatment so the one
  // pick is visually impactful.
  if (allocations.length === 1) {
    const a = allocations[0];
    return (
      <View>
        <Text style={styles.heroTicker}>{a.ticker}</Text>
        <Text style={[styles.heroWeight, { color: accent }]}>{formatPercent(a.weight)}</Text>
      </View>
    );
  }

  // Multi-asset case (DAA b=0/1): list with weights and a footer total so
  // 6×16.67% summing to ~100% is obvious to the reader.
  const total = allocations.reduce((acc, a) => acc + a.weight, 0);
  return (
    <View style={styles.allocList}>
      {allocations.map((a) => (
        <View key={a.ticker} style={styles.allocRow}>
          <Text style={[styles.allocTicker, { color: accent }]}>{a.ticker}</Text>
          <Text style={styles.allocWeight}>{formatPercent(a.weight)}</Text>
        </View>
      ))}
      <View style={[styles.allocRow, styles.allocTotalRow]}>
        <Text style={styles.allocTotalLabel}>Total</Text>
        <Text style={styles.allocTotalWeight}>{formatPercent(total)}</Text>
      </View>
    </View>
  );
}

function ScoreSection({
  title,
  rows,
  allocatedTickers,
}: {
  title: string;
  rows: AssetMomentum[];
  allocatedTickers: Set<string>;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      {rows.map((r) => (
        <View key={`${r.bucket}:${r.ticker}`} style={styles.row}>
          <Text
            style={[styles.rowTicker, allocatedTickers.has(r.ticker) && styles.rowTickerHighlight]}
          >
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
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  // Single-asset hero (VAA, or DAA defensive)
  heroTicker: {
    color: '#f4f6f8',
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroWeight: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  // Multi-asset list (DAA offensive / hybrid)
  allocList: {
    marginTop: 8,
    marginBottom: 4,
  },
  allocRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  allocTicker: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  allocWeight: {
    color: '#cfd5dc',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
  },
  allocTotalRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2a2f37',
  },
  allocTotalLabel: {
    color: '#8a93a0',
    fontSize: 13,
    fontWeight: '600',
  },
  allocTotalWeight: {
    color: '#8a93a0',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  reasoning: {
    color: '#cfd5dc',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
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
