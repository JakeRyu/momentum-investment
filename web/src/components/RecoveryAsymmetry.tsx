/**
 * Lesson 1's arithmetic, drawn.
 *
 * "Lose half and you need to double what is left" is a sentence a
 * reader agrees with and does not feel. As three bars the asymmetry is
 * a length: the red span is exactly as wide as the black one it has to
 * replace, and yet it is 100% rather than 50%.
 *
 * No figure here comes from a backtest — it is 100 and half of 100 —
 * so this deliberately does not go through `BacktestFigure`. Nothing to
 * date, nothing to attribute, no period to print.
 */
export default function RecoveryAsymmetry() {
  return (
    <figure className="recovery">
      <figcaption className="recovery__caption">
        The arithmetic of getting back
      </figcaption>

      <div className="recovery__rows">
        <Row label="Start" value="100">
          <span className="recovery__solid" style={{ width: '100%' }} />
        </Row>

        <Row label="After the fall" value="−50%" accent>
          <span className="recovery__solid" style={{ width: '50%' }} />
        </Row>

        <Row label="To get back" value="+100%" accent>
          <span className="recovery__solid" style={{ width: '50%' }} />
          <span
            className="recovery__gain"
            style={{ left: '50%', width: '50%' }}
          />
        </Row>
      </div>

      <p className="recovery__pull">
        Down 50. Back up 100. Same distance, different number.
      </p>
    </figure>
  )
}

function Row({
  label,
  value,
  accent,
  children,
}: {
  label: string
  value: string
  accent?: boolean
  children: React.ReactNode
}) {
  return (
    <>
      <span className="recovery__label">{label}</span>
      <span className="recovery__track">{children}</span>
      <span
        className={`recovery__value${accent ? ' recovery__value--accent' : ''}`}
      >
        {value}
      </span>
    </>
  )
}
