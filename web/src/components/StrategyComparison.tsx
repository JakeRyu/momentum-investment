import { Link } from 'react-router-dom'

import { STRATEGIES, fundsNeeded } from '../strategies'

/**
 * The six side by side, on facts rather than ratings.
 *
 * The worst fall leads, because that is what these strategies were built
 * to limit — the papers optimise a return measure that scores zero once
 * drawdown reaches 25%. Annualised return is deliberately absent: with a
 * return column this becomes a ranking, and a ranked comparison
 * published by a UK company reads as a financial promotion.
 *
 * The footnote names any strategy whose figure is withheld — a
 * divergence from the cited paper makes quoting that paper's drawdown a
 * false citation, and a bare dash would read as missing data instead.
 * Since the HAA and BAA reconciliations all six publish a figure, so the
 * footnote collapses to the period caveat alone.
 */
export default function StrategyComparison() {
  const withheld = STRATEGIES.filter((s) => !s.backtest).map((s) => s.shortName)

  return (
    <div className="compare">
      <p className="compare__lede">
        New to this? Start with VAA — it has the simplest rule and holds one
        fund at a time.
      </p>

      <div className="compare__list">
        <div className="compare__head" aria-hidden="true">
          <span />
          <span>Worst fall</span>
          <span>Holds</span>
          <span>De-risks</span>
          <span>ETFs</span>
        </div>

        {STRATEGIES.map((s) => (
          <Link
            key={s.id}
            to={`/strategies/${s.id}`}
            className="compare__row"
            data-testid={`compare-row-${s.id}`}
          >
            <span className="compare__name">
              <span className="compare__short">{s.shortName}</span>
              <span className="compare__full">{s.fullName}</span>
              <span className="compare__tagline">{s.tagline}</span>
            </span>

            <Fact label="Worst fall" emphasis>
              {s.backtest ? `−${s.backtest.maxDrawdownPct.toFixed(1)}%` : '—'}
            </Fact>
            <Fact label="Holds">{s.comparison.holds}</Fact>
            <Fact label="De-risks">{s.comparison.deRisks}</Fact>
            <Fact label="ETFs">{fundsNeeded(s.defaultUniverse)}</Fact>
          </Link>
        ))}
      </div>

      <p className="compare__note">
        Worst fall is the deepest month-end drop in each paper&rsquo;s own
        backtest, over periods running from the 1970s. Past results do not
        predict future returns.{' '}
        {withheld.length > 0 && (
          <>
            No figure is shown for {withheld.join(' and ')}: this site&rsquo;s
            version of {withheld.length > 1 ? 'those rules differs' : 'that rule differs'}{' '}
            from the published one, so quoting the paper&rsquo;s number here
            would be misleading.
          </>
        )}
      </p>
    </div>
  )
}

function Fact({
  label,
  emphasis,
  children,
}: {
  label: string
  emphasis?: boolean
  children: React.ReactNode
}) {
  return (
    <span className={`compare__fact${emphasis ? ' compare__fact--lead' : ''}`}>
      <span className="compare__fact-label">{label}</span>
      <span className="compare__fact-value">{children}</span>
    </span>
  )
}
