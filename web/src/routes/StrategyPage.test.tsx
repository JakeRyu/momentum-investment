import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

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

  it('shows the block for BAA, reconciled with its paper', () => {
    renderAt('/strategies/baa')
    expect(screen.getByText('−8.7%')).toBeInTheDocument()
  })
})

describe('the decision banner’s date', () => {
  /** A decision whose prices stop one day short of the date requested. */
  function stubDecision(asOf: string, pricesAsOf: string) {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            strategyId: 'vaa-g4b3',
            asOf,
            pricesAsOf,
            modeLabel: 'Offensive',
            allocations: [{ ticker: 'SPY', weight: 1 }],
            scores: [{ ticker: 'SPY', score: 0.1, bucket: 'Offensive' }],
            reasoning: 'r',
          }),
      } as Response),
    )
  }

  afterEach(() => vi.unstubAllGlobals())

  it('dates itself by the close the reading used, not by the clock', async () => {
    // The pre-open case measured against Yahoo on 2026-09-16: no bar exists
    // for that session yet, so the reading reaches back to the 15th.
    stubDecision('2026-09-16', '2026-09-15')
    renderAt('/strategies/vaa')

    expect(await screen.findByText(/As of 2026\.09\.15/)).toBeInTheDocument()
    expect(screen.queryByText(/As of 2026\.09\.16/)).not.toBeInTheDocument()
  })

  it('shows no date at all rather than a guessed one when the fetch fails', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')))
    renderAt('/strategies/vaa')

    await waitFor(() =>
      expect(screen.queryByText(/As of /)).not.toBeInTheDocument(),
    )
  })
})
