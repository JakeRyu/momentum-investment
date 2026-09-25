import UcitsSubstitutes from '../components/UcitsSubstitutes'
import { describeTicker } from '../etfDescriptions'

/**
 * Lesson 5. Restructured after the Korean edition (ko/WhatYouWouldBuy):
 * a question and a one-sentence answer up front, a sharper ticker
 * definition, and the currency cost for readers whose account is not in
 * dollars. The UCITS half stays — it is the Korean edition that drops
 * it, because a Korean broker sells the US-listed funds themselves.
 *
 * The walked example pulls its one-liner from `etfDescriptions.ts`, the
 * same source the decision tool's score rows use, so the lesson and the
 * tool cannot describe the same ticker two different ways.
 *
 * The UK substitutes live in `UcitsSubstitutes`, hand-written rather
 * than imported from the mobile catalog: `mobile/src/etfCatalog.ts` is a
 * different package, and where the canonical universe should live is an
 * open question. A few representative pairs make the point; the app
 * carries the full mapping.
 */
export default function WhatYouWouldBuy() {
  return (
    <>
      <p>
        Every strategy on this site ends the month by naming something like{' '}
        <strong>SHY 100%</strong>: a ticker and a weight. In other words, it
        tells you <strong>what to hold this month, and how much</strong>.
        This lesson answers the obvious next question: what is that ticker,
        and what do you actually buy?
      </p>
      <p>
        <strong>
          A ticker names one ETF, and you buy that ETF through a brokerage
          account — or, outside the US, its local equivalent.
        </strong>
      </p>

      <h2>Tickers and ETFs</h2>

      <p className="lesson__define">
        <strong>Ticker</strong> A short code that identifies one fund on
        one exchange. It is <strong>a code for telling products apart</strong>,
        not a name that describes what is inside. Two funds holding nearly
        the same thing can have different tickers, and the same fund listed
        in two countries has two.
      </p>

      <p className="lesson__define">
        <strong>ETF</strong> Exchange-traded fund. A basket of assets
        packaged into <strong>a single product you can trade</strong>, bought
        and sold on an exchange during the day like a share. Every asset
        these six strategies allocate to is one.
      </p>

      <h2>SHY, for example</h2>

      <p>
        SHY is an ETF that holds {describeTicker('SHY')}: US government
        debt due back within three years. Its price moves far less than
        longer bonds or stocks, so the strategies use it as a{' '}
        <strong>defensive asset</strong> when conditions turn. When the site
        says <strong>SHY · 100%</strong>, it is saying &ldquo;hold nothing
        but that, this month.&rdquo;
      </p>

      <h2>Buying it</h2>

      <p>
        Buying it is unremarkable. You open a brokerage account, search the
        ticker, and place an order the same way you would for a share. It is
        not reserved for professional investors, though the smallest order
        and whether you can buy fractions of a unit vary by broker.
      </p>

      <h2>If you are outside the US</h2>

      <p>
        The tickers on this site are the ones in the papers, and they are
        all US-listed. A European or UK broker generally cannot sell them
        to a retail client — not because of the strategy, but because those
        funds do not publish the disclosure document EU and UK rules
        require. What you buy instead is a <strong>UCITS</strong> fund: a
        European-domiciled ETF, usually tracking the same index, listed in
        London.
      </p>

      <p>The substitution is per asset, and it is rarely exact.</p>

      <UcitsSubstitutes />

      <p>
        Every asset these six strategies use has a UCITS substitute, so none
        of them is a dead end. But the further one sits from what the paper
        tested, the more choosing it means weighing trade-offs rather than
        looking something up. The iPhone app carries a full mapping for all
        six strategies with the trade-offs written out per asset, and lets
        you override any of them. Check anything you pick against your own
        broker before you rely on it — listings change, and this site is not
        tracking yours.
      </p>

      <h2>Two costs worth knowing</h2>

      <ul>
        <li>
          <strong>The annual fee.</strong> The fund takes it out of the
          price each year rather than billing you, and for the ETFs these
          strategies use it is generally low.
        </li>
        <li>
          <strong>Trading costs.</strong> Each trade costs the broker&rsquo;s
          commission plus the spread, the small gap between the buying and
          selling price. If your account is not in dollars, converting
          currency adds a third.
        </li>
      </ul>
      <p>
        Each looks small, but repeated over years they eat into returns.
        That is why a rule that trades once a month keeps its costs lower
        than one that trades on the news or the market&rsquo;s short-term
        moves.
      </p>
    </>
  )
}
