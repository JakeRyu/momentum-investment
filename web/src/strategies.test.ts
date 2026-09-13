import { describe, expect, it } from 'vitest'

import { STRATEGIES, findStrategy } from './strategies'

describe('backtest figures', () => {
  it('matches the figures verified against the source papers', () => {
    const expected = {
      vaa: { variant: 'VAA-G4 on SPY/EFA/EEM/AGG', periodStart: '1970-12', periodEnd: '2016-12', cagrPct: 18.8, maxDrawdownPct: 16.4, sourceLabel: 'note 16' },
      daa: { variant: 'DAA-G12 (T=6, B=2)', periodStart: '1970-12', periodEnd: '2018-03', cagrPct: 16.0, maxDrawdownPct: 10.6, sourceLabel: 'Fig. 8' },
      paa: { variant: 'PAA2 (a=2, Top6, L=12); site adds SHY and LQD to the cash sleeve', periodStart: '1970-12', periodEnd: '2015-12', cagrPct: 13.7, maxDrawdownPct: 10.4, sourceLabel: 'Fig. 6' },
      laa: { variant: 'LAA (QQQ↔SHY); site times SPY with a 200-day SMA, the paper with a 10-month SMA', periodStart: '1949-02', periodEnd: '2019-10', cagrPct: 10.5, maxDrawdownPct: 15.0, sourceLabel: 'Fig. 12' },
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

  it('withholds BAA until its canary/ranking/breadth match the paper', () => {
    // BaaService's canary (TIP/IEF/BIL vs paper's SPY/VWO/VEA/BND), risky
    // ranking (13612W vs paper's SMA12) and defensive breadth (top-1 of 5
    // vs paper's top-3 of 7) all diverge from Fig 3's BAA-G12, and the
    // canary universe is the crash-protection mechanism. Restore this row
    // only once BaaService is reconciled with the paper.
    expect(findStrategy('baa')?.backtest).toBeUndefined()
  })

  it('reports every drawdown as a positive magnitude', () => {
    for (const s of STRATEGIES) {
      if (!s.backtest) continue
      expect(s.backtest.maxDrawdownPct, s.id).toBeGreaterThan(0)
    }
  })
})
