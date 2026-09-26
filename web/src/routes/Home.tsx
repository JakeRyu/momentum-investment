import { Link } from 'react-router-dom'

import {
  APP_STORE_CTA,
  APP_STORE_URL,
  PLAY_STORE_CTA,
  PLAY_STORE_URL,
} from '../appStore'
import PageMeta from '../components/PageMeta'
import StrategyComparison from '../components/StrategyComparison'
import { LESSONS } from '../lessons'

const FIRST_LESSON = LESSONS[0]

export default function Home() {
  return (
    <div className="home">
      <PageMeta
        description="Six tactical asset allocation strategies by Wouter Keller — VAA, DAA, PAA, HAA, BAA and LAA — run on live market data and compared by how deep they fall."
        path="/"
      />
      <section className="hero">
        <h1>Monthly Rule</h1>
        <p className="hero-claim">Built to be held.</p>
        <p className="hero-tagline">
          Six once-a-month investing rules from Wouter Keller’s papers,
          compared by how far they fall rather than how much they return.
        </p>
        <div className="hero-paths">
          <Link to={`/learn/${FIRST_LESSON.slug}`} className="hero-paths__primary">
            New here? Start with lesson 1 →
          </Link>
          <a href="#strategies" className="hero-paths__secondary">
            Know the rules? Compare the six ↓
          </a>
        </div>
      </section>

      <section id="strategies" className="strategies-section">
        <h2 className="section-title">Compare The Six</h2>
        <StrategyComparison />
      </section>

      <section className="learn-entry">
        <h2 className="section-title">New To This?</h2>
        <p className="learn-entry__body">
          {LESSONS.length} short lessons on why these rules exist, what they
          measure, and what you would actually buy — starting from no
          background at all.
        </p>
        <Link to={`/learn/${FIRST_LESSON.slug}`} className="learn-entry__cta">
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
            <div className="app-badges">
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
              <a
                className="app-badge"
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src="/google-play-badge.png"
                  alt={PLAY_STORE_CTA}
                  width="161"
                  height="48"
                />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
