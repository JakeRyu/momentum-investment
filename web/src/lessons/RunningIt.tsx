import { Link } from 'react-router-dom'

import {
  APP_STORE_CTA,
  APP_STORE_URL,
  PLAY_STORE_CTA,
  PLAY_STORE_URL,
} from '../appStore'

/**
 * Lesson 8. Stops teaching and hands over. Restructured after the Korean
 * edition (ko/RunningIt): a one-sentence summary up front, the site and
 * app compared by how each shows the allocation in force, and the
 * timing window given in UK time in a box of its own.
 *
 * UK window: DecisionTool dates its request in UTC (toISOString), which
 * turns over at 01:00 in British Summer Time and at midnight in winter.
 * Until that happens on the first US business day, the site computes as
 * of the day before. The US opens at 14:30 UK time, or 13:30 in the few
 * weeks each spring and autumn when US and UK clocks disagree.
 *
 * Links to /strategies/vaa rather than to a generic index: the course
 * recommended a starting point in lesson 7, and sending the reader to a
 * chooser again at the last step undoes that.
 */
export default function RunningIt() {
  return (
    <>
      <p>Nothing left to explain. What follows is the whole of the job.</p>
      <p>
        <strong>
          Buy once to start; after that, on the first business day of each
          month, compare and trade only the difference. The rest is waiting.
        </strong>
      </p>

      <h2>Once, to start</h2>

      <p>
        Pick a strategy and open its page — if you have no preference,{' '}
        <Link to="/strategies/vaa">VAA</Link> is the starting point lesson 7
        suggested. Under <strong>Today&rsquo;s Decision</strong> the site
        computes the rule on the latest prices it can reach and prints what
        it says to hold. Buy the allocation it shows, and note the date.
      </p>
      <p>
        Starting mid-month is fine. Only the first month is out of step;
        after the next month-end you are on the same schedule every month.
      </p>

      <h2>Once a month, after that</h2>

      <p>
        The rule is set on the month-end close and that result holds for the
        whole of the following month. So there is one moment a month that
        matters: when a new month starts, check the new allocation and trade
        only what differs from what you hold.{' '}
        <strong>In between, there is no need to watch the market.</strong>{' '}
        What that one moment costs you depends on whether you use the site
        or the app.
      </p>

      <div className="lesson__steps">
        <div className="lesson__steps-col">
          <p className="lesson__steps-label">This Site</p>
          <ol>
            <li className="lesson__step--timing">
              <strong>
                Open it on the first US business day, before the US market
                opens.
              </strong>
            </li>
            <li>Compare what it shows with what you hold.</li>
            <li>Trade only the difference.</li>
            <li>Write down the date and the allocation.</li>
            <li>Close it, and open nothing until next month.</li>
          </ol>
        </div>
        <div className="lesson__steps-col lesson__steps-col--app">
          <p className="lesson__steps-label">The App</p>
          <ol>
            <li className="lesson__step--timing">
              <strong>Open it any day, any hour.</strong>
            </li>
            <li>Compare what it shows with what you hold.</li>
            <li>Trade only the difference.</li>
            <li>Mark this month as rebalanced.</li>
          </ol>
        </div>
      </div>

      <h2>Why the two lists differ</h2>

      <p>
        The site and the app{' '}
        <strong>show the allocation in force in different ways.</strong>
      </p>
      <p>
        The site computes at today&rsquo;s date. On the first US business
        day, before the US market opens, the latest close it can reach is
        the month-end close you want — which is why the timing in step 1
        matters. At any other hour it prints a reading that is not in force.
      </p>
      <p className="lesson__define">
        <strong>In UK time</strong> From 1am until 2.30pm on the first US
        business day. The site dates its reading in UTC, which turns over
        at 1am in British Summer Time and at midnight in winter. The US
        market opens at 2.30pm, or 1.30pm for a few weeks each spring and
        autumn when US and UK clocks change on different dates.
      </p>
      <p>
        The app works the other way round. It opens on{' '}
        <strong>the allocation you should hold now</strong>, and a
        recomputation at today&rsquo;s date sits separately, under Preview.
      </p>

      <p>The last difference is how the month gets recorded.</p>
      <p>
        The site cannot know what you hold, and does not remember what you
        did last month. If you use the site, the note you wrote down is the
        only record there is.
      </p>
      <p>
        The app records, per strategy, whether this month has been checked
        (rebalanced), and starts again when the month rolls over. That stops
        you rebalancing twice in the same month.
      </p>
      <p>
        Neither one knows what you actually hold, and neither places a trade
        for you. What to buy and sell, and how much, is yours to decide and
        carry out.
      </p>

      <h2>If you miss the date</h2>

      <p>
        If you miss the first business day, what matters is not treating
        that day&rsquo;s fresh reading as the next trading signal. The
        strategy is built to work on a set once-a-month basis, and a reading
        recomputed on mid-month prices can differ from the month-end one.
      </p>
      <p>
        The site computes at today&rsquo;s date only, so it cannot show you
        the month-end reading you missed. If you use only the site, there is
        no new signal to follow until the next scheduled check.
      </p>
      <p>
        The app is different: its Holding view shows the most recent
        month-end reading, whatever day you open it. It also maps every
        asset to a local UCITS alternative for readers outside the US, per
        lesson 5. The app is <strong>free</strong>, for iPhone and Android.{' '}
        <a href={APP_STORE_URL} target="_blank" rel="noreferrer">
          {APP_STORE_CTA} →
        </a>{' '}
        <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer">
          {PLAY_STORE_CTA} →
        </a>
      </p>

      <h2>The part that is yours</h2>

      <p>
        This site shows which allocation published rules point to at current
        prices. It does not know your finances or your goals, so it is not a
        source of personal investment advice either.
      </p>
      <p>
        A strategy&rsquo;s backtest shows what happened when its rule was
        applied to the past. In real investing, how you carry the rule out,
        and how you act when the unexpected happens, is up to each of us.
      </p>
      <p>
        <strong>What happens from here is not in any of those tables.</strong>
      </p>
    </>
  )
}
