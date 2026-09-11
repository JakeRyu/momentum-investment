import { rebalanceHint } from '../rebalance';

describe('rebalanceHint', () => {
  describe('asOf in a past month', () => {
    it('reports a past decision when asOf is a month before today', () => {
      expect(rebalanceHint('2022-06-30', '2026-09-11')).toBe(
        'Rebalance monthly · this is a past decision for June 2022',
      );
    });

    it('reports a past decision for a mid-month asOf too', () => {
      expect(rebalanceHint('2026-01-15', '2026-09-11')).toBe(
        'Rebalance monthly · this is a past decision for January 2026',
      );
    });

    it('reports a past decision across a year boundary', () => {
      expect(rebalanceHint('2025-12-31', '2026-01-05')).toBe(
        'Rebalance monthly · this is a past decision for December 2025',
      );
    });
  });

  describe('asOf in the current month, not month-end', () => {
    it('points at the end of the current month and flags it as provisional', () => {
      expect(rebalanceHint('2026-09-11', '2026-09-11')).toBe(
        "Rebalance monthly · next at the end of September. Today's reading can still change.",
      );
    });

    it('still flags provisional when asOf is earlier in the month than today', () => {
      expect(rebalanceHint('2026-09-01', '2026-09-15')).toBe(
        "Rebalance monthly · next at the end of September. Today's reading can still change.",
      );
    });

    it('handles a leap-year February that is not yet month-end', () => {
      // 2028 is a leap year, so Feb 28 is not the last day of the month.
      expect(rebalanceHint('2028-02-28', '2028-02-28')).toBe(
        "Rebalance monthly · next at the end of February. Today's reading can still change.",
      );
    });
  });

  describe('asOf is the last day of the current month', () => {
    it('rolls to the next month with no provisional caveat', () => {
      expect(rebalanceHint('2026-09-30', '2026-09-30')).toBe(
        'Rebalance monthly · next at the end of October',
      );
    });

    it('rolls across the year boundary', () => {
      expect(rebalanceHint('2026-12-31', '2026-12-31')).toBe(
        'Rebalance monthly · next at the end of January',
      );
    });

    it('handles a short month', () => {
      expect(rebalanceHint('2026-02-28', '2026-02-28')).toBe(
        'Rebalance monthly · next at the end of March',
      );
    });

    it('handles a leap-year February month-end', () => {
      expect(rebalanceHint('2028-02-29', '2028-02-29')).toBe(
        'Rebalance monthly · next at the end of March',
      );
    });
  });

  it('defaults `today` to the current date without pinning the clock', () => {
    expect(rebalanceHint('2026-09-11')).toMatch(/^Rebalance monthly · /);
  });
});
