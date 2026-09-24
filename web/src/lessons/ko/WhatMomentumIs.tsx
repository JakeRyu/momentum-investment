import MomentumMeasures from '../../components/MomentumMeasures'

/**
 * Korean edition of lesson 2 — see ../WhatMomentumIs.tsx for the
 * English. Adds what the English leaves to the strategy pages: the name
 * 13612W, its weights, and one worked score, because Korean readers
 * often meet the term first in books and the strategy pages print it.
 *
 * Weights are those in MomentumScoreCalculator.Calculate13612W
 * (12/4/2/1). The worked example's returns are illustrative, not data.
 */
export default function WhatMomentumIs() {
  return (
    <>
      <p>
        이 전략들은 모두 하나의 전제 위에 서 있습니다. 한동안 오른 자산은
        당분간 더 오르는 경향이 있고, 한동안 내린 자산은 당분간 더 내리는
        경향이 있다는 것입니다. 이 경향을 <strong>모멘텀</strong>이라고
        합니다. 수십 년의 가격 기록에서 반복해서 관찰된 이 현상을, 이
        전략들은 몇 가지 간단한 규칙으로 바꿔 사용합니다.
      </p>

      <h2>예측이 아니라 관찰입니다</h2>

      <p>
        이 차이는 생각보다 중요합니다. 여기에는 시장이 어디로 갈지에 대한
        의견이 없고, 뉴스를 읽는 사람도 없습니다. 매달 첫 영업일에 과거
        가격이 어떻게 움직였는지를 확인하고, 어떤 자산이 더 강했는지
        순위를 매긴 뒤 그 결과에 따라 투자합니다. 가격 기록과 스프레드시트만 있으면 직접 계산할 수도
        있습니다.
      </p>

      <h2>&lsquo;오르고 있다&rsquo;를 재는 두 가지 방법</h2>

      <p>
        전략마다 &lsquo;오르고 있다&rsquo;를 재는 방식이 다릅니다. 크게 두
        가지입니다.
      </p>
      <p>
        첫째는 <strong>최근 수익률의 가중 평균</strong>입니다. 대부분의
        전략이 이 방식을 쓰고, 논문과 전략 페이지에서는{' '}
        <strong>13612W</strong>라고 부릅니다. 최근 1개월, 3개월, 6개월,
        12개월 수익률에 각각 12, 4, 2, 1을 곱해 더합니다. 가장 최근 한 달에
        가장 큰 가중치를 주기 때문에 빠르게 반응합니다.
      </p>
      <p>예를 들어 어떤 자산의 최근 수익률이 이렇다고 해 봅시다.</p>

      <table className="lesson__table">
        <thead>
          <tr>
            <th>기간</th>
            <th>수익률</th>
            <th>가중치</th>
            <th>점수 기여</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1개월</td>
            <td>+2%</td>
            <td>× 12</td>
            <td>+0.24</td>
          </tr>
          <tr>
            <td>3개월</td>
            <td>+5%</td>
            <td>× 4</td>
            <td>+0.20</td>
          </tr>
          <tr>
            <td>6개월</td>
            <td>+4%</td>
            <td>× 2</td>
            <td>+0.08</td>
          </tr>
          <tr>
            <td>12개월</td>
            <td>+10%</td>
            <td>× 1</td>
            <td>+0.10</td>
          </tr>
          <tr className="lesson__table-accent">
            <td>합계</td>
            <td></td>
            <td></td>
            <td>+0.62</td>
          </tr>
        </tbody>
      </table>

      <p>
        점수가 0보다 크면 &lsquo;오르고 있다&rsquo;, 0 이하면 &lsquo;오르고
        있지 않다&rsquo;로 읽습니다. 규칙이 쓰는 것은 점수의 부호와 자산
        사이의 순서뿐이라, 0.62라는 값 자체에 특별한 의미는 없습니다. 같은
        자산이라도 지난 한 달에 −3%였다면 첫 줄이 −0.36이 되어 합계가
        +0.02로 떨어집니다. 최근 한 달이 이만큼 크게 작용합니다.
      </p>
      <p>
        둘째는 <strong>현재 가격과 12개월 평균의 비교</strong>입니다. 오늘
        가격이 지난 12개월 평균 가격보다 높으면 &lsquo;오르고 있다&rsquo;로
        봅니다. 전략 페이지에서는 <strong>SMA12</strong>라고 부릅니다.
        열두 달을 똑같이 취급하므로 느리지만 더 안정적입니다.
      </p>
      <p>
        어느 쪽이 정답인 것은 아닙니다. 같은 다이얼의 다른 눈금입니다.
        빠르게 반응하면 하락에서 일찍 빠져나오지만 잘못된 경보도 많아지고,
        느리게 반응하면 경보는 적지만 늦게 움직입니다. 어떤 전략이 어느
        방식을 쓰는지는 아래 표에 정리되어 있습니다.
      </p>

      <MomentumMeasures />

      <h2>모멘텀은 예측이 아닙니다</h2>

      <p>
        모멘텀은 수십 년의 역사에서 측정된 <em>경향</em>이지, 다음 달
        시장이 따라야 하는 법칙이 아닙니다. 그리고 자주 틀립니다. 그래서 이
        전략들은 모멘텀 하나에 모든 것을 맡기지 않습니다. 모멘텀을 언제
        믿지 말아야 하는지 알려주는 두 번째 신호가 있고, 그것이 다음
        레슨의 주제입니다.
      </p>
    </>
  )
}
