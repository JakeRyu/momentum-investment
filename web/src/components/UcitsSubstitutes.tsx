import { findStrategy, fundsNeeded } from '../strategies'

/**
 * Lesson 5's US → UCITS substitution, and what it costs.
 *
 * The scale measures distance from the universe the paper tested, not
 * quality. That distinction is the whole point of the figure: the rule
 * itself is unharmed by a substitution, because the backend scores a
 * holder of CSPX.L on CSPX.L's own history before any ranking happens.
 * What a substitution weakens is the published figure's claim to
 * describe your setup — which is lesson 6's argument, so the figure
 * hands off to it rather than inventing a second one.
 *
 * An imperfect row had to be here. A table of clean swaps would quietly
 * assert that substitution is easy, which is the opposite of the
 * lesson. EFA is the counter-example.
 *
 * SPY's row reads Near rather than As tested because the catalog's
 * curated default, VUAG.L, is the pound-denominated line: the index
 * matches, the price series carries USD/GBP on top of it. The catalog
 * flags currency for exactly this reason. It is the only substitute
 * here that is not USD-denominated.
 *
 * Tickers are hardcoded, as the surrounding lesson already explains:
 * `mobile/src/etfCatalog.ts` is a different package, and the catalog
 * offers several alternatives per asset where this needs one.
 */

type Distance = 'tested' | 'near' | 'different'

const FILLED: Record<Distance, number> = { tested: 3, near: 2, different: 1 }
const LABEL: Record<Distance, string> = {
  tested: 'As tested',
  near: 'Near',
  different: 'Different',
}

const SUBSTITUTES: {
  us: string
  uk: string
  distance: Distance
  differs: React.ReactNode
}[] = [
  {
    us: 'SPY',
    uk: 'VUAG.L',
    distance: 'near',
    differs: (
      <>
        Same index, but <strong>priced in pounds</strong> — the series carries
        the dollar&rsquo;s moves as well as the S&amp;P&rsquo;s
      </>
    ),
  },
  {
    us: 'IEF',
    uk: 'IDTM.L',
    distance: 'tested',
    differs: 'Same 7–10 year US Treasuries',
  },
  {
    us: 'SHY',
    uk: 'IBTS.L',
    distance: 'near',
    differs: 'Short US Treasuries, but the maturity bands differ',
  },
  {
    us: 'EFA',
    uk: 'EXUS.L',
    distance: 'different',
    differs: (
      <>
        MSCI World ex-USA — <strong>includes Canada</strong>, which EAFE does
        not
      </>
    ),
  },
]

export default function UcitsSubstitutes() {
  const laa = fundsNeeded(findStrategy('laa')!.defaultUniverse)
  const baa = fundsNeeded(findStrategy('baa')!.defaultUniverse)

  return (
    <figure className="ucits">
      <figcaption className="ucits__caption">
        What a UK broker can actually sell you
      </figcaption>

      <div className="ucits__table">
        <div className="ucits__row ucits__row--head">
          <span>In the papers</span>
          <span />
          <span>In London</span>
          <span>Distance from tested</span>
          <span>What differs</span>
        </div>

        {SUBSTITUTES.map((s) => (
          <div key={s.us} className="ucits__row">
            <span className="ucits__ticker">{s.us}</span>
            <span className="ucits__arrow" aria-hidden="true">
              →
            </span>
            <span className="ucits__ticker">{s.uk}</span>
            <span
              className={`ucits__scale${
                s.distance === 'different' ? ' ucits__scale--far' : ''
              }`}
            >
              <span className="ucits__meter" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <i key={i} className={i < FILLED[s.distance] ? 'is-on' : undefined} />
                ))}
              </span>
              <span className="ucits__scale-label">{LABEL[s.distance]}</span>
            </span>
            <span className="ucits__differs">{s.differs}</span>
          </div>
        ))}
      </div>

      <div className="ucits__consequence">
        <p className="ucits__pull">
          The rule is run on what you actually hold. The published figure was
          not.
        </p>

        <div className="ucits__cols">
          <div className="ucits__col">
            <p className="ucits__col-head">What still holds</p>
            <p className="ucits__col-body">
              Momentum is measured on price, and knows nothing about which
              index a fund tracks or what it is priced in. Hold VUAG.L and it
              is scored on <strong>VUAG.L&rsquo;s own history</strong>, before
              any ranking happens. You are not running an approximation of the
              rule — you are running the same rule on your own holdings.
            </p>
          </div>
          <div className="ucits__col">
            <p className="ucits__col-head ucits__col-head--red">What weakens</p>
            <p className="ucits__col-body">
              The published drawdown was measured on one specific universe.
              Swap an asset and it is a different universe. Lesson 6 has the
              measure of that: an independent replication moved VAA&rsquo;s
              worst fall by dropping <strong>one</strong> asset, with the rule
              untouched.
              <span className="ucits__figure">16.1% → 25.2%</span>
            </p>
          </div>
        </div>

        <p className="ucits__tail">
          So the scale above is not a quality rating — a substitute further
          down it is not worse, it is <em>unmeasured</em>. Two consequences, at
          different layers: a substitute you are unwilling to accept is a
          strategy you cannot run at all; and every one you do accept is a step
          away from the figure the paper published. LAA asks you to take{' '}
          <strong>{laa}</strong> such steps. BAA asks <strong>{baa}</strong>.
        </p>
      </div>
    </figure>
  )
}
