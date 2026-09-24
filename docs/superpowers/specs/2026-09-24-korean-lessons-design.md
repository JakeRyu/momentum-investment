# Korean Lessons — Design

Date: 2026-09-24
Scope: `web/` only. No backend or mobile changes.

## Background

Keller's strategies already have an audience in Korea. VAA, DAA and LAA
are known there as "동적자산배분" (dynamic asset allocation), mostly
through popular Korean books on the subject, and many Korean retail
investors buy US-listed ETFs directly through overseas-stock accounts.
The strategy universe needs no change for them.

The site is English only. The goal is a Korean entry point that lets that
audience find the site and work through the course, at the lowest
translation and maintenance cost that still reads naturally.

## Decisions already made

- **Path, not subdomain.** `monthlyrule.com/ko/...`, not
  `ko.monthlyrule.com`. The translation work is the same either way. A
  subdomain adds a second deployment, and search engines treat it as a
  separate new site.
- **Translate prose only.** Korean readers generally read English well.
  Navigation, footer, lesson chrome and figure labels stay in English.
  Only the text a reader has to *read* to follow the argument is
  translated.
- **Drop UK-specific material rather than adapt it (option B).** The
  UCITS/ISA passages are not translated. Rewriting them for Korean
  accounts and tax (overseas-stock accounts, capital gains tax, pension
  accounts) is a later, separate piece of work that needs its own fact
  checking.
- **Lessons only, no strategy pages.** Showing "today's decision" in
  Korean to the Korean public is closer to the line that Korean law draws
  around unregistered investment advice (유사투자자문업). The lessons are
  educational. Links from Korean lessons to strategy pages go to the
  English pages.
- **The Korean contents page is the entry point.** `/ko/learn` carries a
  short Korean introduction to the site and a Korean disclaimer. There is
  no separate `/ko` home page.

## What is translated

| Item | Translated |
|---|---|
| Lesson title and one-line summary (8 each) | Yes |
| Lesson bodies (8) | Yes, minus UK-specific passages (see below) |
| `/ko/learn` heading lede: site introduction + disclaimer | Yes (new text) |
| `<title>` / description for the 9 pages | Yes |
| Nav, footer, "Lesson N of M", pager arrows, "All lessons" | No |
| Figures (RecoveryAsymmetry, MomentumMeasures, CanaryGate, DecisionCalendar, BacktestFigure, StrategyComparison) | No — reused as is |
| Home, strategy pages, About, Privacy, 404 | No |

### UK-specific passages dropped

- **Lesson 5 (`WhatYouWouldBuy`):** the UCITS section and the
  `UcitsSubstitutes` table. In their place, a short factual passage.
  Korean brokers sell US-listed ETFs through overseas-stock accounts, so
  a Korean reader buys **the exact funds the strategies name**, with no
  substitutes. That is a better position than the UK reader's, and the
  passage can say so. Nothing about tax.
- **Lesson 7 (`ChoosingOne`):** the "sixteen UCITS substitutes" sentence.
  The explanation of why the site shows no returns column (a UK company
  publishing returns is a financial promotion) stays. It describes the
  site, not the reader.
- **Lesson 8 (`RunningIt`):** the sentence about switching every asset to
  a local UCITS alternative.

## Structure

### Files

- `web/src/lessons/ko/*.tsx`: eight Korean lesson bodies, same file
  names as the English ones.
- `web/src/lessons/ko/index.ts` exports `LESSONS_KO: readonly Lesson[]`.
  It uses the same `Lesson` type and the **same slugs in the same order**
  as `LESSONS`.
- The Korean bodies import the shared figure components directly, as the
  English ones do.

### Routes

`AppRoutes.tsx` adds:

```
/ko/learn         → <Learn lang="ko" />
/ko/learn/:slug   → <Lesson lang="ko" />
```

`Learn` and `Lesson` take a `lang: 'en' | 'ko'` prop (default `'en'`).
From it they pick the lesson list (`LESSONS` or `LESSONS_KO`) and the
link prefix (`''` or `'/ko'`). Every in-course link (rail, pager, contents
list, "All lessons") uses the prefix. The Korean `Learn` swaps in the
Korean heading and lede. Everything else renders identically.

Slugs stay English, so `/learn/x` and `/ko/learn/x` pair 1:1.

### Language switch

A small text link on the contents page and on each lesson page. It reads
"한국어" on English pages and "English" on Korean pages, and points to
the same page in the other language. It sits in the page itself, not in
the site nav. Nav stays untouched.

### SEO

- **Sitemap:** add the 9 `/ko` URLs to `public/sitemap.xml`. Prerendering
  follows the sitemap, so the pages get static HTML with no further
  change.
- **hreflang:** `PageMeta` gains an optional `alternates` prop. The 18
  paired pages (9 English, 9 Korean) each emit
  `<link rel="alternate" hreflang="en|ko|x-default" href="…">`. English
  is `x-default`. Unpaired pages emit nothing new.
- **Canonical:** each Korean page is canonical to itself, not to its
  English twin.
- **`<html lang>`:** `scripts/prerender.mjs` writes `lang="ko"` into the
  template for `/ko/...` paths. On the client, a small effect in the
  Korean `Learn`/`Lesson` sets `document.documentElement.lang` and
  restores it on unmount, so client-side navigation stays correct too.
- **Naver:** after deploy, register the site with Naver Search Advisor
  and submit the sitemap. This is a manual step outside the code.

### Typography

Source Serif 4 and IBM Plex Mono have no Hangul glyphs. Under `:lang(ko)`
only:

- append **Noto Serif KR** (Google Fonts) to `--body` and `--display`.
  It is Adobe's Source Han Serif under Google's name, drawn as the CJK
  companion to Source Serif, which the site already uses, so Latin and
  Hangul share one design. It is also the Google serif a major Korean
  paper uses: JoongAng sets its opinion and feature headlines in it. Load
  weights 400 and 700 only, with `display=swap`, and only on `/ko` pages.
  Google serves Korean in `unicode-range` slices, so a page downloads
  only the glyphs it uses.
- Korean news sites set body text in sans (Noto Sans KR, Pretendard).
  The site's identity is a serif newspaper, so it stays serif. If
  on-screen review finds serif Hangul body text hard to read on phones,
  Noto Sans KR for `--body` only is the fallback.
- `word-break: keep-all`, so lines do not break mid-word.
- if lesson bodies are justified, switch to left-aligned. Korean
  justified text spaces badly.

English pages are unaffected.

## Translation approach

1. **Glossary first**, agreed before any lesson is translated. Examples:
   momentum → 모멘텀, drawdown → 낙폭 (with MDD on first use),
   canary → 카나리아, breadth → 시장 폭(breadth), rebalance → 리밸런싱.
   Keep tickers and strategy names (VAA, DAA …) in English.
2. **Register:** "-합니다" form, as terse as the English. No added
   explanation beyond the source.
3. Claude drafts, the user reviews **one lesson at a time**. A lesson
   ships only after its review.

## Testing

- `lessons/ko/index.test.ts`: `LESSONS_KO` slugs equal `LESSONS` slugs,
  in order, with the same numbers. Adding a lesson to one side only fails.
- `sitemap.test.ts`: the expected list includes `/ko/learn` and
  `/ko/learn/<slug>` for every Korean lesson.
- Route tests: `/ko/learn/<slug>` renders the Korean title, rail and
  pager links point under `/ko/learn/`, and an unknown Korean slug renders
  NotFound.
- `PageMeta`: a paired page emits the three hreflang links. An unpaired
  page emits none.
- Prerender: build and check that `dist/ko/learn/<slug>/index.html`
  exists with `lang="ko"` and the Korean title in `<head>`.
- Manual: read each Korean page on a phone width and a desktop width in
  the browser (font fallback, line breaks).

## Out of scope

- Korean strategy pages, Home, About, Privacy.
- Korean account, tax and domestic-ETF content (option A, later).
- Translating figures or site chrome.
- An i18n library. Two languages across nine pages do not need one.
- Automatic language detection or redirects.

## Open items

- The Korean disclaimer wording on `/ko/learn`. It is drafted with the
  intro and reviewed by the user.
