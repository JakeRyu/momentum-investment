import type { AssetMomentum } from '../api/decisions'

function formatScore(score: number): string {
  return (score >= 0 ? '+' : '') + score.toFixed(4)
}

function formatSignal(score: number): string {
  const pct = score * 100
  return (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%'
}

// Hardcoded to the two macro signals LAA emits (SPY price-trend, UNRATE
// rate-trend). A future macro-aware strategy would extend this map.
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

export default function ScoreSection({
  title,
  rows,
  allocatedTickers,
}: {
  title: string
  rows: AssetMomentum[]
  allocatedTickers: Set<string>
}) {
  const isSignal = title.toLowerCase() === 'signal'

  return (
    <section className="score-section">
      <h3 className="score-section__title">
        {isSignal ? 'MACRO SIGNALS' : title.toUpperCase()}
      </h3>
      {rows.map((r) => {
        const allocated = allocatedTickers.has(r.ticker)
        const negative = !isSignal && r.score < 0
        return (
          <div key={`${r.bucket}:${r.ticker}`} className="score-row">
            <div className="score-row__left">
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
            </div>
            <span
              className={
                'score-row__value' +
                (negative ? ' score-row__value--negative' : '')
              }
            >
              {isSignal ? formatSignal(r.score) : formatScore(r.score)}
            </span>
          </div>
        )
      })}
    </section>
  )
}
