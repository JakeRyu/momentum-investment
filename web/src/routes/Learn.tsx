import { Link } from 'react-router-dom'

import KoreanHead from '../components/KoreanHead'
import LangSwitch from '../components/LangSwitch'
import PageMeta from '../components/PageMeta'
import { COURSES, otherLang, type Lang } from '../lessons/courses'

/**
 * Course contents. The site's reference pages let you look one thing up;
 * this is the part that assumes you arrived knowing nothing and puts the
 * pieces in an order.
 *
 * The Korean page is also the Korean reader's way in, so it says what the
 * site is and carries the disclaimer the English footer gives.
 */
const COPY: Record<Lang, { title: string; heading: string; description: string; lede: string; intro?: string[] }> = {
  en: {
    title: 'Learn',
    heading: 'Learn',
    description:
      'A short course on tactical asset allocation from no background at all: why these rules exist, what they measure, and what you would actually buy.',
    lede: 'Start from no background at all. By the end you should be able to open any strategy page and know what it is telling you to do, and why.',
  },
  ko: {
    title: '동적자산배분 강의',
    heading: '동적자산배분 강의',
    description:
      'VAA, DAA 같은 켈러(Keller)의 동적자산배분 전략을 배경지식 없이 배우는 짧은 강의. 규칙이 왜 있는지, 무엇을 재는지, 실제로 무엇을 사게 되는지.',
    lede: '배경지식 없이 시작합니다. 끝까지 읽으면 어느 전략 페이지를 열어도 그 페이지가 무엇을 하라고 하는지, 왜 그런지 알 수 있습니다.',
    intro: [
      'Monthly Rule은 켈러(Wouter Keller)와 공저자들이 논문으로 발표한 자산배분 규칙 여섯 가지를 실제 시장 가격으로 매달 계산해 보여주는 사이트입니다. 전략 페이지는 영어로 되어 있고, 이 강의는 그 페이지를 읽는 데 필요한 내용을 한국어로 옮긴 것입니다.',
      '이 사이트는 교육용 자료이며 투자 자문이 아닙니다. 과거 성과는 미래 수익을 보장하지 않으며, 투자 판단과 그 결과에 대한 책임은 투자자 본인에게 있습니다.',
    ],
  },
}

export default function Learn({ lang = 'en' }: { lang?: Lang }) {
  const { lessons, prefix } = COURSES[lang]
  const other = otherLang(lang)
  const copy = COPY[lang]

  return (
    <article className="learn" lang={lang}>
      <PageMeta
        title={copy.title}
        description={copy.description}
        path={`${prefix}/learn`}
        alternates={{ en: '/learn', ko: '/ko/learn' }}
      />
      {lang === 'ko' && <KoreanHead />}
      <header>
        <p className="learn__eyebrow">{lessons.length} lessons</p>
        <h1>{copy.heading}</h1>
        <p className="learn__lede">{copy.lede}</p>
        {copy.intro?.map((p) => (
          <p key={p} className="learn__intro">
            {p}
          </p>
        ))}
        <LangSwitch lang={other} to={`${COURSES[other].prefix}/learn`} />
      </header>

      <ol className="learn__list">
        {lessons.map((l) => (
          <li key={l.slug}>
            <Link to={`${prefix}/learn/${l.slug}`} className="learn__item">
              <span className="learn__number">{l.number}</span>
              <span className="learn__body">
                <span className="learn__title">{l.title}</span>
                <span className="learn__summary">{l.summary}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <p className="back-link">
        <Link to="/">← The six strategies</Link>
      </p>
    </article>
  )
}
