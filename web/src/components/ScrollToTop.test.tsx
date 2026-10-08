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

  it('goes to the named section when the link carries one', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    render(
      <MemoryRouter initialEntries={['/one']}>
        <ScrollToTop />
        <Routes>
          <Route path="/one" element={<Link to="/two#list">to the list</Link>} />
          <Route path="/two" element={<section id="list">list</section>} />
        </Routes>
      </MemoryRouter>,
    )
    scrollTo.mockClear()

    fireEvent.click(screen.getByText('to the list'))

    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById('list'))
    expect(scrollTo).not.toHaveBeenCalled()
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
