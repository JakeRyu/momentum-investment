import { Link } from 'react-router-dom'

import PageMeta from '../components/PageMeta'

export default function NotFound() {
  return (
    <div className="not-found">
      <PageMeta
        title="Not found"
        description="That page doesn't exist."
        path="/"
        noindex
      />
      <h1>Not found</h1>
      <p className="muted">
        That page doesn't exist. Try one of the strategies or head back home.
      </p>
      <p>
        <Link to="/">← Home</Link>
      </p>
    </div>
  )
}
