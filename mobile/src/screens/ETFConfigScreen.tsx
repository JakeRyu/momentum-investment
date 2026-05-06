import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  probeTicker,
  TickerNotFoundError,
  type EtfMetadata,
} from '../api/etfProbeClient';
import type { Region } from '../api/vaaClient';
import {
  ASSET_CLASSES,
  VAA_DEFENSIVE,
  VAA_OFFENSIVE,
  findEtfOption,
  isTickerInCurated,
  type AssetClassCode,
} from '../etfCatalog';
import type { CustomEtfEntry, CustomTickers, Overrides } from '../storage';
import { pickTicker } from '../universe';

export type ETFConfigScreenProps = {
  region: Region;
  overrides: Overrides;
  customs: CustomTickers;
  onOverrideChange: (code: AssetClassCode, ticker: string) => void;
  onAddCustom: (code: AssetClassCode, entry: CustomEtfEntry) => void;
  onRemoveCustom: (code: AssetClassCode, ticker: string) => void;
  onReset: () => void;
  onBack: () => void;
};

export default function ETFConfigScreen({
  region,
  overrides,
  customs,
  onOverrideChange,
  onAddCustom,
  onRemoveCustom,
  onReset,
  onBack,
}: ETFConfigScreenProps) {
  const [pickerFor, setPickerFor] = useState<AssetClassCode | null>(null);
  const editable = region === 'UK';
  const hasOverrides = Object.keys(overrides).length > 0;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>← 뒤로</Text>
        </Pressable>

        <Text style={styles.title}>ETF Universe</Text>
        <Text style={styles.subtitle}>
          {region === 'UK'
            ? '🇬🇧 UK · LSE-listed UCITS ETFs'
            : '🇺🇸 US · Original Keller universe (read-only)'}
        </Text>

        <Text style={styles.sectionLabel}>Offensive (G4)</Text>
        <View style={styles.list}>
          {VAA_OFFENSIVE.map((code) => (
            <AssetClassRow
              key={code}
              code={code}
              region={region}
              overrides={overrides}
              customs={customs}
              editable={editable}
              onPress={() => setPickerFor(code)}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Defensive (B3)</Text>
        <View style={styles.list}>
          {VAA_DEFENSIVE.map((code) => (
            <AssetClassRow
              key={code}
              code={code}
              region={region}
              overrides={overrides}
              customs={customs}
              editable={editable}
              onPress={() => setPickerFor(code)}
            />
          ))}
        </View>

        {editable && hasOverrides && (
          <Pressable style={styles.reset} onPress={onReset}>
            <Text style={styles.resetText}>Reset to defaults</Text>
          </Pressable>
        )}

        {!editable && (
          <Text style={styles.note}>
            US universe is fixed to the original Keller tickers (SPY, EFA, EEM, AGG, LQD, IEF,
            SHY). Switch to UK on the home screen to customise the LSE UCITS substitutes.
          </Text>
        )}
      </ScrollView>

      <Modal
        visible={pickerFor !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerFor(null)}
      >
        {pickerFor && (
          <PickerSheet
            code={pickerFor}
            currentTicker={pickTicker(pickerFor, region, overrides)}
            customs={customs[pickerFor] ?? []}
            onSelect={(ticker) => {
              onOverrideChange(pickerFor, ticker);
              setPickerFor(null);
            }}
            onAddCustom={(entry) => {
              onAddCustom(pickerFor, entry);
              setPickerFor(null);
            }}
            onRemoveCustom={(ticker) => onRemoveCustom(pickerFor, ticker)}
            onClose={() => setPickerFor(null)}
          />
        )}
      </Modal>
    </View>
  );
}

function AssetClassRow({
  code,
  region,
  overrides,
  customs,
  editable,
  onPress,
}: {
  code: AssetClassCode;
  region: Region;
  overrides: Overrides;
  customs: CustomTickers;
  editable: boolean;
  onPress: () => void;
}) {
  const def = ASSET_CLASSES[code];
  const ticker = pickTicker(code, region, overrides);
  const fromCurated = region === 'UK' ? findEtfOption(code, ticker) : undefined;
  const fromCustom =
    region === 'UK'
      ? (customs[code] ?? []).find((c) => c.ticker.toUpperCase() === ticker.toUpperCase())
      : undefined;
  const isOverridden = region === 'UK' && overrides[code] !== undefined;

  let subtitle: string;
  if (region !== 'UK') {
    subtitle = def.description;
  } else if (fromCurated) {
    subtitle =
      `${fromCurated.name} · ${fromCurated.ccy} ${fromCurated.dist}` +
      (fromCurated.note ? ` · ${fromCurated.note}` : '');
  } else if (fromCustom) {
    const meta = [fromCustom.ccy, fromCustom.exchange].filter(Boolean).join(' · ');
    subtitle = `${fromCustom.name}${meta ? ` · ${meta}` : ''} · custom`;
  } else {
    subtitle = `${def.description} · custom`;
  }

  const Inner = (
    <View style={[styles.row, isOverridden && styles.rowOverridden]}>
      <View style={styles.rowLeft}>
        <View style={styles.rowLabelLine}>
          <Text style={styles.rowLabel}>{def.label}</Text>
          {isOverridden && <View style={styles.dot} />}
        </View>
        <Text style={styles.rowSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowTicker}>{ticker}</Text>
        {editable && <Text style={styles.rowChange}>Change ▾</Text>}
      </View>
    </View>
  );

  if (!editable) return Inner;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {Inner}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Picker (slide-up sheet) with curated + custom + add-custom flow

type SheetMode = 'choose' | 'add';

function PickerSheet({
  code,
  currentTicker,
  customs,
  onSelect,
  onAddCustom,
  onRemoveCustom,
  onClose,
}: {
  code: AssetClassCode;
  currentTicker: string;
  customs: CustomEtfEntry[];
  onSelect: (ticker: string) => void;
  onAddCustom: (entry: CustomEtfEntry) => void;
  onRemoveCustom: (ticker: string) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<SheetMode>('choose');
  const def = ASSET_CLASSES[code];

  return (
    <Pressable style={styles.modalBackdrop} onPress={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrapper}
      >
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{def.label}</Text>
          <Text style={styles.modalSubtitle}>{def.description}</Text>

          {mode === 'choose' ? (
            <ChoiceList
              code={code}
              currentTicker={currentTicker}
              customs={customs}
              onSelect={onSelect}
              onRemoveCustom={onRemoveCustom}
              onStartAdd={() => setMode('add')}
              onClose={onClose}
            />
          ) : (
            <AddCustomForm
              code={code}
              existingCustoms={customs}
              onConfirm={(entry) => {
                onAddCustom(entry);
              }}
              onCancel={() => setMode('choose')}
            />
          )}
        </Pressable>
      </KeyboardAvoidingView>
    </Pressable>
  );
}

function ChoiceList({
  code,
  currentTicker,
  customs,
  onSelect,
  onRemoveCustom,
  onStartAdd,
  onClose,
}: {
  code: AssetClassCode;
  currentTicker: string;
  customs: CustomEtfEntry[];
  onSelect: (ticker: string) => void;
  onRemoveCustom: (ticker: string) => void;
  onStartAdd: () => void;
  onClose: () => void;
}) {
  const def = ASSET_CLASSES[code];
  return (
    <>
      <ScrollView style={styles.modalScroll}>
        <Text style={styles.groupLabel}>Curated</Text>
        {def.ukAlternatives.map((opt, idx) => {
          const selected = opt.ticker === currentTicker;
          const isCurated = idx === 0;
          return (
            <TouchableOpacity
              key={opt.ticker}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => onSelect(opt.ticker)}
              activeOpacity={0.7}
            >
              <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                {selected && <View style={styles.radioInner} />}
              </View>
              <View style={styles.optionTextWrap}>
                <View style={styles.optionTopRow}>
                  <Text style={styles.optionTicker}>{opt.ticker}</Text>
                  <Text style={styles.optionMeta}>
                    {opt.ccy} · {opt.dist}
                  </Text>
                  {isCurated && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.optionName}>{opt.name}</Text>
                {opt.note && <Text style={styles.optionNote}>{opt.note}</Text>}
              </View>
            </TouchableOpacity>
          );
        })}

        {customs.length > 0 && (
          <>
            <Text style={[styles.groupLabel, styles.groupLabelCustom]}>Your tickers</Text>
            {customs.map((entry) => {
              const selected = entry.ticker === currentTicker;
              return (
                <View
                  key={entry.ticker}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <TouchableOpacity
                    style={styles.customMain}
                    onPress={() => onSelect(entry.ticker)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                      {selected && <View style={styles.radioInner} />}
                    </View>
                    <View style={styles.optionTextWrap}>
                      <View style={styles.optionTopRow}>
                        <Text style={styles.optionTicker}>{entry.ticker}</Text>
                        <Text style={styles.optionMeta}>
                          {[entry.ccy, entry.exchange].filter(Boolean).join(' · ')}
                        </Text>
                      </View>
                      <Text style={styles.optionName} numberOfLines={2}>
                        {entry.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onRemoveCustom(entry.ticker)}
                    style={styles.removeButton}
                    hitSlop={8}
                    activeOpacity={0.5}
                  >
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}

        <Pressable style={styles.addCustom} onPress={onStartAdd}>
          <Text style={styles.addCustomText}>+ Add custom ticker</Text>
        </Pressable>
      </ScrollView>
      <Pressable style={styles.cancel} onPress={onClose}>
        <Text style={styles.cancelText}>취소</Text>
      </Pressable>
    </>
  );
}

function AddCustomForm({
  code,
  existingCustoms,
  onConfirm,
  onCancel,
}: {
  code: AssetClassCode;
  existingCustoms: CustomEtfEntry[];
  onConfirm: (entry: CustomEtfEntry) => void;
  onCancel: () => void;
}) {
  const [input, setInput] = useState('');
  const [probing, setProbing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<EtfMetadata | null>(null);

  const handleProbe = async () => {
    const ticker = input.trim().toUpperCase();
    if (!ticker) return;
    setError(null);
    setPreview(null);

    if (isTickerInCurated(code, ticker)) {
      setError(`${ticker} is already a curated option — pick it from the list.`);
      return;
    }
    if (existingCustoms.some((c) => c.ticker.toUpperCase() === ticker)) {
      setError(`${ticker} is already in your custom list.`);
      return;
    }

    setProbing(true);
    try {
      const meta = await probeTicker(ticker);
      setPreview(meta);
    } catch (e) {
      if (e instanceof TickerNotFoundError) {
        setError(`Yahoo couldn't find '${ticker}'. Check the symbol (e.g. EMIM.L).`);
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setProbing(false);
    }
  };

  const handleConfirm = () => {
    if (!preview) return;
    onConfirm({
      ticker: preview.ticker,
      name: preview.name,
      ccy: preview.currency,
      exchange: preview.exchange,
      addedAt: new Date().toISOString(),
    });
  };

  return (
    <View>
      <Text style={styles.formLabel}>Yahoo ticker symbol</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. EMIM.L"
        placeholderTextColor="#5e6671"
        value={input}
        onChangeText={(v) => {
          setInput(v);
          setPreview(null);
          setError(null);
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        autoFocus
        editable={!probing}
        returnKeyType="search"
        onSubmitEditing={handleProbe}
      />
      <Text style={styles.formHint}>
        Use the exact symbol from Yahoo Finance, including the exchange suffix
        (e.g. .L for LSE, .MI for Borsa Italiana).
      </Text>

      {error && <Text style={styles.formError}>{error}</Text>}

      {preview && (
        <View style={styles.previewBox}>
          <Text style={styles.previewLabel}>✓ Found on Yahoo</Text>
          <Text style={styles.previewTicker}>{preview.ticker}</Text>
          <Text style={styles.previewName}>{preview.name}</Text>
          <Text style={styles.previewMeta}>
            {[preview.currency, preview.exchange].filter(Boolean).join(' · ')}
          </Text>
          {preview.firstAvailableDate && (
            <Text style={styles.previewMeta}>
              History from: {preview.firstAvailableDate}
            </Text>
          )}
        </View>
      )}

      {!preview ? (
        <Pressable
          style={[styles.primary, (!input.trim() || probing) && styles.primaryDisabled]}
          onPress={handleProbe}
          disabled={!input.trim() || probing}
        >
          {probing ? (
            <ActivityIndicator color="#0b0d10" />
          ) : (
            <Text style={styles.primaryText}>검증 & 미리보기</Text>
          )}
        </Pressable>
      ) : (
        <Pressable style={styles.primary} onPress={handleConfirm}>
          <Text style={styles.primaryText}>추가 확정</Text>
        </Pressable>
      )}

      <Pressable style={styles.cancel} onPress={onCancel}>
        <Text style={styles.cancelText}>← 뒤로</Text>
      </Pressable>
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
  list: {
    gap: 8,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#161a1f',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 12,
  },
  rowOverridden: {
    borderColor: '#7ed4a3',
  },
  rowLeft: {
    flex: 1,
    gap: 4,
  },
  rowLabelLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowLabel: {
    color: '#f4f6f8',
    fontSize: 15,
    fontWeight: '600',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7ed4a3',
  },
  rowSubtitle: {
    color: '#8a93a0',
    fontSize: 12,
    lineHeight: 16,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  rowTicker: {
    color: '#f4f6f8',
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  rowChange: {
    color: '#7ed4a3',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  reset: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a414c',
    alignItems: 'center',
  },
  resetText: {
    color: '#cfd5dc',
    fontSize: 14,
    fontWeight: '600',
  },
  note: {
    color: '#5e6671',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 16,
  },
  // Modal sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetWrapper: {
    width: '100%',
  },
  modalSheet: {
    backgroundColor: '#11151a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3a414c',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#f4f6f8',
    fontSize: 20,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: '#8a93a0',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 16,
  },
  modalScroll: {
    flexGrow: 0,
  },
  groupLabel: {
    color: '#8a93a0',
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 8,
  },
  groupLabelCustom: {
    marginTop: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#161a1f',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 12,
    marginBottom: 8,
  },
  optionSelected: {
    borderColor: '#7ed4a3',
    backgroundColor: '#1a2620',
  },
  customMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  removeButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#2a2f37',
  },
  removeText: {
    color: '#8a93a0',
    fontSize: 12,
    fontWeight: '700',
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
  optionTextWrap: {
    flex: 1,
    gap: 4,
  },
  optionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionTicker: {
    color: '#f4f6f8',
    fontSize: 15,
    fontWeight: '700',
  },
  optionMeta: {
    color: '#8a93a0',
    fontSize: 12,
    letterSpacing: 0.4,
  },
  defaultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#2a2f37',
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: '#7ed4a3',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  optionName: {
    color: '#cfd5dc',
    fontSize: 13,
  },
  optionNote: {
    color: '#e0a87a',
    fontSize: 12,
    fontStyle: 'italic',
  },
  addCustom: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a414c',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  addCustomText: {
    color: '#7ed4a3',
    fontSize: 14,
    fontWeight: '600',
  },
  cancel: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: '#8a93a0',
    fontSize: 15,
    fontWeight: '600',
  },
  // Add custom form
  formLabel: {
    color: '#8a93a0',
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#161a1f',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#f4f6f8',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    borderWidth: 1,
    borderColor: '#2a2f37',
  },
  formHint: {
    color: '#5e6671',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  formError: {
    color: '#ff8a8a',
    fontSize: 13,
    marginVertical: 8,
  },
  previewBox: {
    backgroundColor: '#1a2620',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7ed4a3',
    padding: 14,
    marginTop: 12,
    marginBottom: 4,
    gap: 4,
  },
  previewLabel: {
    color: '#7ed4a3',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  previewTicker: {
    color: '#f4f6f8',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  previewName: {
    color: '#cfd5dc',
    fontSize: 13,
    lineHeight: 18,
  },
  previewMeta: {
    color: '#8a93a0',
    fontSize: 12,
  },
  primary: {
    backgroundColor: '#7ed4a3',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryDisabled: {
    opacity: 0.5,
  },
  primaryText: {
    color: '#0b0d10',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
