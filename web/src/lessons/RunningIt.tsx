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
        rule against live prices and prints what it says to hold. Buy that,
        in those proportions, and note the date.
      </p>

      <h2>Once a month, after that</h2>

      <p>
        At the start of each month, open the same page. Compare what it
        says to what you hold, and trade only the difference — which is
        often nothing at all. Then close it. There is no second check, no
        confirmation, and nothing to watch in between; the allocation set
        at the last month-end holds for the whole month, whatever happens
        inside it.
      </p>

      <p>
        If you miss the date, act on the last month-end&rsquo;s decision
        anyway rather than on a fresher reading. A mid-month signal is a
        different rule from the one that was tested, and the next scheduled
        rebalance is already on its way.
      </p>

      <h2>What this site can and cannot do</h2>

      <p>
        It runs the papers&rsquo; original US ETF universe, at
        today&rsquo;s date only. It does not know what you hold, does not
        remember you, and cannot tell you whether last month&rsquo;s
        decision is still the one in force.
      </p>

      <p>
        The iPhone app does those two things — it holds the allocation
        currently in force rather than today&rsquo;s recomputation, and it
        maps every asset to a local UCITS alternative for readers outside
        the US, per lesson 5.{' '}
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
