# Phase 4 Stage 3 — The course scaffold, and lessons 1–4

**Goal:** Give the site the sequence it lacks: `/learn` as a contents page and `/learn/:slug` as numbered lessons, with the first four written.

**Spec:** [2026-09-13-phase-4-learn-course-design.md](../specs/2026-09-13-phase-4-learn-course-design.md)

**Why now:** stages 1 and 2 made the site's facts honest and its comparison legible, but a reader with no background still arrives at a table of six acronyms with nothing in front of it. The course is the thing that was missing.

## Global constraints

- **Mobile URLs are immutable.** `/`, `/strategies/{vaa,daa,paa,haa,baa,laa}`, `/privacy`. The app's only exit for a confused reader runs through them; `routes.test.tsx` pins all eight and must keep passing.
- **`/` must still answer "what are these six"** above the fold — the app's link is labelled *"How these strategies work"*. The course entrance goes below the comparison, not above it.
- **No forward-looking claims.** Backtest figures reach the page only through `BacktestFigure`.
- **Design system fixed.** Palette and faces unchanged. Heading tiers per `DESIGN.md`: section titles in display serif, giant mono caps reserved for the decision banner.

## Content source

Prose written in phase 3 lives only on the unpushed `feat/web-funnel` branch. It is carried across here, not rewritten:

| Lesson | Source |
|---|---|
| 2 — What momentum actually is | `About.tsx` §1 ¶1 |
| 3 — What breadth adds | `About.tsx` §1 ¶2–3 (including the coal-mine canary) |
| 4 — One signal a month | `Home.tsx` cycle section, both paragraphs |

Lesson 1 is new. After this stage, `feat/web-funnel` holds nothing unique and can be deleted.

## File structure

```
web/src/lessons/index.ts          LESSONS metadata + findLesson
web/src/lessons/*.tsx             one component per lesson body
web/src/routes/Learn.tsx          contents page
web/src/routes/Lesson.tsx         one lesson, with rail and prev/next
```

Lesson bodies are components rather than strings: they carry lists, emphasis and links, and JSX keeps that readable without inventing a markup format.

## Tasks

### Task 1 — Routes, metadata, and the teaching register

- [ ] `lessons/index.ts`: `Lesson = { slug, number, title, summary, Body }`, `LESSONS`, `findLesson(slug)`.
- [ ] `Learn.tsx` lists every lesson as a numbered link; `Lesson.tsx` renders one, 404s on an unknown slug.
- [ ] Wire both into `main.tsx` **without touching the four pinned route patterns**.
- [ ] Teaching register CSS, written against this real markup: single column ~65ch, `column-count`/`justify` released, numbered chapter marker, left progress rail.
- [ ] Tests: every slug resolves; unknown slug renders NotFound; `/learn` links to all lessons; the eight pinned URLs still resolve.

### Task 2 — Lessons 1–4

- [ ] 1. *Why not just buy and hold?* — new. Opens on the S&P 500's −50.8%, names the problem the papers solve.
- [ ] 2. *What momentum actually is* — carried from About.
- [ ] 3. *What breadth adds* — carried from About, canary metaphor intact.
- [ ] 4. *One signal a month* — carried from Home.
- [ ] Tests: each lesson renders its distinguishing sentence; no lesson body states a forward-looking claim.

### Task 3 — Entrances

- [ ] Home gains a course entrance **below** the comparison.
- [ ] Lesson 4 hands off to the strategy pages; `/learn` links back to `/`.
- [ ] Verify in a browser at 1280px and 390px.

## Done when

- `npm test` and `dotnet test` green, lint and build clean.
- All eight app-linked URLs resolve.
- `/learn` and four lessons render at both widths.
- Nothing unique remains on `feat/web-funnel`.

## Out of scope

Lessons 5–8 and the landing restructure (stage 4). The HAA and BAA reconciliations (their own releases).
