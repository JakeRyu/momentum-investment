import RecoveryAsymmetry from '../components/RecoveryAsymmetry'

/**
 * Lesson 1. New copy — the other three are carried from phase 3.
 *
 * The −50.8% is the S&P 500 benchmark reported in the VAA paper's
 * Table 8, over Dec 1970 – Dec 2016. It does not go through
 * `BacktestFigure` because that component is keyed to a strategy's own
 * row; the framing it would have added (period, the word backtest, the
 * month-end caveat) is written into the sentences instead.
 */
export default function WhyNotBuyAndHold() {
  return (
    <>
      <p>
        Buying a broad index fund and leaving it alone is a good plan. Over
        long stretches it has beaten most of the people trying to be
        clever, and it costs almost nothing to run. If you do only that,
        you will not have made a mistake.
      </p>
      <p>
        It has one property worth knowing about before you start. In the
        backtest the strategies on this site are measured against, the S&amp;P
        500 fell <strong>50.8%</strong> from its peak, measured at
        month-end, over Dec 1970 – Dec 2016. Within those months it went
        lower still.
      </p>
      <p>
        A fall like that is hard in a way the number understates, because
        getting back is not symmetric. Lose half your money and you need to
        double what is left to return to where you started — not another
        50%. And the recovery takes as long as it takes; you do not get to
        choose the year you need the money.
      </p>

      <RecoveryAsymmetry />

      <p>
        That is the problem these papers set out to solve. Not{' '}
        <em>earn more</em> — they mostly do not promise that — but{' '}
        <em>fall less far</em>, by following a rule that moves out of
        stocks when the market broadly stops rising, and back in when it
        resumes. The author states the target plainly: drawdowns of less
        than 20%, preferably less than 15%.
      </p>
      <p>
        You pay for that. A rule that steps out of a falling market also
        steps out of some rising ones, and it will sometimes sell right
        before a recovery. The trade you are being offered is a shallower
        worst case in exchange for giving up part of the best case. Whether
        that is a good trade for you depends on how you would actually
        behave in the middle of the fall — which is the part no backtest
        can tell you.
      </p>
    </>
  )
}
