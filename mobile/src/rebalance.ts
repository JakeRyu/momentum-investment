/**
 * Keller's strategies are month-end rebalanced, so the only cadence the
 * user needs is "once a month, at month-end".
 *
 * Month-granular on purpose: naming the last *trading* day would require an
 * exchange calendar on the client, and the extra precision does not change
 * what the user does.
 *
 * The date string is split rather than passed to `new Date()`, which would
 * parse `YYYY-MM-DD` as UTC midnight and land on the previous day for any
 * user west of Greenwich.
 */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function rebalanceHint(asOf: string): string {
  const [year, month, day] = asOf.split('-').map(Number);
  const monthIndex = month - 1;

  // On month-end itself the current month's rebalance is already the one
  // being shown, so the next one is a month out.
  const isMonthEnd = day >= daysInMonth(year, monthIndex);
  const targetIndex = isMonthEnd ? (monthIndex + 1) % 12 : monthIndex;

  return `Rebalance monthly · next at the end of ${MONTH_NAMES[targetIndex]}`;
}
