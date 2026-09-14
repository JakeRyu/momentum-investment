import type { Allocation } from '../api/decisions'
import { describeTicker } from '../etfDescriptions'

function formatPercent(weight: number): string {
  const pct = weight * 100
  return Number.isInteger(pct) ? `${pct.toFixed(0)}%` : `${pct.toFixed(2)}%`
}

function spellPercent(weight: number): string {
  if (Math.abs(weight - 1) < 1e-9) return 'One hundred percent of the portfolio.'
  const pct = weight * 100
  return `${pct.toFixed(2)}% of the portfolio.`
}

/**
 * What the rule says to hold.
 *
 * Each ticker carries its one-line description from `etfDescriptions`.
 * This is the moment a reader with no background is most exposed — the
 * site names a four-letter code and a percentage and, until this gloss,
 * said nothing else about it. The same sentences already existed behind
 * a click in the score rows; here they are unconditional.
 */
export default function AllocationsBlock({
  allocations,
}: {
  allocations: Allocation[]
}) {
  if (allocations.length === 1) {
    const a = allocations[0]
    const description = describeTicker(a.ticker)
    return (
      <div className="alloc-hero">
        <p className="alloc-hero__ticker">{a.ticker}</p>
        {description && <p className="alloc-hero__gloss">{description}</p>}
        <p className="alloc-hero__weight">— {spellPercent(a.weight)}</p>
      </div>
    )
  }

  const total = allocations.reduce((acc, a) => acc + a.weight, 0)
  return (
    <ul className="alloc-list">
      {allocations.map((a) => {
        const description = describeTicker(a.ticker)
        return (
          <li key={a.ticker} className="alloc-row">
            <span className="alloc-row__ticker">
              {a.ticker}
              {description && (
                <span className="alloc-row__gloss">{description}</span>
              )}
            </span>
            <span className="alloc-row__weight">{formatPercent(a.weight)}</span>
          </li>
        )
      })}
      <li className="alloc-row alloc-row--total">
        <span className="alloc-row__total-label">Total</span>
        <span className="alloc-row__total-weight">{formatPercent(total)}</span>
      </li>
    </ul>
  )
}
