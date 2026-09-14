import { describe, expect, it } from 'vitest'

import { STRATEGIES, drawdownRange, findStrategy, fundsNeeded } from './strategies'

describe('backtest figures', () => {
  it('matches the figures verified against the source papers', () => {
    const expected = {
      vaa: { variant: 'VAA-G4 on SPY/EFA/EEM/AGG', periodStart: '1970-12', periodEnd: '2016-12', cagrPct: 18.8, maxDrawdownPct: 16.4, sourceLabel: 'note 16' },
      daa: { variant: 'DAA-G12 (T=6, B=2)', periodStart: '1970-12', periodEnd: '2018-03', cagrPct: 16.0, maxDrawdownPct: 10.6, sourceLabel: 'Fig. 8' },
      paa: { variant: 'PAA2 (a=2, Top6, L=12); site adds SHY and LQD to the cash sleeve', periodStart: '1970-12', periodEnd: '2015-12', cagrPct: 13.7, maxDrawdownPct: 10.4, sourceLabel: 'Fig. 6' },
      haa: { variant: 'HAA-Balanced (G8/T4, L=1)', periodStart: '1970-12', periodEnd: '2022-12', cagrPct: 15.9, maxDrawdownPct: 9.7, sourceLabel: 'Fig 6' },
      baa: { variant: 'BAA-G12', periodStart: '1970-12', periodEnd: '2022-06', cagrPct: 14.6, maxDrawdownPct: 8.7, sourceLabel: 'Fig 3' },
      laa: { variant: 'LAA (QQQ↔SHY); site times SPY with a 200-day SMA, the paper with a 10-month SMA', periodStart: '1949-02', periodEnd: '2019-10', cagrPct: 10.5, maxDrawdownPct: 15.0, sourceLabel: 'Fig. 12' },
    }

    for (const [id, figures] of Object.entries(expected)) {
      expect(findStrategy(id)?.backtest, id).toEqual(figures)
    }
  })

  it('reports the span of published drawdowns', () => {
    // Derived rather than typed into the copy: the range sentence in
    // lesson 6 is the site's headline claim, and a hand-copied bound
    // drifts the moment a figure is corrected.
    expect(drawdownRange()).toEqual({ min: 8.7, max: 16.4 })
  })

  it('reports every drawdown as a positive magnitude', () => {
    for (const s of STRATEGIES) {
      if (!s.backtest) continue
      expect(s.backtest.maxDrawdownPct, s.id).toBeGreaterThan(0)
    }
  })
})

describe('taglines', () => {
  it('gives every strategy one', () => {
    for (const s of STRATEGIES) {
      expect(s.tagline, s.id).toBeTruthy()
    }
  })

  it('says what the strategy does, not who published it', () => {
    // The old copy was a paper citation ("Aggressive dual-momentum with
    // crash protection (Keller & Keuning, 2017)"), which tells a beginner
    // nothing they can act on. Attribution belongs on the paper line.
    for (const s of STRATEGIES) {
      expect(s.tagline, s.id).not.toMatch(/Keller|Keuning|van Putten|\b(19|20)\d{2}\b/)
    }
  })

  it('avoids the vocabulary of the papers', () => {
    for (const s of STRATEGIES) {
      expect(s.tagline, s.id).not.toMatch(/13612|SMA12|dual-momentum|breadth|G4|B3|canary/i)
    }
  })
})

describe('comparison facts', () => {
  it('describes what each strategy holds and how it de-risks', () => {
    for (const s of STRATEGIES) {
      expect(s.comparison.holds, s.id).toBeTruthy()
      expect(s.comparison.deRisks, s.id).toBeTruthy()
    }
  })

  it('states facts rather than ratings', () => {
    // The site must not rank the six by expected return: it is published
    // by a UK company and a comparison that reads as a recommendation is
    // a financial promotion. Facts let the reader draw the conclusion.
    for (const s of STRATEGIES) {
      const text = `${s.comparison.holds} ${s.comparison.deRisks}`
      expect(text, s.id).not.toMatch(/best|worst|better|safest|aggressive|recommended|\bbest\b|★|\d+\s*\/\s*\d+/i)
    }
  })
})

describe('fundsNeeded', () => {
  it('counts the distinct ETFs a broker has to support', () => {
    const expected: Record<string, number> = {
      vaa: 7, // 4 offensive + 3 defensive
      daa: 14, // 12 risky + SHY, IEF
      paa: 14, // 12 risky + IEF, SHY
      haa: 9, // 8 risky + BIL (IEF is already in the risky sleeve)
      baa: 16, // 12 risky + TIP, BIL, IEF, BND
      laa: 5, // IWD, GLD, IEF + QQQ, SHY
    }

    for (const s of STRATEGIES) {
      expect(fundsNeeded(s.defaultUniverse), s.id).toBe(expected[s.id])
    }
  })

  it('excludes assets the strategy only reads', () => {
    // Canaries and trend signals are watched, never bought — a broker
    // does not need to carry them. LAA reads SPY and never holds it; DAA
    // reads BND, HAA reads TIP, BAA reads TIP.
    const laa = findStrategy('laa')!
    expect(fundsNeeded(laa.defaultUniverse)).toBe(5)

    const haa = findStrategy('haa')!
    expect(fundsNeeded(haa.defaultUniverse)).toBe(9)
  })
})
