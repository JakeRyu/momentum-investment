import { describe, expect, it } from 'vitest'

import { STRATEGIES, type Strategy } from './strategies'
import { STRATEGIES_KO } from './strategies.ko'

/** Every ticker or series id the strategy's universe names. */
function universeSymbols(s: Strategy): string[] {
  return Object.entries(s.defaultUniverse)
    .filter(([key]) => key !== 'kind')
    .flatMap(([, value]) => value)
}

describe('Korean strategy copy', () => {
  it('covers every strategy', () => {
    for (const s of STRATEGIES) {
      const ko = STRATEGIES_KO[s.id]
      expect(ko?.tagline, s.id).toBeTruthy()
      expect(ko.longDescription.length, s.id).toBeGreaterThan(0)
      for (const p of ko.longDescription) expect(p, s.id).toBeTruthy()
    }
  })

  it('says what the strategy does, not who published it', () => {
    for (const s of STRATEGIES) {
      expect(STRATEGIES_KO[s.id].tagline, s.id).not.toMatch(
        /Keller|켈러|Keuning|van Putten|\b(19|20)\d{2}\b/,
      )
    }
  })

  it('keeps the papers’ vocabulary out of the taglines', () => {
    for (const s of STRATEGIES) {
      expect(STRATEGIES_KO[s.id].tagline, s.id).not.toMatch(
        /13612|SMA12|G4|B3|canary|breadth|카나리아|시장 폭/i,
      )
    }
  })

  it('names every ticker the English description names', () => {
    // A Korean edition may add definitions, but it must not drop or swap
    // a fund the English page tells the reader about.
    for (const s of STRATEGIES) {
      const en = s.longDescription.join(' ')
      const ko = STRATEGIES_KO[s.id].longDescription.join(' ')
      for (const sym of universeSymbols(s)) {
        if (new RegExp(`\\b${sym}\\b`).test(en)) {
          expect(ko, `${s.id}: ${sym}`).toMatch(new RegExp(`\\b${sym}\\b`))
        }
      }
    }
  })

  it('gives PAA’s thresholds as the point of full defence, not where it starts', () => {
    // BF = (12 − n) / N1 rises from n = 11 on; n ≤ 3 (a=1) and n ≤ 6 (a=2)
    // are where it reaches 100% (PaaService.cs). "…부터 늘린다" read as the
    // start, which told a reader PAA2 was fully invested at n = 8.
    const text = STRATEGIES_KO.paa.longDescription.join(' ')
    expect(text).not.toMatch(/이하일 때부터/)
    expect(text).toMatch(/n이 6 이하일 때 완전 방어/)
    expect(text).toMatch(/하나 줄 때마다/)
  })

  it('does not point at a tool the Korean page does not have', () => {
    // PAA's English text refers to the variant toggle "below".
    for (const s of STRATEGIES) {
      for (const p of STRATEGIES_KO[s.id].longDescription) {
        expect(p, s.id).not.toMatch(/아래|below/)
      }
    }
  })
})
