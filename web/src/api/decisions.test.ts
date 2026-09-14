import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it, vi, afterEach } from 'vitest'

import { STRATEGIES } from '../strategies'

import { fetchDecision } from './decisions'

function capture() {
  const calls: string[] = []
  vi.stubGlobal('fetch', (url: string) => {
    calls.push(url)
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          strategyId: 'x',
          asOf: '',
          modeLabel: '',
          allocations: [],
          scores: [],
          reasoning: '',
        }),
    } as Response)
  })
  return calls
}

afterEach(() => vi.unstubAllGlobals())

describe('the web decision client', () => {
  it('sends no tickers — the universe is the server’s', async () => {
    const fixture: Record<string, { buckets: Record<string, string[]> }> =
      JSON.parse(
        readFileSync(join(__dirname, '../../../shared/universes.json'), 'utf8'),
      )
    const everyTicker = new Set<string>(
      Object.values(fixture).flatMap((s) => Object.values(s.buckets).flat()),
    )

    for (const s of STRATEGIES) {
      const calls = capture()
      await fetchDecision(s, '2026-09-14')
      const url = calls[0]
      expect(url, s.id).not.toMatch(
        /[?&](offensive|defensive|canary|risky|cash|permanent|signalEquity|unemploymentSeriesId)=/,
      )
      for (const t of everyTicker) {
        expect(url, `${s.id} leaked ${t}`).not.toContain(`=${t}`)
      }
      vi.unstubAllGlobals()
    }
  })

  it('still sends asOf, and the protection factor for PAA', async () => {
    const paa = STRATEGIES.find((s) => s.id === 'paa')!
    const calls = capture()
    await fetchDecision(paa, '2026-09-14', 1)
    expect(calls[0]).toContain('asOf=2026-09-14')
    expect(calls[0]).toContain('a=1')
  })
})
