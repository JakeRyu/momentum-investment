import { Link, useParams } from 'react-router-dom'

import KoreanHead from '../components/KoreanHead'
import LangSwitch from '../components/LangSwitch'
import PageMeta from '../components/PageMeta'
import { COURSES, findCourseLesson, otherLang, type Lang } from '../lessons/courses'

import NotFound from './NotFound'

/**
 * One lesson.
 *
 * The rail and the "N of M" marker exist because knowing how far along
 * you are is most of what stops a beginner abandoning a sequence. The
 * body sets in a single ~65ch column — the newspaper's three justified
 * columns are for scanning, and these pages are for reading.
 */
export default function Lesson({ lang = 'en' }: { lang?: Lang }) {
  const { slug } = useParams<{ slug: string }>()
  const lesson = slug ? findCourseLesson(lang, slug) : undefined

  if (!lesson) return <NotFound />

  const { lessons, prefix } = COURSES[lang]
  const other = otherLang(lang)
  // Only a lesson that exists in both languages is paired or switchable.
  const twin = findCourseLesson(other, lesson.slug)
  const index = lessons.indexOf(lesson)
  const previous = lessons[index - 1]
  const next = lessons[index + 1]
  const { Body } = lesson

  return (
    <article className="lesson" lang={lang}>
      <PageMeta
        title={lesson.title}
        description={lesson.summary}
        path={`${prefix}/learn/${lesson.slug}`}
        alternates={
          twin
            ? { en: `/learn/${lesson.slug}`, ko: `/ko/learn/${lesson.slug}` }
            : undefined
        }
      />
      {lang === 'ko' && <KoreanHead />}
      <nav className="lesson__rail" aria-label="Course progress">
        <ol>
          {lessons.map((l) => (
            <li
              key={l.slug}
              className={l.slug === lesson.slug ? 'is-current' : undefined}
            >
              <Link to={`${prefix}/learn/${l.slug}`} aria-current={l.slug === lesson.slug ? 'step' : undefined}>
                <span className="lesson__rail-number">{l.number}</span>
                <span className="lesson__rail-title">{l.title}</span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <div className="lesson__main">
        <header className="lesson__head">
          <p className="lesson__marker">
            Lesson {lesson.number} of {lessons.length}
          </p>
          <h1>{lesson.title}</h1>
          {twin && (
            <LangSwitch lang={other} to={`${COURSES[other].prefix}/learn/${lesson.slug}`} />
          )}
        </header>

        <div className="lesson__body">
          <Body />
        </div>

        <nav className="lesson__pager">
          {previous ? (
            <Link to={`${prefix}/learn/${previous.slug}`} className="lesson__prev">
              ← {previous.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link to={`${prefix}/learn/${next.slug}`} className="lesson__next">
              {next.title} →
            </Link>
          ) : (
            <Link to="/" className="lesson__next">
              Compare the six →
            </Link>
          )}
        </nav>

        <p className="back-link">
          <Link to={`${prefix}/learn`}>← All lessons</Link>
        </p>
      </div>
    </article>
  )
}
