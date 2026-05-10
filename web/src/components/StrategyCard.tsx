import { Link } from 'react-router-dom'

import type { Strategy } from '../strategies'

export default function StrategyCard({ strategy }: { strategy: Strategy }) {
  return (
    <Link to={`/strategies/${strategy.id}`} className="card strategy-card">
      <div className="strategy-card__head">
        <span className="strategy-card__short">{strategy.shortName}</span>
        <span className="strategy-card__full">{strategy.fullName}</span>
      </div>
      <p className="strategy-card__blurb">{strategy.blurb}</p>
    </Link>
  )
}
