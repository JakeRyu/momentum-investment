import { describe, expect, it } from 'vitest'

import { STRATEGIES, findStrategy } from './strategies'

describe('backtest figures', () => {
  it('matches the figures verified against the source papers', () => {
    const expected = {
      vaa: { variant: 'VAA-G4 (T/B=1/1)', periodStart: '1970-12', periodEnd: '2016-12', cagrPct: 18.9, maxDrawdownPct: 13.0, sourceLabel: 'Table 8' },
      daa: { variant: 'DAA-G12 (T=6, B=2)', periodStart: '1970-12', periodEnd: '2018-03', cagrPct: 16.0, maxDrawdownPct: 10.6, sourceLabel: 'Fig. 8' },
      paa: { variant: 'PAA2 (a=2, Top6, L=12)', periodStart: '1970-12', periodEnd: '2015-12', cagrPct: 13.7, maxDrawdownPct: 10.4, sourceLabel: 'Fig. 6' },
      baa: { variant: 'BAA-G12', periodStart: '1970-12', periodEnd: '2022-06', cagrPct: 14.6, maxDrawdownPct: 8.7, sourceLabel: 'Fig. 3' },
      laa: { variant: 'LAA (QQQ↔SHY)', periodStart: '1949-02', periodEnd: '2019-10', cagrPct: 10.5, maxDrawdownPct: 15.0, sourceLabel: 'Fig. 12' },
    }

    for (const [id, figures] of Object.entries(expected)) {
      expect(findStrategy(id)?.backtest, id).toEqual(figures)
    }
  })

  it('withholds HAA until its momentum filter matches the paper', () => {
    // HaaService computes 13612W; the HAA paper specifies 13612U (L=1).
    // Publishing Fig. 6's number beside a different rule would be a false
    // citation. Restore this row only with the filter fix.
    expect(findStrategy('haa')?.backtest).toBeUndefined()
  })

  it('reports every drawdown as a positive magnitude', () => {
    for (const s of STRATEGIES) {
      if (!s.backtest) continue
      expect(s.backtest.maxDrawdownPct, s.id).toBeGreaterThan(0)
    }
  })
})
