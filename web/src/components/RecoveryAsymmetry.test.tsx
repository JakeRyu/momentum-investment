import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import RecoveryAsymmetry from './RecoveryAsymmetry'

describe('RecoveryAsymmetry', () => {
  it('states the fall and the climb as the two different numbers', () => {
    render(<RecoveryAsymmetry />)
    expect(screen.getByText('−50%')).toBeInTheDocument()
    expect(screen.getByText('+100%')).toBeInTheDocument()
  })

  it('draws the climb as the same width as the half it replaces', () => {
    const { container } = render(<RecoveryAsymmetry />)
    const gain = container.querySelector('.recovery__gain') as HTMLElement
    const bars = container.querySelectorAll('.recovery__solid')
    // The recovery bar starts where the surviving half ends, and spans
    // exactly as far — that equality is the whole argument.
    expect(gain.style.left).toBe('50%')
    expect(gain.style.width).toBe('50%')
    expect((bars[bars.length - 1] as HTMLElement).style.width).toBe('50%')
  })
})
