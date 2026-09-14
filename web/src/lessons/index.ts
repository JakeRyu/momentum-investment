import type { ComponentType } from 'react';

import OneSignalAMonth from './OneSignalAMonth';
import WhatBreadthAdds from './WhatBreadthAdds';
import WhatMomentumIs from './WhatMomentumIs';
import WhatYouWouldBuy from './WhatYouWouldBuy';
import WhyNotBuyAndHold from './WhyNotBuyAndHold';

/**
 * The course, in order. A reader who works through it should be able to
 * read a strategy page and know what it is telling them.
 *
 * `number` is display order; `slug` is the URL and stays meaningful on
 * its own, so reordering the course does not invalidate a link someone
 * saved. Bodies are components rather than strings because the prose
 * carries lists, emphasis and links.
 */
export type Lesson = {
  slug: string;
  number: number;
  title: string;
  /** One line, shown on the contents page. */
  summary: string;
  Body: ComponentType;
};

export const LESSONS: readonly Lesson[] = [
  {
    slug: 'why-not-buy-and-hold',
    number: 1,
    title: 'Why not just buy and hold?',
    summary:
      'Index funds work. The catch is how far they fall, and what that costs to recover.',
    Body: WhyNotBuyAndHold,
  },
  {
    slug: 'what-momentum-is',
    number: 2,
    title: 'What momentum actually is',
    summary:
      'A measured tendency in prices that have already moved — not a forecast.',
    Body: WhatMomentumIs,
  },
  {
    slug: 'what-breadth-adds',
    number: 3,
    title: 'What breadth adds',
    summary:
      'Counting how many assets are rising, and the small basket that can overrule the rest.',
    Body: WhatBreadthAdds,
  },
  {
    slug: 'one-signal-a-month',
    number: 4,
    title: 'One signal a month',
    summary:
      'When the decision happens, why it holds all month, and what to do if you are late.',
    Body: OneSignalAMonth,
  },
  {
    slug: 'what-you-would-buy',
    number: 5,
    title: 'What you would actually buy',
    summary:
      'The ticker, the fund behind it, what it costs, and what UK readers buy instead.',
    Body: WhatYouWouldBuy,
  },
];

export function findLesson(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug);
}
