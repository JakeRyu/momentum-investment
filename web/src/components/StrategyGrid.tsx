import { STRATEGIES } from '../strategies'

import StrategyCard from './StrategyCard'

export default function StrategyGrid() {
  return (
    <div className="grid strategy-grid">
      {STRATEGIES.map((s) => (
        <StrategyCard key={s.id} strategy={s} />
      ))}
    </div>
  )
}
