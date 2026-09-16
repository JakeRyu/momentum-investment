/**
 * Lesson 3's canary rule, as two months that differ in one thing.
 *
 * The sentence the lesson has to land is "the strategy retreats
 * immediately, regardless of how the broader universe scores" — a
 * precedence between two counts. Prose can only assert it; the reader
 * has to hold both counts in their head and take the ordering on
 * trust.
 *
 * So the main universe is drawn *identically* in both columns, and
 * healthy in both. If it differed, or were failing on the right, the
 * figure would prove nothing: the two columns would simply agree. The
 * whole argument is that the same healthy count produces the opposite
 * allocation.
 *
 * The canary sits at the top because it is a gate that runs first, not
 * a veto applied afterwards. And both columns end in a ranked holding,
 * because ranking happens either way — which set gets ranked is the
 * only thing the canary decides.
 */
export default function CanaryGate() {
  return (
    <figure className="canary">
      <figcaption className="canary__caption">
        Same universe, same month — only the canary differs
      </figcaption>

      <p className="canary__legend">
        <span>
          <i className="canary__key" /> rising
        </span>
        <span>
          <i className="canary__key canary__key--off" /> not rising
        </span>
        <span>
          <i className="canary__key canary__key--held" /> held this month
        </span>
      </p>

      <div className="canary__cols">
        <section className="canary__col">
          <h3 className="canary__head">1 · Canary all clear</h3>

          <Box tone="canary" title="Canary" aside="checked first">
            <Grid size="large" cells="++" />
            <p className="canary__count canary__count--red">2 of 2 rising</p>
            <p className="canary__verdict">
              Gate · <strong>open</strong>
            </p>
          </Box>

          <Stem />

          <Box title="Main universe" aside="now read">
            <Grid cells="++++++++----" />
            <p className="canary__count">
              8 of 12 rising <em>— healthy</em>
            </p>
            <p className="canary__verdict">
              Gate open, so <strong>this</strong> is the set to rank
            </p>
          </Box>

          <Stem />

          <Box title="Ranked &amp; held" aside="top scorers">
            <Grid cells="***" />
            <p className="canary__count">
              Best 3 of the 8 <em>— from the main universe</em>
            </p>
            <p className="canary__verdict">Growth assets</p>
          </Box>

          <Stem red />
          <Arrow />

          <Outcome tone="offensive" label="OFFENSIVE">
            Hold the strongest of the main universe
          </Outcome>
        </section>

        <section className="canary__col">
          <h3 className="canary__head">2 · One canary falters</h3>

          <Box tone="canary" title="Canary" aside="checked first">
            <Grid size="large" cells="+-" />
            <p className="canary__count canary__count--red">1 of 2 falling</p>
            <p className="canary__verdict">
              Gate · <strong>shut</strong>
            </p>
          </Box>

          <Stem red />

          <Box tone="skipped" title="Main universe" aside="identical">
            <Grid cells="++++++++----" />
            <p className="canary__count">
              8 of 12 rising <em>— healthy</em>
            </p>
            <p className="canary__verdict">
              Gate shut, so this set is <strong>not read at all</strong>
            </p>
          </Box>

          <Stem red />

          <Box title="Defensive set" aside="a separate short list">
            <Grid cells="*+-" />
            <p className="canary__count">
              Best 1 of 3 <em>— bonds, bills, cash-like</em>
            </p>
            <p className="canary__verdict">Safe assets</p>
          </Box>

          <Stem red />
          <Arrow />

          <Outcome tone="defensive" label="DEFENSIVE">
            Hold the best of the defensive set
          </Outcome>
        </section>
      </div>

      <p className="canary__note">
        Only DAA, BAA and HAA carry a canary universe. The other three read
        their main universe directly, with no gate in front of it.
      </p>
    </figure>
  )
}

/**
 * `cells` is one character per asset: `+` rising, `-` not rising,
 * `*` rising and held this month. A string keeps the call sites
 * readable as pictures of themselves.
 */
function Grid({ cells, size }: { cells: string; size?: 'large' }) {
  return (
    <div
      className={`canary__grid${size === 'large' ? ' canary__grid--large' : ''}`}
      aria-hidden="true"
    >
      {[...cells].map((c, i) => (
        <span
          key={i}
          className={
            c === '-'
              ? 'canary__cell canary__cell--off'
              : c === '*'
                ? 'canary__cell canary__cell--held'
                : 'canary__cell'
          }
        />
      ))}
    </div>
  )
}

function Box({
  tone,
  title,
  aside,
  children,
}: {
  tone?: 'canary' | 'skipped'
  title: string
  aside: string
  children: React.ReactNode
}) {
  return (
    <div className={`canary__box${tone ? ` canary__box--${tone}` : ''}`}>
      <p className="canary__title">
        {title} <span>· {aside}</span>
      </p>
      {children}
    </div>
  )
}

function Stem({ red }: { red?: boolean }) {
  return (
    <span
      className={`canary__stem${red ? ' canary__stem--red' : ''}`}
      aria-hidden="true"
    />
  )
}

function Arrow() {
  return <span className="canary__arrow" aria-hidden="true" />
}

function Outcome({
  tone,
  label,
  children,
}: {
  tone: 'offensive' | 'defensive'
  label: string
  children: React.ReactNode
}) {
  return (
    <div className={`canary__out canary__out--${tone}`}>
      <span className="canary__out-when">This month</span>
      <span className="canary__out-label">{label}</span>
      <span className="canary__out-body">{children}</span>
    </div>
  )
}
