import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearDoneMarker,
  loadDoneMarkers,
  loadRegisteredStrategies,
  saveDoneMarker,
  saveRegisteredStrategies,
} from '../storage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('registered strategies', () => {
  it('defaults to VAA alone when nothing is stored', async () => {
    expect(await loadRegisteredStrategies()).toEqual(['vaa']);
  });

  it('round-trips a saved set', async () => {
    await saveRegisteredStrategies(['vaa', 'daa']);
    expect(await loadRegisteredStrategies()).toEqual(['vaa', 'daa']);
  });

  it('drops ids that are no longer known strategies', async () => {
    await AsyncStorage.setItem('momentum:registeredStrategies', '["vaa","gone"]');
    expect(await loadRegisteredStrategies()).toEqual(['vaa']);
  });

  it('falls back to the default when the stored value is corrupt', async () => {
    await AsyncStorage.setItem('momentum:registeredStrategies', 'not json');
    expect(await loadRegisteredStrategies()).toEqual(['vaa']);
  });

  it('never returns an empty set', async () => {
    await saveRegisteredStrategies([]);
    expect(await loadRegisteredStrategies()).toEqual(['vaa']);
  });
});

describe('done markers', () => {
  it('is empty before anything is marked', async () => {
    expect(await loadDoneMarkers()).toEqual({});
  });

  it('round-trips a marker per strategy', async () => {
    await saveDoneMarker('vaa', '2026-08');
    await saveDoneMarker('daa', '2026-08');
    expect(await loadDoneMarkers()).toEqual({ vaa: '2026-08', daa: '2026-08' });
  });

  it('clears one without disturbing the others', async () => {
    await saveDoneMarker('vaa', '2026-08');
    await saveDoneMarker('daa', '2026-08');
    await clearDoneMarker('vaa');
    expect(await loadDoneMarkers()).toEqual({ daa: '2026-08' });
  });
});
