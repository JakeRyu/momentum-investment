import { Link, useParams } from 'react-router-dom'

import {
  APP_STORE_CTA,
  APP_STORE_URL,
  PLAY_STORE_CTA,
  PLAY_STORE_URL,
} from '../appStore'
import BacktestFigure from '../components/BacktestFigure'
import KoreanHead from '../components/KoreanHead'
import LangSwitch from '../components/LangSwitch'
import PageMeta from '../components/PageMeta'
import { findCourseLesson } from '../lessons/courses'
import { findStrategy, type Strategy } from '../strategies'
import { STRATEGIES_KO } from '../strategies.ko'

import NotFound from './NotFound'
import { dottedShort, splitTitle } from './strategyTitle'

/**
 * A strategy explained in Korean. It explains the rule and stops there:
 * showing today's decision in Korean to the Korean public sits close to
 * the line Korean law draws around unregistered investment advice
 * (유사투자자문업), so the decision stays on the English page, one link
 * away. See docs/superpowers/specs/2026-10-08-korean-strategy-pages-design.md.
 */
export default function KoStrategyPage() {
  const { id } = useParams<{ id: string }>()
  const strategy = id ? findStrategy(id) : undefined
  if (!strategy) return <NotFound />

  const ko = STRATEGIES_KO[strategy.id]
  const english = `/strategies/${strategy.id}`

  return (
    <article className="strategy-page" lang="ko">
      <PageMeta
        title={`${strategy.fullName} (${strategy.shortName}) 전략`}
        description={`${ko.tagline}. ${strategy.shortName} 전략이 어떤 규칙으로 움직이는지 근거 논문과 함께 한국어로 설명합니다.`}
        path={`/ko/strategies/${strategy.id}`}
        alternates={{ en: english, ko: `/ko/strategies/${strategy.id}` }}
      />
      <KoreanHead />
      <header className="strategy-page__head">
        <p className="strategy-page__tag">{dottedShort(strategy)}</p>
        <h1 lang="en">{splitTitle(strategy.fullName)}</h1>
        <LangSwitch lang="en" to={english} />
      </header>

      <div className="strategy-page__rule-thin" />

      <p className="strategy-page__lede">{ko.tagline}</p>

      <div className="strategy-page__body">
        {ko.longDescription.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <p className="strategy-page__paper">
        논문 ·{' '}
        <em lang="en">
          <a href={strategy.paperUrl} target="_blank" rel="noreferrer">
            {strategy.paperTitle}
          </a>
        </em>{' '}
        — {strategy.paperYear}
      </p>

      {strategy.backtest && <BacktestFigure backtest={strategy.backtest} />}

      <div className="strategy-page__rule-heavy" />

      <section className="strategy-page__now">
        <h2>지금 무엇을 보유하나</h2>
        <p>
          이 페이지는 규칙만 설명합니다. 이 규칙이 지금 무엇을 보유하라고
          하는지는 영어 페이지의 Today&rsquo;s Decision이 실제 시장 가격으로
          계산해 보여 줍니다.
        </p>
        <p>
          <Link to={english}>{strategy.shortName} 영어 페이지에서 확인하기 →</Link>
        </p>
        <LessonLinks strategy={strategy} />
        <p className="strategy-page__disclaimer">
          이 사이트는 교육용 자료이며 투자 자문이 아닙니다. 과거 성과는 미래
          수익을 보장하지 않으며, 투자 판단과 그 결과에 대한 책임은 투자자
          본인에게 있습니다.
        </p>
      </section>

      {/* The English page's promo box and buttons, without its pitch: that
          one sells the UK UCITS mapping, and the app opens on the US
          funds a Korean reader buys. */}
      <aside className="app-promo">
        <p className="app-promo__tag">Monthly Rule 앱</p>
        <p className="app-promo__body">
          앱으로도 볼 수 있습니다. 앱의 Holding 화면은 언제 열어도 직전
          월말의 결과를 보여 주고, 이번 달에 리밸런싱했는지도 기록해 둡니다.
          아이폰과 안드로이드 모두 무료입니다.
        </p>
        <div className="app-promo__ctas">
          <a className="app-promo__cta" href={APP_STORE_URL} target="_blank" rel="noreferrer">
            {APP_STORE_CTA} →
          </a>
          <a className="app-promo__cta" href={PLAY_STORE_URL} target="_blank" rel="noreferrer">
            {PLAY_STORE_CTA} →
          </a>
        </div>
      </aside>

      <p className="back-link">
        <Link to="/ko/learn#strategies">← 여섯 전략</Link>
      </p>
    </article>
  )
}

/** The Korean lessons behind what the English page's reading shows. */
function LessonLinks({ strategy }: { strategy: Strategy }) {
  const slugs = [
    'what-momentum-is',
    ...('canary' in strategy.defaultUniverse ? ['what-breadth-adds'] : []),
    'one-signal-a-month',
  ]
  const lessons = slugs.flatMap((slug) => findCourseLesson('ko', slug) ?? [])

  return (
    <>
      <p>처음이라면 강의에서 먼저 읽어 보세요.</p>
      <ul className="strategy-page__lessons">
        {lessons.map((l) => (
          <li key={l.slug}>
            <Link to={`/ko/learn/${l.slug}`}>{l.title}</Link>
          </li>
        ))}
      </ul>
    </>
  )
}
