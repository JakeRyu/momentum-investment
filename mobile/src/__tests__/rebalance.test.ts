import { rebalanceHint } from '../rebalance';

describe('rebalanceHint', () => {
  it('points at the end of the current month mid-month', () => {
    expect(rebalanceHint('2026-09-11')).toBe(
      'Rebalance monthly · next at the end of September',
    );
  });

  it('rolls to the next month when the date is already month-end', () => {
    expect(rebalanceHint('2026-09-30')).toBe(
      'Rebalance monthly · next at the end of October',
    );
  });

  it('rolls across the year boundary', () => {
    expect(rebalanceHint('2026-12-31')).toBe(
      'Rebalance monthly · next at the end of January',
    );
  });

  it('handles a short month', () => {
    expect(rebalanceHint('2026-02-28')).toBe(
      'Rebalance monthly · next at the end of March',
    );
  });

  it('handles a leap-year February', () => {
    expect(rebalanceHint('2028-02-28')).toBe(
      'Rebalance monthly · next at the end of February',
    );
    expect(rebalanceHint('2028-02-29')).toBe(
      'Rebalance monthly · next at the end of March',
    );
  });
});
