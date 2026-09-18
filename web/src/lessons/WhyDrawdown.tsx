import BacktestFigure from '../components/BacktestFigure'
import { drawdownRange, findStrategy } from '../strategies'

/**
 * Lesson 6. The spine of the course, in the three layers the spec sets
 * out: the authors' own design target, the figures they published, and
 * the cases where it did not hold.
 *
 * The range is computed from `STRATEGIES` so it cannot drift from the
 * figures `BacktestFigure` renders. The worked example is VAA — the
 * strategy with the *worst* published fall of the six, chosen so the
 * reader meets the ceiling rather than the best case.
 *
 * The benchmark numbers (50.8%, 29.4-29.5%) belong to the S&P 500 and a
 * 60/40 portfolio rather than to any strategy on this site, so they do
 * not go through `BacktestFigure`; the framing it would have added is
 * written into the sentences instead, as in lesson 1.
 */
export default function WhyDrawdown() {
  const { min, max } = drawdownRange()
  const vaa = findStrategy('vaa')

  return (
    <>
      <p>
        Lesson 1 opened on a number: the S&amp;P 500 fell{' '}
        <strong>50.8%</strong> from its peak in the backtest these
        strategies are measured against, over Dec 1970 – Dec 2016, measured
        at month-end. This lesson is about what the six do with that
        problem, and how far you should trust the answer.
      </p>

      <h2>The authors set the target themselves</h2>

      <p>
        This is not a framing the site applied afterwards. Keller states it
        in the opening of the VAA paper:
      </p>

      <blockquote className="lesson__quote">
        with VAA we aim at moderate but offensive returns above 10% but
        with defensive drawdowns of less than 20%, preferably less than
        15%.
      </blockquote>

      <p>
        And it is built into the measure the papers optimize. They score
        candidate rules with <strong>K25</strong>, a return measure defined
        to hit zero once maximum drawdown reaches 25% — so a rule that
        earns beautifully and falls 25% scores nothing at all. The ceiling
        is inside the authors&rsquo; own objective function, not applied to
        their results by us.
      </p>

      <h2>What they published</h2>

      <p>
        The papers set out to keep the worst fall under 20%. In the
        published backtests of the variants this site runs, the worst
        month-end fall ranged{' '}
        <strong>
          {min.toFixed(1)}% to {max.toFixed(1)}%
        </strong>
        , against 50.8% for holding the S&amp;P 500 over the same decades.
        A 60/40 stock-and-bond portfolio fell 29.4–29.5% over comparable
        spans.
      </p>

      <p>
        Here is the deepest of the six, so you meet the ceiling rather than
        the best case:
      </p>

      {vaa?.backtest && <BacktestFigure backtest={vaa.backtest} />}

      <p>
        Every strategy page carries its own version of that block. The
        period differs per paper, which is why it is printed beside the
        number every time rather than once at the top of the site.
      </p>

      <h2>Where it does not hold</h2>

      <p>
        Those are the headline variants. Stating the rest raises rather
        than lowers what the figures are worth, because a number with no
        edges is not a measurement.
      </p>

      <ul>
        <li>
          <strong>Other variants in the same papers do worse.</strong>{' '}
          VAA&rsquo;s own pre-1945 span shows 24%, and the HAA paper
          reports a 25.2% fall for one alternative configuration.
        </li>
        <li>
          <strong>
            Small implementation choices move the number a lot.
          </strong>{' '}
          An independent replication by AllocateSmartly found VAA&rsquo;s
          drawdown going from 16.1% to 25.2% when a single asset (AGG) was
          dropped from the universe. Nothing about the rule changed.
        </li>
        <li>
          <strong>The early decades are not tradable history.</strong> ETFs
          did not exist in 1970. The backtests use index proxies for those
          years, which carry no spread, no commission and no tracking
          error.
        </li>
        <li>
          <strong>Month-end is not the floor.</strong> Every figure here is
          measured at the end of a month, because that is how the papers
          measure. Within a month the fall ran deeper, and your account
          would have shown it.
        </li>
      </ul>

      <p>
        Taken together: these are the results of rules applied to the past,
        by the people proposing the rules, on data that flatters the early
        years. They are the best evidence available and they are not a
        forecast. What they do support is the shape of the claim — that
        these designs were aimed at the depth of the fall rather than the
        height of the return, and that on the record they were measured
        against, the falls were shallower.
      </p>
    </>
  )
}
