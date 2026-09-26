import { Link, NavLink, Outlet } from 'react-router-dom'

import { STRATEGIES } from '../strategies'

import ScrollToTop from './ScrollToTop'

export default function Layout() {
  return (
    <div className="layout">
      <ScrollToTop />
      <header className="site-header">
        <Link to="/" className="brand">
          Monthly Rule
        </Link>
        <nav className="nav">
          <NavLink to="/" end className={navClass}>
            Strategies
          </NavLink>
          <NavLink to="/learn" className={navClass}>
            Learn
          </NavLink>
          <NavLink to="/about" className={navClass}>
            About
          </NavLink>
        </nav>
      </header>
      <div className="site-header__rule" />

      <main className="layout-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <p className="disclaimer">
          Computed from the published rules on live market data — Not investment
          advice — Past performance does not predict future results —{' '}
          <Link to="/privacy">Privacy</Link>
        </p>
        <p>
          App Store is a service mark of Apple Inc. Google Play and the Google
          Play logo are trademarks of Google LLC.
        </p>
        <p className="papers">
          Papers ·{' '}
          {STRATEGIES.map((s, i) => (
            <span key={s.id}>
              {i > 0 && ' · '}
              <a href={s.paperUrl} target="_blank" rel="noreferrer">
                {s.shortName}
              </a>
            </span>
          ))}
        </p>
      </footer>
    </div>
  )
}

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'nav-link nav-link--active' : 'nav-link'
}
