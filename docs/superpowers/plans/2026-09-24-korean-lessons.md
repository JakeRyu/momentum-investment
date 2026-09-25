# Korean Lessons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve the eight lessons and the course contents page in Korean at `/ko/learn` and `/ko/learn/<slug>`. Translate prose only; site chrome and figures stay in English.

**Architecture:** A second lesson catalog, `LESSONS_KO`, mirrors `LESSONS` slug for slug. A `COURSES` map chooses the catalog and the URL prefix by language. The existing `Learn` and `Lesson` routes take a `lang` prop, so the Korean pages reuse them. Korean pages carry `lang="ko"` on their `<article>`. They also render a `KoreanHead` component, which loads Noto Serif KR and sets `<html lang>`. Prerendering follows the sitemap, so each Korean URL is added there.

**Tech Stack:** React 19, react-router-dom 7, Vite, Vitest + Testing Library (jsdom), Google Fonts.

**Spec:** `docs/superpowers/specs/2026-09-24-korean-lessons-design.md`

## Global Constraints

- URLs: `/ko/learn` and `/ko/learn/<slug>`. Slugs are identical to the English ones.
- Translate only: lesson title, summary and body; the Korean contents page heading, lede, intro and disclaimer; the `<title>` and description of those 9 pages.
- Never translate: nav, footer, "Lesson N of M", "N lessons", pager arrows, "All lessons", "Compare the six", figure components and their labels, and any page outside `/ko/learn…`.
- Drop UK-specific passages: the UCITS section and `UcitsSubstitutes` in lesson 5, the "sixteen UCITS substitutes" sentence in lesson 7, and the local-UCITS sentence in lesson 8. Lesson 5 gets a short factual passage instead: Korean brokers sell US-listed ETFs through overseas-stock accounts, so Korean readers buy the exact funds named, with no substitutes. **No tax content anywhere.**
- Links from Korean lessons to strategy pages point at the English pages (`/strategies/<id>`).
- Korean canonical URL = the Korean page itself. English is `x-default`.
- Font: Noto Serif KR, weights 400 and 700, `display=swap`, loaded only on `/ko` pages:
  `https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&display=swap`
- Register: "-합니다" form, as terse as the English. Add no explanation that is not in the source.
- Tickers and strategy names (VAA, DAA, SPY …) stay in Latin script.
- Every Korean lesson is reviewed by the user before its commit (spec: "A lesson ships only after its review").
- No i18n library. No automatic language detection or redirects.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- All commands run from `web/`.

## Review Focus

1. **Direct load of a Korean URL on the deployed site.** The page must be prerendered with `lang="ko"`, the Korean title and the font link in `<head>`, not a 404. This is covered by the prerender check in Task 11.
2. **Moving between languages client-side.** English lesson → "한국어" → back to English must leave `<html lang>` correct each time. Covered by the `KoreanHead` cleanup test in Task 2.
3. **A Korean slug that does not exist** (`/ko/learn/nope`) must render NotFound, not a Korean page with no body. Covered by a route test in Task 2.
4. **Hangul in italic-styled elements** (h2, lede, contents titles, pager). Browsers fake an italic with a slant, which looks broken. Covered by a CSS rule in Task 2 and the manual check in Task 11.
5. **A lesson added later to one language only.** The language switch must not link to a missing page, and the parity test must fail. Covered by the switch-hiding test in Task 2 and the parity test in Task 11.

---

## File Structure

| File | Responsibility |
|---|---|
| `web/src/lessons/ko/GLOSSARY.md` (create) | Agreed term list for translators |
| `web/src/lessons/ko/index.ts` (create) | `LESSONS_KO` catalog |
| `web/src/lessons/ko/*.tsx` (create, 8) | Korean lesson bodies |
| `web/src/lessons/courses.ts` (create) | `Lang`, `COURSES`, `findCourseLesson`, `otherLang` |
| `web/src/lessons/courses.test.ts` (create) | Catalog lookup and parity tests |
| `web/src/components/KoreanHead.tsx` (create) | Font stylesheet + `<html lang>` effect |
| `web/src/components/LangSwitch.tsx` (create) | "한국어" / "English" link |
| `web/src/components/PageMeta.tsx` (modify) | `alternates` → hreflang links |
| `web/src/components/PageMeta.test.tsx` (create) | hreflang tests |
| `web/src/routes/Learn.tsx`, `Lesson.tsx` (modify) | `lang` prop |
| `web/src/AppRoutes.tsx` (modify) | `/ko/learn` routes |
| `web/src/routes.test.tsx` (modify) | Korean route tests |
| `web/src/sitemap.test.ts`, `web/public/sitemap.xml` (modify) | Korean URLs |
| `web/scripts/prerender.mjs` (modify) | `lang="ko"` in template for `/ko/` |
| `web/src/index.css` (modify) | `[lang='ko']` typography |
| `AGENTS.md` (modify) | Mention `/ko/learn` |

---

### Task 1: Glossary

**Files:**
- Create: `web/src/lessons/ko/GLOSSARY.md`

**Interfaces:** Produces the term list that Tasks 3–10 follow.

- [ ] **Step 1: Collect the terms.** Read all eight files in `web/src/lessons/*.tsx`. List every technical term, recurring phrase and defined term (text inside `.lesson__define` blocks, `<strong>` and `<em>`).

- [ ] **Step 2: Write the glossary.** Use this format and seed it with the spec's examples. Add every term found in Step 1.

```markdown
# 한국어 레슨 용어집

번역 전에 합의한 용어. 레슨 번역은 이 표를 따른다. 표에 없는 용어가
나오면 번역하기 전에 여기에 먼저 추가하고 사용자 확인을 받는다.

| English | 한국어 | 비고 |
|---|---|---|
| momentum | 모멘텀 | |
| drawdown | 낙폭 | 첫 등장 시 "낙폭(MDD)" |
| maximum drawdown | 최대 낙폭(MDD) | |
| canary / canary universe | 카나리아 / 카나리아 자산군 | |
| breadth | 시장 폭(breadth) | 첫 등장 시 원어 병기, 이후 "시장 폭" |
| rebalance | 리밸런싱 | |
| buy and hold | 매수 후 보유 | |
| tactical asset allocation | 전술적 자산배분 | |
| offensive / defensive (universe) | 공격 / 방어 (자산군) | |
| month-end close | 월말 종가 | |
| ETF | ETF | |
```

- [ ] **Step 3: User review.** Show the table and ask the user to approve or change it. Do not start Task 3 until they approve.

- [ ] **Step 4: Commit**

```bash
git add src/lessons/ko/GLOSSARY.md
git commit -m "Agree the Korean terms before translating the lessons

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Korean course scaffolding

Builds everything except the lesson bodies. `LESSONS_KO` starts empty, so `/ko/learn` renders the Korean intro over an empty list, and every `/ko/learn/<slug>` is NotFound until its lesson task lands. This branch is not merged before Task 11, so nothing half-built ships.

**Files:**
- Create: `src/lessons/ko/index.ts`, `src/lessons/courses.ts`, `src/lessons/courses.test.ts`, `src/components/KoreanHead.tsx`, `src/components/LangSwitch.tsx`, `src/components/PageMeta.test.tsx`
- Modify: `src/components/PageMeta.tsx`, `src/routes/Learn.tsx`, `src/routes/Lesson.tsx`, `src/AppRoutes.tsx`, `src/routes.test.tsx`, `src/sitemap.test.ts`, `public/sitemap.xml`, `scripts/prerender.mjs`, `src/index.css`

**Interfaces:**
- Produces:
  - `src/lessons/ko/index.ts`: `export const LESSONS_KO: readonly Lesson[]`
  - `src/lessons/courses.ts`: `export type Lang = 'en' | 'ko'`; `export const COURSES: Record<Lang, { lessons: readonly Lesson[]; prefix: '' | '/ko' }>`; `export function findCourseLesson(lang: Lang, slug: string): Lesson | undefined`; `export function otherLang(lang: Lang): Lang`
  - `PageMeta` prop `alternates?: { en: string; ko: string }` (paths, not full URLs)
  - `<Learn lang?: Lang />`, `<Lesson lang?: Lang />` (default `'en'`)
  - `<KoreanHead />`, `<LangSwitch lang: Lang; to: string />`

- [ ] **Step 1: Write the failing catalog tests**

`src/lessons/courses.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { COURSES, findCourseLesson, otherLang } from './courses'
import { LESSONS } from './index'

describe('courses', () => {
  it('serves English with no prefix and Korean under /ko', () => {
    expect(COURSES.en.prefix).toBe('')
    expect(COURSES.ko.prefix).toBe('/ko')
    expect(COURSES.en.lessons).toBe(LESSONS)
  })

  it('finds a lesson only in its own language', () => {
    expect(findCourseLesson('en', LESSONS[0].slug)).toBe(LESSONS[0])
    expect(findCourseLesson('ko', 'what-is-a-stock')).toBeUndefined()
  })

  it('swaps languages', () => {
    expect(otherLang('en')).toBe('ko')
    expect(otherLang('ko')).toBe('en')
  })

  it('gives Korean lessons the slug and number of their English twin', () => {
    // A Korean lesson may lag behind its English one, never diverge from it.
    for (const ko of COURSES.ko.lessons) {
      const en = findCourseLesson('en', ko.slug)
      expect(en, ko.slug).toBeDefined()
      expect(ko.number, ko.slug).toBe(en!.number)
    }
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lessons/courses.test.ts`
Expected: FAIL, `Cannot find module './courses'`

- [ ] **Step 3: Create the catalogs**

`src/lessons/ko/index.ts`:

```ts
import type { Lesson } from '../index'

/**
 * The course in Korean, served at /ko/learn. Same slugs and numbers as
 * LESSONS, so /learn/x and /ko/learn/x are one lesson in two languages.
 * Only the prose is translated; see GLOSSARY.md for the agreed terms.
 */
export const LESSONS_KO: readonly Lesson[] = []
```

`src/lessons/courses.ts`:

```ts
import type { Lesson } from './index'
import { LESSONS } from './index'
import { LESSONS_KO } from './ko'

export type Lang = 'en' | 'ko'

/** Which catalog a language reads, and where its pages live. */
export const COURSES: Record<Lang, { lessons: readonly Lesson[]; prefix: '' | '/ko' }> = {
  en: { lessons: LESSONS, prefix: '' },
  ko: { lessons: LESSONS_KO, prefix: '/ko' },
}

export function findCourseLesson(lang: Lang, slug: string): Lesson | undefined {
  return COURSES[lang].lessons.find((l) => l.slug === slug)
}

export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? 'ko' : 'en'
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/lessons/courses.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Write the failing PageMeta test**

`src/components/PageMeta.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import PageMeta from './PageMeta'

function hreflangs(container: HTMLElement) {
  return [...document.querySelectorAll('link[rel="alternate"]'), ...container.querySelectorAll('link[rel="alternate"]')]
    .map((l) => `${l.getAttribute('hreflang')} ${l.getAttribute('href')}`)
}

describe('PageMeta', () => {
  it('links a paired page to both languages, English as default', () => {
    const { container } = render(
      <PageMeta
        title="Learn"
        description="d"
        path="/ko/learn"
        alternates={{ en: '/learn', ko: '/ko/learn' }}
      />,
    )
    expect(new Set(hreflangs(container))).toEqual(
      new Set([
        'en https://monthlyrule.com/learn',
        'ko https://monthlyrule.com/ko/learn',
        'x-default https://monthlyrule.com/learn',
      ]),
    )
  })

  it('adds no language links to a page with no twin', () => {
    const { container } = render(<PageMeta title="About" description="d" path="/about" />)
    expect(hreflangs(container)).toEqual([])
  })
})
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run src/components/PageMeta.test.tsx`
Expected: the first test FAILS (no alternate links rendered). The second passes.

- [ ] **Step 7: Add `alternates` to PageMeta**

In `src/components/PageMeta.tsx`, extend `Props` and render the links after `og:url`:

```tsx
  /** For pages that exist in both languages: each twin's path. */
  alternates?: { en: string; ko: string }
```

```tsx
export default function PageMeta({ title, description, path, noindex, alternates }: Props) {
```

```tsx
      <meta property="og:url" content={ORIGIN + path} />
      {alternates && (
        <>
          <link rel="alternate" hrefLang="en" href={ORIGIN + alternates.en} />
          <link rel="alternate" hrefLang="ko" href={ORIGIN + alternates.ko} />
          <link rel="alternate" hrefLang="x-default" href={ORIGIN + alternates.en} />
        </>
      )}
      {noindex && <meta name="robots" content="noindex" />}
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx vitest run src/components/PageMeta.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 9: Create KoreanHead and LangSwitch**

`src/components/KoreanHead.tsx`:

```tsx
import { useEffect } from 'react'

const FONT =
  'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&display=swap'

/**
 * What a Korean page needs beyond its text. Noto Serif KR is Source Han
 * Serif, drawn as Source Serif's companion, so Latin and Hangul match;
 * React hoists the stylesheet into <head>, and the prerender keeps it
 * there. The build writes lang="ko" into a prerendered page's <html>;
 * this effect keeps it right when the reader arrives by a client-side link.
 */
export default function KoreanHead() {
  useEffect(() => {
    const html = document.documentElement
    const previous = html.lang
    html.lang = 'ko'
    return () => {
      html.lang = previous
    }
  }, [])
  return <link rel="stylesheet" href={FONT} precedence="default" />
}
```

`src/components/LangSwitch.tsx`:

```tsx
import { Link } from 'react-router-dom'

import type { Lang } from '../lessons/courses'

/** Names the other language in that language, as language menus do. */
const LABEL: Record<Lang, string> = { en: 'English', ko: '한국어' }

type Props = {
  /** The language the link leads to. */
  lang: Lang
  to: string
}

export default function LangSwitch({ lang, to }: Props) {
  return (
    <p className="lang-switch">
      <Link to={to} hrefLang={lang} lang={lang}>
        {LABEL[lang]}
      </Link>
    </p>
  )
}
```

- [ ] **Step 10: Write the failing route tests**

In `src/routes.test.tsx`, add the Korean routes to `renderAt`, directly after the `/learn/:slug` line:

```tsx
        <Route path="/ko/learn" element={<Learn lang="ko" />} />
        <Route path="/ko/learn/:slug" element={<Lesson lang="ko" />} />
```

Add imports:

```tsx
import { LESSONS_KO } from './lessons/ko'
import KoreanHead from './components/KoreanHead'
```

Append at the end of the file:

```tsx
describe('Korean course', () => {
  it('serves the Korean contents page in Korean', () => {
    const { container } = renderAt('/ko/learn')
    expect(container.querySelector('.not-found')).toBeNull()
    expect(container.querySelector('article')).toHaveAttribute('lang', 'ko')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('동적자산배분 강의')
  })

  it('links the contents pages to each other', () => {
    renderAt('/learn')
    expect(screen.getByRole('link', { name: '한국어' })).toHaveAttribute('href', '/ko/learn')
    cleanup()
    renderAt('/ko/learn')
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute('href', '/learn')
  })

  it('does not invent a Korean lesson that does not exist', () => {
    const { container } = renderAt('/ko/learn/what-is-a-stock')
    expect(container.querySelector('.not-found')).not.toBeNull()
  })

  it('offers no Korean link on an English lesson with no Korean twin', () => {
    const untranslated = LESSONS.find(
      (l) => !LESSONS_KO.some((k) => k.slug === l.slug),
    )
    if (!untranslated) return // every lesson is translated
    renderAt(`/learn/${untranslated.slug}`)
    expect(screen.queryByRole('link', { name: '한국어' })).toBeNull()
  })

  it.each(LESSONS_KO.map((l) => l.slug))('serves /ko/learn/%s in Korean', (slug) => {
    const { container } = renderAt(`/ko/learn/${slug}`)
    expect(container.querySelector('.not-found')).toBeNull()
    expect(container.querySelector('article')).toHaveAttribute('lang', 'ko')
    // Rail and pager stay inside the Korean course.
    for (const a of container.querySelectorAll('.lesson__rail a, .lesson__pager a[href*="/learn/"]')) {
      expect(a.getAttribute('href'), a.textContent ?? '').toMatch(/^\/ko\/learn\//)
    }
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute('href', `/learn/${slug}`)
  })
})

describe('KoreanHead', () => {
  it('marks the document Korean while mounted and restores it after', () => {
    document.documentElement.lang = 'en'
    const { unmount } = render(<KoreanHead />)
    expect(document.documentElement.lang).toBe('ko')
    unmount()
    expect(document.documentElement.lang).toBe('en')
  })
})
```

Add `cleanup` to the `@testing-library/react` import: `import { cleanup, render, screen } from '@testing-library/react'`.

- [ ] **Step 11: Run them to verify they fail**

Run: `npx vitest run src/routes.test.tsx`
Expected: the Korean contents tests FAIL (no `lang` attribute, no Korean heading, no switch link). The KoreanHead test passes. The `it.each` is empty for now.

- [ ] **Step 12: Make `Learn` language-aware**

Replace `src/routes/Learn.tsx` with:

```tsx
import { Link } from 'react-router-dom'

import KoreanHead from '../components/KoreanHead'
import LangSwitch from '../components/LangSwitch'
import PageMeta from '../components/PageMeta'
import { COURSES, otherLang, type Lang } from '../lessons/courses'

/**
 * Course contents. The site's reference pages let you look one thing up;
 * this is the part that assumes you arrived knowing nothing and puts the
 * pieces in an order.
 *
 * The Korean page is also the Korean reader's way in, so it says what the
 * site is and carries the disclaimer the English footer gives.
 */
const COPY: Record<Lang, { title: string; heading: string; description: string; lede: string; intro?: string[] }> = {
  en: {
    title: 'Learn',
    heading: 'Learn',
    description:
      'A short course on tactical asset allocation from no background at all: why these rules exist, what they measure, and what you would actually buy.',
    lede: 'Start from no background at all. By the end you should be able to open any strategy page and know what it is telling you to do, and why.',
  },
  ko: {
    title: '동적자산배분 강의',
    heading: '동적자산배분 강의',
    description:
      'VAA, DAA 같은 켈러(Keller)의 동적자산배분 전략을 배경지식 없이 배우는 짧은 강의. 규칙이 왜 있는지, 무엇을 재는지, 실제로 무엇을 사게 되는지.',
    lede: '배경지식 없이 시작합니다. 끝까지 읽으면 어느 전략 페이지를 열어도 그 페이지가 무엇을 하라고 하는지, 왜 그런지 알 수 있습니다.',
    intro: [
      'Monthly Rule은 켈러(Wouter Keller)와 공저자들이 논문으로 발표한 자산배분 규칙 여섯 가지를 실제 시장 가격으로 매달 계산해 보여주는 사이트입니다. 전략 페이지는 영어로 되어 있고, 이 강의는 그 페이지를 읽는 데 필요한 내용을 한국어로 옮긴 것입니다.',
      '이 사이트는 교육용 자료이며 투자 자문이 아닙니다. 과거 성과는 미래 수익을 보장하지 않으며, 투자 판단과 그 결과에 대한 책임은 투자자 본인에게 있습니다.',
    ],
  },
}

export default function Learn({ lang = 'en' }: { lang?: Lang }) {
  const { lessons, prefix } = COURSES[lang]
  const other = otherLang(lang)
  const copy = COPY[lang]

  return (
    <article className="learn" lang={lang}>
      <PageMeta
        title={copy.title}
        description={copy.description}
        path={`${prefix}/learn`}
        alternates={{ en: '/learn', ko: '/ko/learn' }}
      />
      {lang === 'ko' && <KoreanHead />}
      <header>
        <p className="learn__eyebrow">{lessons.length} lessons</p>
        <h1>{copy.heading}</h1>
        <p className="learn__lede">{copy.lede}</p>
        {copy.intro?.map((p) => (
          <p key={p} className="learn__intro">
            {p}
          </p>
        ))}
        <LangSwitch lang={other} to={`${COURSES[other].prefix}/learn`} />
      </header>

      <ol className="learn__list">
        {lessons.map((l) => (
          <li key={l.slug}>
            <Link to={`${prefix}/learn/${l.slug}`} className="learn__item">
              <span className="learn__number">{l.number}</span>
              <span className="learn__body">
                <span className="learn__title">{l.title}</span>
                <span className="learn__summary">{l.summary}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <p className="back-link">
        <Link to="/">← The six strategies</Link>
      </p>
    </article>
  )
}
```

Note: the English `<article>` also gets `lang="en"`. That is harmless and makes each page state its own language.

- [ ] **Step 13: Make `Lesson` language-aware**

In `src/routes/Lesson.tsx`:

Replace the imports and the lookup:

```tsx
import { Link, useParams } from 'react-router-dom'

import KoreanHead from '../components/KoreanHead'
import LangSwitch from '../components/LangSwitch'
import PageMeta from '../components/PageMeta'
import { COURSES, findCourseLesson, otherLang, type Lang } from '../lessons/courses'

import NotFound from './NotFound'
```

```tsx
export default function Lesson({ lang = 'en' }: { lang?: Lang }) {
  const { slug } = useParams<{ slug: string }>()
  const lesson = slug ? findCourseLesson(lang, slug) : undefined

  if (!lesson) return <NotFound />

  const { lessons, prefix } = COURSES[lang]
  const other = otherLang(lang)
  // Only a lesson that exists in both languages is paired or switchable.
  const twin = findCourseLesson(other, lesson.slug)
  const index = lessons.indexOf(lesson)
  const previous = lessons[index - 1]
  const next = lessons[index + 1]
  const { Body } = lesson
```

In the JSX, change:
- `<article className="lesson">` → `<article className="lesson" lang={lang}>`
- the `PageMeta`:

```tsx
      <PageMeta
        title={lesson.title}
        description={lesson.summary}
        path={`${prefix}/learn/${lesson.slug}`}
        alternates={
          twin
            ? { en: `/learn/${lesson.slug}`, ko: `/ko/learn/${lesson.slug}` }
            : undefined
        }
      />
      {lang === 'ko' && <KoreanHead />}
```

- `{LESSONS.map((l) => (` → `{lessons.map((l) => (`
- `<Link to={`/learn/${l.slug}`}` (rail) → `<Link to={`${prefix}/learn/${l.slug}`}`
- `Lesson {lesson.number} of {LESSONS.length}` → `Lesson {lesson.number} of {lessons.length}`
- after `<h1>{lesson.title}</h1>` add:

```tsx
          {twin && (
            <LangSwitch lang={other} to={`${COURSES[other].prefix}/learn/${lesson.slug}`} />
          )}
```

- pager: `` `/learn/${previous.slug}` `` → `` `${prefix}/learn/${previous.slug}` `` and the same for `next`
- `<Link to="/learn">← All lessons</Link>` → `` <Link to={`${prefix}/learn`}>← All lessons</Link> ``

- [ ] **Step 14: Add the routes**

In `src/AppRoutes.tsx`, after `<Route path="/learn/:slug" element={<Lesson />} />`:

```tsx
        <Route path="/ko/learn" element={<Learn lang="ko" />} />
        <Route path="/ko/learn/:slug" element={<Lesson lang="ko" />} />
```

- [ ] **Step 15: Run the route tests to verify they pass**

Run: `npx vitest run src/routes.test.tsx`
Expected: PASS. "offers no Korean link on an English lesson with no Korean twin" runs its assertion, because no lesson is translated yet.

- [ ] **Step 16: Put `/ko/learn` in the sitemap test, then the sitemap**

In `src/sitemap.test.ts`, import `LESSONS_KO` (`import { LESSONS_KO } from './lessons/ko'`) and extend `expected`, after the English lesson line:

```ts
      '/ko/learn',
      ...LESSONS_KO.map((l) => `/ko/learn/${l.slug}`),
```

Run: `npx vitest run src/sitemap.test.ts`
Expected: FAIL (`/ko/learn` missing)

In `public/sitemap.xml`, after the `running-it` line:

```xml
  <url><loc>https://monthlyrule.com/ko/learn</loc></url>
```

Run: `npx vitest run src/sitemap.test.ts`
Expected: PASS

- [ ] **Step 17: Prerender `/ko` pages with `lang="ko"`**

In `scripts/prerender.mjs`, add a marker next to `TITLE` and `ROOT`:

```js
const HTML = '<html lang="en">'
```

Include it in the check loop: `for (const marker of [TITLE, ROOT, HTML]) {`

In `page(url)`, change the return to:

```js
  const lang = url.startsWith('/ko/') ? 'ko' : 'en'
  return template
    .replace(HTML, `<html lang="${lang}">`)
    .replace(TITLE, head)
    .replace(ROOT, `<div id="root">${html.slice(head.length)}</div>`)
```

The HEAD regex already accepts `<link … />`, and React emits the hoisted stylesheet first (checked: `<link rel="stylesheet" href="…" data-precedence="default"/><title>…`), so the font link lands in `<head>`.

- [ ] **Step 18: Korean typography**

Append to `src/index.css`:

```css
/* Korean pages. Noto Serif KR (loaded by KoreanHead) follows the Latin
   face, so Latin text keeps Source Serif and Hangul falls through to its
   companion. Hangul has no true italic — browsers slant it, which reads
   as broken — so the italic display styles stand upright here. keep-all
   stops a line breaking inside a Korean word. */
[lang='ko'] {
  --display: "Source Serif 4", "Noto Serif KR", "Tiempos Headline", "Times New Roman", Georgia, serif;
  --body: "Source Serif 4", "Noto Serif KR", "Tiempos Text", Georgia, "Times New Roman", serif;
  font-family: var(--body);
  word-break: keep-all;
}
[lang='ko'] :is(h1, .lesson__body h2, .learn__lede, .learn__title, .lesson__pager, .lesson__body em) {
  font-style: normal;
}

.learn__intro {
  font-size: 16px;
  line-height: 1.6;
  max-width: 58ch;
  margin: 0 0 16px;
  color: var(--ink-soft);
}

.lang-switch {
  font-family: var(--mono);
  font-size: 12px;
  margin: 0 0 24px;
}
.lang-switch a {
  color: var(--red);
}
```

Before appending, check the exact fallback lists of `--display` and `--body` at the top of `src/index.css` (lines 11–13), and copy them after `"Noto Serif KR"` so nothing is lost.

- [ ] **Step 19: Run the whole suite and the linter**

Run: `npm test && npm run lint`
Expected: all tests pass, and there are no lint errors.

- [ ] **Step 20: Commit**

```bash
git add -A src public scripts
git commit -m "Serve a Korean course at /ko/learn, ready for its lessons

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Translation procedure (used by Tasks 3–10)

Every lesson task repeats these rules. They are written out here once, and each task restates the steps it needs.

- Copy the English file's JSX structure exactly: same elements, same `className`s, same figure components with the same props, same `<Link>` targets. Only the text nodes change.
- Replace HTML entities with Korean punctuation. `&rsquo;` goes away (Korean has no apostrophe contractions). Quotation marks become `‘ ’` / `“ ”`. Keep em dashes (`—`) where the sentence structure needs them.
- Drop `{' '}` spacers only where the Korean sentence no longer needs a space before the next element.
- Follow `GLOSSARY.md`. If a term is missing, add it to the glossary first and flag it in the review.
- The file's doc comment stays in English (code comments are exempt from translation) and starts with `Korean text of lesson N — see ../<File>.tsx.`
- Export the component under the same name as the English one.

---

### Task 3: Lesson 1 — `why-not-buy-and-hold`

**Files:**
- Create: `src/lessons/ko/WhyNotBuyAndHold.tsx`
- Modify: `src/lessons/ko/index.ts`, `public/sitemap.xml`

**Interfaces:** Consumes `LESSONS_KO` (Task 2) and `GLOSSARY.md` (Task 1). Produces the catalog entry `{ slug: 'why-not-buy-and-hold', number: 1, … }`.

- [ ] **Step 1: Translate.** Read `src/lessons/WhyNotBuyAndHold.tsx` and write `src/lessons/ko/WhyNotBuyAndHold.tsx` by the translation procedure. It keeps `<RecoveryAsymmetry />` imported from `'../../components/RecoveryAsymmetry'`.
- [ ] **Step 2: Register it.** In `src/lessons/ko/index.ts`, import it and add the entry. Title and summary are translated from `LESSONS[0]` (`'Why not just buy and hold?'` / `'Index funds work. The catch is how far they fall, and what that costs to recover.'`).

```ts
import WhyNotBuyAndHold from './WhyNotBuyAndHold'

export const LESSONS_KO: readonly Lesson[] = [
  {
    slug: 'why-not-buy-and-hold',
    number: 1,
    title: '그냥 사서 들고 있으면 안 될까?',
    summary: '인덱스 펀드는 통합니다. 문제는 얼마나 깊이 떨어지는지, 그리고 회복하는 데 무엇이 드는지입니다.',
    Body: WhyNotBuyAndHold,
  },
]
```

- [ ] **Step 3: Add to the sitemap.** In `public/sitemap.xml`, after the `/ko/learn` line: `<url><loc>https://monthlyrule.com/ko/learn/why-not-buy-and-hold</loc></url>`
- [ ] **Step 4: Run the tests.** Run: `npm test`. Expected: PASS, including the new `serves /ko/learn/why-not-buy-and-hold in Korean` case and the sitemap test.
- [ ] **Step 5: User review.** Run `npm run dev` yourself only if the user asks. Otherwise give the user the command and the URL `http://localhost:5173/ko/learn/why-not-buy-and-hold`, and show the translated text side by side with the English. Apply their changes. Do not commit before they approve.
- [ ] **Step 6: Commit**

```bash
git add src/lessons/ko public/sitemap.xml
git commit -m "Translate lesson 1 into Korean

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Lesson 2 — `what-momentum-is`

**Files:**
- Create: `src/lessons/ko/WhatMomentumIs.tsx`
- Modify: `src/lessons/ko/index.ts`, `public/sitemap.xml`

**Interfaces:** Consumes `LESSONS_KO` and `GLOSSARY.md`. Produces the catalog entry `{ slug: 'what-momentum-is', number: 2, … }`.

- [ ] **Step 1: Translate.** Read `src/lessons/WhatMomentumIs.tsx` and write `src/lessons/ko/WhatMomentumIs.tsx` by the translation procedure. It keeps `<MomentumMeasures />` imported from `'../../components/MomentumMeasures'`.
- [ ] **Step 2: Register it.** Import it in `src/lessons/ko/index.ts` and append this entry after lesson 1. The title and summary are translated from `'What momentum actually is'` / `'A measured tendency in prices that have already moved — not a forecast.'`.

```ts
  {
    slug: 'what-momentum-is',
    number: 2,
    title: '모멘텀이란 무엇인가',
    summary: '이미 움직인 가격에서 측정되는 경향입니다. 예측이 아닙니다.',
    Body: WhatMomentumIs,
  },
```

- [ ] **Step 3: Add to the sitemap.** After the lesson 1 Korean line: `<url><loc>https://monthlyrule.com/ko/learn/what-momentum-is</loc></url>`
- [ ] **Step 4: Run the tests.** Run: `npm test`. Expected: PASS.
- [ ] **Step 5: User review.** Give the user the dev command and `http://localhost:5173/ko/learn/what-momentum-is`, and show the translation side by side with the English. Apply their changes. Do not commit before they approve.
- [ ] **Step 6: Commit**

```bash
git add src/lessons/ko public/sitemap.xml
git commit -m "Translate lesson 2 into Korean

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Lesson 3 — `what-breadth-adds`

**Files:**
- Create: `src/lessons/ko/WhatBreadthAdds.tsx`
- Modify: `src/lessons/ko/index.ts`, `public/sitemap.xml`

**Interfaces:** Consumes `LESSONS_KO` and `GLOSSARY.md`. Produces the catalog entry `{ slug: 'what-breadth-adds', number: 3, … }`.

- [ ] **Step 1: Translate.** Read `src/lessons/WhatBreadthAdds.tsx` and write `src/lessons/ko/WhatBreadthAdds.tsx` by the translation procedure. It keeps `<CanaryGate />` imported from `'../../components/CanaryGate'`.
- [ ] **Step 2: Register it.** Import it and append this entry. It is translated from `'What breadth adds'` / `'Counting how many assets are rising, and the small basket that can overrule the rest.'`.

```ts
  {
    slug: 'what-breadth-adds',
    number: 3,
    title: '시장 폭이 더해 주는 것',
    summary: '오르는 자산이 몇 개인지 세는 일, 그리고 나머지를 모두 뒤집을 수 있는 작은 바구니.',
    Body: WhatBreadthAdds,
  },
```

- [ ] **Step 3: Add to the sitemap.** `<url><loc>https://monthlyrule.com/ko/learn/what-breadth-adds</loc></url>` after lesson 2's Korean line.
- [ ] **Step 4: Run the tests.** Run: `npm test`. Expected: PASS.
- [ ] **Step 5: User review.** Give the user the dev command and `http://localhost:5173/ko/learn/what-breadth-adds`, and show the translation side by side with the English. Apply their changes. Do not commit before they approve.
- [ ] **Step 6: Commit**

```bash
git add src/lessons/ko public/sitemap.xml
git commit -m "Translate lesson 3 into Korean

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Lesson 4 — `one-signal-a-month`

**Files:**
- Create: `src/lessons/ko/OneSignalAMonth.tsx`
- Modify: `src/lessons/ko/index.ts`, `public/sitemap.xml`

**Interfaces:** Consumes `LESSONS_KO` and `GLOSSARY.md`. Produces the catalog entry `{ slug: 'one-signal-a-month', number: 4, … }`.

- [ ] **Step 1: Translate.** Read `src/lessons/OneSignalAMonth.tsx` and write `src/lessons/ko/OneSignalAMonth.tsx` by the translation procedure. It keeps `<DecisionCalendar />` imported from `'../../components/DecisionCalendar'`.
- [ ] **Step 2: Register it.** Import it and append this entry. It is translated from `'One signal a month'` / `'When the decision happens, why it holds all month, and what to do if you are late.'`.

```ts
  {
    slug: 'one-signal-a-month',
    number: 4,
    title: '한 달에 신호 하나',
    summary: '결정은 언제 나오는지, 왜 한 달 내내 유지되는지, 늦었을 때는 어떻게 하는지.',
    Body: OneSignalAMonth,
  },
```

- [ ] **Step 3: Add to the sitemap.** `<url><loc>https://monthlyrule.com/ko/learn/one-signal-a-month</loc></url>` after lesson 3's Korean line.
- [ ] **Step 4: Run the tests.** Run: `npm test`. Expected: PASS.
- [ ] **Step 5: User review.** Give the user the dev command and `http://localhost:5173/ko/learn/one-signal-a-month`, and show the translation side by side with the English. Apply their changes. Do not commit before they approve.
- [ ] **Step 6: Commit**

```bash
git add src/lessons/ko public/sitemap.xml
git commit -m "Translate lesson 4 into Korean

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Lesson 5 — `what-you-would-buy` (UK section replaced)

**Files:**
- Create: `src/lessons/ko/WhatYouWouldBuy.tsx`
- Modify: `src/lessons/ko/index.ts`, `public/sitemap.xml`

**Interfaces:** Consumes `LESSONS_KO` and `GLOSSARY.md`. Produces the catalog entry `{ slug: 'what-you-would-buy', number: 5, … }`.

- [ ] **Step 1: Translate everything before the UCITS section.** Read `src/lessons/WhatYouWouldBuy.tsx`. Translate every part except the passage starting at "all US-listed. A European or UK broker generally cannot sell them" (around line 73) through the `<UcitsSubstitutes />` table and the "Every asset these six strategies use has a UCITS substitute" paragraph (around line 88). **Do not import `UcitsSubstitutes`.**
- [ ] **Step 2: Write the replacement passage.** In place of the dropped section, under a Korean `<h2>` that matches the dropped section's heading level, put:

```tsx
      <p>
        이 전략들이 쓰는 ETF는 모두 미국에 상장되어 있습니다. 한국 증권사의
        해외주식 계좌에서는 미국 상장 ETF를 직접 살 수 있으므로, 한국
        독자는 전략이 지목한 바로 그 펀드를 대체 상품 없이 그대로 삽니다.
        미국 밖의 투자자 대부분은 그렇지 못합니다. 예컨대 영국 독자는 같은
        지수를 따르는 현지 펀드로 바꿔 사야 합니다.
      </p>
```

  No tax, fee or account-type content. If the section before it names specific tickers in a sentence that sets up the UCITS problem, end that sentence where the fact ends.
- [ ] **Step 3: Register it.** Import it and append this entry. The summary drops the UK clause of `'The ticker, the fund behind it, what it costs, and what UK readers buy instead.'`.

```ts
  {
    slug: 'what-you-would-buy',
    number: 5,
    title: '실제로 무엇을 사게 되나',
    summary: '티커, 그 뒤의 펀드, 그리고 드는 비용.',
    Body: WhatYouWouldBuy,
  },
```

- [ ] **Step 4: Add to the sitemap.** `<url><loc>https://monthlyrule.com/ko/learn/what-you-would-buy</loc></url>` after lesson 4's Korean line.
- [ ] **Step 5: Add a guard test.** Append to the `describe('Korean course'` block in `src/routes.test.tsx`:

```tsx
  it('tells Korean readers they buy the named funds, with no UCITS detour', () => {
    const { container } = renderAt('/ko/learn/what-you-would-buy')
    expect(container.textContent).not.toMatch(/UCITS|ISA/)
    expect(container.textContent).toMatch(/해외주식 계좌/)
  })
```

- [ ] **Step 6: Run the tests.** Run: `npm test`. Expected: PASS.
- [ ] **Step 7: User review.** Give the user the dev command and `http://localhost:5173/ko/learn/what-you-would-buy`. Show the translation side by side with the English, and call out the replaced passage specifically. Apply their changes. Do not commit before they approve.
- [ ] **Step 8: Commit**

```bash
git add src/lessons/ko src/routes.test.tsx public/sitemap.xml
git commit -m "Translate lesson 5 into Korean, where the named funds need no substitute

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Lesson 6 — `why-drawdown`

**Files:**
- Create: `src/lessons/ko/WhyDrawdown.tsx`
- Modify: `src/lessons/ko/index.ts`, `public/sitemap.xml`

**Interfaces:** Consumes `LESSONS_KO` and `GLOSSARY.md`. Produces the catalog entry `{ slug: 'why-drawdown', number: 6, … }`.

- [ ] **Step 1: Translate.** Read `src/lessons/WhyDrawdown.tsx` and write `src/lessons/ko/WhyDrawdown.tsx` by the translation procedure. It keeps `<BacktestFigure />` (same props) imported from `'../../components/BacktestFigure'`. Numbers quoted from the papers are copied exactly, not rounded.
- [ ] **Step 2: Register it.** Import it and append this entry. It is translated from `'Drawdown — why these strategies exist'` / `'The target the authors set, the figures they published, and the cases where it did not hold.'`.

```ts
  {
    slug: 'why-drawdown',
    number: 6,
    title: '낙폭 — 이 전략들이 존재하는 이유',
    summary: '저자들이 세운 목표, 그들이 발표한 수치, 그리고 그것이 지켜지지 않은 경우.',
    Body: WhyDrawdown,
  },
```

- [ ] **Step 3: Add to the sitemap.** `<url><loc>https://monthlyrule.com/ko/learn/why-drawdown</loc></url>` after lesson 5's Korean line.
- [ ] **Step 4: Run the tests.** Run: `npm test`. Expected: PASS.
- [ ] **Step 5: User review.** Give the user the dev command and `http://localhost:5173/ko/learn/why-drawdown`, and show the translation side by side with the English. Apply their changes. Do not commit before they approve.
- [ ] **Step 6: Commit**

```bash
git add src/lessons/ko public/sitemap.xml
git commit -m "Translate lesson 6 into Korean

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Lesson 7 — `choosing-one` (UCITS sentence dropped)

**Files:**
- Create: `src/lessons/ko/ChoosingOne.tsx`
- Modify: `src/lessons/ko/index.ts`, `public/sitemap.xml`, `src/routes.test.tsx`

**Interfaces:** Consumes `LESSONS_KO` and `GLOSSARY.md`. Produces the catalog entry `{ slug: 'choosing-one', number: 7, … }`.

- [ ] **Step 1: Translate.** Read `src/lessons/ChoosingOne.tsx` and write `src/lessons/ko/ChoosingOne.tsx` by the translation procedure. It keeps `<StrategyComparison />` imported from `'../../components/StrategyComparison'`. **Keep** the passage on why the site shows no returns column (around line 24: a UK company publishing returns is a financial promotion), translated. **Drop** the "If you are outside the US, that is also sixteen UCITS substitutes" sentence (around line 53). If the paragraph still reads whole without it, end there. If not, rejoin the remaining sentences.
- [ ] **Step 2: Register it.** Import it and append this entry. It is translated from `'Choosing one'` / `'The six side by side, on facts rather than ratings — and the question underneath the table.'`.

```ts
  {
    slug: 'choosing-one',
    number: 7,
    title: '하나 고르기',
    summary: '여섯 전략을 평점이 아닌 사실로 나란히 놓고, 그 표 아래에 있는 질문을 봅니다.',
    Body: ChoosingOne,
  },
```

- [ ] **Step 3: Add to the sitemap.** `<url><loc>https://monthlyrule.com/ko/learn/choosing-one</loc></url>` after lesson 6's Korean line.
- [ ] **Step 4: Add a guard test** to the `describe('Korean course'` block:

```tsx
  it('drops the UCITS count from lesson 7', () => {
    const { container } = renderAt('/ko/learn/choosing-one')
    expect(container.querySelector('.lesson__body')?.textContent).not.toMatch(/UCITS/)
  })
```

  This checks `.lesson__body` only. The shared `StrategyComparison` figure is English and out of scope.
- [ ] **Step 5: Run the tests.** Run: `npm test`. Expected: PASS. If the test fails because `StrategyComparison` itself renders "UCITS" inside `.lesson__body`, narrow the assertion to the `<p>` elements that are direct children of `.lesson__body`, and tell the user.
- [ ] **Step 6: User review.** Give the user the dev command and `http://localhost:5173/ko/learn/choosing-one`, and show the translation side by side with the English. Apply their changes. Do not commit before they approve.
- [ ] **Step 7: Commit**

```bash
git add src/lessons/ko src/routes.test.tsx public/sitemap.xml
git commit -m "Translate lesson 7 into Korean

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Lesson 8 — `running-it` (UCITS sentence dropped)

**Files:**
- Create: `src/lessons/ko/RunningIt.tsx`
- Modify: `src/lessons/ko/index.ts`, `public/sitemap.xml`, `src/routes.test.tsx`

**Interfaces:** Consumes `LESSONS_KO` and `GLOSSARY.md`. Produces the catalog entry `{ slug: 'running-it', number: 8, … }`. This completes the catalog.

- [ ] **Step 1: Translate.** Read `src/lessons/RunningIt.tsx` and write `src/lessons/ko/RunningIt.tsx` by the translation procedure. `<Link to="/strategies/vaa">` stays pointing at the English strategy page, and the `APP_STORE_CTA` / `APP_STORE_URL` imports come from `'../../appStore'`. Keep the "This Site" / app step labels (`.lesson__steps-label`) in English, because they name UI. **Drop** the sentence about switching every asset to a local UCITS alternative for readers outside the US (around line 103).
- [ ] **Step 2: Register it.** Import it and append this entry. It is translated from `'Running it'` / `'What the first day looks like, what each month looks like, and where the site stops.'`.

```ts
  {
    slug: 'running-it',
    number: 8,
    title: '실제로 운용하기',
    summary: '첫날은 어떤 모습인지, 매달은 어떤 모습인지, 그리고 사이트가 어디까지 해 주는지.',
    Body: RunningIt,
  },
```

- [ ] **Step 3: Add to the sitemap.** `<url><loc>https://monthlyrule.com/ko/learn/running-it</loc></url>` after lesson 7's Korean line.
- [ ] **Step 4: Add a guard test** to the `describe('Korean course'` block:

```tsx
  it('sends the Korean reader to the English strategy page, without a UCITS detour', () => {
    const { container } = renderAt('/ko/learn/running-it')
    expect(container.querySelector('.lesson__body a[href="/strategies/vaa"]')).not.toBeNull()
    expect(container.querySelector('.lesson__body')?.textContent).not.toMatch(/UCITS/)
  })
```

- [ ] **Step 5: Run the tests.** Run: `npm test`. Expected: PASS.
- [ ] **Step 6: User review.** Give the user the dev command and `http://localhost:5173/ko/learn/running-it`, and show the translation side by side with the English. Apply their changes. Do not commit before they approve.
- [ ] **Step 7: Commit**

```bash
git add src/lessons/ko src/routes.test.tsx public/sitemap.xml
git commit -m "Translate lesson 8 into Korean

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Parity, build check, docs, PR

**Files:**
- Modify: `src/lessons/courses.test.ts`, `AGENTS.md`

- [ ] **Step 1: Write the parity test.** Now that all eight exist, append to `src/lessons/courses.test.ts`:

```ts
  it('translates every lesson, in the same order', () => {
    expect(COURSES.ko.lessons.map((l) => l.slug)).toEqual(LESSONS.map((l) => l.slug))
  })
```

- [ ] **Step 2: Run it.** Run: `npx vitest run src/lessons/courses.test.ts`. Expected: PASS. Also check that it would fail: temporarily comment out one entry in `src/lessons/ko/index.ts`, run it, see FAIL, then restore the entry.

- [ ] **Step 3: Build and check the prerender**

Run:

```bash
npm run build && \
grep -o '<html lang="ko">' dist/ko/learn/running-it/index.html && \
grep -o '<title>[^<]*</title>' dist/ko/learn/running-it/index.html && \
grep -o 'Noto+Serif+KR[^"]*' dist/ko/learn/running-it/index.html && \
grep -o 'hreflang="ko"[^>]*' dist/learn/running-it/index.html && \
grep -o '<html lang="en">' dist/learn/running-it/index.html
```

Expected: the build prints `prerendered 27 pages and 404.html`. Each grep prints one match: `lang="ko"`, `<title>실제로 운용하기 — Monthly Rule</title>`, the font URL, the Korean hreflang on the English page, and `lang="en"` on the English page. Check that the font `<link>` sits inside `<head>`, not in `#root`: `grep -c 'Noto+Serif+KR' dist/learn/index.html` must print `0`.

- [ ] **Step 4: Manual check in the browser.** Give the user `npm run preview`, or run it in the background only if they ask ([[feedback_dev_server_manual]]). Then check with them, at 375px and at desktop width, on `/ko/learn`, lesson 1, lesson 5 and lesson 8:
  - Hangul renders in Noto Serif KR (not a system gothic), upright, with no mid-word line breaks
  - the "한국어" / "English" switch goes to the matching page, and back
  - the Learn nav item and the footer are unchanged
  - if serif body text is hard to read on a phone, apply the spec's fallback: in the `[lang='ko']` block, set `--body` to `"Noto Sans KR", sans-serif` and add `family=Noto+Sans+KR:wght@400;700` to `KoreanHead`'s URL, after the user agrees

- [ ] **Step 5: Update AGENTS.md.** In the web section (around line 198), change the routes sentence to add the Korean routes, and add one sentence after the lessons sentence:

```markdown
react-router routes: `/`, `/strategies/:id`, `/learn`, `/learn/:slug`,
`/ko/learn`, `/ko/learn/:slug`, `/about`, `/privacy`.
```

```markdown
The Korean course (`src/lessons/ko/`, `LESSONS_KO`) translates lesson prose
only. Chrome and figures stay English, and `lessons/courses.test.ts` fails
if it drifts from `LESSONS`. Terms are fixed in `src/lessons/ko/GLOSSARY.md`.
```

- [ ] **Step 6: Run everything.** Run: `npm test && npm run lint`. Expected: PASS.

- [ ] **Step 7: Commit and open the PR**

```bash
git add src/lessons/courses.test.ts ../AGENTS.md
git commit -m "Require the Korean course to keep pace with the English one

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin korean-lessons
gh pr create --title "Teach the course in Korean" --body "$(cat <<'EOF'
Adds /ko/learn and the eight lessons in Korean. Prose only; nav, figures and strategy pages stay English. UK-only passages (UCITS/ISA) are dropped; lesson 5 instead says Korean readers buy the named US ETFs directly.

Spec: docs/superpowers/specs/2026-09-24-korean-lessons-design.md

After deploy: register monthlyrule.com with Naver Search Advisor and submit the sitemap.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
