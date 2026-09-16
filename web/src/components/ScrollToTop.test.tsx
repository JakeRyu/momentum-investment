import { fireEvent, render, screen } from '@testing-library/react'
import { Link, MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ScrollToTop from './ScrollToTop'

function Back() {
  const navigate = useNavigate()
  return <button onClick={() => navigate(-1)}>back</button>
}

function renderPages() {
  return render(
    <MemoryRouter initialEntries={['/one']}>
      <ScrollToTop />
      <Routes>
        <Route path="/one" element={<Link to="/two">to two</Link>} />
        <Route path="/two" element={<Back />} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ScrollToTop', () => {
  it('goes to the top when a link takes you somewhere new', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    renderPages()
    scrollTo.mockClear()

    fireEvent.click(screen.getByText('to two'))

    expect(scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('leaves the position alone on back', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    renderPages()
    fireEvent.click(screen.getByText('to two'))
    scrollTo.mockClear()

    // Going back returns the reader to something already read, where the
    // position they left is the one worth keeping.
    fireEvent.click(screen.getByText('back'))

    expect(screen.getByText('to two')).toBeInTheDocument()
    expect(scrollTo).not.toHaveBeenCalled()
  })
})
