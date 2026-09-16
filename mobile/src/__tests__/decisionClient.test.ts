/**
 * The version header is the whole mechanism: without it the server sees an
 * anonymous caller, fails open, and the banner can never fire. So it is
 * asserted here rather than left to the device.
 *
 * `expo-application` reports null off a device, which is also the "cannot
 * identify myself" case, so both branches are mocked explicitly.
 */
const mockVersion = jest.fn<string | null, []>();

jest.mock('expo-application', () => ({
  get nativeApplicationVersion() {
    return mockVersion();
  },
}));

import { fetchDecision } from '../api/decisionClient';

function captureRequest() {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  global.fetch = jest.fn((url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          strategyId: 'vaa-g4b3',
          asOf: '2026-10-01',
          pricesAsOf: '2026-09-30',
          clientStatus: 'current',
          modeLabel: 'Offensive',
          allocations: [],
          scores: [],
          reasoning: '',
        }),
    });
  }) as unknown as typeof fetch;
  return calls;
}

function headersOf(init?: RequestInit): Record<string, string> {
  return (init?.headers ?? {}) as Record<string, string>;
}

describe('the version header', () => {
  afterEach(() => jest.clearAllMocks());

  it('is sent when the binary can identify itself', async () => {
    mockVersion.mockReturnValue('1.3');
    const calls = captureRequest();

    await fetchDecision('vaa', '2026-10-01', {});

    expect(headersOf(calls[0].init)['X-App-Version']).toBe('1.3');
  });

  it('is omitted rather than guessed when the version is unreadable', async () => {
    // Off a device. The server reads a missing header as current, so the
    // app is left alone instead of nagged on no evidence.
    mockVersion.mockReturnValue(null);
    const calls = captureRequest();

    await fetchDecision('vaa', '2026-10-01', {});

    expect(headersOf(calls[0].init)).not.toHaveProperty('X-App-Version');
  });

  it('reads the version per request, not once at import', async () => {
    // The value is read through a getter so a build that resolves it late
    // is still reported correctly.
    mockVersion.mockReturnValue('1.3');
    const first = captureRequest();
    await fetchDecision('vaa', '2026-10-01', {});

    mockVersion.mockReturnValue('1.4');
    const second = captureRequest();
    await fetchDecision('vaa', '2026-10-01', {});

    expect(headersOf(first[0].init)['X-App-Version']).toBe('1.3');
    expect(headersOf(second[0].init)['X-App-Version']).toBe('1.4');
  });
});
