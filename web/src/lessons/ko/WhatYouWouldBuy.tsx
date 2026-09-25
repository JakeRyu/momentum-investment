/**
 * Korean edition of lesson 5 — see ../WhatYouWouldBuy.tsx for the
 * English. The English half about UCITS substitutes is gone: a Korean
 * broker's overseas-stock account buys the US-listed funds themselves,
 * so the Korean reader needs no substitute at all. No tax content, by
 * the spec.
 *
 * SHY's description is written out in Korean rather than pulled from
 * etfDescriptions.ts, whose text is English. It says what that entry
 * says ('1–3 year US Treasuries'); keep the two in step.
 */
export default function WhatYouWouldBuy() {
  return (
    <>
      <p>
        이 사이트의 전략은 매달 <strong>SHY 100%</strong>처럼 티커와 비중을
        제시합니다. 즉, 그 달에 <strong>무엇을 얼마나 보유할지</strong>를
        알려주는 것입니다. 이 레슨의 질문은 이것입니다. 그 티커는 무엇이고,
        실제로 무엇을 사게 되는가?
      </p>
      <p>
        <strong>
          티커는 거래소에 상장된 ETF를 식별하는 짧은 코드입니다. 한국에서는
          일반적으로 증권사의 해외주식 거래 계좌를 통해 미국 상장 ETF를 직접
          매수할 수 있습니다.
        </strong>
      </p>

      <h2>티커와 ETF</h2>

      <p className="lesson__define">
        <strong>티커</strong> 한 거래소에 상장된 종목 하나를 가리키는 짧은
        코드입니다. 한국 주식의 종목코드(삼성전자 005930)와 같은 역할입니다.
        티커는 상품의 내용을 설명하는 이름이 아니라{" "}
        <strong>상품을 구별하기 위한 코드</strong>입니다. 따라서 비슷한 자산을
        담은 ETF라도 서로 다른 티커를 사용할 수 있습니다.
      </p>

      <p className="lesson__define">
        <strong>ETF</strong> 상장지수펀드. 여러 자산을 한 바구니에 담아{" "}
        <strong>하나의 상품으로 거래할 수 있게 만든</strong> 펀드입니다.
        주식처럼 거래소에서 장중에 사고팔 수 있습니다. 이 여섯 전략이 투자하는
        자산은 모두 ETF입니다.
      </p>

      <h2>예를 들어 SHY</h2>

      <p>
        SHY는 잔존만기 1~3년의 미국 국채에 투자하는 ETF입니다. 장기채나
        주식에 비해 가격 변동이 상대적으로 작기 때문에, 전략에서는 시장
        상황이 나쁠 때 <strong>방어 자산</strong>으로 사용됩니다.
      </p>
      <p>
        그러니 사이트가 <strong>SHY · 100%</strong>라고 보여주면, 이번 달에는
        다른 것은 모두 팔고 SHY만 보유하라는 뜻입니다.
      </p>

      <h2>한국에서 사는 법</h2>

      <p>
        이 사이트의 티커는 논문에 나온 그대로이고, 모두 미국에 상장된 ETF입니다.
        한국 증권사의 해외주식 계좌에서는 미국 상장 ETF를 직접 살 수 있습니다.
      </p>
      <ul>
        <li>증권사 앱에서 해외주식 거래를 신청합니다.</li>
        <li>티커(예: SHY)로 종목을 검색합니다.</li>
        <li>국내 주식을 살 때처럼 주문합니다.</li>
      </ul>
      <p>
        일반적으로 별도의 전문투자자 자격이 필요한 상품은 아닙니다. 다만
        최소 주문 단위와 소수점 거래 가능 여부는 증권사마다 다를 수
        있습니다. 증권사에 따라 미리 달러로 환전해야 하거나, 원화로 바로 주문할
        수 있습니다.
      </p>
      <p>
        이 점에서 한국 투자자는 좋은 위치에 있습니다. 미국 밖의 투자자 대부분은
        그렇지 못합니다. 예컨대 영국이나 유럽의 개인 투자자는 규제 때문에 미국
        상장 ETF를 살 수 없어서, 같은 지수를 따르는 현지 펀드로 바꿔 사야
        합니다. 한국 투자자는{" "}
        <strong>논문이 검증한 바로 그 펀드를 대체 상품 없이</strong> 삽니다.
      </p>

      <h2>알아 둘 비용 두 가지</h2>

      <ul>
        <li>
          <strong>연간 보수.</strong> ETF가 운용 비용으로 매년 떼어 가는
          돈입니다. 따로 청구되지 않고 가격에 반영되며, 이 전략들이 쓰는 ETF는
          대체로 낮은 편입니다.
        </li>
        <li>
          <strong>거래 비용.</strong> 거래할 때마다 증권사 수수료와
          스프레드(사는 값과 파는 값의 차이)가 듭니다. 한국 투자자에게는 여기에
          환전 비용이 더해집니다.
        </li>
      </ul>
      <p>
        각각의 비용은 작아 보일 수 있지만, 장기간 반복되면 수익률에 영향을 줄
        수 있습니다. 그래서 한 달에 한 번만 거래하는 이 전략은 뉴스나 시장의
        단기 움직임에 따라 자주 매매하는 전략보다 거래 비용을 낮게 유지할 수
        있습니다.
      </p>
    </>
  )
}
