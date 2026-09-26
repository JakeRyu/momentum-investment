import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import AppPromo from '../components/AppPromo'
import BacktestFigure from '../components/BacktestFigure'
import DecisionTool from '../components/DecisionTool'
import PageMeta from '../components/PageMeta'
import { findStrategy, type Strategy } from '../strategies'

import NotFound from './NotFound'

export default function StrategyPage() {
  const { id } = useParams<{ id: string }>()
  const strategy = id ? findStrategy(id) : undefined
  // The date the reading actually used, reported up by the tool below.
  // Null until it loads, and again if the fetch fails — better no date
  // than a guessed one.
  const [pricesAsOf, setPricesAsOf] = useState<string | null>(null)

  if (!strategy) return <NotFound />

  return (
    <article className="strategy-page">
      <PageMeta
        title={`${strategy.fullName} (${strategy.shortName})`}
        description={`${strategy.tagline}. How ${strategy.shortName} works, the paper behind it, and today's decision on live market data.`}
        path={`/strategies/${strategy.id}`}
      />
      <header className="strategy-page__head">
        <p className="strategy-page__tag">{dottedShort(strategy)}</p>
        <h1>{splitTitle(strategy.fullName)}</h1>
      </header>

      <div className="strategy-page__rule-thin" />

      <p className="strategy-page__lede">{strategy.tagline}</p>

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

      {strategy.backtest && <BacktestFigure backtest={strategy.backtest} />}

      <div className="strategy-page__rule-heavy" />

      <section className="strategy-page__tool">
        <div className="decision-banner">
          <h2>Today's Decision</h2>
          {pricesAsOf && (
            <span className="decision-banner__asof">
              As of {pricesAsOf.replace(/-/g, '.')}
            </span>
          )}
          <p className="decision-banner__note">
            The latest closing prices, run through the rule — what it would
            say if today were rebalance day. Not in force until the next
            month-end, so act on it in the first days of a month.
          </p>
          <LessonKey strategy={strategy} />
        </div>
        <DecisionTool strategy={strategy} onPricesAsOf={setPricesAsOf} />
      </section>

      <AppPromo />

      <p className="back-link">
        <Link to="/">← All strategies</Link>
      </p>
    </article>
  )
}

/**
 * Points a reader who landed here from a search, not from the course, at
 * the lesson behind each part of the reading below. The link text names
 * the lesson's subject, which is what a search engine reads it as.
 */
function LessonKey({ strategy }: { strategy: Strategy }) {
  const topics: [label: string, slug: string][] = [
    ['what momentum is', 'what-momentum-is'],
    ...('canary' in strategy.defaultUniverse
      ? [['what the canary does', 'what-breadth-adds'] as [string, string]]
      : []),
    ['when to act on the signal', 'one-signal-a-month'],
  ]
  const links = topics.map(([label, slug]) => (
    <Link key={slug} to={`/learn/${slug}`}>
      {label}
    </Link>
  ))

  return (
    <p className="decision-banner__learn">
      New to these readings? The course explains{' '}
      {links.map((link, i) => (
        <span key={i}>
          {i > 0 && (i === links.length - 1 ? ' and ' : ', ')}
          {link}
        </span>
      ))}
      .
    </p>
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
