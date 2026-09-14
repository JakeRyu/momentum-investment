import { buildSubstitutions, substitutableTickers } from '../universe';

describe('buildSubstitutions', () => {
  it('sends nothing in the US region — the server universe is the US one', () => {
    expect(buildSubstitutions('vaa', 'US', {})).toEqual({});
  });

  it('keys a substitution by the paper ticker', () => {
    const subs = buildSubstitutions('vaa', 'UK', { US_LARGE_CAP: 'CSPX.L' });
    expect(subs.SPY).toBe('CSPX.L');
  });

  it('includes the curated UK default even with no explicit override', () => {
    // A UK user who has changed nothing still holds UCITS substitutes.
    const subs = buildSubstitutions('vaa', 'UK', {});
    expect(Object.keys(subs)).toContain('SPY');
  });

  it('omits tickers the strategy does not hold', () => {
    // The backend 400s on an unknown key, so an override for an asset
    // outside this strategy must never be sent.
    const subs = buildSubstitutions('vaa', 'UK', { US_NASDAQ: 'EQQQ.L' });
    expect(subs).not.toHaveProperty('QQQ');
  });

  it('never substitutes LAA’s signal equity', () => {
    // SPY is LAA's Growth-Trend signal and is not held, so it is not in
    // LAA's substitutable set. Overrides are stored globally by asset
    // class, so without this filter a UK user's VAA choice would move
    // the macro gate.
    const subs = buildSubstitutions('laa', 'UK', { US_LARGE_CAP: 'CSPX.L' });
    expect(subs).not.toHaveProperty('SPY');
    expect(substitutableTickers('laa')).not.toContain('SPY');
    expect(substitutableTickers('laa')).toContain('QQQ');
  });

  it('substitutes a ticker that appears in two buckets once', () => {
    const subs = buildSubstitutions('baa', 'UK', { US_LARGE_CAP: 'CSPX.L' });
    expect(subs.SPY).toBe('CSPX.L');
    expect(Object.keys(subs).filter((k) => k === 'SPY')).toHaveLength(1);
  });
});
