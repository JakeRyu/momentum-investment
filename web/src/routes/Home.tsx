import { Link } from 'react-router-dom'

import StrategyGrid from '../components/StrategyGrid'

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
        <StrategyGrid />
      </section>
    </div>
  )
}
