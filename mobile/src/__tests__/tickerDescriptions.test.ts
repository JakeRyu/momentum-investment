import { describeTicker } from '../tickerDescriptions';

describe('describeTicker', () => {
  it('describes a US ticker from the curated map', () => {
    expect(describeTicker('SPY')).toBe('S&P 500 — US large-cap equities');
  });

  it('describes a UK UCITS ticker from the ETF catalog', () => {
    expect(describeTicker('VUAG.L')).toBe('Vanguard S&P 500 UCITS');
  });

  it('is case-insensitive', () => {
    expect(describeTicker('spy')).toBe('S&P 500 — US large-cap equities');
  });

  it('returns undefined for an unknown ticker so the UI can render nothing', () => {
    expect(describeTicker('ZZZZ')).toBeUndefined();
  });
});
