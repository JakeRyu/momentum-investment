import { APP_STORE_CTA, APP_STORE_URL } from '../appStore'

/**
 * Web-to-app funnel notice. The web tool intentionally stays on the US
 * paper universe at today's date; local-ticker mapping and the in-force
 * monthly allocation live in the iPhone app, so the CTA sends readers
 * there.
 *
 * Strategy pages use the text link rather than Apple's badge — the badge's
 * black fill and rounded corners fight the Brutalist Quarterly grid at this
 * size. The Home section carries the official badge instead.
 */
export default function AppPromo() {
  return (
    <aside className="app-promo">
      <p className="app-promo__tag">US Universe · Today Only</p>
      <p className="app-promo__body">
        This tool runs Keller's original US-ETF universe at today's date. The
        Monthly Rule iPhone app maps every asset class to local UCITS
        alternatives (UK first) and holds the allocation currently in force,
        month to month.
      </p>
      <a
        className="app-promo__cta"
        href={APP_STORE_URL}
        target="_blank"
        rel="noreferrer"
      >
        {APP_STORE_CTA} →
      </a>
    </aside>
  )
}
