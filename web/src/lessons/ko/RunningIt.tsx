import { Link } from "react-router-dom"

import {
  APP_STORE_CTA,
  APP_STORE_URL,
  PLAY_STORE_CTA,
  PLAY_STORE_URL,
} from "../../appStore"

/**
 * Korean edition of lesson 8 — see ../RunningIt.tsx for the English.
 * Puts the site's timing window in Korean time: from 09:00 KST on the
 * US first business day, when the UTC date DecisionTool sends (it dates
 * requests with toISOString) turns over to that day, until the US open
 * that night (22:30, or 23:30 outside US summer time). KST has no summer
 * time, so 09:00 holds all year, and the month-end close (05:00 or 06:00
 * KST) is final well before it.
 *
 * The English sentence on the app's UCITS mapping is gone; the app
 * link stays. Column labels stay English because they name the site and
 * the app.
 */
export default function RunningIt() {
  return (
    <>
      <p>
        더 설명할 것은 없습니다. 이제 실제로 무엇을 하면 되는지만 남았습니다.
      </p>
      <p>
        <strong>
          처음 한 번 사고, 그 뒤로는 한 달에 한 번만 확인하면 됩니다. 새 달이
          시작되면 새로운 배분과 지금 보유한 것을 비교하고, 달라진 부분만
          거래합니다. 나머지는 기다리는 일입니다.
        </strong>
      </p>

      <h2>처음 한 번</h2>

      <p>
        전략 하나를 골라 그 페이지를 엽니다. 딱히 원하는 것이 없다면 레슨 7에서
        출발점으로 든 <Link to="/strategies/vaa">VAA</Link>도 좋습니다.{" "}
        <strong>Today&rsquo;s Decision</strong> 아래에서 사이트가 현재
        이용할 수 있는 가격으로 규칙을 계산해 무엇을 보유할지 보여줍니다.
        사이트가 보여주는 배분대로 사고, 그 날짜를 적어 둡니다.
      </p>
      <p>
        달 중간에 시작해도 괜찮습니다. 첫 달만 예외이고, 다음 월말이
        지나면 그다음부터는 매달 같은 일정으로 움직입니다.
      </p>

      <h2>그 뒤로는 한 달에 한 번</h2>

      <p>
        규칙은 월말 종가를 기준으로 정해지고, 그 결과를 다음 달 내내
        유지합니다. 따라서 투자자가 확인해야 할 순간은 한 달에 한 번입니다.
        새 달이 시작되면 새로운 배분을 확인하고, 지금 가지고 있는 것과
        달라진 부분만 거래합니다.{' '}
        <strong>그 사이에는 시장을 계속 지켜볼 필요가 없습니다.</strong> 그
        한 번에 드는 수고는 사이트로 하느냐 앱으로 하느냐에 따라 다릅니다.
      </p>

      <div className="lesson__steps">
        <div className="lesson__steps-col">
          <p className="lesson__steps-label">This Site</p>
          <ol>
            <li className="lesson__step--timing">
              <strong>미국 첫 영업일에 엽니다.</strong>
            </li>
            <li>보여주는 배분과 지금 보유한 것을 비교합니다.</li>
            <li>차이만 거래합니다.</li>
            <li>날짜와 배분을 적어 둡니다.</li>
            <li>닫고, 다음 달까지 열지 않습니다.</li>
          </ol>
        </div>
        <div className="lesson__steps-col lesson__steps-col--app">
          <p className="lesson__steps-label">The App</p>
          <ol>
            <li className="lesson__step--timing">
              <strong>아무 날, 아무 때나 엽니다.</strong>
            </li>
            <li>보여주는 배분과 지금 보유한 것을 비교합니다.</li>
            <li>차이만 거래합니다.</li>
            <li>이번 달 리밸런싱을 완료로 체크합니다.</li>
          </ol>
        </div>
      </div>

      <h2>왜 두 목록이 다른가</h2>

      <p>
        사이트와 앱은{' '}
        <strong>현재 유효한 배분을 보여주는 방식이 다릅니다.</strong>
      </p>
      <p>
        사이트는 오늘 날짜를 기준으로 계산합니다. 그래서 미국 시장이 아직
        열리지 않은 미국 첫 영업일에는 가장 최근에 확정된 월말 종가를 이용해
        다음 달 배분을 확인할 수 있습니다. 사이트 목록의 1번에서 시간이
        중요한 이유가 이것입니다. <strong>미국 첫 영업일, 미국장이 열리기 전까지</strong> 열어야 합니다.
        그 밖의 시간에 열면 지금 유효하지 않은 결과를 보게 됩니다.
      </p>
      <p className="lesson__define">
        <strong>한국 시간 기준</strong> 미국 첫 영업일 오전 9시부터 밤 10시
        30분 전까지입니다. 사이트는 세계 표준시(UTC) 날짜로 계산하는데, 그
        날짜가 한국 시간 오전 9시에 바뀝니다. 밤 10시 30분은 미국장이 열리는
        때이고, 미국 서머타임이 아닐 때는 한 시간 늦어져 밤 11시 30분이
        됩니다.
      </p>
      <p>
        반면 앱은 현재 유효한 배분을 먼저 보여줍니다. 그래서 앱을 열면{' '}
        <strong>지금 보유해야 하는 배분</strong>이 바로 나타나고, 오늘
        날짜로 다시 계산한 결과는 별도(Preview)로 표시됩니다.
      </p>
      <p>마지막 차이는 기록을 남기는 방식입니다.</p>
      <p>
        사이트는 내가 무엇을 보유했는지 알 수 없고, 내가 지난달에 무엇을
        했는지도 기억하지 않습니다. 그래서 사이트를 사용한다면 내가 적어 둔
        기록이 유일한 기준이 됩니다.
      </p>
      <p>
        앱은 전략별로 이번 달 확인 여부(리밸런싱 완료 여부)를 기록하고, 달이
        바뀌면 다시 시작합니다. 그래서 같은 달에 리밸런싱을 다시 하는 실수를
        줄여줍니다.
      </p>
      <p>
        둘 다 내가 실제로 어떤 자산을 가지고 있는지는 모릅니다. 둘 다 대신
        거래해 주지도 않습니다. 무엇을 얼마나 사고팔지는 결국 내가 결정하고
        실행해야 합니다.
      </p>

      <h2>날짜를 놓쳤다면</h2>

      <p>
        정기 확인 날짜를 놓쳤다면, 그날 새로 계산된 결과를 바로 다음 거래
        신호로 사용하지 않는 것이 중요합니다. 이 전략은 월 1회 정해진
        기준으로 작동하도록 만들어졌기 때문입니다. 달 중간의 가격으로 다시
        계산한 결과는 원래의 월말 기준과 다른 신호가 될 수 있습니다.
      </p>
      <p>
        사이트는 오늘 날짜로만 계산하므로 놓친 월말의 결과를 다시 보여줄
        수 없습니다. 사이트만 사용하는 경우에는 지난 월말의 결과를 다시
        확인할 수 없으므로, 다음 정기 확인 시점까지 별도의 신호가 생기는
        구조는 아닙니다.
      </p>
      <p>
        앱은 다릅니다. 앱의 Holding 화면은 언제 열어도 그 직전
        월말의 결과를 보여줍니다. 앱은 아이폰과 안드로이드 모두{" "}
        <strong>무료</strong>입니다.{" "}
        <a href={APP_STORE_URL} target="_blank" rel="noreferrer">
          {APP_STORE_CTA} →
        </a>{" "}
        <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer">
          {PLAY_STORE_CTA} →
        </a>
      </p>

      <h2>내 몫으로 남는 것</h2>

      <p>
        이 사이트는 발표된 규칙이 현재 가격에서 어떤 배분을 가리키는지
        보여줄 뿐입니다. 여러분의 재정 상황이나 투자 목표를 알지 못하기
        때문에 개인적인 투자 조언을 제공하는 곳도 아닙니다.
      </p>
      <p>
        전략의 백테스트가 보여주는 것은 과거에 그 규칙을 적용했을 때의
        결과입니다. 실제 투자에서는 그 규칙을 어떻게 실행하고, 예상하지 못한
        상황에서 어떻게 행동할지는 각자의 몫입니다.
      </p>
      <p>
        <strong>여기서부터 일어나는 일은 그 어떤 표에도 없습니다.</strong>
      </p>
    </>
  )
}
