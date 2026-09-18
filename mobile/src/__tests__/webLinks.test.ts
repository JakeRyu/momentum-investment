import { strategyWebUrl } from '../webLinks';

describe('strategyWebUrl', () => {
  it('builds the strategy page URL', () => {
    expect(strategyWebUrl('vaa')).toBe(
      'https://monthlyrule.com/strategies/vaa',
    );
  });

  it('uses the strategy id verbatim', () => {
    expect(strategyWebUrl('laa')).toBe(
      'https://monthlyrule.com/strategies/laa',
    );
  });
});
