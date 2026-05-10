import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { getApiBaseUrl, type AllocationDecision, type AssetMomentum, type Region } from '../api/apiBase';
import { fetchDaaG12Decision } from '../api/daaClient';
import { fetchLaaDecision } from '../api/laaClient';
import { fetchPaaDecision, type PaaProtectionFactor } from '../api/paaClient';
import { fetchVaaDecision } from '../api/vaaClient';
import type { Strategy } from '../strategies';

/**
 * Discriminated union of the strategy-specific query parameters. Any new
 * Keller strategy (BAA / HAA / ...) adds a variant here and the matching
 * `fetchXxxDecision` call site below.
 *
 * PAA's protection factor `a` is intentionally NOT part of the request
 * struct — it lives as App-level state and is passed to this screen as
 * a sibling prop (`paaA`), so the segmented control here can toggle it
 * freely without rebuilding the screen state. The request describes
 * "which universe to evaluate"; `paaA` describes "at which protection
 * level". Same separation will likely apply if BAA/HAA introduce their
 * own user-tunable parameters.
 */
export type DecisionRequest =
  | { kind: 'vaa'; offensive: string[]; defensive: string[] }
  | { kind: 'daa-g12'; canary: readonly string[]; risky: readonly string[]; cash: readonly string[] }
  | { kind: 'paa'; risky: readonly string[]; cash: readonly string[] }
  | {
      kind: 'laa';
      permanent: readonly string[];
      risky: string;
      cash: string;
      signalEquity: string;
      unemploymentSeriesId: string;
    };

export type DecisionScreenProps = {
  strategy: Strategy;
  asOf: string;
  /**
   * Region tag shown in the header subtitle. Both VAA and DAA are
   * region-aware now (their universes resolve via per-asset-class
   * overrides for UK), so the flag always reflects which ETF set was
   * sent to the backend.
   */
  region: Region;
  request: DecisionRequest;
  /**
   * Current PAA protection factor. Only meaningful for `request.kind ===
   * 'paa'`, but threaded unconditionally so the type stays simple — the
   * UI just doesn't render the selector for non-PAA strategies.
   */
  paaA: PaaProtectionFactor;
  onPaaAChange: (a: PaaProtectionFactor) => void;
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
  // PAA backend response carries a variant suffix (`paa-g12-a0|a1|a2`)
  // for future history-view consumers, but the title shows a single
  // "PAA-G12" — the variant is signalled to the user by the segmented
  // control below the title, not the title itself.
  'paa-g12-a0': 'PAA-G12',
  'paa-g12-a1': 'PAA-G12',
  'paa-g12-a2': 'PAA-G12',
  'laa': 'LAA',
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
  paaA,
  onPaaAChange,
  onBack,
}: DecisionScreenProps) {
  const [decision, setDecision] = useState<AllocationDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Stable string key over the request payload so useEffect re-fires only
  // when the actual ticker lists change (not on every parent re-render).
  // For PAA, `paaA` is part of the key so toggling the segmented control
  // triggers a refetch — same universe so the backend hits its 6h ticker
  // cache and the response comes back instantly.
  const requestKey = (() => {
    switch (request.kind) {
      case 'vaa':
        return `vaa:${request.offensive.join(',')}|${request.defensive.join(',')}`;
      case 'daa-g12':
        return `daa-g12:${request.canary.join(',')}|${request.risky.join(',')}|${request.cash.join(',')}`;
      case 'paa':
        return `paa:${request.risky.join(',')}|${request.cash.join(',')}|a=${paaA}`;
      case 'laa':
        return (
          `laa:${request.permanent.join(',')}|${request.risky}|${request.cash}` +
          `|${request.signalEquity}|${request.unemploymentSeriesId}`
        );
    }
  })();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      let d: AllocationDecision;
      switch (request.kind) {
        case 'vaa':
          d = await fetchVaaDecision(asOf, request.offensive, request.defensive);
          break;
        case 'daa-g12':
          d = await fetchDaaG12Decision(asOf, request.canary, request.risky, request.cash);
          break;
        case 'paa':
          d = await fetchPaaDecision(asOf, request.risky, request.cash, paaA);
          break;
        case 'laa':
          d = await fetchLaaDecision(
            asOf,
            request.permanent,
            request.risky,
            request.cash,
            request.signalEquity,
            request.unemploymentSeriesId,
          );
          break;
      }
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

  // Both VAA and DAA resolve their universe via the region picker +
  // per-asset-class overrides on the mobile side, so the region flag is
  // meaningful for either.
  const subtitle = `As of ${asOf}  ·  ${REGION_FLAG[region]} ${region} universe`;

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

        {request.kind === 'paa' && (
          <ProtectionFactorPicker value={paaA} onChange={onPaaAChange} />
        )}

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

/**
 * Three-way segmented control over PAA's protection factor `a`. Sits
 * between the screen subtitle and the result card, only rendered for
 * `request.kind === 'paa'`. Toggling triggers a refetch via `requestKey`,
 * which hits the backend ticker cache (6h TTL) so swaps are instantaneous
 * after the first fetch.
 */
function ProtectionFactorPicker({
  value,
  onChange,
}: {
  value: PaaProtectionFactor;
  onChange: (a: PaaProtectionFactor) => void;
}) {
  const options: { v: PaaProtectionFactor; label: string; sub: string }[] = [
    { v: 0, label: 'PAA0', sub: 'Aggressive' },
    { v: 1, label: 'PAA1', sub: 'Moderate' },
    { v: 2, label: 'PAA2', sub: 'Vigilant' },
  ];

  return (
    <View style={styles.protectionWrap}>
      <Text style={styles.protectionLabel}>PROTECTION LEVEL</Text>
      <View style={styles.protectionRow}>
        {options.map((opt) => {
          const selected = opt.v === value;
          return (
            <TouchableOpacity
              key={opt.v}
              style={[styles.protectionSegment, selected && styles.protectionSegmentSelected]}
              onPress={() => onChange(opt.v)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.protectionSegmentLabel,
                  selected && styles.protectionSegmentLabelSelected,
                ]}
              >
                {opt.label}
              </Text>
              <Text
                style={[
                  styles.protectionSegmentSub,
                  selected && styles.protectionSegmentSubSelected,
                ]}
              >
                {opt.sub}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
  // The "Signal" bucket (currently only LAA) carries macro trend
  // deviations rather than per-asset momentum, and the bearish-trigger
  // direction is signal-specific (SPY: bearish when below SMA → score
  // negative; UNRATE: bearish when above SMA → score positive). The
  // generic "negative = red" colouring used for momentum scores would be
  // misleading here, so we render Signal rows neutrally and add a
  // direction hint underneath the value.
  const isSignalSection = title.toLowerCase() === 'signal';

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {isSignalSection ? 'MACRO SIGNALS' : title.toUpperCase()}
      </Text>
      {rows.map((r) => (
        <View key={`${r.bucket}:${r.ticker}`} style={styles.row}>
          <View style={styles.rowLeft}>
            <Text
              style={[styles.rowTicker, allocatedTickers.has(r.ticker) && styles.rowTickerHighlight]}
            >
              {r.ticker}
            </Text>
            {isSignalSection && (
              <Text style={styles.signalCaption}>{signalCaption(r.ticker, r.score)}</Text>
            )}
          </View>
          <Text
            style={[
              styles.rowScore,
              !isSignalSection && r.score < 0 && styles.rowScoreNegative,
            ]}
          >
            {isSignalSection ? formatSignal(r.score) : formatScore(r.score)}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Per-signal direction hint shown below the ticker. Hardcoded to the two
 * macro signals LAA emits (SPY price-trend, UNRATE rate-trend); a future
 * macro-aware strategy would extend this map.
 */
function signalCaption(ticker: string, score: number): string {
  const above = score > 0;
  const at = Math.abs(score) < 1e-9;
  if (ticker === 'SPY') {
    if (at) return 'at 200d SMA';
    return above ? 'above 200d SMA · bullish' : 'below 200d SMA · bearish';
  }
  if (ticker === 'UNRATE') {
    if (at) return 'at 12mo SMA';
    return above ? 'above 12mo SMA · bearish' : 'below 12mo SMA · bullish';
  }
  return '';
}

function formatSignal(score: number): string {
  // Trend deviation as a percentage of SMA, e.g. "+2.45%" / "-4.98%".
  const pct = score * 100;
  return (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
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
  // PAA protection-factor segmented control. Sits between subtitle and
  // result card, hugging the same horizontal padding as the rest of the
  // screen so it visually aligns with title/card edges.
  protectionWrap: {
    marginBottom: 20,
  },
  protectionLabel: {
    color: '#8a93a0',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  protectionRow: {
    flexDirection: 'row',
    backgroundColor: '#161a1f',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  protectionSegment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  protectionSegmentSelected: {
    backgroundColor: '#22323a',
    // Subtle border so the active segment reads against the card behind.
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#7ed4a3',
  },
  protectionSegmentLabel: {
    color: '#8a93a0',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  protectionSegmentLabelSelected: {
    color: '#7ed4a3',
  },
  protectionSegmentSub: {
    color: '#5b6470',
    fontSize: 11,
    marginTop: 2,
  },
  protectionSegmentSubSelected: {
    color: '#cfd5dc',
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
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowLeft: {
    flex: 1,
    gap: 2,
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
  signalCaption: {
    color: '#8a93a0',
    fontSize: 12,
    fontStyle: 'italic',
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
