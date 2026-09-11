import {
  holdingHint,
  inForceAsOf,
  inForceMonthKey,
  previewHint,
} from '../rebalance';

describe('inForceAsOf', () => {
  it('is the last day of the previous month', () => {
    expect(inForceAsOf('2026-09-11')).toBe('2026-08-31');
  });

  it('handles a 30-day previous month', () => {
    expect(inForceAsOf('2026-05-02')).toBe('2026-04-30');
  });

  it('crosses the year boundary', () => {
    expect(inForceAsOf('2026-01-04')).toBe('2025-12-31');
  });

  it('handles a leap-year February', () => {
    expect(inForceAsOf('2028-03-01')).toBe('2028-02-29');
    expect(inForceAsOf('2026-03-01')).toBe('2026-02-28');
  });

  it('still points at the previous month on the last day of this one', () => {
    expect(inForceAsOf('2026-09-30')).toBe('2026-08-31');
  });
});

describe('inForceMonthKey', () => {
  it('is the previous month', () => {
    expect(inForceMonthKey('2026-09-11')).toBe('2026-08');
  });

  it('crosses the year boundary', () => {
    expect(inForceMonthKey('2026-01-04')).toBe('2025-12');
  });
});

describe('holdingHint', () => {
  it('names where the allocation came from and when it changes', () => {
    expect(holdingHint('2026-09-11')).toBe(
      'Set at the 31 August rebalance · next at the end of September',
    );
  });

  it('crosses the year boundary', () => {
    expect(holdingHint('2026-01-04')).toBe(
      'Set at the 31 December rebalance · next at the end of January',
    );
  });
});

describe('previewHint', () => {
  it('says the reading is not yet in force', () => {
    expect(previewHint('2026-09-11')).toBe(
      'Not in force yet · takes effect at the end of September',
    );
  });
});

describe('defaults', () => {
  it('uses today when no date is passed', () => {
    expect(inForceAsOf()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(inForceMonthKey()).toMatch(/^\d{4}-\d{2}$/);
    expect(holdingHint()).toMatch(/^Set at the /);
    expect(previewHint()).toMatch(/^Not in force yet · /);
  });
});
