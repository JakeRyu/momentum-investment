import type { PaaProtectionFactor } from '../api/decisions'

const OPTIONS: { v: PaaProtectionFactor; label: string; sub: string }[] = [
  { v: 0, label: 'PAA0', sub: 'Aggressive' },
  { v: 1, label: 'PAA1', sub: 'Moderate' },
  { v: 2, label: 'PAA2', sub: 'Vigilant' },
]

export default function PaaProtectionPicker({
  value,
  onChange,
}: {
  value: PaaProtectionFactor
  onChange: (a: PaaProtectionFactor) => void
}) {
  return (
    <div className="protection">
      <div className="protection__row" role="group" aria-label="PAA protection level">
        {OPTIONS.map((opt) => {
          const selected = opt.v === value
          return (
            <button
              type="button"
              key={opt.v}
              className={`protection__seg${selected ? ' protection__seg--selected' : ''}`}
              onClick={() => onChange(opt.v)}
              aria-pressed={selected}
            >
              <span className="protection__seg-label">{opt.label}</span>
              <span className="protection__seg-sub">{opt.sub}</span>
            </button>
          )
        })}
      </div>
      <p className="protection__label">PROTECTION LEVEL</p>
    </div>
  )
}
