/**
 * Unified decision client. One `fetchDecision` covers all six Keller
 * strategies; the per-strategy endpoint + query shape is derived from
 * `strategy.defaultUniverse.kind`. Mirrors `backend/src/MomentumInvestment.Api/Program.cs`.
 */
import type { Strategy } from '../strategies'

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:5050'

export type Allocation = { ticker: string; weight: number }
export type AssetMomentum = { ticker: string; score: number; bucket: string }
export type AllocationDecision = {
  strategyId: string
  asOf: string
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
  const u = strategy.defaultUniverse
  const params = new URLSearchParams({ asOf })
  let path: string

  switch (u.kind) {
    case 'vaa':
      path = '/api/vaa-g4b3/decision'
      u.offensive.forEach((t) => params.append('offensive', t))
      u.defensive.forEach((t) => params.append('defensive', t))
      break
    case 'daa':
      path = '/api/daa-g12/decision'
      u.canary.forEach((t) => params.append('canary', t))
      u.risky.forEach((t) => params.append('risky', t))
      u.cash.forEach((t) => params.append('cash', t))
      break
    case 'paa':
      path = '/api/paa/decision'
      params.append('a', String(paaA))
      u.risky.forEach((t) => params.append('risky', t))
      u.cash.forEach((t) => params.append('cash', t))
      break
    case 'haa':
      path = '/api/haa/decision'
      u.risky.forEach((t) => params.append('risky', t))
      params.append('canary', u.canary)
      params.append('cash', u.cash)
      break
    case 'baa':
      path = '/api/baa/decision'
      u.canary.forEach((t) => params.append('canary', t))
      u.risky.forEach((t) => params.append('risky', t))
      u.cash.forEach((t) => params.append('cash', t))
      break
    case 'laa':
      path = '/api/laa/decision'
      u.permanent.forEach((t) => params.append('permanent', t))
      params.append('risky', u.risky)
      params.append('cash', u.cash)
      params.append('signalEquity', u.signalEquity)
      params.append('unemploymentSeriesId', u.unemploymentSeriesId)
      break
  }

  const res = await fetch(`${API_BASE}${path}?${params}`)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  return (await res.json()) as AllocationDecision
}
