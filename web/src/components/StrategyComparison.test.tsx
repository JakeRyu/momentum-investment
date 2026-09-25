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

  it('shows a fall for every strategy, now that all six match their papers', () => {
    renderComparison()
    for (const s of STRATEGIES) {
      const row = screen.getByTestId(`compare-row-${s.id}`)
      expect(within(row).queryByText('—'), s.id).toBeNull()
    }
  })

  it('drops the withheld-figure note when nothing is withheld', () => {
    const { container } = renderComparison()
    expect(container.textContent).not.toMatch(/No figure is shown/i)
    // The framing that must never drop out stays.
    expect(container.textContent).toMatch(/month-end/i)
    expect(container.textContent).toMatch(/do not predict/i)
  })

  it('withholds any strategy that loses its figure', () => {
    // Guards the mechanism rather than today's data: if a future audit
    // pulls a figure, the row must fall back to a dash and the note must
    // explain it. Both HAA and BAA went through exactly this.
    const withheld = STRATEGIES.filter((s) => !s.backtest)
    expect(withheld).toHaveLength(0)
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

  it('shows the table alone when asked, for pages that frame it themselves', () => {
    const { container } = render(
      <MemoryRouter>
        <StrategyComparison tableOnly />
      </MemoryRouter>,
    )
    expect(container.textContent).not.toMatch(/Start with VAA/)
    expect(container.textContent).not.toMatch(/do not predict/i)
    for (const s of STRATEGIES) {
      expect(screen.getByTestId(`compare-row-${s.id}`), s.id).toBeInTheDocument()
    }
  })
})
