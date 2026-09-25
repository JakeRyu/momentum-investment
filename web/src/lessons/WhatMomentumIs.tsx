import MomentumMeasures from '../components/MomentumMeasures'

/**
 * Lesson 2. Restructured after the Korean edition (ko/WhatMomentumIs):
 * it names 13612W and SMA12, the terms the strategy pages print, and
 * works one score through so the weighting is felt rather than stated.
 *
 * Weights are those in MomentumScoreCalculator.Calculate13612W
 * (12/4/2/1). The worked example's returns are illustrative, not data.
 */
export default function WhatMomentumIs() {
  return (
    <>
      <p>
        Every strategy here rests on one premise: an asset that has been
        rising tends to keep rising for a while, and one that has been
        falling tends to keep falling. That tendency is called{' '}
        <strong>momentum</strong>. It has been observed again and again in
        decades of price history, and these strategies turn it into a few
        simple rules.
      </p>

      <h2>An observation, not a forecast</h2>

      <p>
        That distinction matters more than it sounds. Nothing here is an
        opinion about where markets are headed, and no one is reading the
        news. On the first business day of each month the rule looks at how
        prices have already moved, ranks the assets by which were stronger,
        and invests accordingly. You could compute it by hand with a
        spreadsheet and a price history.
      </p>

      <h2>Two ways to measure &ldquo;rising&rdquo;</h2>

      <p>
        The strategies differ in how they measure &ldquo;has been
        rising&rdquo;. There are two main ways.
      </p>
      <p>
        The first is a <strong>weighted blend of recent returns</strong>.
        Most of the strategies use it, and the papers and strategy pages
        call it <strong>13612W</strong>. It takes the last 1, 3, 6 and 12
        months&rsquo; returns, multiplies them by 12, 4, 2 and 1, and adds
        them up. The most recent month carries the heaviest weight, so it
        reacts quickly.
      </p>
      <p>Say an asset&rsquo;s recent returns look like this:</p>

      <table className="lesson__table">
        <thead>
          <tr>
            <th>Period</th>
            <th>Return</th>
            <th>Weight</th>
            <th>Adds</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1 month</td>
            <td>+2%</td>
            <td>× 12</td>
            <td>+0.24</td>
          </tr>
          <tr>
            <td>3 months</td>
            <td>+5%</td>
            <td>× 4</td>
            <td>+0.20</td>
          </tr>
          <tr>
            <td>6 months</td>
            <td>+4%</td>
            <td>× 2</td>
            <td>+0.08</td>
          </tr>
          <tr>
            <td>12 months</td>
            <td>+10%</td>
            <td>× 1</td>
            <td>+0.10</td>
          </tr>
          <tr className="lesson__table-accent">
            <td>Score</td>
            <td></td>
            <td></td>
            <td>+0.62</td>
          </tr>
        </tbody>
      </table>

      <p>
        A score above zero reads as &ldquo;rising&rdquo;; zero or below, as
        &ldquo;not rising&rdquo;. What counts is whether the score is
        positive or negative, and whether it is higher or lower than other
        assets&rsquo; scores. The 0.62 itself means nothing in particular.
        Had the last month been −3% instead, the first row would be −0.36
        and the score would drop to +0.02. That is how much the latest month
        weighs.
      </p>
      <p>
        The second is <strong>today&rsquo;s price against its twelve-month
        average</strong>. If the price is above the average of the past
        twelve months, the asset reads as rising. The strategy pages call
        it <strong>SMA12</strong>. It treats every month the same, so it is
        slower and steadier.
      </p>
      <p>
        Reacting quickly gets you out of a fall earlier, but raises more
        false signals. Reacting slowly raises fewer false signals, but moves
        later. The figure below shows which strategy uses which.
      </p>

      <MomentumMeasures />

      <h2>Momentum is not a prediction</h2>

      <p>
        Momentum is a <em>tendency</em> measured across decades of history,
        not a rule the market is obliged to follow next month. And it fails
        regularly. So these strategies do not lean on momentum alone. A
        second signal tells them when to stop trusting it, and that is the
        next lesson.
      </p>
    </>
  )
}
