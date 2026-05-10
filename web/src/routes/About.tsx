import { Link } from 'react-router-dom'

import { STRATEGIES } from '../strategies'

export default function About() {
  return (
    <article className="about-page">
      <header>
        <h1>About</h1>
      </header>

      <section>
        <h2>Wouter Keller</h2>
        <p>
          Wouter Keller is a Dutch quantitative researcher who has published
          extensively on tactical asset allocation via SSRN since the early
          2010s. The six strategies featured on this site — VAA, DAA, PAA,
          HAA, BAA, and LAA — are all developed by Keller (some with co-authors
          Jan Willem Keuning and JW van Putten) and published as open papers
          between 2016 and 2023.
        </p>
        <p>
          The unifying idea across his work is{' '}
          <em>breadth momentum</em>: instead of only ranking assets by their
          momentum scores, also count <em>how many</em> assets in a given
          universe currently show positive momentum. When that count drops —
          a signal that risk is broadly elevated — the strategy rotates
          defensively into bonds or cash. The "canary universe" extension
          (DAA, BAA, HAA) sharpens this further: a small bellwether basket
          whose breadth alone gates the entire offensive/defensive switch,
          independent of how the main risky universe scores.
        </p>
        <p>
          This site implements those papers as a runnable tool on live market
          data. The strategy designs are Keller's; any implementation choices
          or errors here are mine.
        </p>
      </section>

      <section>
        <h2>How the strategies work, in 30 seconds</h2>
        <p>
          Most of the strategies score assets with one of two signals:
        </p>
        <ul>
          <li>
            <strong>13612W</strong> — a weighted blend of 1-, 3-, 6-, and
            12-month returns. Used by VAA, DAA, HAA, BAA's canary, and BAA's
            risky leg.
          </li>
          <li>
            <strong>SMA12</strong> — current price relative to its 12-month
            simple moving average. Used by PAA and BAA's cash leg.
          </li>
        </ul>
        <p>
          LAA is the exception: it doesn't rank assets by momentum at all.
          Instead, 75% of the portfolio sits in a fixed permanent sleeve, and
          the remaining 25% rotates between QQQ and SHY based on a
          Growth-Trend timing gate built from the SPY 200-day SMA and the FRED
          unemployment series.
        </p>
        <p>
          All strategies use the original Keller US ticker universe. The
          companion mobile app supports a UK UCITS substitution layer; web
          will follow.
        </p>
      </section>

      <section>
        <h2>Papers</h2>
        <ul className="paper-list">
          {STRATEGIES.map((s) => (
            <li key={s.id}>
              <strong>{s.shortName}</strong> —{' '}
              <a href={s.paperUrl} target="_blank" rel="noreferrer">
                {s.paperTitle}
              </a>{' '}
              ({s.paperYear})
            </li>
          ))}
        </ul>
      </section>

      <section className="disclaimer-section">
        <h2>Disclaimer</h2>
        <p>
          This is an educational tool, not investment advice. The strategies
          shown have published backtests in their source papers, but
          backtested returns do not predict future performance. Market data
          comes from unofficial Yahoo Finance and FRED endpoints — the
          implementation can be wrong, the data can be wrong, and momentum
          strategies can and do underperform for extended periods. Do your own
          research before allocating capital.
        </p>
      </section>

      <p className="back-link">
        <Link to="/">← Back to strategies</Link>
      </p>
    </article>
  )
}
