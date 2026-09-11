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
 *
 * `asOf` is user-controlled (a date picker on the home screen allows any
 * past date), so it can land in a month before `today`. `today` is
 * injectable so that case is testable without mocking the clock.
 */

import { formatYmd } from './utils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function rebalanceHint(asOf: string, today: string = formatYmd(new Date())): string {
  const [year, month, day] = asOf.split('-').map(Number);
  const monthIndex = month - 1;

  const [todayYear, todayMonth] = today.split('-').map(Number);
  const todayMonthIndex = todayMonth - 1;

  // A future `asOf` cannot occur (the date picker caps at today), so the
  // only cross-month case to handle is `asOf` landing strictly before
  // today's month.
  const isPastMonth = year * 12 + monthIndex < todayYear * 12 + todayMonthIndex;
  if (isPastMonth) {
    return `Rebalance monthly · this is a past decision for ${MONTH_NAMES[monthIndex]} ${year}`;
  }

  // On month-end itself the current month's rebalance is already the one
  // being shown, so the next one is a month out.
  const isMonthEnd = day >= daysInMonth(year, monthIndex);
  if (isMonthEnd) {
    const nextIndex = (monthIndex + 1) % 12;
    return `Rebalance monthly · next at the end of ${MONTH_NAMES[nextIndex]}`;
  }

  return `Rebalance monthly · next at the end of ${MONTH_NAMES[monthIndex]}. Today's reading can still change.`;
}
