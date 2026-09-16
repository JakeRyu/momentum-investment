/**
 * Unified decision client. One `fetchDecision` covers all six Keller
 * strategies.
 *
 * The universe is the server's — it reads its own canonical records, so
 * nothing here sends tickers. This site runs the papers' US universe as
 * published and has no substitutions to make; the iPhone app is what
 * sends `substitute` pairs for a holder's local UCITS alternatives.
 */
import type { Strategy, StrategyId } from '../strategies'

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:5050'

export type Allocation = { ticker: string; weight: number }
export type AssetMomentum = { ticker: string; score: number; bucket: string }
export type AllocationDecision = {
  strategyId: string
  /** What was asked for. The lookback anchors are measured from this. */
  asOf: string
  /**
   * The latest close the reading could reach. Earlier than `asOf` on a
   * weekend, a holiday, or before the US open — which is exactly when the
   * course tells a reader to look.
   */
  pricesAsOf: string
  modeLabel: string
  allocations: Allocation[]
  scores: AssetMomentum[]
  reasoning: string
}

export type PaaProtectionFactor = 0 | 1 | 2

export async function fetchDecision(
  strategy: Strategy,
  asOf: string,
  paaA: PaaProtectionFactor = 2,
): Promise<AllocationDecision> {
  const params = new URLSearchParams({ asOf })
  if (strategy.defaultUniverse.kind === 'paa') params.append('a', String(paaA))

  const res = await fetch(`${API_BASE}${PATHS[strategy.id]}?${params}`)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  return (await res.json()) as AllocationDecision
}

const PATHS: Record<StrategyId, string> = {
  vaa: '/api/vaa-g4b3/decision',
  daa: '/api/daa-g12/decision',
  paa: '/api/paa/decision',
  haa: '/api/haa/decision',
  baa: '/api/baa/decision',
  laa: '/api/laa/decision',
}
