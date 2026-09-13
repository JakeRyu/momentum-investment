# Phase 4 Stage 1 — Plain Language and Honest Figures

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rescue phase 3's plain-language backend work onto a fresh branch, and put verified, honestly-framed backtest drawdown figures on the strategy pages.

**Architecture:** Branch fresh from `main` (phase 3's design is rejected; its language is cherry-picked). Backtest figures live as data on each strategy and reach the page through a single component that bakes the honesty requirements — period, the word "backtest", the month-end qualifier — into its markup, so no call site can print a bare number. Web gains its first test infrastructure (vitest) because the spec's guarantees are otherwise unenforceable.

**Tech Stack:** React 19, React Router 7, Vite 8, TypeScript 6, vitest + @testing-library/react (new), .NET 10 / xUnit (backend, existing).

**Spec:** [docs/superpowers/specs/2026-09-13-phase-4-learn-course-design.md](../specs/2026-09-13-phase-4-learn-course-design.md)

## Global Constraints

- **No forward-looking claims.** The site never predicts a drawdown, return, or ceiling. It cites what a paper reported. Copy that survives review reads "in the published backtest, the worst month-end fall was X%", never "stays under X%".
- **Every figure carries its frame.** Any rendered backtest number appears with its period, the word "backtest", and the month-end qualifier in the same visual block.
- **Mobile URLs are immutable.** `/`, `/strategies/vaa`, `/strategies/daa`, `/strategies/paa`, `/strategies/haa`, `/strategies/baa`, `/strategies/laa`, `/privacy`. No renames, no redirects.
- **HAA's backtest row is withheld** until the separate 13612U filter change lands. `HaaService` computes 13612W while the paper specifies 13612U, so the paper's figure does not describe what the site runs.
- **Design system unchanged this stage.** No new colors, typefaces, rounded corners, or shadows. Palette stays `--bg #f5f1e8` / `--ink #0a0a0a` / `--red #e63946`.
- **Disclaimer stays** on every screen that shows a decision or a figure.

## Roadmap — where this stage sits

| Stage | Deliverable | Status |
|---|---|---|
| **1. Plain language + honest figures** | Backend reasoning rescued; verified drawdown figures on strategy pages; web test infra | **this plan** |
| 2. Design foundation | Teaching register in CSS, two-tier headings, new comparison presentation on Home, `DESIGN.md` section | next |
| 3. Course scaffold + lessons 1–4 | `/learn`, `/learn/:step`, progress rail, lessons carrying phase 3 prose | after 2 |
| 4. Lessons 5–8 + landing | "What you'd buy", drawdown lesson, choosing, running it; landing restructure; link-integrity coverage | after 3 |
| **HAA filter fix** | `13612W → 13612U` in `HaaService`, own regression tests, own release | separate, unblocks HAA's figure |

Each stage ships working software on its own. Stage 1 leaves the site strictly better even if nothing follows: reasoning reads plainly, and five strategy pages gain a sourced drawdown block.

---

### Task 1: Fresh branch with phase 3's backend language

Phase 3's design is rejected but its backend work contains no presentation code and cherry-picks cleanly.

**Files:**
- Modify (via cherry-pick): `backend/src/MomentumInvestment.Api/Strategies/{BaaService,DaaG12Service,HaaService,LaaService,PaaService,VaaG4B3Service}.cs`

**Interfaces:**
- Consumes: nothing.
- Produces: a branch `feat/honest-figures` off `main` carrying plain-language `reasoning` strings on all six services.

- [ ] **Step 1: Create the branch from main**

```bash
cd /Users/jryu/Projects/momentum-investment
git checkout main
git checkout -b feat/honest-figures
```

- [ ] **Step 2: Cherry-pick the plain-language reasoning commit**

`cd7c10c` touches only the six strategy services.

```bash
git cherry-pick cd7c10c
```

Expected: clean apply. If it conflicts, stop — `main` has moved and the spec's disposition table needs rechecking.

- [ ] **Step 3: Cherry-pick the backend half of the review-fix commit**

`b5dabad` mixes backend and web. Take only the backend files.

```bash
git cherry-pick -n b5dabad
git restore --staged --worktree web/
git commit -m "$(cat <<'EOF'
fix(api): resolve review findings on the plain-language reasoning

Backend half of b5dabad; the web half belonged to the rejected
phase 3 design.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Run the backend tests**

```bash
cd backend && dotnet test
```

Expected: PASS, 84/84.

- [ ] **Step 5: Verify the paper vocabulary is gone from user-facing strings**

```bash
cd /Users/jryu/Projects/momentum-investment
grep -n "Offensive mode\|Defensive mode\|Hybrid mode\|13612W = \|SMA12 = " backend/src/MomentumInvestment.Api/Strategies/*.cs
```

Expected: no matches in `reasoning` string construction. Matches inside XML doc comments are fine — those are for developers.

---

### Task 2: Web test infrastructure and verified backtest data

The spec's guarantees are promises about rendered output, so they need a test runner. Web has none; this task adds one and uses it immediately.

**Files:**
- Modify: `web/package.json`
- Modify: `web/vite.config.ts`
- Create: `web/src/strategies.test.ts`
- Modify: `web/src/strategies.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `npm test` in `web/`; exported type `Backtest`; optional `backtest?: Backtest` on `Strategy`.

- [ ] **Step 1: Install vitest and testing-library**

```bash
cd /Users/jryu/Projects/momentum-investment/web
npm install -D vitest@^3 @testing-library/react@^16 @testing-library/jest-dom@^6 jsdom@^26
```

- [ ] **Step 2: Add the test script**

In `web/package.json`, add to `"scripts"`:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: Configure vitest**

Replace `web/vite.config.ts` with:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

- [ ] **Step 4: Create the test setup file**

Create `web/src/test-setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 5: Write the failing data test**

Create `web/src/strategies.test.ts`. These figures are transcribed from the PDFs in `docs/papers/`; the test is what stops them drifting.

```ts
import { describe, expect, it } from 'vitest'

import { STRATEGIES, findStrategy } from './strategies'

describe('backtest figures', () => {
  it('matches the figures verified against the source papers', () => {
    const expected = {
      vaa: { variant: 'VAA-G4 (T/B=1/1)', periodStart: '1970-12', periodEnd: '2016-12', cagrPct: 18.9, maxDrawdownPct: 13.0, sourceLabel: 'Table 8' },
      daa: { variant: 'DAA-G12 (T=6, B=2)', periodStart: '1970-12', periodEnd: '2018-03', cagrPct: 16.0, maxDrawdownPct: 10.6, sourceLabel: 'Fig. 8' },
      paa: { variant: 'PAA2 (a=2, Top6, L=12)', periodStart: '1970-12', periodEnd: '2015-12', cagrPct: 13.7, maxDrawdownPct: 10.4, sourceLabel: 'Fig. 6' },
      baa: { variant: 'BAA-G12', periodStart: '1970-12', periodEnd: '2022-06', cagrPct: 14.6, maxDrawdownPct: 8.7, sourceLabel: 'Fig. 3' },
      laa: { variant: 'LAA (QQQ↔SHY)', periodStart: '1949-02', periodEnd: '2019-10', cagrPct: 10.5, maxDrawdownPct: 15.0, sourceLabel: 'Fig. 12' },
    }

    for (const [id, figures] of Object.entries(expected)) {
      expect(findStrategy(id)?.backtest, id).toEqual(figures)
    }
  })

  it('withholds HAA until its momentum filter matches the paper', () => {
    // HaaService computes 13612W; the HAA paper specifies 13612U (L=1).
    // Publishing Fig. 6's number beside a different rule would be a false
    // citation. Restore this row only with the filter fix.
    expect(findStrategy('haa')?.backtest).toBeUndefined()
  })

  it('reports every drawdown as a positive magnitude', () => {
    for (const s of STRATEGIES) {
      if (!s.backtest) continue
      expect(s.backtest.maxDrawdownPct, s.id).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

```bash
cd /Users/jryu/Projects/momentum-investment/web && npm test
```

Expected: FAIL — `backtest` does not exist on `Strategy`.

- [ ] **Step 7: Add the type**

In `web/src/strategies.ts`, above `export type Strategy`:

```ts
/**
 * A figure reported by the strategy's source paper, for the variant this
 * site actually implements. Transcribed from the PDFs in `docs/papers/`
 * and pinned by `strategies.test.ts`.
 *
 * `maxDrawdownPct` is the paper's D: the worst peak-to-trough fall
 * measured at month-end, as a positive magnitude. Intra-month falls are
 * deeper; `BacktestFigure` says so wherever this renders.
 *
 * Absent when the site's implementation diverges from the paper the
 * figure came from — publishing it would be a false citation.
 */
export type Backtest = {
  variant: string;
  periodStart: string; // YYYY-MM
  periodEnd: string; // YYYY-MM
  cagrPct: number;
  maxDrawdownPct: number;
  sourceLabel: string;
};
```

Then add to the `Strategy` type, after `comparison`:

```ts
  backtest?: Backtest;
```

- [ ] **Step 8: Add the figures to the five eligible strategies**

In `web/src/strategies.ts`, add a `backtest` block after each strategy's `comparison` block.

VAA:

```ts
    backtest: {
      variant: 'VAA-G4 (T/B=1/1)',
      periodStart: '1970-12',
      periodEnd: '2016-12',
      cagrPct: 18.9,
      maxDrawdownPct: 13.0,
      sourceLabel: 'Table 8',
    },
```

DAA:

```ts
    backtest: {
      variant: 'DAA-G12 (T=6, B=2)',
      periodStart: '1970-12',
      periodEnd: '2018-03',
      cagrPct: 16.0,
      maxDrawdownPct: 10.6,
      sourceLabel: 'Fig. 8',
    },
```

PAA:

```ts
    backtest: {
      variant: 'PAA2 (a=2, Top6, L=12)',
      periodStart: '1970-12',
      periodEnd: '2015-12',
      cagrPct: 13.7,
      maxDrawdownPct: 10.4,
      sourceLabel: 'Fig. 6',
    },
```

BAA:

```ts
    backtest: {
      variant: 'BAA-G12',
      periodStart: '1970-12',
      periodEnd: '2022-06',
      cagrPct: 14.6,
      maxDrawdownPct: 8.7,
      sourceLabel: 'Fig. 3',
    },
```

LAA:

```ts
    backtest: {
      variant: 'LAA (QQQ↔SHY)',
      periodStart: '1949-02',
      periodEnd: '2019-10',
      cagrPct: 10.5,
      maxDrawdownPct: 15.0,
      sourceLabel: 'Fig. 12',
    },
```

HAA gets **no** `backtest` block. Leave this comment in its place, after HAA's `comparison`:

```ts
    // No backtest row: HaaService computes 13612W, but the HAA paper
    // specifies the unweighted 13612U (L=1) for all three universes.
    // Restore the paper's Fig. 6 figures (R 15.9%, D 9.7%, Dec 1970 –
    // Dec 2022) only once the filter matches.
```

- [ ] **Step 9: Run the tests to verify they pass**

```bash
cd /Users/jryu/Projects/momentum-investment/web && npm test
```

Expected: PASS, 3 tests.

- [ ] **Step 10: Commit**

```bash
cd /Users/jryu/Projects/momentum-investment
git add web/package.json web/package-lock.json web/vite.config.ts web/src/test-setup.ts web/src/strategies.ts web/src/strategies.test.ts
git commit -m "$(cat <<'EOF'
feat(web): backtest figures, verified against the source papers

Adds vitest so the figures can be pinned rather than trusted. HAA is
withheld: its service computes 13612W where the paper specifies 13612U.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: The BacktestFigure component

One component is the only route a figure takes to the page, so the honesty requirements live in markup rather than in each caller's copy.

**Files:**
- Create: `web/src/components/BacktestFigure.tsx`
- Create: `web/src/components/BacktestFigure.test.tsx`
- Modify: `web/src/index.css`

**Interfaces:**
- Consumes: `Backtest` from `../strategies` (Task 2).
- Produces: `export default function BacktestFigure({ backtest }: { backtest: Backtest })`.

- [ ] **Step 1: Write the failing tests**

Create `web/src/components/BacktestFigure.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { Backtest } from '../strategies'

import BacktestFigure from './BacktestFigure'

const VAA: Backtest = {
  variant: 'VAA-G4 (T/B=1/1)',
  periodStart: '1970-12',
  periodEnd: '2016-12',
  cagrPct: 18.9,
  maxDrawdownPct: 13.0,
  sourceLabel: 'Table 8',
}

describe('BacktestFigure', () => {
  it('names the period in readable months', () => {
    render(<BacktestFigure backtest={VAA} />)
    expect(screen.getByText(/Dec 1970 – Dec 2016/)).toBeInTheDocument()
  })

  it('calls it a backtest', () => {
    const { container } = render(<BacktestFigure backtest={VAA} />)
    expect(container.textContent).toMatch(/backtest/i)
  })

  it('says the fall is measured at month-end', () => {
    const { container } = render(<BacktestFigure backtest={VAA} />)
    expect(container.textContent).toMatch(/month-end/i)
  })

  it('warns that intra-month falls run deeper', () => {
    const { container } = render(<BacktestFigure backtest={VAA} />)
    expect(container.textContent).toMatch(/deeper/i)
  })

  it('refuses to imply a prediction', () => {
    const { container } = render(<BacktestFigure backtest={VAA} />)
    expect(container.textContent).toMatch(/do not predict/i)
  })

  it('credits the variant and the source table', () => {
    const { container } = render(<BacktestFigure backtest={VAA} />)
    expect(container.textContent).toContain('VAA-G4 (T/B=1/1)')
    expect(container.textContent).toContain('Table 8')
  })

  it('shows the drawdown as a fall, not a gain', () => {
    render(<BacktestFigure backtest={VAA} />)
    expect(screen.getByText('−13.0%')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd /Users/jryu/Projects/momentum-investment/web && npm test
```

Expected: FAIL — cannot resolve `./BacktestFigure`.

- [ ] **Step 3: Write the component**

Create `web/src/components/BacktestFigure.tsx`:

```tsx
import type { Backtest } from '../strategies'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/**
 * The only path a backtest number takes to the page.
 *
 * The period, the word "backtest", the month-end qualifier and the
 * no-prediction line are part of this markup rather than the caller's
 * copy, so a call site cannot print a bare figure. The site's claim is
 * that these strategies were built to limit falls — an argument the
 * papers make themselves, which is why the variant and source table
 * travel with every number.
 */
export default function BacktestFigure({ backtest }: { backtest: Backtest }) {
  return (
    <figure className="backtest">
      <figcaption className="backtest__caption">
        Published backtest · {formatMonth(backtest.periodStart)} –{' '}
        {formatMonth(backtest.periodEnd)}
      </figcaption>

      <div className="backtest__rows">
        <div className="backtest__row">
          <span className="backtest__label">Worst fall, peak to trough</span>
          <span className="backtest__value backtest__value--fall">
            −{backtest.maxDrawdownPct.toFixed(1)}%
          </span>
        </div>
        <div className="backtest__row">
          <span className="backtest__label">Annualised return</span>
          <span className="backtest__value">{backtest.cagrPct.toFixed(1)}%</span>
        </div>
      </div>

      <p className="backtest__note">
        {backtest.variant}, as reported in the source paper (
        {backtest.sourceLabel}). The fall is measured at month-end — within
        a month it ran deeper. Backtested results do not predict future
        returns.
      </p>
    </figure>
  )
}

/** "1970-12" → "Dec 1970". */
function formatMonth(ym: string): string {
  const [year, month] = ym.split('-')
  return `${MONTHS[Number(month) - 1]} ${year}`
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd /Users/jryu/Projects/momentum-investment/web && npm test
```

Expected: PASS, 10 tests total.

- [ ] **Step 5: Style it within the existing system**

Append to `web/src/index.css`, before the `/* ─── Misc ─── */` section. Thin rules only — the heavy rule is reserved for major sections.

```css
/* ─── Backtest figure ─────────────────────────────────────────────── */

.backtest {
  margin: 0 0 28px;
  padding: 16px 18px;
  border: var(--rule-thin);
  max-width: 560px;
}
.backtest__caption {
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 12px;
}
.backtest__rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.backtest__row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(10, 10, 10, 0.15);
}
.backtest__label {
  font-size: 15px;
  color: var(--ink-soft);
}
.backtest__value {
  font-family: var(--mono);
  font-weight: 700;
  font-size: 20px;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}
.backtest__value--fall {
  color: var(--red);
}
.backtest__note {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.5;
  font-style: italic;
  color: var(--muted);
}

@media (max-width: 720px) {
  .backtest__row {
    flex-direction: column;
    gap: 2px;
  }
}
```

- [ ] **Step 6: Commit**

```bash
cd /Users/jryu/Projects/momentum-investment
git add web/src/components/BacktestFigure.tsx web/src/components/BacktestFigure.test.tsx web/src/index.css
git commit -m "$(cat <<'EOF'
feat(web): one component for every backtest figure

Period, the word backtest, the month-end qualifier and the
no-prediction line are markup, not caller copy, so no call site can
print a bare number.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Show the figure on strategy pages

**Files:**
- Modify: `web/src/routes/StrategyPage.tsx`
- Create: `web/src/routes/StrategyPage.test.tsx`

**Interfaces:**
- Consumes: `BacktestFigure` (Task 3), `findStrategy` (existing).
- Produces: nothing downstream.

- [ ] **Step 1: Write the failing tests**

Create `web/src/routes/StrategyPage.test.tsx`. `StrategyPage` reads a route param, so it needs a router, and `DecisionTool` fetches — jsdom has no server, which is fine: the component renders its error state and the assertions here do not touch it.

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import StrategyPage from './StrategyPage'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/strategies/:id" element={<StrategyPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('StrategyPage backtest block', () => {
  it('shows the drawdown for a strategy that matches its paper', () => {
    renderAt('/strategies/vaa')
    expect(screen.getByText('−13.0%')).toBeInTheDocument()
  })

  it('omits the block for HAA, whose filter diverges from the paper', () => {
    const { container } = renderAt('/strategies/haa')
    expect(container.querySelector('.backtest')).toBeNull()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd /Users/jryu/Projects/momentum-investment/web && npm test
```

Expected: FAIL — no element with text `−13.0%`.

- [ ] **Step 3: Render the block**

In `web/src/routes/StrategyPage.tsx`, add the import beside the others:

```tsx
import BacktestFigure from '../components/BacktestFigure'
```

Then place the block between the paper line and the heavy rule, replacing:

```tsx
      <div className="strategy-page__rule-heavy" />
```

with:

```tsx
      {strategy.backtest && <BacktestFigure backtest={strategy.backtest} />}

      <div className="strategy-page__rule-heavy" />
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd /Users/jryu/Projects/momentum-investment/web && npm test
```

Expected: PASS, 12 tests total.

- [ ] **Step 5: Check it in a browser**

```bash
cd /Users/jryu/Projects/momentum-investment/web && npm run dev
```

Visit `http://localhost:5173/strategies/vaa` and `/strategies/haa`. VAA shows the block above the "Today's Decision" rule; HAA does not. Stop the server when done.

- [ ] **Step 6: Commit**

```bash
cd /Users/jryu/Projects/momentum-investment
git add web/src/routes/StrategyPage.tsx web/src/routes/StrategyPage.test.tsx
git commit -m "$(cat <<'EOF'
feat(web): show the published drawdown on strategy pages

The argument for these strategies is the size of the fall, so the
figure sits above the live decision rather than behind a paper link.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Retire the last stale date-picker claim, and pin the mobile URLs

`AppPromo` still advertises a screen phase 2 deleted. This is the third surviving instance of that copy; the first two were found by accident, so this task also pins the routes the app depends on.

**Files:**
- Modify: `web/src/components/AppPromo.tsx`
- Create: `web/src/routes.test.tsx`

**Interfaces:**
- Consumes: route table from `web/src/main.tsx`.
- Produces: nothing downstream.

- [ ] **Step 1: Write the failing tests**

Create `web/src/routes.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import AppPromo from './components/AppPromo'
import { STRATEGIES } from './strategies'
import About from './routes/About'
import Home from './routes/Home'
import NotFound from './routes/NotFound'
import Privacy from './routes/Privacy'
import StrategyPage from './routes/StrategyPage'

/** Mirrors main.tsx. The app links to these paths; none may move. */
function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/strategies/:id" element={<StrategyPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('URLs the iPhone app links to', () => {
  // HomeScreen.tsx:91 — "How these strategies work →"
  it('serves the landing page', () => {
    const { container } = renderAt('/')
    expect(container.querySelector('.not-found')).toBeNull()
  })

  // DecisionScreen.tsx:241 — "How this strategy works →"
  it.each(STRATEGIES.map((s) => s.id))('serves /strategies/%s', (id) => {
    const { container } = renderAt(`/strategies/${id}`)
    expect(container.querySelector('.not-found')).toBeNull()
  })

  // App Store listing — privacy policy URL
  it('serves the privacy page', () => {
    const { container } = renderAt('/privacy')
    expect(container.querySelector('.not-found')).toBeNull()
  })
})

describe('AppPromo', () => {
  it('does not advertise the date picker phase 2 removed', () => {
    const { container } = render(<AppPromo />)
    expect(container.textContent).not.toMatch(/any date|date you choose|per-date/i)
  })

  it('describes what the app actually does', () => {
    render(<AppPromo />)
    expect(screen.getByText(/in force/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to verify the AppPromo ones fail**

```bash
cd /Users/jryu/Projects/momentum-investment/web && npm test
```

Expected: the eight URL tests PASS; both `AppPromo` tests FAIL on the "any date you choose" copy.

- [ ] **Step 3: Fix the copy and the doc comment**

In `web/src/components/AppPromo.tsx`, replace the doc comment's second sentence and the body paragraph. The comment currently says "local-ticker mapping and per-date decisions live in the iPhone app"; it becomes:

```tsx
/**
 * Web-to-app funnel notice. The web tool intentionally stays on the US
 * paper universe at today's date; local-ticker mapping and the in-force
 * monthly allocation live in the iPhone app, so the CTA sends readers
 * there.
 *
 * Strategy pages use the text link rather than Apple's badge — the badge's
 * black fill and rounded corners fight the Brutalist Quarterly grid at this
 * size. The Home section carries the official badge instead.
 */
```

And the body paragraph becomes:

```tsx
      <p className="app-promo__body">
        This tool runs Keller's original US-ETF universe at today's date. The
        Momentum Investment iPhone app maps every asset class to local UCITS
        alternatives (UK first) and holds the allocation currently in force,
        month to month.
      </p>
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd /Users/jryu/Projects/momentum-investment/web && npm test
```

Expected: PASS, 22 tests total.

- [ ] **Step 5: Sweep for any other survivor**

```bash
cd /Users/jryu/Projects/momentum-investment
grep -rn "any date\|date you choose\|per-date\|decision date" web/src mobile/src
```

Expected: no matches. Anything found is a fourth survivor — fix it in this commit.

- [ ] **Step 6: Lint and build**

```bash
cd /Users/jryu/Projects/momentum-investment/web && npm run lint && npm run build
```

Expected: both clean.

- [ ] **Step 7: Commit**

```bash
cd /Users/jryu/Projects/momentum-investment
git add web/src/components/AppPromo.tsx web/src/routes.test.tsx
git commit -m "$(cat <<'EOF'
fix(web): retire the last date-picker claim, pin the app's URLs

Third survivor of copy for a screen phase 2 deleted. The route test
exists so the next restructure cannot quietly break the app's only
way out.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Done when

- `cd backend && dotnet test` passes 84/84.
- `cd web && npm test` passes 22 tests.
- `cd web && npm run lint && npm run build` are clean.
- `/strategies/vaa`, `/daa`, `/paa`, `/baa`, `/laa` each show a sourced drawdown block; `/strategies/haa` shows none.
- No user-facing string contains `13612W = `, `Offensive mode`, `Defensive mode`, `Hybrid mode`, or a bare score.
- No file in `web/src` or `mobile/src` mentions a date picker.
- All eight app-linked URLs render a real page.

## Out of scope, deliberately

- The `/learn` course, the teaching register, and the landing restructure — stages 2–4.
- The HAA momentum-filter fix — its own change, its own release. HAA's figure stays withheld until then.
- Any change to `mobile/`. The app's links are pinned by test here, not modified.
