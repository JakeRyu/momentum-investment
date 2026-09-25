import DecisionCalendar from '../components/DecisionCalendar'

/**
 * Lesson 4. Restructured after the Korean edition (ko/OneSignalAMonth):
 * a question and a one-sentence answer up front, then each section
 * unpacks one part of that answer. The Korean edition's Korean-time note
 * becomes a UK-time one here.
 *
 * UK time: the US closes at 16:00 ET and opens at 09:30 ET, which is
 * 21:00 and 14:30 in the UK while both countries are on the same kind of
 * time. For a few weeks each year the US and UK change clocks on
 * different dates, and both land an hour earlier.
 */
export default function OneSignalAMonth() {
  return (
    <>
      <p>
        Whichever of the six suits you, they all run on the same clock. This
        lesson answers one question: when does the rule decide, and when do
        you act?
      </p>
      <p>
        <strong>
          The rule is computed once at month-end; on the first business day
          of the next month you trade only what has changed, then leave it
          until the next month-end.
        </strong>
      </p>

      <h2>Computed at month-end, held for a month</h2>

      <p>
        The signal is computed on the{' '}
        <strong>US market&rsquo;s month-end close</strong>. Month-end here
        is not the 31st on the calendar but the{' '}
        <strong>last day the US market actually trades</strong> in that
        month. The <strong>allocation it produces</strong> then holds through
        the whole of the following month. It does not rebalance because a
        headline broke or a market moved on a Tuesday.
      </p>
      <p>
        In the UK, the month-end close is final at 9pm, and the US market
        opens at 2.30pm on the first business day. For a few weeks each
        spring and autumn, when the two countries change their clocks on
        different dates, both are an hour earlier.
      </p>

      <h2>On the calendar</h2>

      <p>
        The calendar below is a month on the rule&rsquo;s clock. Three
        moments are marked:
      </p>
      <ul className="lesson__marked">
        <li>
          <strong>① The last business day of last month</strong> — its
          closing prices set next month&rsquo;s allocation.
        </li>
        <li>
          <strong>② The first business day of this month</strong> — compare
          the new allocation with what you hold, and trade only what
          differs.
        </li>
        <li>
          <strong>③ After that</strong> — hold the allocation until the next
          month-end.
        </li>
      </ul>
      <p>
        News breaks and markets move in between, and the allocation does not
        change. Of the 31 days, effectively only one asks you to check the rule
        and trade if needed.
      </p>

      <DecisionCalendar />

      <h2>If you are late</h2>

      <p>
        Missing the first business day does not change the principle. The
        allocation to move into is still the one set at the last month-end,
        not a fresh reading on today&rsquo;s prices. Recomputing mid-month
        and acting on it means running a different strategy from the
        once-a-month rule the backtests tested. And the next scheduled
        rebalance is already on its way.
      </p>
      <p>
        Remembering that one day, every month, without fail, is a job
        calendars and automatic reminders do better than people.
      </p>

      <h2>The work is small</h2>

      <p>
        Once a month you check what the rule says, compare it with what you
        hold, and place the trades that differ — often none at all. The rest
        of the month there is nothing to do, and nothing you should do.
      </p>
    </>
  )
}
