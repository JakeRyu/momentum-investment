import StrategyComparison from '../components/StrategyComparison'

/**
 * Lesson 7. The comparison on the landing page, reached at the point
 * where its axes mean something.
 *
 * It renders `StrategyComparison` rather than restating the data: one
 * presentation, two call sites, so a column added later appears in both
 * without anyone remembering to do it twice.
 */
export default function ChoosingOne() {
  return (
    <>
      <p>
        You have met the parts: a momentum score, a breadth count, one
        decision a month, the funds behind the tickers, and what the
        published falls were. This is the table from the front page, which
        should now read as facts rather than jargon.
      </p>

      <p>
        One thing it deliberately does not have is a return column. With
        one, this becomes a ranking, and a ranked comparison published by a
        UK company is a financial promotion — a thing with rules attached
        that this site is not set up to satisfy. The columns that are here
        are properties of the rule, not judgements about it.
      </p>

      <StrategyComparison />

      <h2>What actually differs</h2>

      <p>
        Read down the <em>Holds</em> column first. VAA holds exactly one
        fund, every month. DAA steps between one, four and six as its
        canaries turn. PAA spreads across as many as seven. That single
        difference drives most of what you will feel: a concentrated rule
        moves further in both directions, and a spread one is duller in
        both.
      </p>

      <p>
        Then <em>De-risks</em>. Some of these go from fully invested to
        fully defensive in a single step; others step down in stages. A
        rule that de-risks all at once is right earlier when a fall is
        real, and wrong more expensively when it is not.
      </p>

      <p>
        <em>ETFs</em> is the practical constraint, and worth checking
        before the others. It counts the distinct funds your broker has to
        list, not how many you hold at once: BAA needs sixteen, LAA five.
        If you are outside the US, that is also sixteen UCITS substitutes
        you have to be satisfied with rather than five. A rule you cannot
        actually buy is not a rule you are running.
      </p>

      <h2>If you want a starting point</h2>

      <p>
        Start with VAA. Not because the figures favour it — its published
        fall is the deepest of the six — but because its rule is the one
        you can hold in your head: score four assets, and if any of them is
        negative, go defensive. You can tell at a glance whether the site
        is doing what it says. That is worth more in the first year than a
        better-looking backtest.
      </p>

      <p>
        The question underneath all of this is not which rule was best on
        the record. It is which one you would still be following in the
        eighth month of a fall, when it has been defensive for a while and
        the market has been rising for three weeks without you. Every one
        of these only works if it is followed; that is the part that is
        about you rather than the data.
      </p>
    </>
  )
}
