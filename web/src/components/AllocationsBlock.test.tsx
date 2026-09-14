import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import AllocationsBlock from './AllocationsBlock'

describe('AllocationsBlock', () => {
  it('says what the single held ticker is', () => {
    render(<AllocationsBlock allocations={[{ ticker: 'SHY', weight: 1 }]} />)
    expect(screen.getByText('SHY')).toBeInTheDocument()
    expect(screen.getByText(/1–3 year US Treasuries/)).toBeInTheDocument()
  })

  it('glosses every ticker in a multi-asset allocation', () => {
    render(
      <AllocationsBlock
        allocations={[
          { ticker: 'SPY', weight: 0.5 },
          { ticker: 'GLD', weight: 0.5 },
        ]}
      />,
    )
    expect(screen.getByText(/S&P 500/)).toBeInTheDocument()
    expect(screen.getByText(/Physical gold/)).toBeInTheDocument()
  })

  it('renders a ticker it has no description for', () => {
    render(<AllocationsBlock allocations={[{ ticker: 'ZZZ', weight: 1 }]} />)
    expect(screen.getByText('ZZZ')).toBeInTheDocument()
  })
})
