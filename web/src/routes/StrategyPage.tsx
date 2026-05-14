import { Link, useParams } from 'react-router-dom'

import DecisionTool from '../components/DecisionTool'
import { findStrategy, type Strategy } from '../strategies'

import NotFound from './NotFound'

export default function StrategyPage() {
  const { id } = useParams<{ id: string }>()
  const strategy = id ? findStrategy(id) : undefined

  if (!strategy) return <NotFound />

  return (
    <article className="strategy-page">
      <header className="strategy-page__head">
        <p className="strategy-page__tag">{dottedShort(strategy)}</p>
        <h1>{splitTitle(strategy.fullName)}</h1>
      </header>

      <div className="strategy-page__rule-thin" />

      <p className="strategy-page__lede">{strategy.blurb}</p>

      <div className="strategy-page__body">
        {strategy.longDescription.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <p className="strategy-page__paper">
        Paper ·{' '}
        <em>
          <a href={strategy.paperUrl} target="_blank" rel="noreferrer">
            {strategy.paperTitle}
          </a>
        </em>{' '}
        — {strategy.paperYear}
      </p>

      <div className="strategy-page__rule-heavy" />

      <section className="strategy-page__tool">
        <div className="decision-banner">
          <h2>Today's Decision</h2>
          <span className="decision-banner__asof">
            As of {new Date().toISOString().slice(0, 10).replace(/-/g, '.')}
          </span>
        </div>
        <DecisionTool strategy={strategy} />
      </section>

      <p className="back-link">
        <Link to="/">← All strategies</Link>
      </p>
    </article>
  )
}

function dottedShort(s: Strategy): string {
  return s.shortName.split('').join('.') + '.'
}

// Split long-name titles at the first space so "Vigilant Asset Allocation"
// renders across two display lines for the magazine-spread hero.
function splitTitle(full: string): React.ReactNode {
  const i = full.indexOf(' ')
  if (i === -1) return full
  const head = full.slice(0, i)
  const tail = full.slice(i + 1)
  return (
    <>
      {head}
      <br />
      {tail}
    </>
  )
}
