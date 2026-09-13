/**
 * Lesson 2. Prose carried from the phase 3 About page, where it sat
 * under "How the strategies work, in 30 seconds".
 */
export default function WhatMomentumIs() {
  return (
    <>
      <p>
        Momentum, in this context, is the premise these papers are built
        on: that an asset which has been rising tends to keep rising for a
        while, and one that has been falling tends to keep falling. These
        strategies act on that published pattern directly, rather than on
        any forecast of what markets will do next.
      </p>
      <p>
        That distinction matters more than it sounds. Nothing here is an
        opinion about where markets are headed, and no one is reading the
        news. Each month the rule looks at how prices have already moved,
        sorts the assets by that, and acts. You could compute it by hand
        with a spreadsheet and a price history.
      </p>
      <p>
        The strategies differ in how they measure &ldquo;has been
        rising&rdquo;. Most use a weighted blend of the last 1, 3, 6 and 12
        months&rsquo; returns, which reacts quickly because the most recent
        month carries the heaviest weight. Others compare today&rsquo;s
        price to its average over the past twelve months, which is slower
        and steadier. Neither is the correct answer; they are different
        settings on the same dial, and the strategy pages say which one
        each uses.
      </p>
      <p>
        What momentum is <em>not</em> is a prediction. The pattern is a
        tendency measured across decades of history, not a rule the market
        is obliged to follow next month. It fails regularly — that is why
        the next lesson is about a second signal that decides when to stop
        trusting it.
      </p>
    </>
  )
}
