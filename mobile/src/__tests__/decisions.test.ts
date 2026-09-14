import { buildDecisionRequest } from '../decisions';

describe('buildDecisionRequest', () => {
  it('carries the strategy and its substitutions, and no tickers', () => {
    const req = buildDecisionRequest('baa', 'UK', { US_LARGE_CAP: 'CSPX.L' });
    expect(req.id).toBe('baa');
    expect(req.substitutions.SPY).toBe('CSPX.L');
    expect(req).not.toHaveProperty('canary');
    expect(req).not.toHaveProperty('risky');
    expect(req).not.toHaveProperty('cash');
  });

  it('is empty for a US holder', () => {
    expect(buildDecisionRequest('vaa', 'US', {}).substitutions).toEqual({});
  });

  it('builds a request for every strategy id', () => {
    // Every id must be a key of the bundled fixture, or substitutableTickers
    // reads undefined.buckets.
    const ids = ['vaa', 'paa', 'daa', 'baa', 'haa', 'laa'] as const;
    for (const id of ids) {
      expect(buildDecisionRequest(id, 'UK', {}).id).toBe(id);
    }
  });
});
