# Phase 4 Stage 4 — Lessons 5–8, and the ticker a beginner meets first

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the course — the four remaining lessons — and close the gap the whole phase was named for: the site prints `SHY`, 100% of the portfolio, without ever saying what that is.

**Architecture:** Four new lesson bodies under `web/src/lessons/`, registered in the existing `LESSONS` array; no new routes, no new components except where a lesson needs markup that does not exist yet. Lesson 7 renders the shipped `StrategyComparison` rather than a second presentation of the same data. The drawdown range in lesson 6 is derived from `STRATEGIES` so it cannot drift from the figures the papers pinned.

**Tech Stack:** React 19, react-router-dom 7, TypeScript, Vite, Vitest + Testing Library.

**Spec:** [2026-09-13-phase-4-learn-course-design.md](../specs/2026-09-13-phase-4-learn-course-design.md)

**Follows:** [stage 3](2026-09-13-phase-4-stage-3-learn-course.md), which built `/learn`, `/learn/:slug` and lessons 1–4.

---

## Global Constraints

- **Mobile URLs are immutable.** `/`, `/strategies/{vaa,daa,paa,haa,baa,laa}`, `/privacy`. `routes.test.tsx` pins all eight and must keep passing. No new route patterns.
- **`/` must still answer "what are these six"** above the fold — the app's link is labelled *"How these strategies work"*.
- **No forward-looking claims.** The existing test asserts no lesson body matches `/will (?:return|earn|beat|grow|rise)|guarantee|is expected to return/i`. Every new lesson is covered by it automatically.
- **Backtest figures reach the page only through `BacktestFigure`** — except figures that belong to a *benchmark* rather than a strategy (the S&P 500's 50.8%, 60/40's 29.4–29.5%), which carry their period, the word backtest and the month-end qualifier in the sentence itself, exactly as lesson 1 already does.
- **Copy rule.** Allowed: *"The papers set out to keep the worst fall under 20%. In the published backtests of the variants this site runs, the worst month-end fall ranged X% to Y%, against 50.8% for holding the S&P 500 over the same decades."* Forbidden: any sentence where the site — rather than a cited paper — predicts a future drawdown, return, or ceiling.
- **Design system fixed.** Palette and faces unchanged. No new colors, no new typefaces, no rounded corners, no shadows. Heading tiers per `DESIGN.md`: section titles in display serif; giant mono caps reserved for the decision banner; mono micro-caps 10–11px for labels.

## Decisions taken (2026-09-13)

These resolve open points in the spec and override it where noted.

1. **All six backtest figures are publishable.** The spec withholds BAA and blocks HAA on the 13612W/13612U divergence. Commit `935dea6` reconciled both, and `strategies.ts` now carries a `backtest` for all six. The spec's "*(withheld)*" row and open question 2 are historical.
2. **Home gains no live decision hook in this stage.** The spec's IA puts "today's live decision" between the comparison and the course entrance. Deferred to its own stage — it is a data-fetching feature, not course content.
3. **Lesson 7 reuses `StrategyComparison`.** The spec's "needs a new presentation" was written against phase 3's rejected row layout, which stage 2 replaced. One presentation, two call sites.
4. **Lesson 5's UK content is hand-written in `web/`.** The full UCITS mapping lives in `mobile/src/etfCatalog.ts`; importing across the package boundary would pre-empt the unresolved question of where the canonical universe should live. The lesson names three representative substitutes and sends readers to the app for the rest.

## File structure

| File | Responsibility |
|---|---|
| `web/src/lessons/WhatYouWouldBuy.tsx` | Lesson 5 body — ticker → fund → broker, incl. UK UCITS note |
| `web/src/lessons/WhyDrawdown.tsx` | Lesson 6 body — design intent, verified figures, honest limits |
| `web/src/lessons/ChoosingOne.tsx` | Lesson 7 body — frames and renders `StrategyComparison` |
| `web/src/lessons/RunningIt.tsx` | Lesson 8 body — hand-off to the tool and the app |
| `web/src/lessons/index.ts` | Registers the four; `LESSONS` becomes length 8 |
| `web/src/strategies.ts` | Gains `drawdownRange()` — min/max across published figures |
| `web/src/routes/Learn.tsx` | Lesson count stops being hard-coded prose |
| `web/src/routes/Home.tsx` | Course-entrance copy stops claiming "Four" |
| `web/src/components/AllocationsBlock.tsx` | The allocated ticker gains its plain-English gloss |
| `web/src/components/StrategyComparison.tsx` | Doc comment corrected — nothing is withheld any more |
| `web/src/routes/About.tsx` | *(Task 7, optional)* Stops defining terms lesson 3 defines |
| `web/src/index.css` | Definition block, lesson figure spacing, allocation gloss |
| `DESIGN.md` | Gains the "Teaching register" section the spec asks for |

---

## Task 1: Stop the lesson count drifting

`Learn.tsx` says "Four short lessons" and `Home.tsx` says "Four short lessons on…". Both go stale the moment lesson 5 lands. The count moves to a mono micro-label — the site's existing idiom for a number — and out of the prose.

**Files:**
- Modify: `web/src/routes/Learn.tsx:14-21`
- Modify: `web/src/routes/Home.tsx:25-33`
- Test: `web/src/routes.test.tsx`

**Interfaces:**
- Consumes: `LESSONS` from `web/src/lessons` (existing).
- Produces: nothing new. Later tasks add to `LESSONS` without touching copy.

- [ ] **Step 1: Write the failing test**

Add to `web/src/routes.test.tsx`, inside the existing `describe('the course', …)` block:

```tsx
  it('does not hard-code how many lessons there are', () => {
    const { container: learn } = renderAt('/learn')
    expect(learn.textContent).not.toMatch(/\b(one|two|three|four|five|six|seven|eight)\s+(short\s+)?lessons\b/i)

    const { container: home } = renderAt('/')
    expect(home.textContent).not.toMatch(/\b(one|two|three|four|five|six|seven|eight)\s+(short\s+)?lessons\b/i)
  })

  it('states the lesson count from the catalog', () => {
    renderAt('/learn')
    expect(screen.getByText(`${LESSONS.length} lessons`)).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `cd web && npx vitest run src/routes.test.tsx`
Expected: FAIL — both tests. The first matches "Four short lessons" in each page; the second finds no `4 lessons` text.

- [ ] **Step 3: Make the change**

In `web/src/routes/Learn.tsx`, replace the header block:

```tsx
      <header>
        <p className="learn__eyebrow">{LESSONS.length} lessons</p>
        <h1>Learn</h1>
        <p className="learn__lede">
          Start from no background at all. By the end you should be able to
          open any strategy page and know what it is telling you to do, and
          why.
        </p>
      </header>
```

In `web/src/routes/Home.tsx`, replace the `learn-entry` body paragraph:

```tsx
        <p className="learn-entry__body">
          A short course on why these rules exist, what they measure, and
          what you would actually buy — starting from no background at all.
        </p>
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `cd web && npx vitest run src/routes.test.tsx`
Expected: PASS, including the eight pinned-URL tests.

- [ ] **Step 5: Commit**

```bash
git add web/src/routes/Learn.tsx web/src/routes/Home.tsx web/src/routes.test.tsx
git commit -m "refactor(web): take the lesson count out of the prose

The course grows by four in this stage and two pages claimed 'Four short
lessons' in body copy. The number moves to the mono micro-label, where a
numeral belongs in this design system, and comes from LESSONS.length."
```

---

## Task 2: Lesson 5 — What you would actually buy

The gap the site has never filled. A beginner reads `SHY · 100%` and has no way to find out what that is, whether they can buy it, or what to do about it from the UK.

**Files:**
- Create: `web/src/lessons/WhatYouWouldBuy.tsx`
- Modify: `web/src/lessons/index.ts`
- Modify: `web/src/index.css` (definition block)
- Modify: `DESIGN.md` (teaching register section)
- Test: `web/src/routes.test.tsx`

**Interfaces:**
- Consumes: `describeTicker(ticker: string): string | undefined` from `web/src/etfDescriptions`.
- Produces: lesson slug `what-you-would-buy`, number 5. CSS class `lesson__define` available to later lessons.

- [ ] **Step 1: Write the failing test**

Add to `web/src/routes.test.tsx`, inside `describe('the course', …)`:

```tsx
  it('tells the reader what SHY is', () => {
    const { container } = renderAt('/learn/what-you-would-buy')
    expect(container.textContent).toMatch(/SHY/)
    expect(container.textContent).toMatch(/1–3 year US Treasuries/)
  })

  it('names UCITS substitutes for UK readers', () => {
    const { container } = renderAt('/learn/what-you-would-buy')
    expect(container.textContent).toMatch(/UCITS/)
    expect(container.textContent).toMatch(/CSPX\.L/)
  })
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `cd web && npx vitest run src/routes.test.tsx`
Expected: FAIL — `/learn/what-you-would-buy` renders `NotFound`, so none of the text is present.

- [ ] **Step 3: Write the lesson body**

Create `web/src/lessons/WhatYouWouldBuy.tsx`:

```tsx
import { describeTicker } from '../etfDescriptions'

/**
 * Lesson 5. New copy — the gap this site has carried since it launched.
 *
 * The walked example pulls its one-liner from `etfDescriptions.ts`, the
 * same source the decision tool's score rows use, so the lesson and the
 * tool cannot describe the same ticker two different ways.
 *
 * The UK substitutes are hand-written rather than imported from the
 * mobile catalog: `mobile/src/etfCatalog.ts` is a different package, and
 * where the canonical universe should live is an open question. Three
 * representative pairs make the point; the app carries the full mapping.
 */
export default function WhatYouWouldBuy() {
  return (
    <>
      <p>
        Every strategy on this site ends the month by naming something like{' '}
        <strong>SHY</strong> and a percentage. That is the whole output. So
        it is worth being plain about what the thing on the left actually
        is, because the site has been assuming you knew.
      </p>

      <p className="lesson__define">
        <strong>Ticker.</strong> A short code that identifies one fund on
        one exchange — like a postcode, not a description. Two funds
        holding nearly the same thing have different tickers, and the same
        fund listed in two countries has two.
      </p>

      <p className="lesson__define">
        <strong>ETF.</strong> Exchange-traded fund. A single holding that
        owns a basket of other things on your behalf, and that you buy and
        sell during the day like a share. Every asset these six strategies
        allocate to is one.
      </p>

      <p>
        So <strong>SHY</strong> is an ETF, and what it holds is{' '}
        {describeTicker('SHY')} — government debt due back within three
        years. That is why the strategies reach for it when
        the signal turns: it is the corner of the portfolio least likely to
        move much in either direction. When the site says{' '}
        <em>SHY · 100%</em>, it is saying &ldquo;hold nothing but that,
        this month.&rdquo;
      </p>

      <p>
        Buying it is unremarkable. You open a brokerage account, search the
        ticker, and place an order the same way you would for a share.
        There is no minimum beyond the price of one unit, and nothing about
        it is reserved for professionals.
      </p>

      <h2>Two costs worth knowing</h2>

      <p>
        The fund charges an annual fee, taken out of the price rather than
        billed to you — a few hundredths of a percent for the ETFs these
        strategies use. And each trade costs you the broker&rsquo;s
        commission plus the spread, the small gap between the buying and
        selling price. Neither is large, but both are why a rule that
        trades once a month is cheaper to run than one that reacts to the
        news.
      </p>

      <h2>If you are outside the US</h2>

      <p>
        The tickers on this site are the ones in the papers, and they are
        all US-listed. A European or UK broker generally cannot sell them
        to a retail client — not because of the strategy, but because those
        funds do not publish the disclosure document EU and UK rules
        require. What you buy instead is a{' '}
        <strong>UCITS</strong> fund: a European-domiciled ETF, usually
        tracking the same index, listed in London.
      </p>

      <p>
        The substitution is per asset, and it is rarely exact. Three of the
        common ones:
      </p>

      <ul>
        <li>
          <strong>SPY</strong> → <strong>CSPX.L</strong> — both track the
          S&amp;P 500.
        </li>
        <li>
          <strong>IEF</strong> → <strong>IDTM.L</strong> — both hold 7–10
          year US Treasuries.
        </li>
        <li>
          <strong>SHY</strong> → <strong>IBTS.L</strong> — both hold short
          US Treasuries, though the maturity bands differ slightly.
        </li>
      </ul>

      <p>
        Some have no clean equivalent at all, and choosing between the near
        misses is a judgement rather than a lookup. The iPhone app carries
        a full mapping for all six strategies with the trade-offs written
        out per asset, and lets you override any of them. Check anything
        you pick against your own broker before you rely on it — listings
        change, and this site is not tracking yours.
      </p>
    </>
  )
}
```

- [ ] **Step 4: Register it**

In `web/src/lessons/index.ts`, add the import beside the others (alphabetical, matching the existing block):

```ts
import WhatYouWouldBuy from './WhatYouWouldBuy';
```

and append to `LESSONS` after the `one-signal-a-month` entry:

```ts
  {
    slug: 'what-you-would-buy',
    number: 5,
    title: 'What you would actually buy',
    summary:
      'The ticker, the fund behind it, what it costs, and what UK readers buy instead.',
    Body: WhatYouWouldBuy,
  },
```

- [ ] **Step 5: Add the definition-block style**

In `web/src/index.css`, inside the `/* ─── Teaching register (Learn + Lesson) ─── */` section, after the `.lesson__body strong` rule:

```css
/* Definition block. A term the reader has not met yet, set off by the
   red rule rather than a new color or a box — DESIGN.md allows no
   rounded corners and no shadows, so the accent does the work. */
.lesson__define {
  border-left: 3px solid var(--red);
  padding-left: 16px;
  margin: 22px 0;
}
.lesson__define strong {
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  display: block;
  margin-bottom: 4px;
  color: var(--red);
}

/* Lesson sub-heads. Tier below .section-title: these sit inside a
   reading column, so they mark a turn in the argument without
   competing with the lesson's own h1. */
.lesson__body h2 {
  font-family: var(--display);
  font-style: italic;
  font-weight: 700;
  font-size: 26px;
  letter-spacing: -0.5px;
  margin: 38px 0 12px;
}

.lesson__body ul {
  margin: 18px 0;
  padding-left: 22px;
}
.lesson__body li {
  margin-bottom: 8px;
}
```

- [ ] **Step 6: Document the register in DESIGN.md**

In `DESIGN.md`, insert a new section immediately before `## Out of scope (this design phase)`:

```markdown
## Teaching register

The newspaper setting — three justified columns, dense rules, a drop-cap
lede — is built for scanning a reference page. The course is built for
reading in sequence, so `/learn` and `/learn/:slug` use a second register
inside the same system. Same palette, same faces, nothing new.

| Element | Treatment |
|---|---|
| **Reading column** | Single column, ~65ch. `column-count` and `text-align: justify` released. |
| **Lesson title** (`h1`) | Display serif italic, one tier below the strategy hero. |
| **Sub-head** (`.lesson__body h2`) | Display serif italic, 26px. Marks a turn in the argument inside the column. |
| **Chapter marker** (`.lesson__marker`) | Mono micro-caps — "Lesson 5 of 8". |
| **Progress rail** (`.lesson__rail`) | Left column, every lesson listed, current one in `--red`. Knowing how far along you are is most of what stops a beginner abandoning a sequence. |
| **Definition block** (`.lesson__define`) | 3px `--red` left rule, term in mono caps above the sentence. For a word the reader has not met yet. |

The rail and the marker are the only furniture. No progress bars, no
percentages, no badges.
```

- [ ] **Step 7: Run the tests and make sure they pass**

Run: `cd web && npx vitest run`
Expected: PASS. The lesson-catalog tests still pass (numbering has no gap), and `Lesson 5 of 5` now renders on the last lesson.

- [ ] **Step 8: Commit**

```bash
git add web/src/lessons/WhatYouWouldBuy.tsx web/src/lessons/index.ts web/src/index.css web/src/routes.test.tsx DESIGN.md
git commit -m "feat(web): lesson 5 — what you would actually buy

The site has printed 'SHY · 100%' since launch without once saying what
that is. The lesson walks one ticker end to end, pulling its description
from the same etfDescriptions the decision tool uses, and tells non-US
readers why they cannot buy it and what they buy instead.

UK substitutes are hand-written here rather than imported from the mobile
catalog: that is a different package, and where the canonical universe
should live is still open."
```

---

## Task 3: Lesson 6 — Drawdown, why these strategies exist

The spine of the course. Three layers: the authors' own design target, the figures they published, and the cases where it did not hold.

**Files:**
- Create: `web/src/lessons/WhyDrawdown.tsx`
- Modify: `web/src/strategies.ts` (append `drawdownRange`)
- Modify: `web/src/lessons/index.ts`
- Test: `web/src/strategies.test.ts`, `web/src/routes.test.tsx`

**Interfaces:**
- Consumes: `STRATEGIES`, `findStrategy` from `web/src/strategies`; `BacktestFigure` from `web/src/components/BacktestFigure`.
- Produces: `drawdownRange(): { min: number; max: number }` — the smallest and largest `maxDrawdownPct` across strategies that publish one. Lesson slug `why-drawdown`, number 6.

- [ ] **Step 1: Write the failing test for the helper**

Add to `web/src/strategies.test.ts`, inside the existing `describe('backtest figures', …)`:

```ts
  it('reports the span of published drawdowns', () => {
    // Derived rather than typed into the copy: the range sentence in
    // lesson 6 is the site's headline claim, and a hand-copied bound
    // drifts the moment a figure is corrected.
    expect(drawdownRange()).toEqual({ min: 8.7, max: 16.4 })
  })
```

and extend the import at the top of the file:

```ts
import { STRATEGIES, drawdownRange, findStrategy, fundsNeeded } from './strategies'
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `cd web && npx vitest run src/strategies.test.ts`
Expected: FAIL — `drawdownRange is not a function` / TS error, no such export.

- [ ] **Step 3: Write the helper**

Append to `web/src/strategies.ts`, after `fundsNeeded`:

```ts
/**
 * The span of published maximum drawdowns across the six, as positive
 * magnitudes. Lesson 6's headline sentence quotes this range, so it is
 * derived from the same data `BacktestFigure` renders rather than typed
 * into the prose — a hand-copied bound survives a figure correction and
 * turns into a false citation.
 */
export function drawdownRange(): { min: number; max: number } {
  const falls = STRATEGIES.flatMap((s) =>
    s.backtest ? [s.backtest.maxDrawdownPct] : [],
  );
  return { min: Math.min(...falls), max: Math.max(...falls) };
}
```

- [ ] **Step 4: Run the helper test**

Run: `cd web && npx vitest run src/strategies.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing test for the lesson**

Add to `web/src/routes.test.tsx`, inside `describe('the course', …)`:

```tsx
  it('quotes the drawdown range from the data, not from memory', () => {
    const { container } = renderAt('/learn/why-drawdown')
    const { min, max } = drawdownRange()
    expect(container.textContent).toMatch(
      new RegExp(`${min.toFixed(1)}% to ${max.toFixed(1)}%`),
    )
  })

  it('states the cases where the drawdown claim did not hold', () => {
    const { container } = renderAt('/learn/why-drawdown')
    expect(container.textContent).toMatch(/25\.2%/)
    expect(container.textContent).toMatch(/AllocateSmartly/)
  })

  it('renders its figure through BacktestFigure, with the month-end caveat', () => {
    const { container } = renderAt('/learn/why-drawdown')
    expect(container.querySelector('.backtest')).not.toBeNull()
    expect(container.textContent).toMatch(/measured at month-end/)
  })
```

and extend the imports at the top:

```tsx
import { STRATEGIES, drawdownRange } from './strategies'
```

- [ ] **Step 6: Run it to make sure it fails**

Run: `cd web && npx vitest run src/routes.test.tsx`
Expected: FAIL — `/learn/why-drawdown` renders `NotFound`.

- [ ] **Step 7: Write the lesson body**

Create `web/src/lessons/WhyDrawdown.tsx`:

```tsx
import BacktestFigure from '../components/BacktestFigure'
import { drawdownRange, findStrategy } from '../strategies'

/**
 * Lesson 6. The spine of the course, in the three layers the spec sets
 * out: the authors' own design target, the figures they published, and
 * the cases where it did not hold.
 *
 * The range is computed from `STRATEGIES` so it cannot drift from the
 * figures `BacktestFigure` renders. The worked example is VAA — the
 * strategy with the *worst* published fall of the six, chosen so the
 * reader meets the ceiling rather than the best case.
 *
 * The benchmark numbers (50.8%, 29.4–29.5%) belong to the S&P 500 and a
 * 60/40 portfolio rather than to any strategy on this site, so they do
 * not go through `BacktestFigure`; the framing it would have added is
 * written into the sentences instead, as in lesson 1.
 */
export default function WhyDrawdown() {
  const { min, max } = drawdownRange()
  const vaa = findStrategy('vaa')

  return (
    <>
      <p>
        Lesson 1 opened on a number: the S&amp;P 500 fell{' '}
        <strong>50.8%</strong> from its peak in the backtest these
        strategies are measured against, over Dec 1970 – Dec 2016, measured
        at month-end. This lesson is about what the six do with that
        problem, and how far you should trust the answer.
      </p>

      <h2>The authors set the target themselves</h2>

      <p>
        This is not a framing the site applied afterwards. Keller states it
        in the opening of the VAA paper:
      </p>

      <blockquote className="lesson__quote">
        with VAA we aim at moderate but offensive returns above 10% but
        with defensive drawdowns of less than 20%, preferably less than
        15%.
      </blockquote>

      <p>
        And it is built into the measure the papers optimise. They score
        candidate rules with <strong>K25</strong>, a return measure defined
        to hit zero once maximum drawdown reaches 25% — so a rule that
        earns beautifully and falls 25% scores nothing at all. The ceiling
        is inside the authors&rsquo; own objective function, not applied to
        their results by us.
      </p>

      <h2>What they published</h2>

      <p>
        The papers set out to keep the worst fall under 20%. In the
        published backtests of the variants this site runs, the worst
        month-end fall ranged{' '}
        <strong>
          {min.toFixed(1)}% to {max.toFixed(1)}%
        </strong>
        , against 50.8% for holding the S&amp;P 500 over the same decades.
        A 60/40 stock-and-bond portfolio fell 29.4–29.5% over comparable
        spans.
      </p>

      <p>
        Here is the deepest of the six, so you meet the ceiling rather than
        the best case:
      </p>

      {vaa?.backtest && <BacktestFigure backtest={vaa.backtest} />}

      <p>
        Every strategy page carries its own version of that block. The
        period differs per paper, which is why it is printed beside the
        number every time rather than once at the top of the site.
      </p>

      <h2>Where it does not hold</h2>

      <p>
        Those are the headline variants. Stating the rest raises rather
        than lowers what the figures are worth, because a number with no
        edges is not a measurement.
      </p>

      <ul>
        <li>
          <strong>Other variants in the same papers do worse.</strong>{' '}
          VAA&rsquo;s own pre-1945 span shows 24%, and the HAA paper
          reports a 25.2% fall for one alternative configuration.
        </li>
        <li>
          <strong>Small implementation choices move the number a lot.</strong>{' '}
          An independent replication by AllocateSmartly found VAA&rsquo;s
          drawdown going from 16.1% to 25.2% when a single asset (AGG) was
          dropped from the universe. Nothing about the rule changed.
        </li>
        <li>
          <strong>The early decades are not tradable history.</strong> ETFs
          did not exist in 1970. The backtests use index proxies for those
          years, which carry no spread, no commission and no tracking
          error.
        </li>
        <li>
          <strong>Month-end is not the floor.</strong> Every figure here is
          measured at the end of a month, because that is how the papers
          measure. Within a month the fall ran deeper, and your account
          would have shown it.
        </li>
      </ul>

      <p>
        Taken together: these are the results of rules applied to the past,
        by the people proposing the rules, on data that flatters the early
        years. They are the best evidence available and they are not a
        forecast. What they do support is the shape of the claim — that
        these designs were aimed at the depth of the fall rather than the
        height of the return, and that on the record they were measured
        against, the falls were shallower.
      </p>
    </>
  )
}
```

- [ ] **Step 8: Register it**

In `web/src/lessons/index.ts`, add the import:

```ts
import WhyDrawdown from './WhyDrawdown';
```

and append after the `what-you-would-buy` entry:

```ts
  {
    slug: 'why-drawdown',
    number: 6,
    title: 'Drawdown — why these strategies exist',
    summary:
      'The target the authors set, the figures they published, and the cases where it did not hold.',
    Body: WhyDrawdown,
  },
```

- [ ] **Step 9: Add the pull-quote style**

In `web/src/index.css`, in the teaching-register section after `.lesson__define strong`:

```css
/* Pull quote. Used for the papers' own words, where the distinction
   between what an author claimed and what this site claims has to be
   visible at a glance. */
.lesson__quote {
  margin: 24px 0;
  padding-left: 20px;
  border-left: var(--rule-thin);
  font-family: var(--display);
  font-style: italic;
  font-size: 21px;
  line-height: 1.4;
  color: var(--ink-soft);
}
```

- [ ] **Step 10: Run the tests and make sure they pass**

Run: `cd web && npx vitest run`
Expected: PASS, all files.

- [ ] **Step 11: Commit**

```bash
git add web/src/lessons/WhyDrawdown.tsx web/src/lessons/index.ts web/src/strategies.ts web/src/strategies.test.ts web/src/index.css web/src/routes.test.tsx
git commit -m "feat(web): lesson 6 — drawdown, why these strategies exist

Three layers, per the phase 4 spec: Keller's own stated target and the
K25 measure that encodes it, the published figures, then the four cases
where the claim does not hold — other variants, AllocateSmartly's -25.2%
on a one-asset change, index proxies before ETFs, and month-end not being
the floor.

The range comes from drawdownRange() rather than the copy, so correcting
a figure cannot leave a false citation behind in the prose. The worked
example is VAA, the worst of the six, so the reader meets the ceiling."
```

---

## Task 4: Lesson 7 — Choosing one

The comparison, reached at the point where the reader can finally parse its axes. It renders the shipped component rather than a second drawing of the same data.

**Files:**
- Create: `web/src/lessons/ChoosingOne.tsx`
- Modify: `web/src/lessons/index.ts`
- Modify: `web/src/components/StrategyComparison.tsx:1-18` (doc comment only)
- Test: `web/src/routes.test.tsx`

**Interfaces:**
- Consumes: `StrategyComparison` (default export, no props) from `web/src/components/StrategyComparison`.
- Produces: lesson slug `choosing-one`, number 7.

- [ ] **Step 1: Write the failing test**

Add to `web/src/routes.test.tsx`, inside `describe('the course', …)`:

```tsx
  it('shows the comparison inside lesson 7, not a second copy of it', () => {
    const { container } = renderAt('/learn/choosing-one')
    expect(container.querySelector('.compare')).not.toBeNull()
    for (const s of STRATEGIES) {
      expect(
        container.querySelector(`[data-testid="compare-row-${s.id}"]`),
        s.id,
      ).not.toBeNull()
    }
  })

  it('does not rank the six by return', () => {
    const { container } = renderAt('/learn/choosing-one')
    expect(container.textContent).not.toMatch(/best performing|highest return|top performer/i)
  })
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `cd web && npx vitest run src/routes.test.tsx`
Expected: FAIL — `/learn/choosing-one` renders `NotFound`.

- [ ] **Step 3: Write the lesson body**

Create `web/src/lessons/ChoosingOne.tsx`:

```tsx
import StrategyComparison from '../components/StrategyComparison'

/**
 * Lesson 7. The comparison on the landing page, reached at the point
 * where its axes mean something.
 *
 * It renders `StrategyComparison` rather than restating the data: one
 * presentation, two call sites, so a fourth axis added later appears in
 * both without anyone remembering to do it twice.
 */
export default function ChoosingOne() {
  return (
    <>
      <p>
        You have met the parts: a momentum score, a breadth count, one
        decision a month, the funds behind the tickers, and what the
        published falls were. This is the table from the front page, which
        should now read as facts rather than jargon.
      </p>

      <p>
        One thing it deliberately does not have is a return column. With
        one, this becomes a ranking, and a ranked comparison published by a
        UK company is a financial promotion — a thing with rules attached
        that this site is not set up to satisfy. The columns that are here
        are properties of the rule, not judgements about it.
      </p>

      <StrategyComparison />

      <h2>What actually differs</h2>

      <p>
        Read down the <em>Holds</em> column first. VAA holds exactly one
        fund, every month. DAA steps between one, four and six as its
        canaries turn. PAA spreads across as many as seven. That single
        difference drives most of what you will feel: a concentrated rule
        moves further in both directions, and a spread one is duller in
        both.
      </p>

      <p>
        Then <em>De-risks</em>. Some of these go from fully invested to
        fully defensive in a single step; others step down in stages. A
        rule that de-risks all at once is right earlier when a fall is
        real, and wrong more expensively when it is not.
      </p>

      <p>
        <em>ETFs</em> is the practical constraint, and worth checking
        before the others. It counts the distinct funds your broker has to
        list, not how many you hold at once: BAA needs sixteen, LAA five.
        If you are outside the US, that is also sixteen UCITS substitutes
        you have to be satisfied with rather than five. A rule you cannot
        actually buy is not a rule you are running.
      </p>

      <h2>If you want a starting point</h2>

      <p>
        Start with VAA. Not because the figures favour it — its published
        fall is the deepest of the six — but because its rule is the one
        you can hold in your head: score four assets, and if any of them is
        negative, go defensive. You can tell at a glance whether the site
        is doing what it says. That is worth more in the first year than a
        better-looking backtest.
      </p>

      <p>
        The question underneath all of this is not which rule was best on
        the record. It is which one you would still be following in the
        eighth month of a fall, when it has been defensive for a while and
        the market has been rising for three weeks without you. Every one
        of these only works if it is followed; that is the part that is
        about you rather than the data.
      </p>
    </>
  )
}
```

- [ ] **Step 4: Register it**

In `web/src/lessons/index.ts`, add the import:

```ts
import ChoosingOne from './ChoosingOne';
```

and append after the `why-drawdown` entry:

```ts
  {
    slug: 'choosing-one',
    number: 7,
    title: 'Choosing one',
    summary:
      'The six side by side, on facts rather than ratings — and the question underneath the table.',
    Body: ChoosingOne,
  },
```

- [ ] **Step 5: Correct the stale doc comment**

`StrategyComparison.tsx` still describes HAA and BAA as withheld; commit `935dea6` reconciled both. Replace its final paragraph (`web/src/components/StrategyComparison.tsx:15-17`):

```
 * The footnote names any strategy whose figure is withheld — a
 * divergence from the cited paper makes quoting that paper's drawdown a
 * false citation. As of the HAA and BAA reconciliations all six publish
 * a figure, so the footnote collapses to the period caveat alone.
```

- [ ] **Step 6: Run the tests and make sure they pass**

Run: `cd web && npx vitest run`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add web/src/lessons/ChoosingOne.tsx web/src/lessons/index.ts web/src/components/StrategyComparison.tsx web/src/routes.test.tsx
git commit -m "feat(web): lesson 7 — choosing one

Renders the shipped StrategyComparison rather than a second drawing of
the same data, so a column added later shows up on both the landing page
and the lesson. The prose walks the three axes in the order that matters
to a beginner and keeps the VAA recommendation on its non-performance
rationale.

Also corrects the component's doc comment, which still said HAA and BAA
were withheld — 935dea6 reconciled both."
```

---

## Task 5: Lesson 8 — Running it

The last lesson, which stops teaching and hands the reader to the tool.

**Files:**
- Create: `web/src/lessons/RunningIt.tsx`
- Modify: `web/src/lessons/index.ts`
- Test: `web/src/routes.test.tsx`

**Interfaces:**
- Consumes: `Link` from `react-router-dom`; `APP_STORE_CTA`, `APP_STORE_URL` from `web/src/appStore`.
- Produces: lesson slug `running-it`, number 8 — the last, so `Lesson.tsx`'s pager falls through to its "Compare the six →" branch.

- [ ] **Step 1: Write the failing test**

Add to `web/src/routes.test.tsx`, inside `describe('the course', …)`:

```tsx
  it('hands the last lesson off to a strategy page', () => {
    renderAt('/learn/running-it')
    expect(screen.getByRole('link', { name: /VAA/i })).toHaveAttribute(
      'href',
      '/strategies/vaa',
    )
  })

  it('reaches eight lessons, matching the copy on /learn', () => {
    // The two pages state the count from LESSONS.length; this pins the
    // course as finished so a ninth lesson is a deliberate decision.
    expect(LESSONS).toHaveLength(8)
    const { container } = renderAt('/learn/running-it')
    expect(container.textContent).toMatch(/Lesson 8 of 8/)
  })
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `cd web && npx vitest run src/routes.test.tsx`
Expected: FAIL — `/learn/running-it` renders `NotFound`; `LESSONS` has length 7.

- [ ] **Step 3: Write the lesson body**

Create `web/src/lessons/RunningIt.tsx`:

```tsx
import { Link } from 'react-router-dom'

import { APP_STORE_CTA, APP_STORE_URL } from '../appStore'

/**
 * Lesson 8. Stops teaching and hands over.
 *
 * Links to /strategies/vaa rather than to a generic index: the course
 * recommended a starting point in lesson 7, and sending the reader to a
 * chooser again at the last step undoes that.
 */
export default function RunningIt() {
  return (
    <>
      <p>
        Nothing left to explain. What follows is the whole of the job.
      </p>

      <h2>Once, to start</h2>

      <p>
        Pick a strategy and open its page — if you have no preference,{' '}
        <Link to="/strategies/vaa">VAA</Link> is the one lesson 7 argued
        for. Under <em>Today&rsquo;s Decision</em> the site computes the
        rule against live prices and prints what it says to hold. Buy that,
        in those proportions, and note the date.
      </p>

      <h2>Once a month, after that</h2>

      <p>
        At the start of each month, open the same page. Compare what it
        says to what you hold, and trade only the difference — which is
        often nothing at all. Then close it. There is no second check, no
        confirmation, and nothing to watch in between; the allocation set
        at the last month-end holds for the whole month, whatever happens
        inside it.
      </p>

      <p>
        If you miss the date, act on the last month-end&rsquo;s decision
        anyway rather than on a fresher reading. A mid-month signal is a
        different rule from the one that was tested, and the next scheduled
        rebalance is already on its way.
      </p>

      <h2>What this site can and cannot do</h2>

      <p>
        It runs the papers&rsquo; original US ETF universe, at today&rsquo;s
        date only. It does not know what you hold, does not remember you,
        and cannot tell you whether last month&rsquo;s decision is still
        the one in force.
      </p>

      <p>
        The iPhone app does those two things — it holds the allocation
        currently in force rather than today&rsquo;s recomputation, and it
        maps every asset to a local UCITS alternative for readers outside
        the US, per lesson 5.{' '}
        <a href={APP_STORE_URL} target="_blank" rel="noreferrer">
          {APP_STORE_CTA} →
        </a>
      </p>

      <h2>The part that is yours</h2>

      <p>
        This site states what published rules say on current prices. It is
        not advice, it does not know your circumstances, and no one here is
        regulated to give you any. The strategies were designed to limit
        how far a portfolio falls, and on the backtests their authors
        published they did — with the caveats lesson 6 set out. What
        happens from here is not in any of those tables.
      </p>
    </>
  )
}
```

- [ ] **Step 4: Register it**

In `web/src/lessons/index.ts`, add the import:

```ts
import RunningIt from './RunningIt';
```

and append after the `choosing-one` entry:

```ts
  {
    slug: 'running-it',
    number: 8,
    title: 'Running it',
    summary:
      'What the first day looks like, what each month looks like, and where the site stops.',
    Body: RunningIt,
  },
```

- [ ] **Step 5: Run the tests and make sure they pass**

Run: `cd web && npx vitest run`
Expected: PASS. `routes.test.tsx`'s "makes no forward-looking claim in any lesson body" now covers all eight.

- [ ] **Step 6: Verify the whole course in a browser**

Run: `cd web && npm run dev`
Check at 1280px and 390px: `/learn` lists eight; the rail on `/learn/running-it` shows eight entries and marks the last; the pager on lesson 8 falls through to "Compare the six →"; lesson 6's `BacktestFigure` and lesson 7's comparison both fit the reading column without horizontal scroll.

- [ ] **Step 7: Commit**

```bash
git add web/src/lessons/RunningIt.tsx web/src/lessons/index.ts web/src/routes.test.tsx
git commit -m "feat(web): lesson 8 — running it, and the course is eight

Stops teaching: the first day, the monthly loop, what to do when you are
late, and an explicit statement of where the site's competence ends. Links
to /strategies/vaa rather than back to a chooser, because lesson 7 already
made that choice for a reader who had none."
```

---

## Task 6: The allocated ticker gets its plain-English gloss

The spec calls this the single highest-value small change on the site: `SHY · 100%` is the moment a beginner is most exposed, and `etfDescriptions.ts` has had the sentence to fix it all along — used only inside a collapsed score row nobody clicks.

**Files:**
- Modify: `web/src/components/AllocationsBlock.tsx`
- Modify: `web/src/index.css` (`.alloc-hero`, `.alloc-row` gloss)
- Test: `web/src/components/AllocationsBlock.test.tsx` (create)

**Interfaces:**
- Consumes: `describeTicker` from `web/src/etfDescriptions`; `Allocation` from `web/src/api/decisions`.
- Produces: no new exports.

- [ ] **Step 1: Write the failing test**

Create `web/src/components/AllocationsBlock.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import AllocationsBlock from './AllocationsBlock'

describe('AllocationsBlock', () => {
  it('says what the single held ticker is', () => {
    render(<AllocationsBlock allocations={[{ ticker: 'SHY', weight: 1 }]} />)
    expect(screen.getByText('SHY')).toBeInTheDocument()
    expect(screen.getByText(/1–3 year US Treasuries/)).toBeInTheDocument()
  })

  it('glosses every ticker in a multi-asset allocation', () => {
    render(
      <AllocationsBlock
        allocations={[
          { ticker: 'SPY', weight: 0.5 },
          { ticker: 'GLD', weight: 0.5 },
        ]}
      />,
    )
    expect(screen.getByText(/S&P 500/)).toBeInTheDocument()
    expect(screen.getByText(/Physical gold/)).toBeInTheDocument()
  })

  it('renders a ticker it has no description for', () => {
    render(<AllocationsBlock allocations={[{ ticker: 'ZZZ', weight: 1 }]} />)
    expect(screen.getByText('ZZZ')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `cd web && npx vitest run src/components/AllocationsBlock.test.tsx`
Expected: FAIL on the first two — the component renders the ticker and the weight, no description.

- [ ] **Step 3: Add the gloss**

Rewrite `web/src/components/AllocationsBlock.tsx`:

```tsx
import type { Allocation } from '../api/decisions'
import { describeTicker } from '../etfDescriptions'

function formatPercent(weight: number): string {
  const pct = weight * 100
  return Number.isInteger(pct) ? `${pct.toFixed(0)}%` : `${pct.toFixed(2)}%`
}

function spellPercent(weight: number): string {
  if (Math.abs(weight - 1) < 1e-9) return 'One hundred percent of the portfolio.'
  const pct = weight * 100
  return `${pct.toFixed(2)}% of the portfolio.`
}

/**
 * What the rule says to hold.
 *
 * Each ticker carries its one-line description from `etfDescriptions`.
 * This is the moment a reader with no background is most exposed — the
 * site names a four-letter code and a percentage and, until this gloss,
 * said nothing else about it. The same sentences already existed behind
 * a click in the score rows; here they are unconditional.
 */
export default function AllocationsBlock({
  allocations,
}: {
  allocations: Allocation[]
}) {
  if (allocations.length === 1) {
    const a = allocations[0]
    const description = describeTicker(a.ticker)
    return (
      <div className="alloc-hero">
        <p className="alloc-hero__ticker">{a.ticker}</p>
        {description && <p className="alloc-hero__gloss">{description}</p>}
        <p className="alloc-hero__weight">— {spellPercent(a.weight)}</p>
      </div>
    )
  }

  const total = allocations.reduce((acc, a) => acc + a.weight, 0)
  return (
    <ul className="alloc-list">
      {allocations.map((a) => {
        const description = describeTicker(a.ticker)
        return (
          <li key={a.ticker} className="alloc-row">
            <span className="alloc-row__ticker">
              {a.ticker}
              {description && (
                <span className="alloc-row__gloss">{description}</span>
              )}
            </span>
            <span className="alloc-row__weight">{formatPercent(a.weight)}</span>
          </li>
        )
      })}
      <li className="alloc-row alloc-row--total">
        <span className="alloc-row__total-label">Total</span>
        <span className="alloc-row__total-weight">{formatPercent(total)}</span>
      </li>
    </ul>
  )
}
```

- [ ] **Step 4: Style it**

In `web/src/index.css`, after the `.alloc-hero__ticker` rule:

```css
/* The gloss sits between the ticker and its weight: a reader who does
   not know the code meets the plain-English line before the number. */
.alloc-hero__gloss {
  margin: 2px 0 0;
  font-family: var(--body);
  font-style: italic;
  font-size: 17px;
  color: var(--muted);
}
```

and after the `.alloc-row__ticker` rule:

```css
.alloc-row__gloss {
  display: block;
  font-family: var(--body);
  font-style: italic;
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
  color: var(--muted);
  margin-top: 2px;
}
```

- [ ] **Step 5: Run the tests and make sure they pass**

Run: `cd web && npx vitest run`
Expected: PASS, all files.

- [ ] **Step 6: Verify against a live decision**

Run the backend (`cd backend && dotnet run --project src/MomentumInvestment.Api`) and `cd web && npm run dev`. Open `/strategies/vaa` and `/strategies/laa` at 1280px and 390px: the hero gloss must not push the weight line off the fold, and the multi-asset rows must stay aligned with their percentages.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/AllocationsBlock.tsx web/src/components/AllocationsBlock.test.tsx web/src/index.css
git commit -m "feat(web): say what the held ticker is, beside the ticker

'SHY · One hundred percent of the portfolio' was the site's most exposed
moment for a reader with no background, and etfDescriptions has had the
sentence that fixes it since launch — locked behind a click in the score
rows. The gloss is now unconditional, on both the single-holding hero and
the multi-asset list."
```

---

## Task 7: Reduce About to what only About can say — *optional*

**Droppable.** Everything above is lessons 5–8 and the landing copy, which is what stage 4 was scoped as. This task is the spec's IA line for `/about` ("Author, papers, method, disclaimer (reduced)"), which no stage picked up. It is worth doing here because the course has now created a real duplication rather than a stylistic one: About's second paragraph defines breadth and the canary universe, and lesson 3 defines both better, with the coal-mine metaphor the spec asked for. Two definitions of the same term on one site is the thing the course was built to stop.

`/about` is not one of the eight URLs the iPhone app pins, so its content is free to change.

**Files:**
- Modify: `web/src/routes/About.tsx:19-31` (drop the duplicated paragraph), `:41` (section title)
- Test: `web/src/routes.test.tsx`

**Interfaces:**
- Consumes: `Link` from `react-router-dom` (already imported in `About.tsx`).
- Produces: nothing.

- [ ] **Step 1: Write the failing test**

Add to `web/src/routes.test.tsx`, as a new top-level `describe`:

```tsx
describe('About', () => {
  it('leaves the teaching to the course', () => {
    // Lesson 3 owns breadth and the canary universe. Two definitions of
    // one term on one site is what the course exists to stop.
    const { container } = renderAt('/about')
    expect(container.textContent).not.toMatch(/coal miners|early-warning basket/i)
    expect(container.textContent).not.toMatch(
      /instead of only ranking assets by their\s+momentum scores/i,
    )
  })

  it('points a reader who wants the concepts at the course', () => {
    renderAt('/about')
    expect(screen.getByRole('link', { name: /course/i })).toHaveAttribute(
      'href',
      '/learn',
    )
  })

  it('does not compete with the label the app links to', () => {
    // HomeScreen.tsx's link reads "How these strategies work →" and goes
    // to /. An About heading with the same words sends a reader who
    // followed it to the wrong page.
    const { container } = renderAt('/about')
    expect(container.textContent).not.toMatch(/How the strategies work/i)
  })

  it('keeps what only About can say', () => {
    const { container } = renderAt('/about')
    expect(container.textContent).toMatch(/Wouter Keller/)
    expect(container.textContent).toMatch(/not investment advice/)
    expect(container.querySelectorAll('.paper-list li')).toHaveLength(
      STRATEGIES.length,
    )
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `cd web && npx vitest run src/routes.test.tsx`
Expected: FAIL on the first three — the canary paragraph is present, there is no `/learn` link, and the heading reads "How the strategies work, in 30 seconds".

- [ ] **Step 3: Drop the duplicated paragraph**

In `web/src/routes/About.tsx`, replace the whole second `<p>` of the Keller section — the one beginning "The unifying idea across his work is" and ending "independent of how the main risky universe scores." — with:

```tsx
        <p>
          The unifying idea across his work is <em>breadth momentum</em>:
          counting how many assets in a universe are rising, and letting
          that count rather than a forecast decide when to take cover. The
          course works through what that means and why it is built the way
          it is — <Link to="/learn">start the course →</Link>
        </p>
```

- [ ] **Step 4: Retitle the method section**

In the same file, change the heading:

```tsx
        <h2>Method</h2>
```

- [ ] **Step 5: Run the tests and make sure they pass**

Run: `cd web && npx vitest run`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add web/src/routes/About.tsx web/src/routes.test.tsx
git commit -m "refactor(web): let the course own the concepts, and About own the author

About defined breadth and the canary universe; lesson 3 now defines both,
with the coal-mine metaphor and the 'watched, never bought' point About
never made. Two definitions of one term is what the course was built to
stop, so About keeps one sentence and a link.

The 'How the strategies work' heading also collided with the label the
iPhone app uses for its link to /, which would have sent a reader who
followed it to the wrong page. It is now 'Method'."
```

---

## Done when

- `cd web && npm test`, `npm run lint` and `npm run build` are clean.
- `cd backend && dotnet test` stays at its current pass count — this stage touches no backend code.
- All eight app-linked URLs still resolve (`routes.test.tsx`).
- `/learn` lists eight lessons; each renders at 1280px and 390px with no horizontal scroll.
- No lesson body trips the forward-looking-claim assertion.
- Every backtest figure on the site still carries its period, the word backtest, and the month-end qualifier.

## Out of scope

- **Home's live decision hook.** The spec's IA calls for it between the comparison and the course entrance; deferred to its own stage (decision 2 above).
- **Moving the canonical universe to the backend.** Lesson 5 hand-writes three UK substitutes precisely so this stage does not pre-empt that decision.
- **Web UK region support.** Lesson 5 explains the substitution; the site still runs the US universe only.
- **Any mobile change.** The app deliberately teaches nothing; that stays true.
