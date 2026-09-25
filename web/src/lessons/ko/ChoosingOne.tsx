import StrategyComparison from "../../components/StrategyComparison"

/**
 * Korean edition of lesson 7 — see ../ChoosingOne.tsx for the English.
 * Adds a Korean key to StrategyComparison, whose column heads stay
 * English. The English sentence about sixteen UCITS substitutes is
 * replaced by what the fund count means for a Korean reader, who buys
 * the US-listed funds themselves.
 *
 * The counts quoted (VAA 1 fund, DAA 1 · 4 · 6, PAA up to 7, BAA 16
 * ETFs, LAA 5) are those StrategyComparison renders from strategies.ts.
 */
export default function ChoosingOne() {
  return (
    <>
      <p>
        지금까지 모멘텀 점수, 시장 폭, 한 달에 한 번의 결정, 티커 뒤의 펀드,
        그리고 발표된 낙폭을 차례로 봤습니다. 이제 홈페이지의 비교표가 용어가
        아니라 사실로 읽힐 것입니다. 이번 레슨의 질문은 이것입니다. 여섯 전략 중
        무엇을 고를까?
      </p>
      <p>
        <strong>
          처음이라면 VAA가 무난한 출발점입니다. 하지만 진짜 기준은 과거 성적이
          아니라, 하락장 한가운데서도 계속 따를 수 있는 규칙인가입니다.
        </strong>
      </p>

      <h2>수익률 칸이 없는 이유</h2>

      <p>
        이 표에는 수익률 칸이 없습니다. 이 표의 목적은 어떤 전략이 더 많이
        벌었는지를 비교하는 것이 아니라,{" "}
        <strong>각 전략이 어떻게 다르게 움직이는지를 보여주는 것</strong>
        이기 때문입니다.
      </p>

      <h2>표 읽기</h2>

      <ul>
        <li>
          <strong>Worst fall</strong>: 레슨 6에서 본 최대 낙폭입니다. 각 논문의
          백테스트에서 월말 기준으로 가장 크게 떨어진 폭이며, 과거 결과가 미래를
          예측하지는 않습니다.
        </li>
        <li>
          <strong>Holds</strong>: 한 번에 보유하는 ETF 수입니다.
        </li>
        <li>
          <strong>De-risks</strong>: 방어로 옮겨 가는 방식입니다. 한 번에
          옮기는지(all at once), 단계적으로 옮기는지입니다.
        </li>
        <li>
          <strong>ETFs</strong>: 이 전략을 운용하려면 사고팔 수 있어야 하는 서로
          다른 ETF의 수입니다. 동시에 보유하는 수가 아닙니다.
        </li>
      </ul>
      <p>
        Holds는 한 번에 몇 개를 가지고 있는지, ETFs는 전략에서 선택할 수 있는
        ETF가 총 몇 종류인지를 뜻합니다.
      </p>

      <StrategyComparison tableOnly />

      <h2>실제로 차이를 만드는 것</h2>

      <p>
        먼저 <strong>Holds</strong>, 즉 한 번에 몇 개의 ETF를 보유하는지를
        보세요. 이것이 실제 투자에서 전략의 성격을 크게 바꾸기 때문입니다. VAA는
        매달 정확히 한 개를 보유합니다. DAA는 카나리아 상태에 따라 한 개, 네 개,
        여섯 개를 오갑니다. PAA는 최대 일곱 개로 나눠 담습니다. 이 차이 하나가
        체감의 대부분을 결정합니다. 한 곳에 집중하는 규칙은 오를 때도 내릴 때도
        더 크게 움직이고, 나눠 담는 규칙은 양쪽 모두 밋밋합니다.
      </p>
      <p>
        다음은 <strong>De-risks</strong>입니다. 어떤 전략은 전부 투자한 상태에서
        한 번에 전부 방어로 넘어가고, 어떤 전략은 단계적으로 내려옵니다. 한 번에
        방어자산으로 이동하는 규칙은 시장이 실제로 계속 떨어질 때 빠르게 위험을
        줄일 수 있습니다. 하지만 시장이 잠시 흔들렸다가 다시 올라간다면,
        방어자산에 머무는 동안 반등을 놓칠 수도 있습니다.
      </p>
      <p>
        <strong>ETFs</strong>는 현실적인 조건입니다. BAA는 16개, LAA는 5개가
        필요합니다. 한국 투자자는 이 ETF들을 대부분 해외주식 계좌에서 그대로 살
        수 있어서 구하지 못할 걱정은 적습니다. 대신 종목 수가 많을수록 매달
        확인하고 거래할 것도 많아집니다.
      </p>

      <h2>출발점이 필요하다면</h2>

      <p>
        여섯 전략을 처음 접한다면, 먼저 VAA의 규칙부터 살펴보는 것도 좋은
        출발점입니다. 이유는 성과 때문이 아니라{" "}
        <strong>규칙이 단순하기 때문입니다.</strong> 실제로 VAA의 발표된 낙폭은
        여섯 중 가장 깊습니다. 대신 규칙이 머리에 담길 만큼 단순합니다.{" "}
        <strong>
          자산 네 개의 점수를 매기고, 하나라도 마이너스면 방어로 간다.
        </strong>{" "}
        규칙이 단순하기 때문에 직접 계산해 보면서 어떻게 작동하는지 확인하기
        쉽습니다. 처음에는 더 높은 백테스트 성과를 찾기보다, 내가 전략의 규칙을
        제대로 이해하는 것이 더 중요합니다.
      </p>

      <h2>진짜 질문</h2>

      <p>
        이 모든 것 아래에 있는 질문은 &lsquo;과거에 어느 규칙이 가장
        좋았는가&rsquo;가 아닙니다.{" "}
        <strong>
          하락 8개월째, 규칙이 한동안 방어 상태에 머물러 있고 시장은 나 없이
          3주째 오르고 있을 때도 계속 따를 수 있는 규칙은 무엇인가
        </strong>
        입니다. 레슨 1에서 남겨 둔 질문이 바로 이것입니다.{" "}
        <strong>
          어느 전략이든 따를 때에만 작동합니다. 그 부분은 데이터가 아니라 나에
          관한 문제입니다.
        </strong>
      </p>
    </>
  )
}
