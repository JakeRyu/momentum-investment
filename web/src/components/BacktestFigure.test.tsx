import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { STRATEGIES, type Backtest } from '../strategies'

import BacktestFigure from './BacktestFigure'

const VAA: Backtest = {
  variant: 'VAA-G4 (T/B=1/1)',
  periodStart: '1970-12',
  periodEnd: '2016-12',
  cagrPct: 18.9,
  maxDrawdownPct: 13.0,
  sourceLabel: 'Table 8',
}

describe('BacktestFigure', () => {
  it('names the period in readable months', () => {
    render(<BacktestFigure backtest={VAA} />)
    expect(screen.getByText(/Dec 1970 – Dec 2016/)).toBeInTheDocument()
  })

  it('calls it a backtest', () => {
    const { container } = render(<BacktestFigure backtest={VAA} />)
    expect(container.textContent).toMatch(/backtest/i)
  })

  it('says the fall is measured at month-end', () => {
    const { container } = render(<BacktestFigure backtest={VAA} />)
    expect(container.textContent).toMatch(/month-end/i)
  })

  it('warns that intra-month falls run deeper', () => {
    const { container } = render(<BacktestFigure backtest={VAA} />)
    expect(container.textContent).toMatch(/deeper/i)
  })

  it('refuses to imply a prediction', () => {
    const { container } = render(<BacktestFigure backtest={VAA} />)
    expect(container.textContent).toMatch(/do not predict/i)
  })

  it('credits the variant and the source table', () => {
    const { container } = render(<BacktestFigure backtest={VAA} />)
    expect(container.textContent).toContain('VAA-G4 (T/B=1/1)')
    expect(container.textContent).toContain('Table 8')
  })

  it('shows the drawdown as a fall, not a gain', () => {
    render(<BacktestFigure backtest={VAA} />)
    expect(screen.getByText('−13.0%')).toBeInTheDocument()
  })
})

const strategiesWithBacktest = STRATEGIES.filter((s) => s.backtest)

describe.each(strategiesWithBacktest)('BacktestFigure ($id)', (strategy) => {
  const backtest = strategy.backtest as Backtest

  it('carries the period, the word "backtest", the month-end qualifier and the no-prediction line', () => {
    const { container } = render(<BacktestFigure backtest={backtest} />)
    expect(container.textContent).toMatch(/backtest/i)
    expect(container.textContent).toMatch(/month-end/i)
    expect(container.textContent).toMatch(/do not predict/i)
    expect(
      screen.getByText(new RegExp(`${formatMonth(backtest.periodStart)} – ${formatMonth(backtest.periodEnd)}`))
    ).toBeInTheDocument()
  })
})

/** "1970-12" → "Dec 1970". Mirrors BacktestFigure's own formatter. */
function formatMonth(ym: string): string {
  const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  const [year, month] = ym.split('-')
  return `${MONTHS[Number(month) - 1]} ${year}`
}
