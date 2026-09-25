import CanaryGate from '../components/CanaryGate'

/**
 * Lesson 3. Prose carried from the phase 3 About page, including the
 * coal-mine canary metaphor.
 */
export default function WhatBreadthAdds() {
  return (
    <>
      <p>
        Rather than only ranking assets by how strongly they&rsquo;re
        rising, each strategy also counts how many assets in its universe
        show positive momentum at all — a measure of the market&rsquo;s
        overall health, not just one holding&rsquo;s fortunes. This count
        is what the strategies call <strong>breadth</strong>.
      </p>
      <p>
        When breadth falls, that&rsquo;s read as a broad loss of appetite
        for risk, and the strategy rotates the portfolio out of stocks and
        into bonds or cash until conditions improve. The count does the
        deciding, not anyone&rsquo;s judgement about whether this
        particular wobble is serious.
      </p>
      <p>
        Three of these strategies apply that same breadth count to a small
        early-warning basket, what the papers call a{' '}
        <strong>canary universe</strong>: one asset for HAA, two for DAA and
        four for BAA. Each asset in it acts as a canary, named for the caged
        birds coal miners once carried underground: if a canary faltered, the miners left
        immediately, without waiting to see whether the rest of the mine
        felt fine. These strategies work the same way — when the canary
        universe&rsquo;s breadth turns down, the strategy retreats
        immediately, regardless of how the broader universe scores.
      </p>
      <p>
        The canary basket is watched, never bought. That is why the
        comparison on the home page counts fewer funds than you might
        expect for those strategies: you need a price feed for the
        canaries, not a position in them.
      </p>

      <CanaryGate />

      <p>
        The figure draws the simplest case, where one faltering canary is
        enough to go fully defensive. That is how BAA and HAA react. DAA
        moves only half the portfolio when one of its two canaries falters,
        and all of it when both do.
      </p>

      <p>
        This is where the strategies separate from one another. How many
        bad assets it takes before the rule starts selling, and whether it
        sells all at once or in steps, is most of what makes one of these
        more cautious than another.
      </p>
    </>
  )
}
