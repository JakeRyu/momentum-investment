import { Link, useParams } from 'react-router-dom'

import DecisionTool from '../components/DecisionTool'
import { findStrategy } from '../strategies'

import NotFound from './NotFound'

export default function StrategyPage() {
  const { id } = useParams<{ id: string }>()
  const strategy = id ? findStrategy(id) : undefined

  if (!strategy) return <NotFound />

  return (
    <article className="strategy-page">
      <header className="strategy-page__head">
        <p className="strategy-page__short">{strategy.shortName}</p>
        <h1>{strategy.fullName}</h1>
        <p className="strategy-page__blurb">{strategy.blurb}</p>
      </header>

      <section className="strategy-page__body">
        {strategy.longDescription.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
        <p className="strategy-page__paper">
          Paper:{' '}
          <a href={strategy.paperUrl} target="_blank" rel="noreferrer">
            {strategy.paperTitle} ({strategy.paperYear})
          </a>
        </p>
      </section>

      <section className="strategy-page__tool">
        <h2>Today's decision</h2>
        <DecisionTool strategy={strategy} />
      </section>

      <p className="back-link">
        <Link to="/">← All strategies</Link>
      </p>
    </article>
  )
}
