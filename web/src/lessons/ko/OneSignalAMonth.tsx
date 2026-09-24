import DecisionCalendar from "../../components/DecisionCalendar"

/**
 * Korean edition of lesson 4 — see ../OneSignalAMonth.tsx for the
 * English. Adds what the English leaves out for a reader in Korea: the
 * US close and open fall at night or early morning there. KST = ET + 13h
 * in US summer time and + 14h in winter, so 16:00 ET is 05:00 or 06:00
 * the next day and 09:30 ET is 22:30 or 23:30.
 *
 * Walks through DecisionCalendar in Korean first, since its labels stay
 * English.
 */
export default function OneSignalAMonth() {
  return (
    <>
      <p>
        여섯 전략 중 무엇을 고르든, 모두 같은 시계로 움직입니다. 이 레슨의
        질문은 하나입니다. 언제 판단하고, 언제 행동하는가?
      </p>
      <p>
        <strong>
          월말에 한 번 계산하고, 다음 달 첫 영업일에 필요한 만큼만 거래한 뒤,
          다음 월말까지 그대로 둡니다.
        </strong>
      </p>

      <h2>월말에 계산하고, 한 달 동안 유지합니다</h2>

      <p>
        신호는 <strong>미국 시장의 월말 종가를</strong> 기준으로 계산합니다.
        여기서 월말은 달력상의 31일이 아니라, 그 달 미국 시장이 실제로 거래하는{" "}
        <strong>마지막 영업일</strong>입니다. 그렇게 결정된{" "}
        <strong>투자 비중과 보유 자산은</strong> 다음 달 한 달 내내 유지됩니다.
        큰 뉴스가 나왔다고, 어느 화요일에 시장이 출렁였다고 중간에 리밸런싱하지
        않습니다.
      </p>
      <p>
        <strong>
          한국 투자자는 미국 시장의 월말 종가가 확정된 뒤, 다음 미국 첫 영업일
          저녁에 실제 거래를 하게 됩니다.
        </strong>{" "}
        미국의 서머타임 여부에 따라 한국 시간은 한 시간 달라질 수 있습니다.
      </p>

      <h2>달력으로 보면</h2>

      <p>아래 달력은 규칙의 시계로 본 한 달입니다. 표시된 날은 셋뿐입니다.</p>
      <ul className="lesson__marked">
        <li>
          <strong>① 지난달 마지막 영업일</strong> — 이 날의 종가로 다음 달
          배분을 계산합니다.
        </li>
        <li>
          <strong>② 이번 달 첫 영업일</strong> — 계산된 배분과 현재 보유를
          비교하고, 필요한 만큼만 거래합니다.
        </li>
        <li>
          <strong>③ 그 이후</strong> — 다음 월말까지 배분을 그대로 유지합니다.
        </li>
      </ul>
      <p>
        중간에 뉴스가 나고 시장이 움직인 날에도 배분은 바뀌지 않습니다. 31일 중
        규칙에 따라 확인하고 필요한 경우 거래하는 날은 사실상 하루뿐입니다.
      </p>

      <DecisionCalendar />

      <h2>늦었다면</h2>

      <p>
        첫 영업일을 놓쳐도 원칙은 같습니다. 옮겨 갈 배분은 여전히 지난 월말에
        정해진 것이고, 오늘 가격으로 새로 계산한 결과가 아닙니다. 달 중간에 다시
        계산해서 움직이면, 원래 백테스트에서 검증한 월 1회 규칙과 다른 전략을
        사용하게 됩니다. 다음 정기 리밸런싱도 곧 다가옵니다.
      </p>
      <p>
        매달 그 하루를 빠짐없이 기억하는 일은 사람보다 캘린더와 자동 알림이 더
        잘합니다.
      </p>

      <h2>할 일은 작습니다</h2>

      <p>
        한 달에 한 번, 규칙이 무엇을 말하는지 확인하고, 지금 보유한 것과
        비교하고, 다른 부분만 거래합니다. 거래할 것이 하나도 없는 달도 많습니다.
        나머지 날에는 특별한 신호가 없는 한 아무것도 하지 않습니다.
      </p>
    </>
  )
}
