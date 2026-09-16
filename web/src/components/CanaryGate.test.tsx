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

  it('says the canary belongs to only three of the six', () => {
    const { container } = render(<CanaryGate />)
    expect(container.querySelector('.canary__note')?.textContent).toMatch(
      /DAA, BAA and HAA/,
    )
  })
})
