import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import CanaryGate from './CanaryGate'

describe('CanaryGate', () => {
  it('shows the same healthy main universe in both columns', () => {
    const { container } = render(<CanaryGate />)
    const [open, shut] = container.querySelectorAll('.canary__col')

    // The figure only argues anything if the count that gets ignored is
    // identical to the one that gets read — and still healthy.
    const counts = (col: Element) =>
      [...col.querySelectorAll('.canary__count')].map((n) => n.textContent)
    expect(counts(open)).toContain('8 of 12 rising — healthy')
    expect(counts(shut)).toContain('8 of 12 rising — healthy')
  })

  it('reaches opposite allocations from that same count', () => {
    const { container } = render(<CanaryGate />)
    const [open, shut] = container.querySelectorAll('.canary__col')
    expect(open.querySelector('.canary__out-label')?.textContent).toBe(
      'OFFENSIVE',
    )
    expect(shut.querySelector('.canary__out-label')?.textContent).toBe(
      'DEFENSIVE',
    )
  })

  it('marks the skipped universe only where the gate is shut', () => {
    const { container } = render(<CanaryGate />)
    const [open, shut] = container.querySelectorAll('.canary__col')
    expect(open.querySelector('.canary__box--skipped')).toBeNull()
    expect(shut.querySelector('.canary__box--skipped')).not.toBeNull()
  })

  it('ranks a set in both columns — the canary picks which, not whether', () => {
    const { container } = render(<CanaryGate />)
    for (const col of container.querySelectorAll('.canary__col')) {
      expect(col.querySelector('.canary__cell--held')).not.toBeNull()
    }
  })

  /**
   * Every grid states a count in the line under it, so the squares and
   * the sentence are two spellings of one fact and can disagree. They
   * did: the main universe read "8 of 12 rising" over twelve filled
   * squares, and "best 3 of the 8" sat over three.
   */
  it('draws each count as the number of squares it claims', () => {
    const { container } = render(<CanaryGate />)
    const grids = [...container.querySelectorAll('.canary__grid')]

    const shape = (g: Element) => ({
      total: g.querySelectorAll('.canary__cell').length,
      off: g.querySelectorAll('.canary__cell--off').length,
      held: g.querySelectorAll('.canary__cell--held').length,
    })

    // Canary all clear: 2 of 2 rising.
    expect(shape(grids[0])).toEqual({ total: 2, off: 0, held: 0 })
    // Main universe: 8 of 12 rising — so four are not.
    expect(shape(grids[1])).toEqual({ total: 12, off: 4, held: 0 })
    // Best 3 of the 8: all eight shown, three marked.
    expect(shape(grids[2])).toEqual({ total: 8, off: 0, held: 3 })

    // One canary falling of two.
    expect(shape(grids[3])).toEqual({ total: 2, off: 1, held: 0 })
    // The same main universe, unchanged.
    expect(shape(grids[4])).toEqual({ total: 12, off: 4, held: 0 })
    // Best 1 of 3 in the defensive set.
    expect(shape(grids[5])).toEqual({ total: 3, off: 1, held: 1 })
  })

  it('says the canary belongs to only three of the six', () => {
    const { container } = render(<CanaryGate />)
    expect(container.querySelector('.canary__note')?.textContent).toMatch(
      /DAA, BAA and HAA/,
    )
  })
})
