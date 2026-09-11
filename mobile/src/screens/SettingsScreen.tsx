import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { Region } from '../api/apiBase';
import { STRATEGIES, type StrategyId } from '../strategies';

export type SettingsScreenProps = {
  registered: StrategyId[];
  onRegisteredChange: (ids: StrategyId[]) => void;
  region: Region;
  onRegionChange: (r: Region) => void;
  onOpenEtfConfig: () => void;
  onBack: () => void;
};

const REGION_OPTIONS: { value: Region; label: string; sub: string }[] = [
  { value: 'US', label: '🇺🇸 US', sub: 'NYSE/NASDAQ' },
  { value: 'UK', label: '🇬🇧 UK', sub: 'LSE UCITS' },
];

export default function SettingsScreen({
  registered,
  onRegisteredChange,
  region,
  onRegionChange,
  onOpenEtfConfig,
  onBack,
}: SettingsScreenProps) {
  const toggleStrategy = (id: StrategyId) => {
    const isRegistered = registered.includes(id);
    if (isRegistered) {
      // Refuse to drop the last registered strategy.
      if (registered.length <= 1) return;
      onRegisteredChange(registered.filter((r) => r !== id));
      return;
    }
    // Preserve STRATEGIES order so home's card order is stable.
    const next = STRATEGIES.filter((s) => s.id === id || registered.includes(s.id)).map(
      (s) => s.id,
    );
    onRegisteredChange(next);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Settings</Text>

        <Text style={styles.sectionLabel}>My strategies</Text>
        <View style={styles.strategyList}>
          {STRATEGIES.map((s) => {
            const checked = registered.includes(s.id);
            return (
              <TouchableOpacity
                key={s.id}
                style={styles.strategyRow}
                onPress={() => toggleStrategy(s.id)}
                activeOpacity={0.7}
              >
                <View style={styles.strategyTextWrap}>
                  <Text style={styles.strategyShort}>{s.shortName}</Text>
                  <Text style={styles.strategyFull}>{s.fullName}</Text>
                </View>
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Region</Text>
        <View style={styles.segmented}>
          {REGION_OPTIONS.map((opt) => {
            const selected = opt.value === region;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.segment, selected && styles.segmentSelected]}
                onPress={() => onRegionChange(opt.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>
                  {opt.label}
                </Text>
                <Text style={[styles.segmentSub, selected && styles.segmentSubSelected]}>
                  {opt.sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>ETF universe</Text>
        <TouchableOpacity style={styles.linkRow} onPress={onOpenEtfConfig} activeOpacity={0.7}>
          <Text style={styles.linkRowText}>Customise tickers</Text>
          <Text style={styles.linkRowArrow}>→</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 48,
  },
  back: {
    color: '#7ed4a3',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  title: {
    color: '#f4f6f8',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 28,
  },
  sectionLabel: {
    color: '#8a93a0',
    fontSize: 12,
    letterSpacing: 1.4,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 12,
  },
  strategyList: {
    gap: 8,
    marginBottom: 28,
  },
  strategyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#161a1f',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 12,
  },
  strategyTextWrap: {
    flex: 1,
    gap: 4,
  },
  strategyShort: {
    color: '#f4f6f8',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  strategyFull: {
    color: '#cfd5dc',
    fontSize: 13,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3a414c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: '#7ed4a3',
    backgroundColor: '#7ed4a3',
  },
  checkmark: {
    color: '#0b0d10',
    fontSize: 14,
    fontWeight: '700',
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#161a1f',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginBottom: 28,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  segmentSelected: {
    backgroundColor: '#1a2620',
    borderWidth: 1,
    borderColor: '#7ed4a3',
  },
  segmentLabel: {
    color: '#8a93a0',
    fontSize: 15,
    fontWeight: '600',
  },
  segmentLabelSelected: {
    color: '#f4f6f8',
  },
  segmentSub: {
    color: '#5e6671',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  segmentSubSelected: {
    color: '#7ed4a3',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#161a1f',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  linkRowText: {
    color: '#f4f6f8',
    fontSize: 15,
    fontWeight: '600',
  },
  linkRowArrow: {
    color: '#7ed4a3',
    fontSize: 16,
    fontWeight: '700',
  },
});
