import { describeTicker } from '../etfDescriptions'

/**
 * Lesson 5. New copy — the gap this site has carried since it launched.
 *
 * The walked example pulls its one-liner from `etfDescriptions.ts`, the
 * same source the decision tool's score rows use, so the lesson and the
 * tool cannot describe the same ticker two different ways.
 *
 * The UK substitutes are hand-written rather than imported from the
 * mobile catalog: `mobile/src/etfCatalog.ts` is a different package, and
 * where the canonical universe should live is an open question. Three
 * representative pairs make the point; the app carries the full mapping.
 */
export default function WhatYouWouldBuy() {
  return (
    <>
      <p>
        Every strategy on this site ends the month by naming something like{' '}
        <strong>SHY</strong> and a percentage. That is the whole output. So
        it is worth being plain about what the thing on the left actually
        is, because the site has been assuming you knew.
      </p>

      <p className="lesson__define">
        <strong>Ticker</strong> A short code that identifies one fund on
        one exchange — like a postcode, not a description. Two funds
        holding nearly the same thing have different tickers, and the same
        fund listed in two countries has two.
      </p>

      <p className="lesson__define">
        <strong>ETF</strong> Exchange-traded fund. A single holding that
        owns a basket of other things on your behalf, and that you buy and
        sell during the day like a share. Every asset these six strategies
        allocate to is one.
      </p>

      <p>
        So <strong>SHY</strong> is an ETF, and what it holds is{' '}
        {describeTicker('SHY')} — government debt due back within three
        years. That is why the strategies reach for it when the signal
        turns: it is the corner of the portfolio least likely to move much
        in either direction. When the site says <em>SHY · 100%</em>, it is
        saying &ldquo;hold nothing but that, this month.&rdquo;
      </p>

      <p>
        Buying it is unremarkable. You open a brokerage account, search the
        ticker, and place an order the same way you would for a share.
        There is no minimum beyond the price of one unit, and nothing about
        it is reserved for professionals.
      </p>

      <h2>Two costs worth knowing</h2>

      <p>
        The fund charges an annual fee, taken out of the price rather than
        billed to you — a few hundredths of a percent for the ETFs these
        strategies use. And each trade costs you the broker&rsquo;s
        commission plus the spread, the small gap between the buying and
        selling price. Neither is large, but both are why a rule that
        trades once a month is cheaper to run than one that reacts to the
        news.
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

      <p>
        The substitution is per asset, and it is rarely exact. Three of the
        common ones:
      </p>

      <ul>
        <li>
          <strong>SPY</strong> → <strong>CSPX.L</strong> — both track the
          S&amp;P 500.
        </li>
        <li>
          <strong>IEF</strong> → <strong>IDTM.L</strong> — both hold 7–10
          year US Treasuries.
        </li>
        <li>
          <strong>SHY</strong> → <strong>IBTS.L</strong> — both hold short
          US Treasuries, though the maturity bands differ slightly.
        </li>
      </ul>

      <p>
        Some have no clean equivalent at all, and choosing between the near
        misses is a judgement rather than a lookup. The iPhone app carries
        a full mapping for all six strategies with the trade-offs written
        out per asset, and lets you override any of them. Check anything
        you pick against your own broker before you rely on it — listings
        change, and this site is not tracking yours.
      </p>
    </>
  )
}
