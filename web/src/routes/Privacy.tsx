import { Link } from 'react-router-dom'

import PageMeta from '../components/PageMeta'

export default function Privacy() {
  return (
    <article className="about-page">
      <PageMeta
        title="Privacy Policy"
        description="What Monthly Rule and its companion app collect, store and send."
        path="/privacy"
      />
      <header>
        <h1>Privacy Policy</h1>
      </header>

      <section>
        <h2>Summary</h2>
        <p>
          Monthly Rule — this website and the companion mobile app —
          does not collect, store, or share any personal data. There are no
          user accounts and no advertising. The website counts visits with
          Cloudflare Web Analytics, which sets no cookies and does not
          identify or follow individual visitors; the app has no analytics
          at all.
        </p>
      </section>

      <section>
        <h2>Data stored on your device</h2>
        <p>
          The mobile app saves a small set of preferences locally on your
          device so they persist between launches: your selected region,
          strategy, PAA protection factor, and any ETF ticker substitutions
          you configure. This data never leaves your device and is deleted
          when you uninstall the app. The website stores nothing.
        </p>
      </section>

      <section>
        <h2>Network requests</h2>
        <p>
          To compute a strategy decision, the app and website send requests to
          our API server (hosted on Microsoft Azure). These requests contain
          only the strategy parameters needed for the calculation — never any
          personal information. Like any web server, the hosting
          infrastructure may keep transient technical logs (such as IP
          addresses) for operational purposes; we do not use these to identify
          anyone, and we do not share or sell them.
        </p>
        <p>
          Market data is retrieved by our server from public Yahoo Finance and
          FRED (Federal Reserve Economic Data) endpoints. Your device does not
          contact these services directly.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          If this policy ever changes — for example, if a future version of
          the app adds a feature that requires data collection — this page
          will be updated before that version ships.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about this policy:{' '}
          <a href="mailto:jihyung.ryu@gmail.com">jihyung.ryu@gmail.com</a>
        </p>
        <p>Last updated: 24 September 2026</p>
      </section>

      <p className="back-link">
        <Link to="/">← Back to strategies</Link>
      </p>
    </article>
  )
}
