import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { findStrategy, type Strategy } from '../strategies'

import NotFound from './NotFound'

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:5050'

export default function StrategyPage() {
  const { id } = useParams<{ id: string }>()
  const strategy = id ? findStrategy(id) : undefined

  if (!strategy) return <NotFound />

  return (
    <article className="strategy-page">
      <header className="strategy-page__head">
        <p className="strategy-page__short">{strategy.shortName}</p>
        <h1>{strategy.fullName}</h1>
        <p className="strategy-page__blurb">{strategy.blurb}</p>
      </header>

      <section className="strategy-page__body">
        {strategy.longDescription.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
        <p className="strategy-page__paper">
          Paper:{' '}
          <a href={strategy.paperUrl} target="_blank" rel="noreferrer">
            {strategy.paperTitle} ({strategy.paperYear})
          </a>
        </p>
      </section>

      <section className="strategy-page__tool">
        <h2>Today's decision</h2>
        {strategy.id === 'vaa' ? (
          <VaaDecisionInline strategy={strategy} />
        ) : (
          <p className="muted">
            Decision tool wiring lands in the next PR. Until then, see the{' '}
            <Link to="/strategies/vaa">VAA page</Link> for an example of the
            live result panel.
          </p>
        )}
      </section>

      <p className="back-link">
        <Link to="/">← All strategies</Link>
      </p>
    </article>
  )
}

// Temporary inline implementation for VAA only — superseded in the next PR
// by the generic <DecisionTool/> component that handles all six strategies.
type Allocation = { ticker: string; weight: number }
type AllocationDecision = {
  strategyId: string
  asOf: string
  modeLabel: string
  allocations: Allocation[]
  reasoning: string
}

function VaaDecisionInline({ strategy }: { strategy: Strategy }) {
  const [decision, setDecision] = useState<AllocationDecision | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (strategy.defaultUniverse.kind !== 'vaa') return
    const { offensive, defensive } = strategy.defaultUniverse
    const today = new Date().toISOString().slice(0, 10)
    const params = new URLSearchParams({ asOf: today })
    offensive.forEach((t) => params.append('offensive', t))
    defensive.forEach((t) => params.append('defensive', t))
    fetch(`${API_BASE}/api/vaa-g4b3/decision?${params}`)
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)),
      )
      .then(setDecision)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : String(e)),
      )
  }, [strategy])

  if (error) return <pre className="error-box">{error}</pre>
  if (!decision) return <p className="muted">Loading…</p>

  return (
    <div className="decision-card">
      <p className="decision-card__mode">{decision.modeLabel.toUpperCase()} MODE</p>
      <p className="decision-card__reasoning">{decision.reasoning}</p>
      <ul className="alloc-list">
        {decision.allocations.map((a) => (
          <li key={a.ticker} className="alloc-row">
            <strong>{a.ticker}</strong>
            <span>{(a.weight * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
