import { anyOutdated, isOutdated } from '../appVersion';

describe('isOutdated', () => {
  it('nags only on an explicit outdated', () => {
    expect(isOutdated('outdated')).toBe(true);
  });

  it('stays quiet on current', () => {
    expect(isOutdated('current')).toBe(false);
  });

  it('stays quiet when the server said nothing', () => {
    // A server deployed before clientStatus existed, or a request that
    // failed before it could answer.
    expect(isOutdated(undefined)).toBe(false);
    expect(isOutdated(null)).toBe(false);
  });

  it('stays quiet on a status it does not recognise', () => {
    // A newer server with more to say should not make an older app invent
    // a warning out of a word it has never seen.
    expect(isOutdated('unsupported')).toBe(false);
    expect(isOutdated('OUTDATED')).toBe(false);
    expect(isOutdated('')).toBe(false);
  });
});

describe('anyOutdated', () => {
  const outdated = { decision: { clientStatus: 'outdated' }, error: null };
  const current = { decision: { clientStatus: 'current' }, error: null };
  const failed = { decision: null, error: 'offline' };

  it('warns when any loaded strategy says so', () => {
    expect(anyOutdated([current, outdated, current])).toBe(true);
  });

  it('stays quiet when every strategy is current', () => {
    expect(anyOutdated([current, current])).toBe(false);
  });

  it('is not confused by strategies still loading or failed', () => {
    // Home holds one slot per registered strategy; some may be empty.
    expect(anyOutdated([undefined, failed])).toBe(false);
    expect(anyOutdated([undefined, failed, outdated])).toBe(true);
  });

  it('stays quiet before anything has arrived', () => {
    expect(anyOutdated([])).toBe(false);
  });
});
