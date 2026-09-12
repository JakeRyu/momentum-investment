import { buildDecisionRequest } from '../decisions';

describe('buildDecisionRequest', () => {
  it('builds the VAA request from the US universe', () => {
    const r = buildDecisionRequest('vaa', 'US', {});
    expect(r).toEqual({
      kind: 'vaa',
      offensive: ['SPY', 'EFA', 'EEM', 'AGG'],
      defensive: ['LQD', 'IEF', 'SHY'],
    });
  });

  it('builds the DAA request with its canary bucket', () => {
    const r = buildDecisionRequest('daa', 'US', {});
    expect(r.kind).toBe('daa-g12');
    if (r.kind !== 'daa-g12') throw new Error('wrong kind');
    expect(r.canary).toEqual(['VWO', 'BND']);
    expect(r.risky).toHaveLength(12);
    expect(r.cash).toEqual(['SHY', 'IEF', 'LQD']);
  });

  it('builds a request for every strategy id', () => {
    const ids = ['vaa', 'paa', 'daa', 'baa', 'haa', 'laa'] as const;
    for (const id of ids) {
      expect(buildDecisionRequest(id, 'US', {}).kind).toBeTruthy();
    }
  });

  it('applies a UK override to the resolved tickers', () => {
    const r = buildDecisionRequest('vaa', 'UK', {});
    if (r.kind !== 'vaa') throw new Error('wrong kind');
    expect(r.offensive[0]).not.toBe('SPY');
    expect(r.offensive[0]).toMatch(/\.L$/);
  });
});
