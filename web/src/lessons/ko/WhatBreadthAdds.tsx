import CanaryGate from "../../components/CanaryGate"

/**
 * Korean edition of lesson 3 — see ../WhatBreadthAdds.tsx for the
 * English. Walks the reader through CanaryGate in Korean before it
 * appears, since the figure's labels stay English, and states how each
 * canary strategy actually reacts, because the figure draws only the
 * simplest all-or-nothing case.
 *
 * Canary sizes and reactions are those in strategies.ts: HAA one (TIP),
 * DAA two (VWO, BND), BAA four (SPY, VWO, VEA, BND). The English
 * lesson's "two or three assets" is out of step with that.
 */
export default function WhatBreadthAdds() {
  return (
    <>
      <p>
        레슨 2의 모멘텀은 자산 하나하나를 봅니다. 이 자산이 오르고 있는가, 어느
        자산이 더 강하게 오르는가. 이번 레슨은 한 걸음 물러서서 시장 전체를
        봅니다.
      </p>

      <h2>몇 개가 오르고 있는가</h2>

      <p>
        각 전략은 자산의 순위를 매기는 것과 별도로, 전체 자산 중 현재 상승
        추세에 있는 자산이 <em>몇 개</em>인지 셉니다. 이 개수가{" "}
        <strong>시장 폭(breadth)</strong>입니다. 여기서 &lsquo;상승
        추세&rsquo;는 앞 레슨에서 설명한 모멘텀 점수가 0보다 큰 경우를 뜻합니다.
      </p>
      <p>
        12개 중 8개가 오르고 있다면 시장은 대체로 건강합니다. 12개 중
        2개뿐이라면 몇몇 자산이 아무리 강해 보여도 시장 전반은 힘을 잃은
        상태입니다. 자산 하나의 움직임이 아니라 시장 전체에 상승이 얼마나 넓게
        퍼져 있는지를 보는 것입니다.
      </p>
      <p>
        시장 폭이 줄어들면 전략은 이를 시장 전반의 상승세가 약해지고 있다는
        신호로 보고, 주식에서 빠져나와 채권이나 현금성 자산으로 옮깁니다. 이번
        하락이 심각한지 아닌지를 누가 판단하는 것이 아닙니다. 개수가 결정합니다.
      </p>

      <h2>카나리아: 먼저 확인하는 작은 바구니</h2>

      <p>
        DAA, BAA, HAA 세 전략은 여기서 한 단계를 더 둡니다. 전체 자산군과 별도로
        한 개에서 네 개짜리 작은 바구니를 두고, 그 자산들이 상승 추세에 있는지를
        먼저 확인합니다. 논문은 이것을 <strong>카나리아 자산군</strong>이라고
        부릅니다. HAA는 TIP 하나, DAA는 VWO와 BND 둘, BAA는 SPY, VWO, VEA, BND
        넷입니다.
      </p>
      <p>
        이름은 옛날 광부들이 탄광에 데리고 들어간 카나리아에서 왔습니다.
        카나리아가 이상 신호를 보이면 광부들은 탄광 전체에 문제가 생길 가능성을
        의심하고 밖으로 나왔습니다. 이 전략들도 같습니다. 카나리아가 꺾이면 전체
        자산군의 점수가 아무리 좋아도 곧바로 물러납니다.
      </p>
      <p>
        카나리아는 매수 대상이 아닙니다. 신호를 확인하기 위해 지켜보는
        자산입니다. 그래서 홈페이지의 비교표에서 이 세 전략의 ETF 수가 생각보다
        적게 나옵니다.
      </p>

      <h2>그림 읽기</h2>

      <p>
        아래 그림은 <strong>같은 달, 같은 자산군</strong>을 보여줍니다. 두
        경우의 차이는 <strong>카나리아 신호 하나뿐</strong>입니다.
      </p>

      <p>
        <strong>왼쪽:</strong> 카나리아가 모두 상승 추세입니다.
      </p>
      <ul className="lesson__flow">
        <li>게이트가 열립니다.</li>
        <li>메인 자산군을 살펴봅니다.</li>
        <li>12개 중 상승 추세인 8개를 비교해 가장 강한 자산을 보유합니다.</li>
      </ul>

      <p>
        <strong>오른쪽:</strong> 카나리아 하나가 꺾였습니다.
      </p>
      <ul className="lesson__flow">
        <li>게이트가 닫힙니다.</li>
        <li>메인 자산군은 아예 보지 않습니다.</li>
        <li>대신 방어용 자산 중 가장 나은 것을 선택합니다.</li>
      </ul>

      <CanaryGate />

      <p>
        그림은 가장 단순한 경우, 즉 카나리아가 하나라도 꺾이면 전부 방어로
        전환하는 경우를 보여줍니다. 실제로는 카나리아가 몇 개 꺾였는지에 따라
        전략마다 반응이 다릅니다.
      </p>
      <table className="lesson__table lesson__table--text">
        <thead>
          <tr>
            <th>전략</th>
            <th>카나리아</th>
            <th>카나리아 신호</th>
            <th>대응</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>BAA</strong>
            </td>
            <td>4개</td>
            <td>하나라도 꺾임</td>
            <td>전부 방어</td>
          </tr>
          <tr>
            <td>
              <strong>DAA</strong>
            </td>
            <td>2개</td>
            <td>하나 꺾임</td>
            <td>절반 방어</td>
          </tr>
          <tr>
            <td>
              <strong>DAA</strong>
            </td>
            <td>2개</td>
            <td>둘 다 꺾임</td>
            <td>전부 방어</td>
          </tr>
          <tr>
            <td>
              <strong>HAA</strong>
            </td>
            <td>TIP 1개</td>
            <td>TIP이 꺾임</td>
            <td>전부 현금성 자산</td>
          </tr>
        </tbody>
      </table>

      <h2>전략들이 갈라지는 곳</h2>

      <p>
        여기서 전략들의 성격이 갈립니다. 몇 개의 카나리아가 꺾여야 방어로
        전환하는지, 그리고 한 번에 전환하는지 단계적으로 전환하는지가 전략마다
        다릅니다. 이 차이는 레슨 7의 비교표에서 다시 봅니다.
      </p>
    </>
  )
}
