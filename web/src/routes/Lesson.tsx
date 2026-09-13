import { Link, useParams } from 'react-router-dom'

import { LESSONS, findLesson } from '../lessons'

import NotFound from './NotFound'

/**
 * One lesson.
 *
 * The rail and the "N of M" marker exist because knowing how far along
 * you are is most of what stops a beginner abandoning a sequence. The
 * body sets in a single ~65ch column — the newspaper's three justified
 * columns are for scanning, and these pages are for reading.
 */
export default function Lesson() {
  const { slug } = useParams<{ slug: string }>()
  const lesson = slug ? findLesson(slug) : undefined

  if (!lesson) return <NotFound />

  const index = LESSONS.indexOf(lesson)
  const previous = LESSONS[index - 1]
  const next = LESSONS[index + 1]
  const { Body } = lesson

  return (
    <article className="lesson">
      <nav className="lesson__rail" aria-label="Course progress">
        <ol>
          {LESSONS.map((l) => (
            <li
              key={l.slug}
              className={l.slug === lesson.slug ? 'is-current' : undefined}
            >
              <Link to={`/learn/${l.slug}`} aria-current={l.slug === lesson.slug ? 'step' : undefined}>
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
            Lesson {lesson.number} of {LESSONS.length}
          </p>
          <h1>{lesson.title}</h1>
        </header>

        <div className="lesson__body">
          <Body />
        </div>

        <nav className="lesson__pager">
          {previous ? (
            <Link to={`/learn/${previous.slug}`} className="lesson__prev">
              ← {previous.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link to={`/learn/${next.slug}`} className="lesson__next">
              {next.title} →
            </Link>
          ) : (
            <Link to="/" className="lesson__next">
              Compare the six →
            </Link>
          )}
        </nav>

        <p className="back-link">
          <Link to="/learn">← All lessons</Link>
        </p>
      </div>
    </article>
  )
}
