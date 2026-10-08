# Korean Strategy Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve `/ko/strategies/{id}` for all six strategies: a Korean explanation of each rule, with no decision on the page.

**Architecture:** Korean copy lives in a new `web/src/strategies.ko.ts`, keyed by `StrategyId`. A new route component `KoStrategyPage` renders it with the English page's header markup, the paper line and `BacktestFigure`, and puts a link to the English page where the decision would be. The English page, `/ko/learn`, Korean lesson 6's table and the sitemap link to the new pages.

**Tech Stack:** React 19, react-router-dom, Vite (+ SSR prerender from `public/sitemap.xml`), Vitest + Testing Library. Commands run from `web/`.

**Spec:** `docs/superpowers/specs/2026-10-08-korean-strategy-pages-design.md`

## Global Constraints

- `web/` only. No backend or mobile changes.
- The Korean page **never computes or shows a decision**: no `DecisionTool`, no "Today's Decision" banner, no `fetch`.
- No `AppPromo` on the Korean page.
- Strategy names (`fullName`, `shortName`), tickers, figure labels and UI names (*Today's Decision*) stay in English.
- Korean copy is "-합니다"체, a Korean edition rather than a line-by-line translation; facts and numbers match `strategies.ts` and the paper.
- Terms follow `web/src/lessons/ko/GLOSSARY.md`. Task 1 adds the new terms; the user confirms them at plan review.
- Korean taglines: no author names (Keller, 켈러, Keuning, van Putten), no years, no paper vocabulary (13612, SMA12, G4, B3, canary/카나리아, breadth/시장 폭).
- `strategies.ts` is not modified.
- Every new route must be in `public/sitemap.xml`, or it is not prerendered and 404s on direct load.

## Correction to the spec

The spec says Korean lesson 8's link to `/strategies/vaa` should point to `/ko/strategies/vaa`. **Leave it on the English page.** The sentence around it tells the reader to read *Today's Decision* on that page, which the Korean page will not have, and `routes.test.tsx` ("sends the Korean reader to the English strategy page") already pins it. Task 6 updates the spec to match.

## Review Focus

- **A reader who lands on a Korean page from search and wants to act.** They need a one-click path to the decision. Task 3 tests the link to the English page by its name and href.
- **`/ko/learn`'s intro.** It currently says "전략 페이지는 영어로 되어 있고". Once Korean strategy pages exist, that sentence is false. Task 5 rewrites it and tests the old wording is gone.
- **Client-side navigation from a Korean page to the English one.** `KoreanHead` must reset `<html lang>` to `en` on unmount. It already does, and Task 3 mounts it on the Korean page only.
- **PAA's English description refers to "the page below" and its variant toggle.** The Korean page has no toggle. Task 1 tests that no Korean paragraph says "아래" or "below".
- **The Korean `h1` is an English name.** `[lang='ko'] h1` sets it upright, but it must stay italic like the English page. Task 3's CSS keeps it italic through `:lang(en)`. Check it by eye in Task 6.

---

### Task 1: Korean copy and glossary terms

**Files:**
- Create: `web/src/strategies.ko.ts`
- Create: `web/src/strategies.ko.test.ts`
- Modify: `web/src/lessons/ko/GLOSSARY.md` (append rows to the 개념 table)

**Interfaces:**
- Consumes: `StrategyId`, `STRATEGIES`, `Strategy['defaultUniverse']` from `web/src/strategies.ts`
- Produces: `export type StrategyKo = { tagline: string; longDescription: string[] }` and `export const STRATEGIES_KO: Record<StrategyId, StrategyKo>`

- [ ] **Step 1: Add the glossary terms**

Append these rows to the end of the `## 개념` table in `web/src/lessons/ko/GLOSSARY.md` (after the `rule | 규칙` row):

```markdown
| 13612W / 13612U / SMA12 | 원어 | 13612U는 첫 등장 시 "1·3·6·12개월 수익률의 단순 평균"으로 풀이. 전략 페이지 |
| moving average / simple moving average | 이동평균 / 단순 이동평균 | 200-day SMA → 200일 이동평균 |
| offensive asset / defensive asset | 공격 자산 / 방어 자산 | |
| defensive sleeve | 방어 자산군 | BAA |
| permanent sleeve | 고정 자산 | LAA |
| bond fraction | 채권 비중 | PAA |
| protection factor | 보호 계수 | PAA. Aggressive / Moderate / Vigilant는 원어 |
| bellwether | 풍향계 | |
| unanimous | 만장일치 | BAA |
| absolute momentum filter | 절대 모멘텀 필터 | |
| Growth-Trend (GT) timing | 성장-추세(GT) 타이밍 | LAA |
| unemployment rate | 실업률 | |
| real assets / REITs / commodities | 실물자산 / 리츠 / 원자재 | |
| T-bills | 1–3개월 미국 국채 | |
| intermediate / short Treasuries | 중기 국채 / 단기 국채 | |
| TIPS | 미국 물가연동국채(TIPS) | |
```

- [ ] **Step 2: Write the failing test**

Create `web/src/strategies.ko.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { STRATEGIES, type Strategy } from './strategies'
import { STRATEGIES_KO } from './strategies.ko'

/** Every ticker or series id the strategy's universe names. */
function universeSymbols(s: Strategy): string[] {
  return Object.entries(s.defaultUniverse)
    .filter(([key]) => key !== 'kind')
    .flatMap(([, value]) => value)
}

describe('Korean strategy copy', () => {
  it('covers every strategy', () => {
    for (const s of STRATEGIES) {
      const ko = STRATEGIES_KO[s.id]
      expect(ko?.tagline, s.id).toBeTruthy()
      expect(ko.longDescription.length, s.id).toBeGreaterThan(0)
      for (const p of ko.longDescription) expect(p, s.id).toBeTruthy()
    }
  })

  it('says what the strategy does, not who published it', () => {
    for (const s of STRATEGIES) {
      expect(STRATEGIES_KO[s.id].tagline, s.id).not.toMatch(
        /Keller|켈러|Keuning|van Putten|\b(19|20)\d{2}\b/,
      )
    }
  })

  it('keeps the papers’ vocabulary out of the taglines', () => {
    for (const s of STRATEGIES) {
      expect(STRATEGIES_KO[s.id].tagline, s.id).not.toMatch(
        /13612|SMA12|G4|B3|canary|breadth|카나리아|시장 폭/i,
      )
    }
  })

  it('names every ticker the English description names', () => {
    // A Korean edition may add definitions, but it must not drop or swap
    // a fund the English page tells the reader about.
    for (const s of STRATEGIES) {
      const en = s.longDescription.join(' ')
      const ko = STRATEGIES_KO[s.id].longDescription.join(' ')
      for (const sym of universeSymbols(s)) {
        if (new RegExp(`\\b${sym}\\b`).test(en)) {
          expect(ko, `${s.id}: ${sym}`).toMatch(new RegExp(`\\b${sym}\\b`))
        }
      }
    }
  })

  it('does not point at a tool the Korean page does not have', () => {
    // PAA's English text refers to the variant toggle "below".
    for (const s of STRATEGIES) {
      for (const p of STRATEGIES_KO[s.id].longDescription) {
        expect(p, s.id).not.toMatch(/아래|below/)
      }
    }
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/strategies.ko.test.ts`
Expected: FAIL — cannot resolve `./strategies.ko`.

- [ ] **Step 4: Write the copy**

Create `web/src/strategies.ko.ts`:

```ts
import type { StrategyId } from './strategies'

/**
 * Korean edition of each strategy's tagline and description, for the
 * /ko/strategies pages. Not a line-by-line translation: the sentences
 * follow Korean order and add a definition where the English assumes one,
 * but every fact, ticker and threshold is the one `strategies.ts` states.
 * Terms follow lessons/ko/GLOSSARY.md.
 *
 * The Korean page carries no decision, so nothing here may point at the
 * tool below the English description (PAA's variant toggle).
 */
export type StrategyKo = {
  tagline: string
  longDescription: string[]
}

export const STRATEGIES_KO: Record<StrategyId, StrategyKo> = {
  vaa: {
    tagline: '가장 강한 하나에 전부, 첫 경고에 전부 빠진다',
    longDescription: [
      'VAA는 자산군을 공격 자산 네 개(미국 대형주, 미국 외 선진국 주식, 신흥국 주식, 미국 종합 채권)와 방어 자산 세 개(회사채, 중기 국채, 단기 국채)로 나눕니다. 매달 모든 자산에 13612W 모멘텀 점수를 매깁니다. 최근 1개월, 3개월, 6개월, 12개월 수익률에 가중치를 두어 섞은 점수입니다.',
      '공격 자산 네 개의 점수가 모두 양수이면 그중 점수가 가장 높은 하나에 전부 투자합니다. 하나라도 0 이하가 되면 방어 자산 가운데 점수가 가장 높은 하나로 전부 옮깁니다. 한 자산에 모두 거는 집중과 "넷 다 양수여야 한다"는 엄격한 조건이 VAA의 성격을 만듭니다. 추세가 이어지는 장에서는 크게 오르고, 오르는 자산이 줄어드는 첫 신호에 빠르게 물러납니다.',
    ],
  },
  daa: {
    tagline: '풍향계 자산 두 개가 피할 때를 정한다',
    longDescription: [
      'DAA는 카나리아 자산군이라는 생각을 처음 도입한 전략입니다. 신흥국 주식(VWO)과 미국 종합 채권(BND), 두 자산으로 된 작은 바구니가 위험자산 12개로 된 메인 자산군 바깥에 따로 있으면서, 공격과 방어를 가르는 게이트 역할만 합니다. 매달 두 카나리아 가운데 13612W 모멘텀이 0 이하인 것이 몇 개인지 셉니다.',
      '나쁜 카나리아가 0개면 완전 공격입니다. 위험자산 상위 여섯 개를 1/6씩 보유합니다. 1개면 절반 방어로, 위험자산 세 개와 현금성 자산을 절반씩 보유합니다. 2개면 완전 방어로, 현금성 자산(IEF, SHY, LQD) 가운데 가장 좋은 하나만 보유합니다. 공격과 방어의 비율을 정하는 것은 위험자산 각각의 점수가 아니라 이 개수입니다. 이것이 시장 폭(breadth) 모멘텀의 핵심입니다.',
    ],
  },
  paa: {
    tagline: '오르는 자산이 줄어들수록 위험을 조금씩 줄인다',
    longDescription: [
      'PAA는 위험자산 12개에 VAA나 DAA보다 단순한 신호를 씁니다. 각 자산의 현재 가격을 지난 12개월 단순 이동평균(SMA12)과 비교합니다. 이동평균보다 위에 있는 위험자산의 수(n)가 채권 비중, 곧 포트폴리오 가운데 점수가 가장 좋은 현금성 자산으로 옮길 몫을 정합니다.',
      '보호 계수 a는 이 전환이 얼마나 조심스러운지를 정합니다. a=0(Aggressive)은 오르는 위험자산이 하나도 없을 때만 완전 방어로 갑니다. a=1(Moderate)은 n이 3 이하일 때부터, a=2(Vigilant, 켈러가 기준으로 권하는 값)는 n이 6 이하일 때부터 방어 비중을 늘립니다. a가 클수록 더 일찍 위험을 줄입니다.',
    ],
  },
  haa: {
    tagline: '네 자산을 함께 보유하고, 인플레이션 경고에 빠진다',
    longDescription: [
      'HAA는 네 가지 자산 범주, 곧 미국 주식과 해외 주식, 실물자산(리츠, 원자재), 국채를 위험자산 여덟 개에 나눠 담습니다. 공격과 방어는 카나리아 자산 하나, TIP(미국 물가연동국채)가 정합니다. 신호는 13612U, 곧 1·3·6·12개월 수익률의 단순 평균입니다. TIP의 13612U가 0 이하가 되면 HAA는 이것을 금리 상승 충격으로 읽고 전부 현금성 자산으로 옮깁니다. BIL(1–3개월 미국 국채)과 IEF(중기 국채) 가운데 더 나은 쪽입니다.',
      '카나리아가 양호하면 13612U 기준 상위 위험자산 네 개를 1/4씩 보유합니다. 이름의 "하이브리드"는 여기서 나옵니다. 그 네 개 가운데 자기 모멘텀이 0 이하인 것은 현금성 자산으로 바뀌므로, 한 달 안에서 일부는 투자하고 일부는 방어할 수 있습니다. 상위 네 개 중 하나가 나쁘면 25%가 현금성 자산입니다. TIP 카나리아 덕분에 HAA는 2022년 전통적인 주식 60 · 채권 40 포트폴리오에 타격을 준 인플레이션·금리 국면 변화에 특히 민감하게 반응합니다.',
    ],
  },
  baa: {
    tagline: '가장 엄격한 방어. 경고 하나면 전부 빠진다',
    longDescription: [
      'BAA는 DAA의 카나리아 게이트를 만장일치 규칙으로 조입니다. 카나리아 네 개(SPY, VWO, VEA, BND)의 13612W 모멘텀이 모두 양수여야 공격 모드에 들어갑니다. 하나라도 하락 신호를 보이면 포트폴리오 전체가 방어 자산군으로 갑니다. 채권과 헤지 자산 일곱 개 가운데 SMA12 기준 상위 세 개를 같은 비중으로 담고, 그중 BIL보다 점수가 낮은 것은 BIL로 바꿉니다.',
      '카나리아 네 개가 모두 양호하면 위험자산 12개 가운데 상위 여섯 개를 1/6씩 보유합니다. 신호를 둘로 나눈 설계가 핵심입니다. 카나리아에는 빠른 13612W를 써서 게이트가 빨리 반응하게 하고, 공격과 방어 양쪽의 순위는 느린 SMA12로 매겨 보유 종목이 덜 바뀌게 합니다. HAA와 달리, 떨어지고 있는 자산이라도 상위 여섯 안에 들면 그대로 보유합니다. 논문이 공격 자산 선택에 절대 모멘텀 필터를 두지 않기 때문입니다.',
    ],
  },
  laa: {
    tagline: '대부분은 사서 보유, 느린 경기 스위치 하나',
    longDescription: [
      'LAA는 여섯 전략 가운데 성격이 가장 다릅니다. 포트폴리오의 75%는 고정 자산(러셀 1000 가치주, 금, 중기 국채. IWD, GLD, IEF를 같은 비중으로)에 두고 전술적으로 바꾸지 않습니다. 나머지 25%만 위험자산 하나(QQQ)와 현금성 자산 하나(SHY) 사이를 오갑니다.',
      '이 25%를 움직이는 신호는 자산 모멘텀이 아니라 경기를 보는 성장-추세(GT) 타이밍입니다. 두 신호가 함께 나빠질 때만 위험을 줄입니다. SPY가 200일 이동평균보다 낮고, 동시에 미국 실업률(FRED의 UNRATE)이 12개월 이동평균보다 높을 때입니다. 둘 중 하나만 나쁘면 QQQ를 유지합니다. 두 조건이 함께 나타나는 일은 실제 경기 침체가 아니면 드물기 때문에, LAA는 대부분의 시간을 고정 자산 75%와 QQQ 25%로 보내고 경기가 전반적으로 나빠질 때만 현금성 자산으로 물러납니다.',
    ],
  },
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/strategies.ko.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/strategies.ko.ts src/strategies.ko.test.ts src/lessons/ko/GLOSSARY.md
git commit -m "Write each strategy's rule in Korean"
```

---

### Task 2: Let the comparison table link to the Korean pages

**Files:**
- Modify: `web/src/components/StrategyComparison.tsx` (Props and the row `Link`)
- Modify: `web/src/lessons/ko/ChoosingOne.tsx` (the `<StrategyComparison tableOnly />` line)
- Test: `web/src/components/StrategyComparison.test.tsx`

**Interfaces:**
- Produces: `StrategyComparison` prop `linkPrefix?: '' | '/ko'` (default `''`); rows link to `` `${linkPrefix}/strategies/${id}` ``

- [ ] **Step 1: Write the failing test**

Add inside the `describe('StrategyComparison', …)` block in `StrategyComparison.test.tsx`:

```tsx
  it('can send a Korean reader to the Korean pages', () => {
    render(
      <MemoryRouter>
        <StrategyComparison tableOnly linkPrefix="/ko" />
      </MemoryRouter>,
    )
    for (const s of STRATEGIES) {
      expect(screen.getByTestId(`compare-row-${s.id}`), s.id).toHaveAttribute(
        'href',
        `/ko/strategies/${s.id}`,
      )
    }
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/StrategyComparison.test.tsx`
Expected: FAIL — the prop is ignored, so the href is `/strategies/vaa`.

- [ ] **Step 3: Implement**

In `StrategyComparison.tsx`, extend `Props` and use it:

```tsx
type Props = {
  /**
   * Drop the starting-point line above the table and the note below it,
   * for a page whose own prose already frames the figures.
   */
  tableOnly?: boolean
  /** '/ko' when the table sits in a Korean lesson, so rows open the Korean pages. */
  linkPrefix?: '' | '/ko'
}

export default function StrategyComparison({ tableOnly, linkPrefix = '' }: Props) {
```

and change the row link to:

```tsx
            to={`${linkPrefix}/strategies/${s.id}`}
```

In `web/src/lessons/ko/ChoosingOne.tsx`, change `<StrategyComparison tableOnly />` to:

```tsx
      <StrategyComparison tableOnly linkPrefix="/ko" />
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/StrategyComparison.test.tsx`
Expected: PASS, including the existing "each linking to its page" test (default prefix still `/strategies/…`).

- [ ] **Step 5: Commit**

```bash
git add src/components/StrategyComparison.tsx src/components/StrategyComparison.test.tsx src/lessons/ko/ChoosingOne.tsx
git commit -m "Point the Korean lesson's comparison table at the Korean pages"
```

---

### Task 3: The Korean strategy page

**Files:**
- Create: `web/src/routes/strategyTitle.tsx` (moved helpers)
- Create: `web/src/routes/KoStrategyPage.tsx`
- Modify: `web/src/routes/StrategyPage.tsx` (import the moved helpers, delete the local copies at the bottom)
- Modify: `web/src/AppRoutes.tsx` (add the route)
- Modify: `web/src/routes.test.tsx` (route in `renderAt`, new `describe`)
- Modify: `web/src/index.css` (Korean strategy-page rules, appended after the `[lang='ko'] :is(…)` rule)

**Interfaces:**
- Consumes: `STRATEGIES_KO` (Task 1); `findStrategy`, `Strategy` from `strategies.ts`; `findCourseLesson` from `lessons/courses.ts`; `KoreanHead`, `LangSwitch`, `PageMeta`, `BacktestFigure`
- Produces: `export function dottedShort(s: Strategy): string` and `export function splitTitle(full: string): React.ReactNode` in `routes/strategyTitle.tsx`; default export `KoStrategyPage`; route `/ko/strategies/:id`

- [ ] **Step 1: Write the failing tests**

In `web/src/routes.test.tsx`:

1. Change the vitest import to `import { describe, expect, it, vi } from 'vitest'`.
2. Add `import KoStrategyPage from './routes/KoStrategyPage'` with the other route imports.
3. In `renderAt`, add after the `/ko/learn/:slug` route:

```tsx
        <Route path="/ko/strategies/:id" element={<KoStrategyPage />} />
```

4. Add this block after `describe('Korean course', …)`:

```tsx
describe('Korean strategy pages', () => {
  it.each(STRATEGIES.map((s) => s.id))('serves /ko/strategies/%s in Korean, with no decision', (id) => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const { container } = renderAt(`/ko/strategies/${id}`)
    expect(container.querySelector('.not-found')).toBeNull()
    expect(container.querySelector('article')).toHaveAttribute('lang', 'ko')
    expect(container.querySelector('.decision, .decision-banner, .app-promo')).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('404s on a strategy that does not exist', () => {
    const { container } = renderAt('/ko/strategies/xyz')
    expect(container.querySelector('.not-found')).not.toBeNull()
  })

  it('sends a reader who wants the current reading to the English page', () => {
    renderAt('/ko/strategies/daa')
    expect(screen.getByRole('link', { name: /DAA 영어 페이지/ })).toHaveAttribute(
      'href',
      '/strategies/daa',
    )
  })

  it('links back to its English twin', () => {
    renderAt('/ko/strategies/vaa')
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute('href', '/strategies/vaa')
  })

  it('points at the canary lesson only for a strategy with a canary', () => {
    renderAt('/ko/strategies/daa')
    expect(screen.getByRole('link', { name: '시장 폭이 더해 주는 것' })).toHaveAttribute(
      'href',
      '/ko/learn/what-breadth-adds',
    )
    cleanup()
    renderAt('/ko/strategies/paa')
    expect(screen.queryByRole('link', { name: '시장 폭이 더해 주는 것' })).toBeNull()
    expect(screen.getByRole('link', { name: '모멘텀이란 무엇인가' })).toHaveAttribute(
      'href',
      '/ko/learn/what-momentum-is',
    )
  })

  it('carries the Korean disclaimer', () => {
    const { container } = renderAt('/ko/strategies/vaa')
    expect(container.textContent).toMatch(/투자 자문이 아닙니다/)
  })

  it('shows the published drawdown, as the English page does', () => {
    renderAt('/ko/strategies/vaa')
    expect(screen.getByText('−16.4%')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/routes.test.tsx`
Expected: FAIL — cannot resolve `./routes/KoStrategyPage`.

- [ ] **Step 3: Move the title helpers**

Create `web/src/routes/strategyTitle.tsx` (moved verbatim from the bottom of `StrategyPage.tsx`, now exported):

```tsx
import type { Strategy } from '../strategies'

export function dottedShort(s: Strategy): string {
  return s.shortName.split('').join('.') + '.'
}

// Split long-name titles at the first space so "Vigilant Asset Allocation"
// renders across two display lines for the magazine-spread hero.
export function splitTitle(full: string): React.ReactNode {
  const i = full.indexOf(' ')
  if (i === -1) return full
  const head = full.slice(0, i)
  const tail = full.slice(i + 1)
  return (
    <>
      {head}
      <br />
      {tail}
    </>
  )
}
```

In `StrategyPage.tsx`, delete the local `dottedShort` and `splitTitle` functions and add:

```tsx
import { dottedShort, splitTitle } from './strategyTitle'
```

- [ ] **Step 4: Write the page**

Create `web/src/routes/KoStrategyPage.tsx`:

```tsx
import { Link, useParams } from 'react-router-dom'

import BacktestFigure from '../components/BacktestFigure'
import KoreanHead from '../components/KoreanHead'
import LangSwitch from '../components/LangSwitch'
import PageMeta from '../components/PageMeta'
import { findCourseLesson } from '../lessons/courses'
import { findStrategy, type Strategy } from '../strategies'
import { STRATEGIES_KO } from '../strategies.ko'

import NotFound from './NotFound'
import { dottedShort, splitTitle } from './strategyTitle'

/**
 * A strategy explained in Korean. It explains the rule and stops there:
 * showing today's decision in Korean to the Korean public sits close to
 * the line Korean law draws around unregistered investment advice
 * (유사투자자문업), so the decision stays on the English page, one link
 * away. See docs/superpowers/specs/2026-10-08-korean-strategy-pages-design.md.
 */
export default function KoStrategyPage() {
  const { id } = useParams<{ id: string }>()
  const strategy = id ? findStrategy(id) : undefined
  if (!strategy) return <NotFound />

  const ko = STRATEGIES_KO[strategy.id]
  const english = `/strategies/${strategy.id}`

  return (
    <article className="strategy-page" lang="ko">
      <PageMeta
        title={`${strategy.fullName} (${strategy.shortName}) 전략`}
        description={`${ko.tagline}. ${strategy.shortName} 전략이 어떤 규칙으로 움직이는지 근거 논문과 함께 한국어로 설명합니다.`}
        path={`/ko/strategies/${strategy.id}`}
        alternates={{ en: english, ko: `/ko/strategies/${strategy.id}` }}
      />
      <KoreanHead />
      <header className="strategy-page__head">
        <p className="strategy-page__tag">{dottedShort(strategy)}</p>
        <h1 lang="en">{splitTitle(strategy.fullName)}</h1>
        <LangSwitch lang="en" to={english} />
      </header>

      <div className="strategy-page__rule-thin" />

      <p className="strategy-page__lede">{ko.tagline}</p>

      <div className="strategy-page__body">
        {ko.longDescription.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <p className="strategy-page__paper">
        논문 ·{' '}
        <em lang="en">
          <a href={strategy.paperUrl} target="_blank" rel="noreferrer">
            {strategy.paperTitle}
          </a>
        </em>{' '}
        — {strategy.paperYear}
      </p>

      {strategy.backtest && <BacktestFigure backtest={strategy.backtest} />}

      <div className="strategy-page__rule-heavy" />

      <section className="strategy-page__now">
        <h2>지금 무엇을 보유하나</h2>
        <p>
          이 페이지는 규칙만 설명합니다. 이 규칙이 지금 무엇을 보유하라고
          하는지는 영어 페이지의 Today&rsquo;s Decision이 실제 시장 가격으로
          계산해 보여 줍니다.
        </p>
        <p>
          <Link to={english}>{strategy.shortName} 영어 페이지에서 확인하기 →</Link>
        </p>
        <LessonLinks strategy={strategy} />
        <p className="strategy-page__disclaimer">
          이 사이트는 교육용 자료이며 투자 자문이 아닙니다. 과거 성과는 미래
          수익을 보장하지 않으며, 투자 판단과 그 결과에 대한 책임은 투자자
          본인에게 있습니다.
        </p>
      </section>

      <p className="back-link">
        <Link to="/ko/learn#strategies">← 여섯 전략</Link>
      </p>
    </article>
  )
}

/** The Korean lessons behind what the English page's reading shows. */
function LessonLinks({ strategy }: { strategy: Strategy }) {
  const slugs = [
    'what-momentum-is',
    ...('canary' in strategy.defaultUniverse ? ['what-breadth-adds'] : []),
    'one-signal-a-month',
  ]
  const lessons = slugs.flatMap((slug) => findCourseLesson('ko', slug) ?? [])

  return (
    <p>
      처음이라면 강의에서 먼저 읽어 보세요.{' '}
      {lessons.map((l, i) => (
        <span key={l.slug}>
          {i > 0 && ' · '}
          <Link to={`/ko/learn/${l.slug}`}>{l.title}</Link>
        </span>
      ))}
    </p>
  )
}
```

- [ ] **Step 5: Add the route**

In `web/src/AppRoutes.tsx`, add `import KoStrategyPage from './routes/KoStrategyPage'` and, after the `/ko/learn/:slug` route:

```tsx
        <Route path="/ko/strategies/:id" element={<KoStrategyPage />} />
```

- [ ] **Step 6: Add the CSS**

In `web/src/index.css`, directly after the `[lang='ko'] :is(h1, …) { font-style: normal; }` rule:

```css
/* Korean strategy pages. The title is the English name, so it keeps the
   English page's italic; the Korean lede stands upright, and a Hangul
   syllable makes no drop cap. */
.strategy-page[lang='ko'] h1:lang(en) {
  font-style: italic;
}
.strategy-page[lang='ko'] .strategy-page__lede {
  font-style: normal;
}
.strategy-page[lang='ko'] .strategy-page__lede::first-letter {
  float: none;
  font: inherit;
  margin: 0;
  color: inherit;
}
.strategy-page__now h2 {
  font-family: var(--display);
  font-weight: 700;
  font-size: 28px;
  margin: 0 0 12px;
}
.strategy-page__now p {
  font-size: 16px;
  line-height: 1.6;
  max-width: 60ch;
  margin: 0 0 12px;
}
.strategy-page__now a {
  color: var(--red);
}
.strategy-page__disclaimer {
  font-size: 14px;
  color: var(--ink-soft);
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run src/routes.test.tsx src/routes/StrategyPage.test.tsx`
Expected: PASS, including the existing English strategy-page tests.

- [ ] **Step 8: Commit**

```bash
git add src/routes/strategyTitle.tsx src/routes/KoStrategyPage.tsx src/routes/StrategyPage.tsx src/AppRoutes.tsx src/routes.test.tsx src/index.css
git commit -m "Serve each strategy's rule in Korean, without a decision"
```

---

### Task 4: Link the English page to its Korean twin

**Files:**
- Modify: `web/src/routes/StrategyPage.tsx` (`PageMeta` and header)
- Test: `web/src/routes.test.tsx`

**Interfaces:**
- Consumes: `LangSwitch` from `components/LangSwitch`

- [ ] **Step 1: Write the failing test**

Add to `describe('Korean strategy pages', …)` in `routes.test.tsx`:

```tsx
  it('is linked from its English twin', () => {
    renderAt('/strategies/vaa')
    expect(screen.getByRole('link', { name: '한국어' })).toHaveAttribute('href', '/ko/strategies/vaa')
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/routes.test.tsx -t "is linked from its English twin"`
Expected: FAIL — no link named 한국어.

- [ ] **Step 3: Implement**

In `StrategyPage.tsx`, add `import LangSwitch from '../components/LangSwitch'`, give `PageMeta` the pair:

```tsx
      <PageMeta
        title={`${strategy.fullName} (${strategy.shortName})`}
        description={`${strategy.tagline}. How ${strategy.shortName} works, the paper behind it, and today's decision on live market data.`}
        path={`/strategies/${strategy.id}`}
        alternates={{ en: `/strategies/${strategy.id}`, ko: `/ko/strategies/${strategy.id}` }}
      />
```

and add the switch as the last child of the header:

```tsx
      <header className="strategy-page__head">
        <p className="strategy-page__tag">{dottedShort(strategy)}</p>
        <h1>{splitTitle(strategy.fullName)}</h1>
        <LangSwitch lang="ko" to={`/ko/strategies/${strategy.id}`} />
      </header>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/routes.test.tsx src/routes/StrategyPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/routes/StrategyPage.tsx src/routes.test.tsx
git commit -m "Offer the Korean explanation from each English strategy page"
```

---

### Task 5: List the six strategies on /ko/learn

**Files:**
- Modify: `web/src/routes/Learn.tsx` (Korean intro sentence; strategy list)
- Modify: `web/src/index.css` (one modifier after `.learn__number`)
- Test: `web/src/routes.test.tsx`

**Interfaces:**
- Consumes: `STRATEGIES` from `strategies.ts`, `STRATEGIES_KO` (Task 1)

- [ ] **Step 1: Write the failing tests**

Add to `describe('Korean strategy pages', …)`:

```tsx
  it('is listed on the Korean contents page', () => {
    const { container } = renderAt('/ko/learn')
    const list = container.querySelector('#strategies')
    expect(list).not.toBeNull()
    for (const s of STRATEGIES) {
      expect(list?.querySelector(`a[href="/ko/strategies/${s.id}"]`), s.id).not.toBeNull()
    }
  })

  it('no longer tells Korean readers the strategy pages are English only', () => {
    const { container } = renderAt('/ko/learn')
    expect(container.textContent).not.toMatch(/전략 페이지는 영어로 되어 있고/)
  })

  it('leaves the English contents page without a strategy list', () => {
    const { container } = renderAt('/learn')
    expect(container.querySelector('#strategies')).toBeNull()
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/routes.test.tsx -t "Korean strategy pages"`
Expected: FAIL on the two `/ko/learn` tests.

- [ ] **Step 3: Implement**

In `Learn.tsx`, add imports:

```tsx
import { STRATEGIES } from '../strategies'
import { STRATEGIES_KO } from '../strategies.ko'
```

Replace the first Korean `intro` paragraph with:

```ts
      'Monthly Rule은 켈러(Wouter Keller)와 공저자들이 논문으로 발표한 자산배분 규칙 여섯 가지를 실제 시장 가격으로 매달 계산해 보여주는 사이트입니다. 각 전략의 규칙은 아래 여섯 전략에서 한국어로 읽을 수 있습니다. 매달의 계산 결과(Today’s Decision)는 영어 전략 페이지에만 있고, 이 강의는 그 페이지를 읽는 데 필요한 내용을 한국어로 옮긴 것입니다.',
```

Insert between the closing `</ol>` of the lesson list and the `back-link` paragraph:

```tsx
      {lang === 'ko' && (
        <section id="strategies">
          <h2 className="section-title">여섯 전략</h2>
          <ul className="learn__list">
            {STRATEGIES.map((s) => (
              <li key={s.id}>
                <Link to={`/ko/strategies/${s.id}`} className="learn__item">
                  <span className="learn__number learn__number--short">{s.shortName}</span>
                  <span className="learn__body">
                    <span className="learn__title">{s.fullName}</span>
                    <span className="learn__summary">{STRATEGIES_KO[s.id].tagline}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
```

In `index.css`, after the `.learn__number { … }` rule:

```css
/* A three-letter strategy name in the slot a lesson number takes. */
.learn__number--short {
  font-size: 18px;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/routes.test.tsx`
Expected: PASS, including the existing "serves the Korean contents page in Korean" test.

- [ ] **Step 5: Commit**

```bash
git add src/routes/Learn.tsx src/routes.test.tsx src/index.css
git commit -m "List the six strategies in Korean on the Korean contents page"
```

---

### Task 6: Sitemap, prerender, spec correction, visual check

**Files:**
- Modify: `web/public/sitemap.xml`
- Modify: `web/src/sitemap.test.ts`
- Modify: `docs/superpowers/specs/2026-10-08-korean-strategy-pages-design.md` (the Korean-lessons bullet under "Links in and out")

- [ ] **Step 1: Write the failing test**

In `sitemap.test.ts`, add after `...LESSONS_KO.map((l) => `/ko/learn/${l.slug}`),`:

```ts
      ...STRATEGIES.map((s) => `/ko/strategies/${s.id}`),
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/sitemap.test.ts`
Expected: FAIL — six `/ko/strategies/…` entries missing.

- [ ] **Step 3: Add the URLs**

In `public/sitemap.xml`, after the last `/ko/learn/…` line:

```xml
  <url><loc>https://monthlyrule.com/ko/strategies/vaa</loc></url>
  <url><loc>https://monthlyrule.com/ko/strategies/daa</loc></url>
  <url><loc>https://monthlyrule.com/ko/strategies/paa</loc></url>
  <url><loc>https://monthlyrule.com/ko/strategies/haa</loc></url>
  <url><loc>https://monthlyrule.com/ko/strategies/baa</loc></url>
  <url><loc>https://monthlyrule.com/ko/strategies/laa</loc></url>
```

- [ ] **Step 4: Correct the spec**

In the spec, replace the bullet

```markdown
- **Korean lessons:** the one inline link to `/strategies/vaa`
  (`lessons/ko/RunningIt.tsx`) points to `/ko/strategies/vaa` instead.
```

with

```markdown
- **Korean lessons:** the one inline link to `/strategies/vaa`
  (`lessons/ko/RunningIt.tsx`) stays on the English page. Its sentence
  sends the reader to *Today's Decision*, which only the English page has.
```

- [ ] **Step 5: Full check and build**

Run: `npm test -- --run && npm run lint && npm run build`
Expected: all tests pass, lint clean, build ends with `prerendered 35 pages and 404.html`.

Then confirm the prerendered output:

```bash
for id in vaa daa paa haa baa laa; do
  f=dist/ko/strategies/$id/index.html
  echo "$id lang=$(grep -o '<html lang="[a-z]*"' $f) alternates=$(grep -o 'rel="alternate"' $f | wc -l | tr -d ' ') decision=$(grep -c 'decision-banner' $f)"
done
```

Expected for each: `lang=<html lang="ko"`, `alternates=3`, `decision=0`.

- [ ] **Step 6: Visual check**

Run `npx vite preview` and open `/ko/strategies/vaa`, `/ko/strategies/laa`, `/ko/learn#strategies` and `/strategies/vaa` at desktop width and at 375px. Check: the English `h1` is italic on the Korean page; the Korean lede has no drop cap and is upright; the body's three columns read well with `keep-all`; "VAA" fits its slot in the `/ko/learn` list; the 한국어/English switches sit under the titles.

- [ ] **Step 7: Commit**

```bash
git add public/sitemap.xml src/sitemap.test.ts ../docs/superpowers/specs/2026-10-08-korean-strategy-pages-design.md
git commit -m "Put the Korean strategy pages in the sitemap so they prerender"
```
