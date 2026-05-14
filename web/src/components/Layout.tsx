import { Link, NavLink, Outlet } from 'react-router-dom'

import { STRATEGIES } from '../strategies'

export default function Layout() {
  return (
    <div className="layout">
      <header className="site-header">
        <Link to="/" className="brand">
          Momentum Investment
        </Link>
        <nav className="nav">
          <NavLink to="/" end className={navClass}>
            Strategies
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
          Educational tool — Not investment advice — Past performance is not
          indicative of future results.
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
