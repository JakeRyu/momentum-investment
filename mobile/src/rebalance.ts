/**
 * Keller's strategies compute a signal at month-end close and hold that
 * allocation through the following month. So the allocation a user should be
 * holding on any given day comes from the last month-end — not from today,
 * whose reading is a preview of a rebalance that has not happened yet.
 *
 * The in-force date is the last *calendar* day of the previous month, not a
 * computed trading day: the backend already resolves to the
 * trading-day-on-or-before the date it is given, so no exchange calendar is
 * needed here.
 *
 * Dates are split as strings rather than passed to `new Date()`, which parses
 * `YYYY-MM-DD` as UTC midnight and lands on the previous day west of
 * Greenwich.
 */
import { formatYmd } from './utils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/** Year and 0-based month of the month before `today`. */
function previousMonth(today: string): { year: number; monthIndex: number } {
  const [year, month] = today.split('-').map(Number);
  const monthIndex = month - 1;
  return monthIndex === 0
    ? { year: year - 1, monthIndex: 11 }
    : { year, monthIndex: monthIndex - 1 };
}

function currentMonthName(today: string): string {
  const [, month] = today.split('-').map(Number);
  return MONTH_NAMES[month - 1];
}

export function inForceAsOf(today: string = formatYmd(new Date())): string {
  const { year, monthIndex } = previousMonth(today);
  const day = daysInMonth(year, monthIndex);
  const mm = String(monthIndex + 1).padStart(2, '0');
  return `${year}-${mm}-${day}`;
}

export function inForceMonthKey(today: string = formatYmd(new Date())): string {
  const { year, monthIndex } = previousMonth(today);
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

export function holdingHint(today: string = formatYmd(new Date())): string {
  const { year, monthIndex } = previousMonth(today);
  const day = daysInMonth(year, monthIndex);
  return (
    `Set at the ${day} ${MONTH_NAMES[monthIndex]} rebalance` +
    ` · next at the end of ${currentMonthName(today)}`
  );
}

export function previewHint(today: string = formatYmd(new Date())): string {
  return `Not in force yet · takes effect at the end of ${currentMonthName(today)}`;
}
