import RecoveryAsymmetry from '../components/RecoveryAsymmetry'

/**
 * Lesson 1. Restructured after the Korean edition (ko/WhyNotBuyAndHold)
 * read better: it names maximum drawdown here, since lesson 6 leans on
 * it, and walks the asymmetry through a £100,000 account.
 *
 * The −50.8% is the S&P 500 benchmark reported in the VAA paper's
 * Table 8, over Dec 1970 – Dec 2016. It does not go through
 * `BacktestFigure` because that component is keyed to a strategy's own
 * row; the framing it would have added (period, the word backtest, the
 * month-end caveat) is written into the sentences instead.
 *
 * The recovery figures are 1 / (1 − fall) − 1, not backtest results.
 */
export default function WhyNotBuyAndHold() {
  return (
    <>
      <p>
        Buying a broad index fund and holding it for years is a good plan.
        Over long stretches it has beaten most of the investors trying to
        beat the market, and it costs almost nothing to run. Doing only that
        is a perfectly reasonable choice.
      </p>
      <p>There is one thing worth knowing before you start.</p>

      <h2>The problem is the fall</h2>

      <p>
        In the VAA paper&rsquo;s backtest (Dec 1970 – Dec 2016), the S&amp;P
        500 — the benchmark these strategies are measured against — fell{' '}
        <strong>50.8%</strong> from its previous peak, measured at
        month-end. The deepest fall from a peak to a later low is called the{' '}
        <strong>maximum drawdown</strong>. Within those months it went lower
        still.
      </p>
      <p>
        What matters is that falling and recovering are not symmetric. Lose
        half and what is left has to double to get back — not rise another
        50%. For the S&amp;P 500&rsquo;s 50.8% fall, the climb back is about
        103%. And the deeper the fall, the faster that climb grows: a 20%
        fall needs 25% to recover, a 40% fall needs 66.7%.
      </p>

      <RecoveryAsymmetry />

      <h2>Why a big fall is harder than it looks</h2>

      <p>
        Markets may well recover. But recovery takes as long as it takes,
        and you do not get to choose when you need the money. Someone close
        to retirement, or who needs the money within a few years, is in a
        different position when a large fall arrives. Believing that markets
        rise in the long run is one thing; reaching the day you need the
        money and finding half of it gone is another.
      </p>
      <p>
        So &ldquo;how much does it earn over the long run?&rdquo; is not the
        only question. &ldquo;How much less does it lose when a big fall
        comes?&rdquo; matters too.
      </p>

      <h2>The problem these strategies set out to solve</h2>

      <p>
        That is the problem the strategies on this site address. The aim is
        not to earn more — the papers mostly do not promise that — but to{' '}
        <strong>fall less far</strong>. The idea is simple:
      </p>
      <ul>
        <li>While the market is broadly rising, hold stocks.</li>
        <li>When the rise falters, reduce stocks or step out.</li>
        <li>When it resumes, step back in.</li>
      </ul>
      <p>
        This is not an attempt to call the market&rsquo;s turns in advance.
        It follows a trend that has already shown up, to sidestep part of the
        large falls.
      </p>
      <p>
        The author states the target plainly: a maximum drawdown under 20%,
        preferably under 15%. That is a risk target, not a return target. If
        an account peaked at £100,000, it means aiming never to fall below
        £80,000 after that peak. It is a target rather than a promise, and
        lesson 6 looks at how well it held.
      </p>

      <h2>It is not free</h2>

      <p>
        The rule judges from prices that have already moved, so its signal
        comes after a fall has begun. If the fall runs long and deep, it
        avoids most of it. But if the market dips and rebounds quickly, the
        rule can sell near the bottom and miss the rebound. And when the
        market wobbles and then keeps rising, it misses the gains made while
        it was out.
      </p>
      <p>
        In short, these strategies are a trade-off:{' '}
        <strong>giving up part of the rises to avoid part of the falls</strong>
        . A shallower worst case, in exchange for part of the best case.
      </p>

      <h2>What a backtest cannot tell you</h2>

      <p>
        Whether that trade-off suits you is not something a backtest
        answers. What matters is whether you would keep following the rule
        on the day £100,000 has become £70,000, or the day after it stepped
        out and the market bounced without you. That depends on what you
        actually do, not on past data. Lesson 7 comes back to this question.
      </p>
    </>
  )
}
