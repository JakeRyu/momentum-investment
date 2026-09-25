import BacktestFigure from "../../components/BacktestFigure"
import { drawdownRange, findStrategy } from "../../strategies"

/**
 * Korean edition of lesson 6 — see ../WhyDrawdown.tsx for the English.
 * Same three layers (the authors' target, what they published, where it
 * does not hold), with a comparison table and a Korean key to
 * BacktestFigure, whose labels stay English.
 *
 * The strategies' range and VAA's figures come from STRATEGIES, as in
 * the English, so a corrected figure cannot leave this page behind. The
 * benchmark numbers (50.8%, 29.4–29.5%) and the caveats are copied from
 * the English lesson, which cites them.
 */
export default function WhyDrawdown() {
  const { min, max } = drawdownRange()
  const vaa = findStrategy("vaa")

  return (
    <>
      <p>
        레슨 1은 숫자 하나로 시작했습니다. 1970년 12월부터 2016년 12월까지,
        S&amp;P 500은 월말 기준으로 고점 대비 <strong>50.8%</strong>{" "}
        떨어졌습니다.
      </p>
      <p>
        <strong>
          이번 레슨의 질문은 두 가지입니다. 여섯 전략은 이 낙폭을 얼마나 줄였고,
          그 결과를 어디까지 믿을 수 있을까요?
        </strong>
      </p>
      <p>
        논문이 발표한 백테스트에서 여섯 전략의 최대 낙폭은{" "}
        <strong>
          {min.toFixed(1)}~{max.toFixed(1)}%
        </strong>
        였습니다. 같은 방식으로 계산한 S&amp;P 500의 최대 낙폭은{" "}
        <strong>50.8%</strong>였습니다.
      </p>

      <h2>목표는 저자가 직접 세웠습니다</h2>

      <p>
        &lsquo;낙폭을 줄인다&rsquo;는 목표는 이 사이트가 나중에 붙인 해석이
        아닙니다. 켈러는 VAA 논문 첫머리에서 전략의 목표를 직접 밝혔습니다.{" "}
        <strong>
          연 10%가 넘는 적당히 공격적인 수익률을 추구하면서도, 낙폭은 20% 미만,
          가능하면 15% 미만으로 제한하는 것
        </strong>
        입니다. 원문은 이렇습니다.
      </p>

      <blockquote className="lesson__quote">
        with VAA we aim at moderate but offensive returns above 10% but with
        defensive drawdowns of less than 20%, preferably less than 15%.
      </blockquote>

      <p>
        이 목표는 논문이 규칙을 고르는 기준에도 들어 있습니다. 논문에서는 후보
        규칙을 <strong>K25라는 지표</strong>로 평가합니다. 이 지표는 수익률뿐
        아니라 낙폭도 함께 반영합니다.{" "}
        <strong>
          최대 낙폭이 25%에 도달하면 이 지표에서 0점이 되도록 설계되어 있습니다.
        </strong>
      </p>
      <p>
        즉, 수익률이 아무리 높더라도 낙폭이 25%에 이르는 규칙에는 높은 점수를
        주지 않습니다. 낙폭의 한계선이 저자들의 평가 기준 안에 처음부터 들어
        있는 것입니다.
      </p>

      <h2>발표된 결과</h2>

      <table className="lesson__table">
        <thead>
          <tr>
            <th>대상</th>
            <th>최대 낙폭</th>
            <th>고점 1억 원이라면</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>S&amp;P 500 보유</td>
            <td>−50.8%</td>
            <td>약 {left(50.8)}만 원</td>
          </tr>
          <tr>
            <td>주식 60 · 채권 40</td>
            <td>−29.4~29.5%</td>
            <td>
              약 {left(29.5)}~{left(29.4)}만 원
            </td>
          </tr>
          <tr className="lesson__table-accent">
            <td>여섯 전략</td>
            <td>
              −{min.toFixed(1)}~{max.toFixed(1)}%
            </td>
            <td>
              약 {left(max)}~{left(min)}만 원
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        여섯 전략의 수치는 이 사이트가 운용하는 변형을 논문이 백테스트한
        결과입니다. 60/40 포트폴리오는 비슷한 기간에 대한 수치입니다. 기간은
        논문마다 다릅니다.
      </p>
      <p>
        아래는 여섯 전략 중 낙폭이 <strong>가장 컸던</strong> VAA의 결과입니다.
        가장 좋은 경우가 아니라 가장 나빴던 경우를 먼저 보는 것이 공정하기
        때문입니다. 그림의 &lsquo;Worst fall, peak to trough&rsquo;는 최대
        낙폭(고점에서 저점까지)입니다.
      </p>

      {vaa?.backtest && (
        <>
          <BacktestFigure backtest={vaa.backtest} />
          <p>
            이 그림의 {vaa.backtest.cagrPct.toFixed(1)}%는 해당 백테스트의
            연평균 수익률입니다. 이 레슨에서 먼저 보는 숫자는 그 위의 −
            {vaa.backtest.maxDrawdownPct.toFixed(1)}% 최대 낙폭입니다.
          </p>
        </>
      )}

      <p>
        모든 전략 페이지에 이런 상자가 하나씩 있습니다. 기간이 논문마다 달라서,
        사이트 맨 위에 한 번 적는 대신 숫자 옆에 매번 기간을 함께 적습니다.
      </p>

      <h2>이 숫자의 한계</h2>

      <p>
        위 숫자는 각 논문의 대표 변형입니다. 한계를 함께 적어야 숫자의 가치가
        올라갑니다. 경계가 없는 숫자는 측정이 아니기 때문입니다.
      </p>
      <ul>
        <li>
          <strong>
            같은 논문의 다른 변형에서는 더 큰 낙폭이 나타났습니다.
          </strong>{" "}
          VAA의 1945년 이전 구간은 <strong>24%</strong>, HAA 논문의 한 대안
          설정은 <strong>25.2%</strong>의 낙폭을 보였습니다.
        </li>
        <li>
          <strong>작은 구현 차이가 숫자를 크게 바꿉니다.</strong>{" "}
          AllocateSmartly의 독립적인 재현에서, VAA의 자산군에서 AGG 하나만 빼도
          낙폭이 16.1%에서 25.2%로 커졌습니다. 신호 규칙은 동일했지만, 사용한 자산 구성이
          달라지자 결과가 크게 달라졌습니다. 백테스트 결과는 전략의 규칙만으로
          결정되는 것이 아니라, 어떤 자산을 대상으로 적용했는지에도 영향을
          받습니다.
        </li>
        <li>
          <strong>초기 구간에는 현재와 같은 ETF가 존재하지 않았습니다.</strong>{' '}
          1970년에는 ETF가 없었기 때문에, 그 시기의 백테스트는 실제 ETF
          가격이 아니라 해당 자산이나 지수를 나타내는 대용 데이터를
          사용합니다. 그 시기의 백테스트에는 실제 거래에서 발생하는
          스프레드, 수수료, 추적 오차 등이 그대로 반영되지 않습니다.
        </li>
        <li>
          <strong>월말이 바닥은 아닙니다.</strong> 모든 수치는 논문의 방식대로
          월말에 잰 것입니다. 한 달 중간에는 월말보다 더 깊은 낙폭이
          발생할 수 있고, 실제 투자자는 그 시점의 평가손실을 경험하게
          됩니다.
        </li>
      </ul>

      <h2>정리하면</h2>

      <p>
        이 숫자들은{' '}
        <strong>
          규칙을 제안한 연구자들이 과거 데이터를 사용해 해당 규칙을 적용한
        </strong>{' '}
        결과입니다. 과거에 이 규칙이 어떻게 작동했는지를 보여주는 중요한
        증거이지만, 미래 수익이나 낙폭을 보장하는 예측은 아닙니다.
      </p>
      <p>
        따라서 이 숫자가 보여주는 것은{' '}
        <strong>
          미래의 수익률을 예측할 수 있다는 사실이 아니라, 이 전략들이 무엇을
          목표로 설계되었고 과거 데이터에서 그 목표에 어떤 결과가 나왔는지
        </strong>
        입니다.
      </p>
      <p>
        이 전략들은 높은 수익만을 목표로 한 것이 아니라{' '}
        <strong>큰 하락을 줄이는 것</strong>을 중요한 목표로 삼았습니다.
        그리고 논문에서 검증한 과거 구간에서는 S&amp;P 500보다 낮은 최대
        낙폭을 기록했습니다.
      </p>
    </>
  )
}

/** What ₩100M at the peak is worth at the bottom of a fall, in 만 원. */
function left(fallPct: number): string {
  return Math.round(10000 * (1 - fallPct / 100)).toLocaleString("ko-KR")
}
