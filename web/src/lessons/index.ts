import type { ComponentType } from 'react';

import ChoosingOne from './ChoosingOne';
import OneSignalAMonth from './OneSignalAMonth';
import RunningIt from './RunningIt';
import WhatBreadthAdds from './WhatBreadthAdds';
import WhatMomentumIs from './WhatMomentumIs';
import WhatYouWouldBuy from './WhatYouWouldBuy';
import WhyDrawdown from './WhyDrawdown';
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
  {
    slug: 'why-drawdown',
    number: 6,
    title: 'Drawdown — why these strategies exist',
    summary:
      'The target the authors set, the figures they published, and the cases where it did not hold.',
    Body: WhyDrawdown,
  },
  {
    slug: 'choosing-one',
    number: 7,
    title: 'Choosing one',
    summary:
      'The six side by side, on facts rather than ratings — and the question underneath the table.',
    Body: ChoosingOne,
  },
  {
    slug: 'running-it',
    number: 8,
    title: 'Running it',
    summary:
      'What the first day looks like, what each month looks like, and where the site stops.',
    Body: RunningIt,
  },
];

export function findLesson(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug);
}
