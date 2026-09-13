import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import StrategyPage from './StrategyPage'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/strategies/:id" element={<StrategyPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('StrategyPage backtest block', () => {
  it('shows the drawdown for a strategy that matches its paper', () => {
    renderAt('/strategies/vaa')
    expect(screen.getByText('−16.4%')).toBeInTheDocument()
  })

  it('omits the block for BAA, whose canary diverges from the paper', () => {
    const { container } = renderAt('/strategies/baa')
    expect(container.querySelector('.backtest')).toBeNull()
  })
})
