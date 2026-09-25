import BacktestFigure from '../components/BacktestFigure'
import { drawdownRange, findStrategy } from '../strategies'

/**
 * Lesson 6. The spine of the course, in the three layers the spec sets
 * out: the authors' own design target, the figures they published, and
 * the cases where it did not hold. Restructured after the Korean edition
 * (ko/WhyDrawdown): two questions up front, a comparison table with a
 * £100,000-at-the-peak column, and a note on which number in the figure
 * this lesson is about.
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
        Lesson 1 opened on a number: over Dec 1970 – Dec 2016, measured at
        month-end, the S&amp;P 500 fell <strong>50.8%</strong> from its
        peak.
      </p>
      <p>
        <strong>
          This lesson asks two questions. How far did the six strategies
          cut that fall, and how far can you trust the answer?
        </strong>
      </p>
      <p>
        In the published backtests of the variants this site runs, the six
        strategies&rsquo; worst month-end fall ranged{' '}
        <strong>
          {min.toFixed(1)}% to {max.toFixed(1)}%
        </strong>
        . Measured the same way, the S&amp;P 500&rsquo;s was{' '}
        <strong>50.8%</strong>.
      </p>

      <h2>The authors set the target themselves</h2>

      <p>
        Cutting the fall is not a framing the site applied afterwards. Keller
        states the goal in the opening of the VAA paper:{' '}
        <strong>
          returns above 10% a year that are moderate but offensive, with
          drawdowns held under 20%, and preferably under 15%
        </strong>
        . In his words:
      </p>

      <blockquote className="lesson__quote">
        with VAA we aim at moderate but offensive returns above 10% but
        with defensive drawdowns of less than 20%, preferably less than
        15%.
      </blockquote>

      <p>
        The target is also built into how the papers choose between rules.
        They score candidate rules with{' '}
        <strong>a measure called K25</strong>, which weighs the fall as well
        as the return.{' '}
        <strong>
          It is designed to reach zero once the maximum drawdown hits 25%.
        </strong>
      </p>
      <p>
        So however well a rule earns, one that falls 25% does not score
        well. The ceiling sits inside the authors&rsquo; own yardstick from
        the start, not applied to their results by us.
      </p>

      <h2>What they published</h2>

      <table className="lesson__table">
        <thead>
          <tr>
            <th>Holding</th>
            <th>Worst fall</th>
            <th>£100,000 at the peak becomes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>S&amp;P 500</td>
            <td>−50.8%</td>
            <td>about £{left(50.8)}</td>
          </tr>
          <tr>
            <td>60/40 stocks and bonds</td>
            <td>−29.4–29.5%</td>
            <td>
              about £{left(29.5)}–{left(29.4)}
            </td>
          </tr>
          <tr className="lesson__table-accent">
            <td>The six strategies</td>
            <td>
              −{min.toFixed(1)}–{max.toFixed(1)}%
            </td>
            <td>
              about £{left(max)}–{left(min)}
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        The strategies&rsquo; figures are the papers&rsquo; backtests of the
        variants this site runs. The 60/40 figure covers comparable spans.
        The periods differ from paper to paper.
      </p>
      <p>
        Here is VAA, the <strong>deepest</strong> of the six — meeting the
        worst case first, rather than the best, is the fair way round. In
        the figure, &lsquo;Worst fall, peak to trough&rsquo; is the maximum
        drawdown.
      </p>

      {vaa?.backtest && (
        <>
          <BacktestFigure backtest={vaa.backtest} />
          <p>
            The {vaa.backtest.cagrPct.toFixed(1)}% in the figure is that
            backtest&rsquo;s annualized return. The number this lesson is
            about is the one above it: the −
            {vaa.backtest.maxDrawdownPct.toFixed(1)}% worst fall.
          </p>
        </>
      )}

      <p>
        Every strategy page carries its own version of that block. The
        period differs per paper, which is why it is printed beside the
        number every time rather than once at the top of the site.
      </p>

      <h2>The limits of these numbers</h2>

      <p>
        Those are the headline variants. Stating the rest raises rather
        than lowers what the figures are worth, because a number with no
        edges is not a measurement.
      </p>

      <ul>
        <li>
          <strong>Other variants in the same papers fell further.</strong>{' '}
          VAA&rsquo;s own pre-1945 span shows 24%, and the HAA paper
          reports a 25.2% fall for one alternative configuration.
        </li>
        <li>
          <strong>
            Small implementation choices move the number a lot.
          </strong>{' '}
          An independent replication by AllocateSmartly found VAA&rsquo;s
          drawdown going from 16.1% to 25.2% when a single asset (AGG) was
          dropped from the universe. The signal rule was the same; changing
          the assets changed the result. A backtest reflects not only the
          rule but also the assets it is applied to.
        </li>
        <li>
          <strong>
            The early years predate the ETFs used today.
          </strong>{' '}
          ETFs did not exist in 1970, so the backtests use index proxies for
          those years rather than real ETF prices. Those proxies carry no
          spread, no commission and no tracking error.
        </li>
        <li>
          <strong>Month-end is not the floor.</strong> Every figure here is
          measured at the end of a month, because that is how the papers
          measure. Within a month the fall can run deeper, and an investor
          would have seen that loss in their account.
        </li>
      </ul>

      <h2>In short</h2>

      <p>
        These numbers are{' '}
        <strong>
          the results of the rules&rsquo; own authors applying them to past
          data
        </strong>
        . They are important evidence of how the rules behaved, not a
        promise about future returns or falls.
      </p>
      <p>
        What they show is{' '}
        <strong>
          not that future returns can be predicted, but what these
          strategies were designed to do, and how that aim fared on past
          data
        </strong>
        .
      </p>
      <p>
        These strategies aimed not only at returns but, above all, at{' '}
        <strong>cutting large falls</strong>. Over the periods the papers
        tested, their worst falls were shallower than the S&amp;P
        500&rsquo;s.
      </p>
    </>
  )
}

/** What £100,000 at the peak is worth at the bottom of a fall. */
function left(fallPct: number): string {
  return (Math.round(1000 * (1 - fallPct / 100)) * 100).toLocaleString('en-GB')
}
