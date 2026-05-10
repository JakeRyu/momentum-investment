import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="not-found">
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
