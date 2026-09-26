import { backTarget } from '../navigation';
import { findStrategy } from '../strategies';

describe('backTarget', () => {
  it('leaves the app from Home', () => {
    expect(backTarget({ kind: 'home' })).toBeNull();
  });

  it('returns to Home from Settings', () => {
    expect(backTarget({ kind: 'settings' })).toEqual({ kind: 'home' });
  });

  it('returns to Settings from the ETF config, which is opened from there', () => {
    expect(backTarget({ kind: 'config', strategyId: 'vaa' })).toEqual({ kind: 'settings' });
  });

  it('returns to Home from a strategy', () => {
    expect(backTarget({ kind: 'decision', strategy: findStrategy('vaa') })).toEqual({
      kind: 'home',
    });
  });
});
