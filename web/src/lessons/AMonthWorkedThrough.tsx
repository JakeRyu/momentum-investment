import LessonScreenshot from '../components/LessonScreenshot'

const SHOTS = '/lessons/trading212'

/**
 * Lesson 9. Lesson 8's procedure done once on a real account: the
 * author's DAA rebalance at the start of October 2026, in Trading 212.
 *
 * Every balance, amount, profit and loss and return figure in the
 * screenshots is blanked before they are committed. A real account's
 * results would read as a track record — a financial promotion — and the
 * lesson is about the steps, not the outcome. Weights and tickers stay.
 *
 * Trading 212 is named once, as where this account happens to be, not
 * as a recommendation. The app screenshot is from 8 October; it is
 * there to show the Holding view still on the 30 September reading.
 *
 * The pie and the trades are the ones that actually went through. That
 * month the account also moved from pound-quoted funds to the
 * dollar-quoted ones the app names, so two markets that stayed changed
 * fund; the lesson says so rather than presenting it as the rule's doing.
 */
export default function AMonthWorkedThrough() {
  return (
    <>
      <p>
        Lesson 8 set out the monthly job: compare, trade only the
        difference, write it down. This is one real month of it — DAA,
        rebalanced at the start of October 2026, in the account of the
        person who built this site.
      </p>
      <p>
        <strong>
          Every balance, amount and return in these screenshots is blanked
          out on purpose. What this lesson shows is the procedure, not the
          result.
        </strong>
      </p>
      <p>
        The broker is Trading 212, because that is where the account is.
        Other brokers lay their screens out differently, but the job is the
        same in any of them.
      </p>

      <h2>What the rule said</h2>

      <p>
        Through September, DAA was fully invested: six risky assets at one
        sixth each. At the September month-end close, one of its two canary
        assets turned down. Lesson 3 described what that does: DAA keeps the
        three strongest risky assets, still at one sixth each, and puts the
        other half in the strongest of its cash assets.
      </p>

      <LessonScreenshot
        src={`${SHOTS}/01-app-holding.jpg`}
        caption="The app: what to hold now"
        alt="The Monthly Rule app showing DAA-G12 as of 30 September 2026, in UK funds: CMFP.L, CNDX.L and IJPA.L at 16.67% each and IBTA.L at 50%. A note says one of the two canary assets, IUAA.L, has turned down, so the strategy is half invested."
      />

      <p>
        This was taken on 8 October, a week into the month, and it still
        shows the 30 September reading. That is the app&rsquo;s Holding
        view doing what lesson 8 described: it opens on the allocation in
        force, not on a fresh calculation for today.
      </p>

      <h2>Compare</h2>

      <LessonScreenshot
        src={`${SHOTS}/02-holdings-vs-target.jpg`}
        caption="Before: current weight against target"
        alt="Trading 212 holdings for the DAA pie, sorted by target weight. Six funds, each with its current weight against its target: Invesco EQQQ Nasdaq-100 17.73% / 17%, iShares Core MSCI EM 16.83% / 17%, L&G Longer Dated All Commodities 16.94% / 17%, Vanguard S&P 500 17% / 17%, iShares Core MSCI Japan 16.26% / 16%, iShares Physical Gold 15.24% / 16%. Values are blanked out."
      />

      <p>
        Trading 212 keeps these funds in a <em>pie</em>: a set of funds,
        each with a target weight. On each row the coloured figure is the
        current weight and the grey one after the slash is the target. A
        month of price moves has pulled them apart a little — 17.73% against
        17%, 15.24% against 16%. That drift is normal, and on its own it is
        not a reason to trade.
      </p>
      <p>
        Set against the app, three of the six markets are leaving (the
        S&amp;P 500, emerging markets and gold), three are staying, and one
        is new.
      </p>

      <h2>Change the targets</h2>

      <LessonScreenshot
        src={`${SHOTS}/03-new-targets.jpg`}
        caption="The new targets"
        alt="Edit pie screen with four funds: iShares USD Treasury Bond 1-3yr (IBTA) 50%, L&G Longer Dated All Commodities (CMFP) 17%, iShares NASDAQ 100 (CNDX) 17% and iShares Core MSCI Japan IMI (IJPA) 16%, totalling 100%. The figure inside the ring is blanked out."
      />

      <p>
        Editing the pie means removing the funds that leave, adding the new
        ones, and entering the targets. They went in here as whole
        percentages, so the app&rsquo;s 16.67% became 17, 17 and 16. A third
        of a point either way is smaller than a month&rsquo;s ordinary drift.
      </p>
      <p>
        One change this month was not the rule&rsquo;s. The account also
        moved from funds quoted in pounds to ones quoted in dollars — the
        ones the app names. The Nasdaq-100 and Japan stayed; the funds
        holding them changed. That was a one-off choice of fund, and it
        shows in the trades below.
      </p>

      <h2>Sell what left</h2>

      <p>
        Taking a fund out of the pie does not sell it, so Trading 212 asks
        what to do with the ones removed. <em>Rebalance my pie</em> sells
        them and spreads the money across the new targets, which is what the
        rule says. <em>Move to my investments</em> would keep them — out of
        the pie, but still held and still in those markets.
      </p>

      <h2>What actually traded</h2>

      <LessonScreenshot
        src={`${SHOTS}/04-trades.jpg`}
        caption="The trades that went through"
        alt="Trading 212 rebalance history. Sell: Invesco EQQQ Nasdaq-100 (Dist), Vanguard S&P 500 (Acc), iShares Core MSCI EM IMI (Acc), iShares Core MSCI Japan IMI (Acc), iShares Physical Gold. Buy: iShares USD Treasury Bond 1-3yr (Acc), iShares NASDAQ 100 (Acc), iShares Core MSCI Japan IMI (Acc), L&G Longer Dated All Commodities (Acc). Amounts are blanked out."
      />

      <p>
        Five funds were sold in full: the three markets the rule dropped,
        and the pound-quoted Nasdaq-100 and Japan funds. Three were bought:
        the short Treasury fund, to half the pie, and the two dollar-quoted
        replacements. The Japan fund appears on both sides because only the
        currency it is quoted in changed.
      </p>
      <p>
        The last line is the one to notice. The commodities fund stayed
        exactly as it was, so it got only a small top-up back to its
        target — it was not sold and bought back. That is what{' '}
        <strong>trade only the difference</strong> looks like. In a month
        without a change of fund, the Nasdaq-100 and Japan holdings would
        have been nudged the same way.
      </p>
      <p>
        Switching funds is not free: every sale and purchase pays the
        spread. That is one more reason to settle on your funds once and
        leave them. Before the orders go in, the broker shows what they are
        expected to cost; read that too.
      </p>

      <h2>Write it down, and close it</h2>

      <p>
        Note the date and the four funds with their targets. The next reading
        is set on the October month-end close. With the app it can be checked
        any day after that; with the site, on Monday 2 November, before the
        US market opens. Until then there is nothing to do.
      </p>
      <p>
        That was one month. A month in which the rule says the same as the
        month before is shorter still.
      </p>
    </>
  )
}
