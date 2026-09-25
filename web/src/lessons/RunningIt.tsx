import { Link } from 'react-router-dom'

import { APP_STORE_CTA, APP_STORE_URL } from '../appStore'

/**
 * Lesson 8. Stops teaching and hands over.
 *
 * Links to /strategies/vaa rather than to a generic index: the course
 * recommended a starting point in lesson 7, and sending the reader to a
 * chooser again at the last step undoes that.
 */
export default function RunningIt() {
  return (
    <>
      <p>Nothing left to explain. What follows is the whole of the job.</p>

      <h2>Once, to start</h2>

      <p>
        Pick a strategy and open its page — if you have no preference,{' '}
        <Link to="/strategies/vaa">VAA</Link> is the one lesson 7 argued
        for. Under <em>Today&rsquo;s Decision</em> the site computes the
        rule on the latest prices it can reach and prints what it says to
        hold. Buy that, in those proportions, and note the date. Starting mid-month puts you
        briefly off the rule&rsquo;s calendar; the next month-end puts you
        back on it.
      </p>

      <h2>Once a month, after that</h2>

      <p>
        The rule settles at the month-end close and holds for the whole of
        the following month. So there is one moment that matters — the start
        of a month — and nothing to watch on any day inside it. What that
        moment costs you depends on which of the two you run it on.
      </p>

      <div className="lesson__steps">
        <div className="lesson__steps-col">
          <p className="lesson__steps-label">This Site</p>
          <ol>
            <li className="lesson__step--timing">
              Open the strategy page on the first business day of a month,{' '}
              <strong>before the US market opens</strong>
            </li>
            <li>Compare what it prints to what you hold</li>
            <li>Trade only the difference — often nothing at all</li>
            <li>Write down the date and the allocation</li>
            <li>Close it, and open nothing until next month</li>
          </ol>
        </div>
        <div className="lesson__steps-col lesson__steps-col--app">
          <p className="lesson__steps-label">The App</p>
          <ol>
            <li className="lesson__step--timing">
              Open it — <strong>any day, any hour</strong>
            </li>
            <li>Compare what it prints to what you hold</li>
            <li>Trade only the difference — often nothing at all</li>
            <li>Tick the month off</li>
          </ol>
        </div>
      </div>

      <h2>Why one list is longer</h2>

      <p>
        The first step is the site computing at today&rsquo;s date. Before
        the US market opens on the first business day, the most recent close
        it can reach is the month-end you want; at any other hour it is
        printing a reading that is not in force. The app is built the other
        way round — the in-force allocation is what it opens on, and
        today&rsquo;s recomputation sits behind a second tab that says so.
      </p>

      <p>
        The last step is memory. The site does not know what you hold and
        will not remember you were here, so the written note is the only
        record there is. The app marks the month off per strategy and clears
        the mark when the month rolls over, which is also what stops you
        checking twice.
      </p>

      <p>
        Neither one knows your holdings and neither places a trade. The
        middle steps are yours in both columns.
      </p>

      <h2>If you miss the date</h2>

      <p>
        Do not act on a fresher reading. A mid-month signal is a different
        rule from the one that was tested, and the next scheduled rebalance
        is already on its way. The site cannot show you the month-end you
        missed — it computes at today&rsquo;s date only — so there the
        answer is to hold what you have until the next one. The app can: its
        Holding view is that reading, whatever day you open it.
      </p>

      <p>
        One difference is not about steps at all. The site runs the
        papers&rsquo; original US ETF universe as published; the app maps
        every asset to a local UCITS alternative for readers outside the US,
        per lesson 5.{' '}
        <a href={APP_STORE_URL} target="_blank" rel="noreferrer">
          {APP_STORE_CTA} →
        </a>
      </p>

      <h2>The part that is yours</h2>

      <p>
        This site states what published rules say on current prices. It is
        not advice, it does not know your circumstances, and no one here is
        regulated to give you any. The strategies were designed to limit
        how far a portfolio falls, and on the backtests their authors
        published they did — with the caveats lesson 6 set out. What
        happens from here is not in any of those tables.
      </p>
    </>
  )
}
