import { Link } from 'react-router-dom'

import { LESSONS } from '../lessons'

/**
 * Course contents. The site's reference pages let you look one thing up;
 * this is the part that assumes you arrived knowing nothing and puts the
 * pieces in an order.
 */
export default function Learn() {
  return (
    <article className="learn">
      <header>
        <p className="learn__eyebrow">{LESSONS.length} lessons</p>
        <h1>Learn</h1>
        <p className="learn__lede">
          Start from no background at all. By the end you should be able to
          open any strategy page and know what it is telling you to do, and
          why.
        </p>
      </header>

      <ol className="learn__list">
        {LESSONS.map((l) => (
          <li key={l.slug}>
            <Link to={`/learn/${l.slug}`} className="learn__item">
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
