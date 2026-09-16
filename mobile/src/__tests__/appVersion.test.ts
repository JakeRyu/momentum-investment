import { isOutdated } from '../appVersion';

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
