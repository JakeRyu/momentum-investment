import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { STRATEGIES } from '../strategies'

import StrategyComparison from './StrategyComparison'

function renderComparison() {
  return render(
    <MemoryRouter>
      <StrategyComparison />
    </MemoryRouter>,
  )
}

describe('StrategyComparison', () => {
  it('lists all six strategies, each linking to its page', () => {
    renderComparison()
    for (const s of STRATEGIES) {
      const link = screen.getByRole('link', { name: new RegExp(s.shortName) })
      expect(link, s.id).toHaveAttribute('href', `/strategies/${s.id}`)
    }
  })

  it('leads with the worst fall, because that is the site argument', () => {
    renderComparison()
    // VAA's published figure. The comparison exists to let a beginner see
    // how far each strategy fell, not how much it earned.
    expect(screen.getByText('−16.4%')).toBeInTheDocument()
  })

  it('shows no return figures, so the table cannot be read as a ranking', () => {
    const { container } = renderComparison()
    // 18.8 is VAA's CAGR — present in the data, deliberately absent here.
    expect(container.textContent).not.toContain('18.8')
  })

  it('withholds the fall for strategies whose code diverges from their paper', () => {
    renderComparison()
    for (const id of ['haa', 'baa']) {
      const row = screen.getByTestId(`compare-row-${id}`)
      expect(within(row).getByText('—'), id).toBeInTheDocument()
    }
  })

  it('says why those two are blank rather than leaving a bare dash', () => {
    const { container } = renderComparison()
    expect(container.textContent).toMatch(/differs from|diverge/i)
  })

  it('carries the comparison facts for every strategy', () => {
    renderComparison()
    for (const s of STRATEGIES) {
      const row = screen.getByTestId(`compare-row-${s.id}`)
      expect(within(row).getByText(s.comparison.holds), s.id).toBeInTheDocument()
      expect(within(row).getByText(s.comparison.deRisks), s.id).toBeInTheDocument()
      expect(within(row).getByText(s.tagline), s.id).toBeInTheDocument()
    }
  })

  it('recommends a starting point on simplicity, never on performance', () => {
    const { container } = renderComparison()
    expect(container.textContent).toMatch(/simplest/i)
    expect(container.textContent).not.toMatch(/highest return|best performing|earns the most/i)
  })
})
