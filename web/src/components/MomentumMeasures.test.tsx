import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import MomentumMeasures from './MomentumMeasures'

describe('MomentumMeasures', () => {
  it('puts BAA in both columns, because it runs both signals', () => {
    const { container } = render(<MomentumMeasures />)
    const columns = container.querySelectorAll('.measures__col')
    expect(columns).toHaveLength(2)
    for (const col of columns) {
      expect(col.textContent).toMatch(/BAA/)
    }
  })

  it('keeps PAA out of the blend column', () => {
    const { container } = render(<MomentumMeasures />)
    const [blend, average] = container.querySelectorAll('.measures__col')
    expect(blend.textContent).not.toMatch(/PAA/)
    expect(average.textContent).toMatch(/PAA/)
  })

  it('names LAA as using neither, rather than filing it under one', () => {
    const { container } = render(<MomentumMeasures />)
    for (const col of container.querySelectorAll('.measures__col')) {
      expect(col.textContent).not.toMatch(/LAA/)
    }
    expect(
      container.querySelector('.measures__note')?.textContent,
    ).toMatch(/LAA/)
  })
})
