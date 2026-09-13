import type { Backtest } from '../strategies'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/**
 * The only path a backtest number takes to the page.
 *
 * The period, the word "backtest", the month-end qualifier and the
 * no-prediction line are part of this markup rather than the caller's
 * copy, so a call site cannot print a bare figure. The site's claim is
 * that these strategies were built to limit falls — an argument the
 * papers make themselves, which is why the variant and source table
 * travel with every number.
 */
export default function BacktestFigure({ backtest }: { backtest: Backtest }) {
  return (
    <figure className="backtest">
      <figcaption className="backtest__caption">
        Published backtest · {formatMonth(backtest.periodStart)} –{' '}
        {formatMonth(backtest.periodEnd)}
      </figcaption>

      <div className="backtest__rows">
        <div className="backtest__row">
          <span className="backtest__label">Worst fall, peak to trough</span>
          <span className="backtest__value backtest__value--fall">
            −{backtest.maxDrawdownPct.toFixed(1)}%
          </span>
        </div>
        <div className="backtest__row">
          <span className="backtest__label">Annualised return</span>
          <span className="backtest__value">{backtest.cagrPct.toFixed(1)}%</span>
        </div>
      </div>

      <p className="backtest__predict">
        Backtested results do not predict future returns.
      </p>

      <p className="backtest__note">
        {backtest.variant}, as reported in the source paper (
        {backtest.sourceLabel}). The fall is measured at month-end — within
        a month it ran deeper.
      </p>
    </figure>
  )
}

/** "1970-12" → "Dec 1970". */
function formatMonth(ym: string): string {
  const [year, month] = ym.split('-')
  return `${MONTHS[Number(month) - 1]} ${year}`
}
