# Phase 3 — Web Funnel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the web's side of the education split — a descriptive comparison that answers "is one of these for me", a section on the monthly cycle people actually get wrong, concepts before formulas on About, and reasoning sentences a newcomer can read.

**Architecture:** Facts move into `web/src/strategies.ts` so the comparison renders from data rather than markup. The home strategy grid is replaced outright. Backend reasoning strings are rewritten in place — same maths, same payload, different words — so both surfaces pick them up at once.

**Tech Stack:** React 19 + Vite + TypeScript (`web/`), ASP.NET Core 10 (`backend/`). No test runner in `web/`; `dotnet test` covers the backend.

**Spec:** `docs/superpowers/specs/2026-09-13-phase-3-web-funnel-design.md`

## Global Constraints

- **No backtest figures, no performance claims, no ratings.** The comparison is mechanical facts only. "Start here" is grounded in how simple a rule is to understand and run, never in outcome.
- **The vocabulary `G4`, `B3`, `13612W`, `SMA12`, `canary breadth`, `CF`, `BF`, `GT timing`, `Risk-On/Risk-Off` leaves every reasoning sentence.** Signal names stay on About and the strategy pages.
- **No maths, universe, API-shape or `mobile/` changes.** Mobile renders the new reasoning with no edit.
- **Design system is `DESIGN.md` (Brutalist Quarterly):** three colours only — `--bg` cream `#f5f1e8`, `--ink` near-black `#0a0a0a`, `--red` `#e63946`. No gradients, no shadows, no fourth colour. Heavy rules, serif display italic, editorial layout.
- Web style: 2-space indent, single quotes. **Semicolons follow the file you are editing** — `web/src/*.ts` uses them (`strategies.ts`), `web/src/**/*.tsx` does not (`Home.tsx`). ESLint has no `semi` rule, so nothing will catch a mismatch; match the neighbouring lines by eye.
- Every task ends green on `cd web && npm run lint && npm run build`; backend tasks also on `cd backend && dotnet test`.
- **Do not run a browser.** Visual verification is one consolidated pass by the controller at the end.

---

### Task 1: Strategy taglines and comparison facts

Data first, so the later tasks render rather than hardcode. `blurb` is paper language (`SMA12 breadth with selectable protection level a ∈ {0, 1, 2}`) and the app replaced it with a plain tagline two phases ago; the web is the last surface still using it.

**Files:**
- Modify: `web/src/strategies.ts`
- Modify: `web/src/routes/StrategyPage.tsx` (its lede reads `strategy.blurb`)
- Modify: `web/src/components/StrategyCard.tsx` (deleted in Task 2, but must compile now)

**Interfaces:**
- Produces, used by Task 2: `Strategy.tagline: string` and `Strategy.comparison: { holds: string; deRisks: string; fundsNeeded: number }`.

- [ ] **Step 1: Replace `blurb` with `tagline` in the type and all six entries**

In `web/src/strategies.ts`, rename the field and use the app's wording verbatim (from `mobile/src/strategies.ts`) so every surface describes a strategy identically:

```typescript
  vaa: 'All-in on one winner, out at the first bad sign'
  paa: 'Eases out of risk as fewer assets trend up'
  daa: 'Two bellwether assets decide when to take cover'
  baa: "Strictest guard: one warning and it's fully out"
  haa: 'Four assets at once, out on an inflation warning'
  laa: 'Mostly buy-and-hold, one slow economic switch'
```

- [ ] **Step 2: Add the comparison facts**

Add to the `Strategy` type and every entry:

```typescript
  /**
   * Mechanical facts for the home comparison. Deliberately not ratings and
   * deliberately not performance: `deRisks` is the "aggressiveness" axis
   * restated as a property of the rule, so the reader draws the conclusion
   * and the site asserts nothing.
   *
   * `fundsNeeded` is the count of distinct tickers in `defaultUniverse`,
   * deduplicated across buckets — what a broker has to support. LAA's five
   * excludes its signals (SPY trend, unemployment), which are read, never
   * held.
   */
  comparison: {
    holds: string
    deRisks: string
    fundsNeeded: number
  }
```

Values, verified by resolving each universe:

| id | holds | deRisks | fundsNeeded |
|---|---|---|---|
| `vaa` | `'1'` | `'all at once'` | `7` |
| `paa` | `'up to 7'` | `'gradually'` | `14` |
| `daa` | `'1 · 4 · 6'` | `'in three steps'` | `15` |
| `baa` | `'1 or 6'` | `'all at once'` | `16` |
| `haa` | `'1 or 4'` | `'all at once'` | `10` |
| `laa` | `'4'` | `'a quarter of the portfolio'` | `5` |

Keep the existing `STRATEGIES` order (vaa, daa, paa, haa, baa, laa) — Task 2 decides display order separately.

- [ ] **Step 3: Update the two consumers**

`StrategyPage.tsx`: `{strategy.blurb}` → `{strategy.tagline}` in the lede.
`StrategyCard.tsx`: `{strategy.blurb}` → `{strategy.tagline}`.

- [ ] **Step 4: Verify**

Run: `cd web && npm run lint && npm run build`
Expected: both clean, no reference to `blurb` left (`grep -rn "blurb" src/` returns only the `.strategy-card__blurb` CSS rule, which Task 2 removes).

- [ ] **Step 5: Commit**

```bash
git add web/src/strategies.ts web/src/routes/StrategyPage.tsx web/src/components/StrategyCard.tsx
git commit -m "feat(web): plain taglines and comparison facts on the strategy catalog"
```

---

### Task 2: The home strategy section becomes a comparison

**Files:**
- Create: `web/src/components/StrategyComparison.tsx`
- Delete: `web/src/components/StrategyGrid.tsx`, `web/src/components/StrategyCard.tsx`
- Modify: `web/src/routes/Home.tsx`, `web/src/index.css`

**Interfaces:**
- Consumes: `STRATEGIES` with `tagline` and `comparison` from Task 1.

- [ ] **Step 1: Build the comparison**

`StrategyComparison.tsx` renders a lede line then one row per strategy, each row a `<Link to={/strategies/${s.id}}>` carrying:

- short name (display face, the visual anchor),
- full name,
- tagline,
- three labelled facts: `Holds`, `De-risks`, `Funds needed`.

The lede, verbatim:

```
New to this? Start with VAA — it has the simplest rule and holds one fund at a time.
```

Order rows so the recommendation reads first: **VAA, DAA, PAA, HAA, BAA, LAA** — the existing `STRATEGIES` order already starts with VAA, so map over it directly rather than re-sorting.

Use a semantic `<table>` only if it stays legible when stacked; a list of rows with a labelled fact group per row is easier to make responsive and is what the styling below assumes. Read `src/index.css` around `.strategy-grid` and `.app-compare` first and follow the idiom you find there.

- [ ] **Step 2: Style it, stacking on narrow screens**

In `index.css`, replace the `.strategy-grid` / `.strategy-card*` block (including `.strategy-card__blurb`, now unreferenced) with the comparison's rules.

Desktop: facts sit in a row, label above value, aligned across strategies so the eye can compare down a column. Heavy rule between rows, per the design system.

**Below 720px** (the existing breakpoint in this file): each strategy becomes a block and the three facts stack with their labels repeated. No horizontal scroll — `DESIGN.md` is editorial and has no data-table idiom, and a table forced through 375px reads worse than repeated labels.

Three colours only. The short name may take `--red` if it earns the emphasis; nothing else introduces colour.

- [ ] **Step 3: Wire it into Home and delete the grid**

`Home.tsx`: replace `<StrategyGrid />` with `<StrategyComparison />` and fix the import. Keep the `id="strategies"` section wrapper — the funnel links to `/#strategies`.

Delete `StrategyGrid.tsx` and `StrategyCard.tsx`; confirm nothing else imports them.

- [ ] **Step 4: Verify**

Run: `cd web && npm run lint && npm run build`
Expected: clean, no unused imports, no dangling CSS selectors for deleted components.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/StrategyComparison.tsx web/src/routes/Home.tsx web/src/index.css
git rm web/src/components/StrategyGrid.tsx web/src/components/StrategyCard.tsx
git commit -m "feat(web): compare the six strategies where the cards used to be"
```

---

### Task 3: "Running this for real", and one stale claim

**Files:**
- Modify: `web/src/routes/Home.tsx`, `web/src/index.css`

- [ ] **Step 1: Add the section between the comparison and the app section**

So the page reads: what these are → how you would actually run one → take it with you.

Content is the monthly cycle and nothing else. Three beats:

1. The signal is computed at the **month-end close**.
2. That allocation is **held through the following month** — it does not change with the market in between.
3. **If you are late, you still move to the month-end allocation**, not to what today's prices say. Acting mid-month is a different, untested rule, and the next rebalance is coming anyway.

The third beat is the one people get wrong and the reason the app exists. Write it as prose in the site's editorial voice — not a numbered list of instructions — and keep it to a short section; the depth lives in the papers.

End the section leading into the existing app section rather than repeating its CTA.

- [ ] **Step 2: Fix the stale app-compare claim**

`Home.tsx`'s `THE APP` column still lists **`Any decision date`**. Phase 2 deleted the date picker, so that is now false.

Replace that line with something the app actually does now, e.g. what it holds in force and tracks between months. Check the current app behaviour described in `docs/superpowers/specs/2026-09-11-phase-2-in-force-decision-design.md` rather than inventing a claim. Leave the other two lines (`Local UCITS ETF mapping (UK first)`, `The same six Keller strategies`) alone — both still true.

The `THIS SITE` column's `Today's decision only` remains accurate.

- [ ] **Step 3: Verify**

Run: `cd web && npm run lint && npm run build`

- [ ] **Step 4: Commit**

```bash
git add web/src/routes/Home.tsx web/src/index.css
git commit -m "feat(web): explain the monthly cycle, and drop a claim phase 2 retired"
```

---

### Task 4: About gains the concepts, before the formulas

**Files:**
- Modify: `web/src/routes/About.tsx`

- [ ] **Step 1: Put plain language in front of the formulas**

About's `How the strategies work, in 30 seconds` currently opens straight onto 13612W and SMA12. Add a passage before it covering, in this order:

- what momentum means here — an asset that has been rising tends to keep rising for a while, and these strategies act on that rather than on forecasts,
- why the strategies count **how many** assets are rising rather than only ranking them — that count is the health of the whole market, not of one holding,
- why a falling count rotates the portfolio into bonds or cash.

That third idea is what the word "breadth" names, and the existing Keller section already uses the term — introduce it plainly here so the later section can lean on it.

Keep the formula section intact after it. This is a side path for readers who want the mechanism, not a replacement.

- [ ] **Step 2: Verify**

Run: `cd web && npm run lint && npm run build`

- [ ] **Step 3: Commit**

```bash
git add web/src/routes/About.tsx
git commit -m "feat(web): explain momentum and breadth before the formulas"
```

---

### Task 5: Plain-language reasoning strings

Copy only. The maths, the response shape, the `Scores` payload and the mode labels are untouched — only the `Reasoning` sentence changes.

This is the last piece of the original diagnosis still open: a newcomer reads this sentence at the moment of action and cannot parse `G4` or `13612W`. The scores stay in the tables directly beneath, and the signal names stay on About and the strategy pages.

**Files:**
- Modify: `backend/src/MomentumInvestment.Api/Strategies/VaaG4B3Service.cs`, `DaaG12Service.cs`, `PaaService.cs`, `HaaService.cs`, `BaaService.cs`, `LaaService.cs`

- [ ] **Step 1: Rewrite each branch**

Keep every interpolated value that names *which* asset was chosen. Drop inline score lists — six numbers in a sentence are unreadable and already tabulated below. Where a single score named the winner, dropping it is fine; the tables carry it.

**`VaaG4B3Service`** — defensive, then offensive:

```csharp
$"At least one of the four offensive assets has stopped trending up, so the " +
$"strategy has moved fully into the strongest defensive holding — {top.Ticker}."
```

```csharp
$"All four offensive assets are trending up, so the strategy holds the " +
$"strongest of them — {top.Ticker}."
```

**`DaaG12Service`** — the `b switch`, cases 0, 1, default:

```csharp
0 =>
    $"Both bellwether assets are trending up, so the strategy is fully " +
    $"invested: the {t} strongest risky assets at {1.0m / T:P2} each — " +
    $"{string.Join(", ", topRisky.Select(r => r.Ticker))}.",
1 =>
    $"One of the two bellwether assets ({string.Join(", ", badCanaries)}) has " +
    $"turned down, so the strategy is half invested: the {t} strongest risky " +
    $"assets at {1.0m / T:P2} each — " +
    $"{string.Join(", ", topRisky.Select(r => r.Ticker))} — with {cf:P0} in " +
    $"{topCash!.Ticker}.",
_ =>
    $"Both bellwether assets have turned down, so the strategy has moved " +
    $"fully into {topCash!.Ticker}.",
```

**`PaaService`** — offensive, defensive, hybrid:

```csharp
$"All {N} risky assets are above their 12-month average, so the strategy " +
$"holds the {T} strongest at {1m / T:P2} each — " +
$"{string.Join(", ", topRisky.Select(r => r.Ticker))}."
```

```csharp
$"Only {n} of {N} risky assets are above their 12-month average — at or below " +
$"the {threshold} this protection level allows — so the strategy has moved " +
$"fully into {topCash!.Ticker}."
```

```csharp
$"{n} of {N} risky assets are above their 12-month average, so the strategy is " +
$"partly invested: the {t} strongest at {riskyWeight:P2} each — " +
$"{string.Join(", ", topRisky.Select(r => r.Ticker))} — with {cashFraction:P0} " +
$"in {topCash!.Ticker}."
```

**`HaaService`** — defensive, then offensive:

```csharp
$"The inflation-protected bellwether ({universe.Canary}) has turned down, which " +
$"this strategy reads as a rising-yield shock, so it has moved fully into " +
$"{universe.Cash}."
```

```csharp
$"The inflation-protected bellwether ({universe.Canary}) is still trending up, " +
$"so the strategy holds the {T} strongest risky assets at {weight:P2} each — " +
$"{string.Join(", ", topRisky.Select(r => r.Ticker))}."
```

**`BaaService`** — offensive, then defensive:

```csharp
$"All {canaryScores.Count} bellwether assets are trending up, so the strategy " +
$"holds the {T} strongest risky assets at {weight:P2} each — " +
$"{string.Join(", ", topRisky.Select(r => r.Ticker))}."
```

```csharp
$"{bad.Count} of {canaryScores.Count} bellwether assets have turned down " +
$"({string.Join(", ", bad.Select(c => c.Ticker))}) — this strategy needs every " +
$"one of them positive — so it has moved fully into {topCash.Ticker}."
```

**`LaaService`** — risk-off, then risk-on. Interpolate the window constants rather than hardcoding "200" and "12":

```csharp
$"Both slow signals have turned: {universe.SignalEquity} is below its " +
$"{SpyTrendWindow}-day average and unemployment is above its " +
$"{UeTrendWindow}-month average. The permanent quarter-shares in " +
$"{string.Join(", ", universe.Permanent)} stay, and the rotating quarter moves " +
$"to {universe.Cash} instead of {universe.Risky}."
```

```csharp
$"The two slow signals are not both negative, so the rotating quarter stays in " +
$"{universe.Risky}, alongside permanent quarter-shares in " +
$"{string.Join(", ", universe.Permanent)}."
```

Delete any local variable left unused by these rewrites (`spyDirection`, `ueDirection`, `spyClose`/`spySma`/`ueValue`/`ueSma` if nothing else reads them — check before removing; some feed the `Scores` payload, which must not change).

- [ ] **Step 2: Verify the vocabulary is gone**

Run:

```bash
cd backend && grep -rn "G4\|B3\|13612W\|SMA12\|GT timing\|Risk-On\|Risk-Off\|canary breadth" src/MomentumInvestment.Api/Strategies/*.cs | grep -i "reasoning\|\\\$\""
```

Expected: no hits inside any `Reasoning` string. Hits in comments, class names (`VaaG4B3Service`), `StrategyId` values and score-calculation code are fine and must stay.

- [ ] **Step 3: Verify the build and tests**

Run: `cd backend && dotnet test --nologo`
Expected: 84/84 pass. No test asserts on reasoning text, so a green run proves only that nothing else broke.

- [ ] **Step 4: Commit**

```bash
git add backend/src/MomentumInvestment.Api/Strategies
git commit -m "feat(api): say why in plain language, not paper vocabulary"
```

---

## Done when

- `cd web && npm run lint && npm run build` and `cd backend && dotnet test` are clean.
- No `Reasoning` string contains `G4`, `B3`, `13612W`, `SMA12`, `CF`, `BF`, `GT timing` or `Risk-On/Off`.
- Home reads: what these are → how to run one → take it with you, with no claim the app no longer supports.
- A reader who has never heard of Keller can pick a strategy from the home page and know what running it would involve.
