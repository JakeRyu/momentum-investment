import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { STRATEGIES, type Strategy, type StrategyId } from '../strategies';
import { formatYmd } from '../utils';

export type HomeScreenProps = {
  selectedStrategyId: StrategyId;
  onStrategyChange: (id: StrategyId) => void;
  asOfDate: Date;
  onAsOfChange: (d: Date) => void;
  onConfirm: () => void;
};

export default function HomeScreen({
  selectedStrategyId,
  onStrategyChange,
  asOfDate,
  onAsOfChange,
  onConfirm,
}: HomeScreenProps) {
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Momentum Investment</Text>
        <Text style={styles.subtitle}>Wouter Keller momentum strategies</Text>

        <Text style={styles.sectionLabel}>기준일 (As of)</Text>
        {Platform.OS === 'ios' ? (
          <View style={styles.dateRow}>
            <DateTimePicker
              value={asOfDate}
              mode="date"
              display="compact"
              themeVariant="dark"
              maximumDate={new Date()}
              onChange={(_, d) => d && onAsOfChange(d)}
            />
            <Text style={styles.dateText}>{formatYmd(asOfDate)}</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.androidDateButton}
              onPress={() => setShowAndroidPicker(true)}
            >
              <Text style={styles.androidDateText}>{formatYmd(asOfDate)}</Text>
            </TouchableOpacity>
            {showAndroidPicker && (
              <DateTimePicker
                value={asOfDate}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(_, d) => {
                  setShowAndroidPicker(false);
                  if (d) onAsOfChange(d);
                }}
              />
            )}
          </>
        )}

        <Text style={styles.sectionLabel}>전략 (Strategy)</Text>
        <View style={styles.strategyList}>
          {STRATEGIES.map((s) => (
            <StrategyRow
              key={s.id}
              strategy={s}
              selected={s.id === selectedStrategyId}
              onPress={() => onStrategyChange(s.id)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.confirm, pressed && styles.confirmPressed]}
          onPress={onConfirm}
        >
          <Text style={styles.confirmText}>추천 종목 보기</Text>
        </Pressable>
      </View>
    </View>
  );
}

function StrategyRow({
  strategy,
  selected,
  onPress,
}: {
  strategy: Strategy;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.strategyRow, selected && styles.strategyRowSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <View style={styles.strategyTextWrap}>
        <View style={styles.strategyHeaderRow}>
          <Text style={styles.strategyShort}>{strategy.shortName}</Text>
          <Text style={styles.strategyFull}>{strategy.fullName}</Text>
          {!strategy.implemented && (
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming soon</Text>
            </View>
          )}
        </View>
        <Text style={styles.strategyBlurb}>{strategy.blurb}</Text>
      </View>
    </TouchableOpacity>
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
  title: {
    color: '#f4f6f8',
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    color: '#8a93a0',
    fontSize: 14,
    marginTop: 4,
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  dateText: {
    color: '#cfd5dc',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  androidDateButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#161a1f',
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  androidDateText: {
    color: '#f4f6f8',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  strategyList: {
    gap: 8,
    marginBottom: 28,
  },
  strategyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#161a1f',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 12,
  },
  strategyRowSelected: {
    borderColor: '#7ed4a3',
    backgroundColor: '#1a2620',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#3a414c',
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#7ed4a3',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7ed4a3',
  },
  strategyTextWrap: {
    flex: 1,
    gap: 4,
  },
  strategyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
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
    flexShrink: 1,
  },
  comingSoonBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#2a2f37',
    borderRadius: 4,
  },
  comingSoonText: {
    color: '#8a93a0',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  strategyBlurb: {
    color: '#8a93a0',
    fontSize: 12,
    lineHeight: 16,
  },
  confirm: {
    backgroundColor: '#7ed4a3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmPressed: {
    opacity: 0.8,
  },
  confirmText: {
    color: '#0b0d10',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
