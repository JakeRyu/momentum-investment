import StrategyComparison from '../components/StrategyComparison'

/**
 * Lesson 7. The comparison on the landing page, reached at the point
 * where its axes mean something. Restructured after the Korean edition
 * (ko/ChoosingOne): a question and answer up front, a key to the table's
 * columns before it appears, and the de-risking trade-off spelled out.
 *
 * It renders `StrategyComparison` rather than restating the data: one
 * presentation, two call sites, so a column added later appears in both
 * without anyone remembering to do it twice. Unlike the Korean edition it
 * keeps the table's own lede and note, and the UK regulatory reason for
 * the missing return column, since this edition's readers are the ones
 * that rule is about.
 */
export default function ChoosingOne() {
  return (
    <>
      <p>
        You have met the parts: a momentum score, a breadth count, one
        decision a month, the funds behind the tickers, and what the
        published falls were. The table from the front page should now read
        as facts rather than jargon. This lesson asks: which of the six?
      </p>
      <p>
        <strong>
          If you are new, VAA is a sensible place to start. But the real
          test is not the record; it is whether you could keep following a
          rule in the middle of a fall.
        </strong>
      </p>

      <h2>Why there is no return column</h2>

      <p>
        The table has no return column. Its purpose is not to compare which
        strategy earned more but to show{' '}
        <strong>how each one moves differently</strong>. There is a
        regulatory reason too: with returns, it becomes a ranking, and a
        ranked comparison published by a UK company is a financial promotion
        — a thing with rules attached that this site is not set up to
        satisfy. The columns that are here are properties of the rule, not
        verdicts on it.
      </p>

      <h2>Reading the table</h2>

      <ul>
        <li>
          <strong>Worst fall</strong>: the maximum drawdown from lesson 6 —
          the deepest month-end drop in each paper&rsquo;s own backtest.
          Past results do not predict future ones.
        </li>
        <li>
          <strong>Holds</strong>: how many ETFs it holds at once.
        </li>
        <li>
          <strong>De-risks</strong>: how it moves to defensive assets — all
          at once, or in steps.
        </li>
        <li>
          <strong>ETFs</strong>: how many distinct ETFs the strategy can
          choose from, so how many your broker has to list.
        </li>
      </ul>
      <p>
        Holds is how many you own at a time; ETFs is how many the strategy
        can pick from in total.
      </p>

      <StrategyComparison />

      <h2>What actually differs</h2>

      <p>
        Start with <strong>Holds</strong> — how many ETFs it owns at once —
        because in practice it shapes a strategy&rsquo;s character more than
        anything else. VAA holds exactly one fund, every month. DAA steps
        between one, four and six as its canaries turn. PAA spreads across
        as many as seven. A concentrated rule moves further in both
        directions, and a spread one is duller in both.
      </p>

      <p>
        Then <strong>De-risks</strong>. Some of these go from fully invested
        to fully defensive in a single step; others step down in stages. A
        rule that moves to defensive assets all at once cuts risk quickly
        when the market really does keep falling. But if the market only
        wobbles and then climbs again, it can miss the rebound while it sits
        in defensive assets.
      </p>

      <p>
        <strong>ETFs</strong> is the practical constraint, and worth
        checking before the others: BAA needs sixteen, LAA five. If you are
        outside the US, that is also sixteen UCITS substitutes you have to
        be satisfied with rather than five. And the more funds a rule uses,
        the more there is to check and trade each month.
      </p>

      <h2>If you want a starting point</h2>

      <p>
        The table says it in one line — start with VAA — and now the
        reasoning can go with it. The reason is{' '}
        <strong>not its record but its simplicity</strong>. VAA&rsquo;s
        published fall is in fact the deepest of the six. But its rule fits
        in your head:{' '}
        <strong>
          score four assets, and go defensive if any is negative.
        </strong>{' '}
        Because it is that simple, you can work it through yourself and see
        how it operates. At the start, understanding a rule properly matters
        more than hunting for a better-looking backtest.
      </p>

      <h2>The real question</h2>

      <p>
        The question underneath all of this is not which rule was best on
        the record. It is{' '}
        <strong>
          which one you would still be following in the eighth month of a
          fall, when it has been defensive for a while and the market has
          been rising for three weeks without you
        </strong>
        . That is the question lesson 1 left open. Every one of these only
        works if it is followed; that part is about you rather than the
        data.
      </p>
    </>
  )
}
