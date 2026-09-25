import CanaryGate from '../components/CanaryGate'

/**
 * Lesson 3. Restructured after the Korean edition (ko/WhatBreadthAdds):
 * it walks through CanaryGate before the figure, and tabulates how each
 * canary strategy actually reacts, because the figure draws only the
 * simplest all-or-nothing case.
 *
 * Canary sizes and reactions are those in strategies.ts: HAA one (TIP),
 * DAA two (VWO, BND), BAA four (SPY, VWO, VEA, BND).
 */
export default function WhatBreadthAdds() {
  return (
    <>
      <p>
        Lesson 2&rsquo;s momentum looks at one asset at a time: is it
        rising, and which is rising hardest? This lesson steps back and
        looks at the market as a whole.
      </p>

      <h2>How many are rising</h2>

      <p>
        Alongside ranking assets, each strategy counts how many assets in
        its universe are currently rising — by the measure from the previous
        lesson. That count is the market&rsquo;s{' '}
        <strong>breadth</strong>. Eight of twelve rising is a broadly
        healthy market. Two of twelve is a market that has lost its footing,
        however strong those two look.
      </p>
      <p>
        When breadth falls, a strategy reads it as a sign that the market as
        a whole is losing its upward trend, and rotates out of stocks into
        bonds or cash. No one decides whether this particular wobble is
        serious. The count decides.
      </p>

      <h2>The canary: a small basket checked first</h2>

      <p>
        Three of these strategies apply that same breadth count to a small
        early-warning basket, what the papers call a{' '}
        <strong>canary universe</strong>: one asset for HAA, two for DAA and
        four for BAA. HAA watches TIP; DAA watches VWO and BND; BAA watches
        SPY, VWO, VEA and BND.
      </p>
      <p>
        The name comes from the caged birds coal miners once carried
        underground: if a canary faltered, the miners left immediately,
        without waiting to see whether the rest of the mine felt fine. These
        strategies work the same way. When the canaries turn down, the
        strategy retreats at once, however well the main universe scores.
      </p>
      <p>
        The canary basket is watched, never bought. You need a price feed
        for the canaries, not a position in them. That is why the comparison
        on the home page counts fewer funds than you might expect for those
        strategies.
      </p>

      <h2>Reading the figure</h2>

      <p>
        The figure below shows <strong>the same month and the same
        universe</strong> twice. The only difference is{' '}
        <strong>one canary signal</strong>.
      </p>

      <p>
        <strong>Left:</strong> both canaries are rising.
      </p>
      <ul className="lesson__flow">
        <li>The gate opens.</li>
        <li>The strategy reads the main universe.</li>
        <li>It compares the eight of twelve that are rising and holds the strongest.</li>
      </ul>

      <p>
        <strong>Right:</strong> one canary has turned down.
      </p>
      <ul className="lesson__flow">
        <li>The gate shuts.</li>
        <li>The main universe is not read at all.</li>
        <li>The strategy picks the best of its defensive assets instead.</li>
      </ul>

      <CanaryGate />

      <p>
        The figure draws the simplest case, where one faltering canary is
        enough to go fully defensive. The real reactions differ:
      </p>

      <table className="lesson__table lesson__table--text">
        <thead>
          <tr>
            <th>Strategy</th>
            <th>Canaries</th>
            <th>Signal</th>
            <th>Response</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>BAA</strong></td>
            <td>4</td>
            <td>Any one falters</td>
            <td>Fully defensive</td>
          </tr>
          <tr>
            <td><strong>DAA</strong></td>
            <td>2</td>
            <td>One falters</td>
            <td>Half defensive</td>
          </tr>
          <tr>
            <td><strong>DAA</strong></td>
            <td>2</td>
            <td>Both falter</td>
            <td>Fully defensive</td>
          </tr>
          <tr>
            <td><strong>HAA</strong></td>
            <td>TIP only</td>
            <td>TIP falters</td>
            <td>Fully into cash</td>
          </tr>
        </tbody>
      </table>

      <h2>Where the strategies part ways</h2>

      <p>
        This is where the strategies separate from one another. How many bad
        signals it takes before the rule starts selling, and whether it
        sells all at once or in steps, is most of what makes one of these
        more cautious than another. Lesson 7&rsquo;s comparison comes back
        to it.
      </p>
    </>
  )
}
