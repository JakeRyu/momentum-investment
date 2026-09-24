import type { Lesson } from '../index'

import WhatBreadthAdds from './WhatBreadthAdds'
import WhatMomentumIs from './WhatMomentumIs'
import WhyNotBuyAndHold from './WhyNotBuyAndHold'

/**
 * The course in Korean, served at /ko/learn. Same slugs and numbers as
 * LESSONS, so /learn/x and /ko/learn/x are one lesson in two languages.
 * Each is a Korean edition written for the reader's flow, not a
 * sentence-for-sentence translation; see GLOSSARY.md for the agreed terms.
 */
export const LESSONS_KO: readonly Lesson[] = [
  {
    slug: 'why-not-buy-and-hold',
    number: 1,
    title: '그냥 사서 보유하면 안 될까?',
    summary:
      '인덱스 펀드는 좋은 선택입니다. 문제는 얼마나 깊이 떨어지는지, 그리고 회복에 무엇이 드는지입니다.',
    Body: WhyNotBuyAndHold,
  },
  {
    slug: 'what-momentum-is',
    number: 2,
    title: '모멘텀이란 무엇인가',
    summary: '이미 움직인 가격에서 측정되는 경향입니다. 예측이 아닙니다.',
    Body: WhatMomentumIs,
  },
  {
    slug: 'what-breadth-adds',
    number: 3,
    title: '시장 폭이 더해 주는 것',
    summary: '오르는 자산이 몇 개인지 세는 일, 그리고 나머지를 모두 뒤집을 수 있는 작은 바구니.',
    Body: WhatBreadthAdds,
  },
]
