import { useEffect, useState } from 'react'

import {
  fetchDecision,
  type AllocationDecision,
  type PaaProtectionFactor,
} from '../api/decisions'
import type { Strategy } from '../strategies'

import AllocationsBlock from './AllocationsBlock'
import PaaProtectionPicker from './PaaProtectionPicker'
import ScoreSection from './ScoreSection'

export default function DecisionTool({ strategy }: { strategy: Strategy }) {
  const [decision, setDecision] = useState<AllocationDecision | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [paaA, setPaaA] = useState<PaaProtectionFactor>(2)

  const asOf = new Date().toISOString().slice(0, 10)
  const isPaa = strategy.defaultUniverse.kind === 'paa'
  const requestKey = `${strategy.id}|${asOf}|a=${paaA}`
  const loading = loadedKey !== requestKey

  useEffect(() => {
    let cancelled = false
    fetchDecision(strategy, asOf, paaA)
      .then((d) => {
        if (cancelled) return
        setDecision(d)
        setError(null)
        setLoadedKey(requestKey)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : String(e))
        setLoadedKey(requestKey)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  return (
    <div className="decision">
      {isPaa && <PaaProtectionPicker value={paaA} onChange={setPaaA} />}

      {loading && !decision && !error && (
        <p className="muted">Fetching decision…</p>
      )}

      {error && <pre className="error-box">{error}</pre>}

      {decision && <DecisionCard decision={decision} />}
    </div>
  )
}

function DecisionCard({ decision }: { decision: AllocationDecision }) {
  const allocatedTickers = new Set(decision.allocations.map((a) => a.ticker))

  const bucketOrder: string[] = []
  for (const s of decision.scores) {
    if (!bucketOrder.includes(s.bucket)) bucketOrder.push(s.bucket)
  }

  return (
    <>
      <span className="decision__mode">State · {decision.modeLabel}</span>

      <div className="decision-spread">
        <div>
          <AllocationsBlock allocations={decision.allocations} />
        </div>
        <p className="decision-spread__rationale">{decision.reasoning}</p>
      </div>

      <div className="score-grid">
        {bucketOrder.map((bucket) => (
          <ScoreSection
            key={bucket}
            title={bucket}
            rows={decision.scores.filter((s) => s.bucket === bucket)}
            allocatedTickers={allocatedTickers}
          />
        ))}
      </div>
    </>
  )
}
