import { Link } from 'react-router-dom'

import { APP_STORE_CTA, APP_STORE_URL } from '../appStore'
import StrategyComparison from '../components/StrategyComparison'

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <h1>Momentum Investment</h1>
        <p className="hero-tagline">
          Six tactical asset allocation strategies, runnable end-to-end on live
          market data.
        </p>
        <p className="hero-keller">
          Strategies designed by Wouter Keller. <Link to="/about">About →</Link>
        </p>
      </section>

      <section id="strategies" className="strategies-section">
        <h2 className="section-title">Compare The Six</h2>
        <StrategyComparison />
      </section>

      <section className="learn-entry">
        <h2 className="section-title">New To This?</h2>
        <p className="learn-entry__body">
          Four short lessons on why these rules exist, what they measure,
          and what you would actually buy — starting from no background at
          all.
        </p>
        <Link to="/learn" className="learn-entry__cta">
          Start the course →
        </Link>
      </section>

      <section className="app-section">
        <h2 className="section-title">Take It With You</h2>
        <div className="app-compare">
          <div className="app-compare__col">
            <p className="app-compare__label">This Site</p>
            <ul>
              <li>US paper universe, as published</li>
              <li>Today's decision only</li>
              <li>Strategy education &amp; papers</li>
            </ul>
          </div>
          <div className="app-compare__col app-compare__col--app">
            <p className="app-compare__label">The App</p>
            <ul>
              <li>Local UCITS ETF mapping (UK first)</li>
              <li>In-force allocation, month to month</li>
              <li>The same six Keller strategies</li>
            </ul>
            <a
              className="app-badge"
              href={APP_STORE_URL}
              target="_blank"
              rel="noreferrer"
            >
              <img
                src="/app-store-badge.svg"
                alt={APP_STORE_CTA}
                width="143"
                height="48"
              />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
