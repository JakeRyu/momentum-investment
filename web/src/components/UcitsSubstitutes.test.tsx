import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { findStrategy, fundsNeeded } from '../strategies'

import UcitsSubstitutes from './UcitsSubstitutes'

describe('UcitsSubstitutes', () => {
  it('carries a substitute that is not exact', () => {
    const { container } = render(<UcitsSubstitutes />)
    // Without an imperfect row the table quietly asserts that
    // substitution is easy, which is the opposite of the lesson.
    expect(container.querySelector('.ucits__scale--far')).not.toBeNull()
  })

  it('separates the rule holding from the backtest weakening', () => {
    const { container } = render(<UcitsSubstitutes />)
    const [holds, weakens] = container.querySelectorAll('.ucits__col')
    expect(holds.textContent).toMatch(/own history/)
    expect(weakens.textContent).toMatch(/16\.1% → 25\.2%/)
  })

  it('says the scale measures distance, not quality', () => {
    const { container } = render(<UcitsSubstitutes />)
    expect(container.querySelector('.ucits__tail')?.textContent).toMatch(
      /not a quality rating/,
    )
  })

  it('counts the substitutions from the strategy data, not by hand', () => {
    const { container } = render(<UcitsSubstitutes />)
    const tail = container.querySelector('.ucits__tail')?.textContent ?? ''
    for (const id of ['laa', 'baa']) {
      const count = fundsNeeded(findStrategy(id)!.defaultUniverse)
      expect(tail).toMatch(new RegExp(`\\b${count}\\b`))
    }
  })
})
