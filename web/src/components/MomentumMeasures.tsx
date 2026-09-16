/**
 * Lesson 2's "different settings on the same dial", as a table.
 *
 * The prose can say most strategies use one measure and others use the
 * second; it cannot show that BAA runs *both* — a fast blend on its
 * canary gate and a slow average on its ranking — without a digression
 * the lesson does not want. Side by side, BAA simply appears in each
 * column.
 *
 * LAA appears in neither, so it is named underneath rather than forced
 * into a column. A two-column split that swallowed it would be the
 * table telling a tidier story than the strategies support.
 *
 * Which strategy uses which signal is hardcoded rather than derived:
 * `strategies.ts` carries it only inside prose descriptions, and adding
 * a structured field for one figure would change the strategy record
 * for every consumer. The descriptions on each strategy page are the
 * source — keep this in step with them.
 */
export default function MomentumMeasures() {
  return (
    <figure className="measures">
      <figcaption className="measures__caption">
        Two settings on the same dial
      </figcaption>

      <div className="measures__cols">
        <div className="measures__col">
          <p className="measures__name">Weighted blend</p>
          <p className="measures__sub">
            The last 1, 3, 6 and 12 months&rsquo; returns, averaged together.
          </p>

          <Row label="Weighting">
            The most recent month counts heaviest
          </Row>
          <Row label="Reacts" speed={4}>
            Quickly
          </Row>
          <Row label="Used by">
            <strong>VAA</strong>, <strong>DAA</strong>, <strong>HAA</strong>,
            and <strong>BAA</strong>&rsquo;s canary gate
          </Row>
        </div>

        <div className="measures__col">
          <p className="measures__name">Price vs its own average</p>
          <p className="measures__sub">
            Today&rsquo;s price compared to the average of the past twelve
            months.
          </p>

          <Row label="Weighting">Every month counts the same</Row>
          <Row label="Reacts" speed={1}>
            Slowly — steadier, and later
          </Row>
          <Row label="Used by">
            <strong>PAA</strong>, and <strong>BAA</strong>&rsquo;s ranking of
            what to hold
          </Row>
        </div>
      </div>

      <p className="measures__note">
        HAA uses the blend in its unweighted form, so its most recent month
        carries no extra weight. <strong>LAA</strong> uses neither: it reads a
        macro gate rather than each asset&rsquo;s own momentum, which is why it
        sits apart from the other five.
      </p>
    </figure>
  )
}

function Row({
  label,
  speed,
  children,
}: {
  label: string
  /** Filled segments out of four. Omitted where speed is not the point. */
  speed?: number
  children: React.ReactNode
}) {
  return (
    <div className="measures__row">
      <span className="measures__label">{label}</span>
      <span className="measures__value">{children}</span>
      {speed !== undefined && (
        <span className="measures__dial" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <i key={i} className={i < speed ? 'is-on' : undefined} />
          ))}
        </span>
      )}
    </div>
  )
}
