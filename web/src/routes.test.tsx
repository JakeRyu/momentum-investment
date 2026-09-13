import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import AppPromo from './components/AppPromo'
import { STRATEGIES } from './strategies'
import About from './routes/About'
import Home from './routes/Home'
import NotFound from './routes/NotFound'
import Privacy from './routes/Privacy'
import StrategyPage from './routes/StrategyPage'

/** Mirrors main.tsx. The app links to these paths; none may move. */
function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/strategies/:id" element={<StrategyPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('URLs the iPhone app links to', () => {
  // HomeScreen.tsx:91 — "How these strategies work →"
  it('serves the landing page', () => {
    const { container } = renderAt('/')
    expect(container.querySelector('.not-found')).toBeNull()
  })

  // DecisionScreen.tsx:241 — "How this strategy works →"
  it.each(STRATEGIES.map((s) => s.id))('serves /strategies/%s', (id) => {
    const { container } = renderAt(`/strategies/${id}`)
    expect(container.querySelector('.not-found')).toBeNull()
  })

  // App Store listing — privacy policy URL
  it('serves the privacy page', () => {
    const { container } = renderAt('/privacy')
    expect(container.querySelector('.not-found')).toBeNull()
  })
})

describe('AppPromo', () => {
  it('does not advertise the date picker phase 2 removed', () => {
    const { container } = render(<AppPromo />)
    expect(container.textContent).not.toMatch(/any date|date you choose|per-date/i)
  })

  it('describes what the app actually does', () => {
    render(<AppPromo />)
    expect(screen.getByText(/in force/i)).toBeInTheDocument()
  })
})
