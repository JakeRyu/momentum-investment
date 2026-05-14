import { useState } from 'react'

import type { AssetMomentum } from '../api/decisions'
import { describeTicker } from '../etfDescriptions'

const DOT_CELLS = 10

function formatScore(score: number): string {
  return (score >= 0 ? '+' : '') + score.toFixed(4)
}

function formatSignal(score: number): string {
  const pct = score * 100
  return (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%'
}

function signalCaption(ticker: string, score: number): string {
  const above = score > 0
  const at = Math.abs(score) < 1e-9
  if (ticker === 'SPY') {
    if (at) return 'at 200d SMA'
    return above ? 'above 200d SMA · bullish' : 'below 200d SMA · bearish'
  }
  if (ticker === 'UNRATE') {
    if (at) return 'at 12mo SMA'
    return above ? 'above 12mo SMA · bearish' : 'below 12mo SMA · bullish'
  }
  return ''
}

function dotBar(score: number, bucketMaxAbs: number): string {
  const safeMax = bucketMaxAbs > 0 ? bucketMaxAbs : 1
  const filled = Math.round((Math.abs(score) / safeMax) * DOT_CELLS)
  const clamped = Math.max(0, Math.min(DOT_CELLS, filled))
  return '●'.repeat(clamped) + '○'.repeat(DOT_CELLS - clamped)
}

export default function ScoreSection({
  title,
  rows,
  allocatedTickers,
}: {
  title: string
  rows: AssetMomentum[]
  allocatedTickers: Set<string>
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const isSignal = title.toLowerCase() === 'signal'
  const bucketMaxAbs = rows.reduce((acc, r) => Math.max(acc, Math.abs(r.score)), 0)

  return (
    <section className="score-section">
      <h3 className="score-section__title">
        {isSignal ? 'Macro Signals' : title}
      </h3>
      {rows.map((r) => {
        const allocated = allocatedTickers.has(r.ticker)
        const negative = !isSignal && r.score < 0
        const description = describeTicker(r.ticker)
        const isExpanded = expanded === r.ticker
        const rowId = `desc-${r.bucket}-${r.ticker}`
        return (
          <div key={`${r.bucket}:${r.ticker}`}>
            <button
              type="button"
              className={
                'score-row' + (isExpanded ? ' score-row--expanded' : '')
              }
              onClick={() => setExpanded(isExpanded ? null : r.ticker)}
              aria-expanded={isExpanded}
              aria-controls={description ? rowId : undefined}
              disabled={!description}
            >
              <span className="score-row__left">
                <span
                  className={
                    'score-row__ticker' +
                    (allocated ? ' score-row__ticker--allocated' : '')
                  }
                >
                  {r.ticker}
                </span>
                {isSignal && (
                  <span className="score-row__caption">
                    {signalCaption(r.ticker, r.score)}
                  </span>
                )}
              </span>
              <span
                className={
                  'score-row__value' +
                  (negative ? ' score-row__value--negative' : '')
                }
              >
                {isSignal ? formatSignal(r.score) : formatScore(r.score)}
              </span>
              <span
                className={
                  'score-row__bar' + (negative ? ' score-row__bar--negative' : '')
                }
              >
                {dotBar(r.score, bucketMaxAbs)}
              </span>
              <span className="score-row__marker">{allocated ? '■' : ''}</span>
            </button>
            {isExpanded && description && (
              <p id={rowId} className="score-row__description">
                {description}
              </p>
            )}
          </div>
        )
      })}
    </section>
  )
}
