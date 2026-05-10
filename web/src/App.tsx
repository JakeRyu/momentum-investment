import { useEffect, useState } from 'react'

type Allocation = { ticker: string; weight: number }

type AllocationDecision = {
  strategyId: string
  asOf: string
  modeLabel: string
  allocations: Allocation[]
  reasoning: string
}

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:5050'

export default function App() {
  const [decision, setDecision] = useState<AllocationDecision | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const url =
      `${API_BASE}/api/vaa-g4b3/decision?asOf=${today}` +
      `&offensive=SPY&offensive=EFA&offensive=EEM&offensive=AGG` +
      `&defensive=LQD&defensive=IEF&defensive=SHY`
    fetch(url)
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)),
      )
      .then(setDecision)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : String(e)),
      )
  }, [])

  return (
    <main
      style={{
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        maxWidth: 640,
        margin: '40px auto',
        padding: 24,
        color: '#1a1a1a',
      }}
    >
      <h1 style={{ marginBottom: 4 }}>Momentum Investment</h1>
      <p style={{ color: '#666', marginTop: 0, fontSize: 14 }}>
        Calling <code>{API_BASE}</code>
      </p>

      {error && (
        <pre
          style={{
            background: '#fee',
            border: '1px solid #fcc',
            padding: 12,
            borderRadius: 6,
            color: '#900',
            whiteSpace: 'pre-wrap',
          }}
        >
          {error}
        </pre>
      )}

      {!decision && !error && <p style={{ color: '#888' }}>Loading…</p>}

      {decision && (
        <section
          style={{
            marginTop: 24,
            padding: 20,
            borderRadius: 12,
            background: '#f6f7f9',
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            VAA-G4/B3 — {decision.modeLabel}
          </h2>
          <p style={{ color: '#444' }}>{decision.reasoning}</p>
          <ul style={{ paddingLeft: 20 }}>
            {decision.allocations.map((a) => (
              <li key={a.ticker}>
                <strong>{a.ticker}</strong> — {(a.weight * 100).toFixed(1)}%
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
