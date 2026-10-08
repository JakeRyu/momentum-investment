import LessonScreenshot from "../../components/LessonScreenshot"

const SHOTS = "/lessons/trading212"

/**
 * Korean edition of lesson 9 — see ../AMonthWorkedThrough.tsx for the
 * English, and for why every amount in the screenshots is blanked.
 *
 * The account is a UK one, so it holds London-listed funds where the
 * paper names US tickers. Korean lesson 5 drops UCITS substitutes (a
 * Korean overseas-stock account buys the US funds themselves), so the
 * ticker section here explains the substitution in a sentence and tells
 * the Korean reader the step does not apply to them, rather than
 * pointing back to lesson 5. The site's timing for November is given
 * in Korean time, as in ko/RunningIt. The pound-to-dollar fund switch
 * that month is explained as in the English.
 */
export default function AMonthWorkedThrough() {
  return (
    <>
      <p>
        레슨 8에서 한 달에 한 번 하는 일을 정리했습니다. 비교하고, 달라진
        부분만 거래하고, 적어 둡니다. 이 레슨은 그 일을 실제로 한 번 해 본
        기록입니다. 이 사이트를 만든 사람의 계좌에서 2026년 10월 초에 한 DAA
        리밸런싱입니다.
      </p>
      <p>
        <strong>
          화면의 잔고, 금액, 수익률은 모두 일부러 가렸습니다. 이 레슨이
          보여 주려는 것은 결과가 아니라 절차입니다.
        </strong>
      </p>
      <p>
        증권사는 Trading 212입니다. 계좌가 거기 있기 때문입니다. 다른
        증권사는 화면 구성이 다르지만, 하는 일은 어디서나 같습니다.
      </p>

      <h2>규칙이 말한 것</h2>

      <p>
        9월 내내 DAA는 전부 투자된 상태였습니다. 위험자산 6개를 6분의 1씩
        보유했습니다. 그런데 9월 말 종가에서 카나리아 자산 2개 중 하나가
        꺾였습니다. 레슨 3에서 본 대로, 이때 DAA는 가장 강한 위험자산 3개를
        그대로 6분의 1씩 남기고, 나머지 절반은 현금성 자산 중 가장 강한
        하나에 둡니다.
      </p>

      <LessonScreenshot
        src={`${SHOTS}/01-app-holding.jpg`}
        caption="앱: 지금 보유할 것"
        alt="Monthly Rule 앱의 DAA-G12 화면. 2026년 9월 30일 기준, UK funds. CMFP.L, CNDX.L, IJPA.L 각 16.67%, IBTA.L 50%. 카나리아 자산 2개 중 하나(IUAA.L)가 꺾여 절반만 투자한다는 설명이 붙어 있습니다."
      />

      <p>
        이 화면은 10월 8일, 달이 바뀌고 일주일 뒤에 찍었습니다. 그런데도 9월
        30일 결과를 보여 줍니다. 레슨 8에서 설명한 앱의 Holding
        화면이 하는 일입니다. 오늘 날짜로 새로 계산하지 않고, 지금 유효한
        배분을 엽니다.
      </p>

      <h2>영국 계좌의 티커</h2>

      <p>
        이 계좌는 영국 계좌라서 미국 상장 ETF 대신 런던에 상장된 펀드로 같은
        시장을 삽니다. 앱의 UK funds 설정이 그 티커를 보여 줍니다.
        한국 증권사의 해외주식 계좌라면 미국 티커를 그대로 사면 되므로, 이
        부분은 건너뛰어도 됩니다.
      </p>

      <h2>비교한다</h2>

      <LessonScreenshot
        src={`${SHOTS}/02-holdings-vs-target.jpg`}
        caption="리밸런싱 전: 현재 비중과 목표 비중"
        alt="Trading 212의 DAA pie 보유 종목, 목표 비중 순. 펀드 6개의 현재 비중과 목표 비중: Invesco EQQQ Nasdaq-100 17.73% / 17%, iShares Core MSCI EM 16.83% / 17%, L&G Longer Dated All Commodities 16.94% / 17%, Vanguard S&P 500 17% / 17%, iShares Core MSCI Japan 16.26% / 16%, iShares Physical Gold 15.24% / 16%. 금액은 가렸습니다."
      />

      <p>
        Trading 212는 이 펀드들을 pie로 묶어 둡니다. 펀드마다 목표
        비중을 정해 둔 묶음입니다. 각 줄에서 색깔 있는 숫자가 현재 비중이고,
        빗금 뒤 회색 숫자가 목표 비중입니다. 한 달 동안 가격이 움직이면서
        조금씩 벌어졌습니다. 17.73% 대 17%, 15.24% 대 16%처럼요. 이런 차이는
        자연스러운 것이고, 그것만으로는 거래할 이유가 되지 않습니다.
      </p>
      <p>
        앱과 비교하면 시장 6개 중 3개(S&amp;P 500, 신흥국, 금)는 빠지고,
        3개는 남고, 1개가 새로 들어옵니다.
      </p>

      <h2>목표를 바꾼다</h2>

      <LessonScreenshot
        src={`${SHOTS}/03-new-targets.jpg`}
        caption="새 목표 비중"
        alt="Edit pie 화면. 펀드 4개: iShares USD Treasury Bond 1-3yr(IBTA) 50%, L&G Longer Dated All Commodities(CMFP) 17%, iShares NASDAQ 100(CNDX) 17%, iShares Core MSCI Japan IMI(IJPA) 16%, 합계 100%. 고리 안의 수치는 가렸습니다."
      />

      <p>
        pie를 고친다는 것은 빠지는 펀드를 지우고, 새 펀드를 넣고, 목표
        비중을 입력하는 일입니다. 여기서는 정수로 입력해서 앱의 16.67%가 17,
        17, 16이 되었습니다. 0.3%포인트 남짓한 차이는 한 달 동안 저절로
        생기는 차이보다 작습니다.
      </p>
      <p>
        이번 달에는 규칙과 상관없는 변경이 하나 있었습니다. 파운드로 거래되는
        펀드에서 달러로 거래되는 펀드, 곧 앱이 말하는 펀드로 바꿨습니다.
        나스닥 100과 일본은 그대로 남았고, 그 시장을 담는 펀드만 바뀌었습니다.
        한 번만 하는 펀드 선택이고, 아래 거래 내역에 그대로 드러납니다.
      </p>

      <h2>빠진 종목을 판다</h2>

      <p>
        pie에서 펀드를 지운다고 팔리지는 않습니다. 그래서 Trading 212가 지운
        펀드를 어떻게 할지 묻습니다. Rebalance my pie는 그 펀드를
        팔아 새 목표에 나눠 넣습니다. 규칙이 말하는 것이 이쪽입니다.{" "}
        Move to my investments를 고르면 pie 밖으로 옮겨질 뿐, 여전히
        보유하고 그 시장에 그대로 노출됩니다.
      </p>

      <h2>실제로 거래된 것</h2>

      <LessonScreenshot
        src={`${SHOTS}/04-trades.jpg`}
        caption="실제로 체결된 거래"
        alt="Trading 212의 리밸런싱 내역. 매도: Invesco EQQQ Nasdaq-100(Dist), Vanguard S&P 500(Acc), iShares Core MSCI EM IMI(Acc), iShares Core MSCI Japan IMI(Acc), iShares Physical Gold. 매수: iShares USD Treasury Bond 1-3yr(Acc), iShares NASDAQ 100(Acc), iShares Core MSCI Japan IMI(Acc), L&G Longer Dated All Commodities(Acc). 금액은 가렸습니다."
      />

      <p>
        5개는 전부 팔았습니다. 규칙이 뺀 시장 3개, 그리고 파운드로 거래되던
        나스닥 100과 일본 펀드입니다. 3개는 샀습니다. pie의 절반이 되는 미국
        단기 국채 펀드, 그리고 달러로 거래되는 대체 펀드 2개입니다. 일본 펀드가
        양쪽에 다 있는 것은 거래 통화만 바뀌었기 때문입니다.
      </p>
      <p>
        눈여겨볼 것은 마지막 줄입니다. 원자재 펀드는 그대로 남았기 때문에
        목표 비중까지 조금만 더 샀습니다. 전부 팔았다가 다시 사지 않았습니다.
        이것이 <strong>달라진 부분만 거래한다</strong>는 모습입니다. 펀드를
        바꾸지 않는 달이라면 나스닥 100과 일본도 이렇게 조금만 조정됩니다.
      </p>
      <p>
        펀드를 바꾸는 데에도 비용이 듭니다. 팔고 살 때마다 스프레드(매수·매도
        호가 차이)를 냅니다. 펀드는 한 번 정하고 그대로 두는 편이 좋은 이유가
        하나 더 있는 셈입니다. 주문이 나가기 전에 증권사가 예상 비용도 보여
        주니, 그것도 읽어 두세요.
      </p>

      <h2>적어 두고, 닫는다</h2>

      <p>
        날짜와 펀드 4개, 그리고 각 목표 비중을 적어 둡니다. 다음 결과는 10월
        말 종가로 정해집니다. 앱이라면 그 뒤 아무 날이나 확인하면 되고,
        사이트라면 11월 2일(월) 오전 9시부터 미국장 개장 전까지 엽니다. 그때까지는
        할 일이 없습니다.
      </p>
      <p>
        이것이 한 달입니다. 규칙이 지난달과 같은 답을 내는 달은 이보다 더
        짧습니다.
      </p>
    </>
  )
}
