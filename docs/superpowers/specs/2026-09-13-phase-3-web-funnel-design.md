# Phase 3 — The Web Funnel

Date: 2026-09-13
Scope: `web/` and a copy-only change in `backend/`. No `mobile/` changes.
Parent: `2026-09-11-onboarding-education-design.md` (phase 3 section)

## Background

Phases 1 and 2 closed the app's side of the split: it now answers "what do I
do right now" without background knowledge. The web's side is still open.

The original diagnosis named three blockers that were assigned to the web —
choosing among six strategies is impossible for a newcomer, nothing explains
what any of them is, and nobody says how the monthly workflow actually
works. The web today shows six cards carrying paper-language blurbs
(`SMA12 breadth with selectable protection level a ∈ {0, 1, 2}`) and an
About page that opens with formulas.

There is also one gap the app cannot close on its own: `reasoning` still
reads `G4` and `13612W`, so a newcomer still cannot answer *why* from the
decision screen. That string comes from the backend and is rendered on both
surfaces, which is why it belongs here rather than in a mobile phase.

## The line this phase must not cross

The app is publicly listed by a UK-registered company, so anything that
reads as a personal recommendation or a performance claim is a financial
promotion. This shapes the whole design:

- **Comparison is descriptive, never rated.** No "aggressiveness: high".
  Facts a reader can verify, stated mechanically.
- **No backtest figures.** The papers' CAGR and drawdown numbers stay behind
  the paper links already on each strategy page. Putting them in a
  comparison invites "which one made the most money", which is both the
  wrong way to read a momentum strategy and the most exposed thing a
  marketing page can say.
- **"Start here" is about comprehension and operation, not outcome.** It
  claims VAA is the easiest rule to understand and run, not that it is the
  one to own.

## 1. The home strategy section becomes a comparison

The six cards are replaced by a comparison whose rows are the strategies.
Each row carries the short name, the full name, the plain-language tagline,
and three factual columns:

| | Holds | How it de-risks | Funds needed |
|---|---|---|---|
| VAA | 1 | all at once | 7 |
| PAA | up to 7 | gradually | 14 |
| DAA | 1 · 4 · 6 | in three steps | 15 |
| BAA | 1 or 6 | all at once | 16 |
| HAA | 1 or 4 | all at once | 10 |
| LAA | 4 | a quarter of the portfolio | 5 |

**"How it de-risks" is the column that earns the table.** It is the
"aggressiveness" axis of the original sketch, restated as a mechanical
property instead of a rating — VAA is all-or-nothing, PAA scales with
breadth, LAA can only ever move a quarter. The reader draws their own
conclusion and we assert nothing.

**"Funds needed"** is the count of distinct tickers in the default US
universe, deduplicated across buckets — the practical question of what a
broker has to support. Verified by resolving each strategy's universe.
LAA's 5 excludes its signals (SPY trend, unemployment), which are read but
never held.

**What triggers the defensive switch is not a column** — the taglines
already carry it ("Two bellwether assets decide when to take cover").

Above the table, one line: **"New to this? Start with VAA — it has the
simplest rule and holds one fund at a time."** Grounded in the rule's
simplicity and the operating burden, both of which are visible in the table
itself. (The owner, who runs two strategies, judged LAA's operating load
comparable — its sleeve switch is also at most two trades — but VAA far
easier to understand, and comprehension is what a newcomer needs.)

Each row links to that strategy's page, as the cards did.

**Web taglines are unified with the app's.** `web/src/strategies.ts` still
carries the paper-language `blurb`; it takes the same plain taglines
`mobile/src/strategies.ts` uses, so all surfaces describe a strategy the
same way. The existing `longDescription` on each strategy page is unchanged
— that is where the mechanism belongs.

**Narrow screens stack rather than scroll.** Each strategy becomes a block
that repeats the three labels, rather than a horizontally scrolling table.
The design system (`DESIGN.md`, Brutalist Quarterly) is editorial and has no
data-table idiom; a stacked block is closer to its grain than a table forced
through a 375px viewport.

## 2. "Running this for real"

A new section between the comparison and the existing app section, so the
page reads: what these are → how you would actually run one → take it with
you.

It covers the monthly cycle and nothing else:

- the signal is computed at month-end close,
- that allocation is held through the following month,
- if you are late, you still move to the month-end allocation rather than
  acting on today's prices.

That last point is the one people get wrong, and it is the reason the app
exists — it is also exactly what phase 2 rebuilt the app around. Ending the
section on the App Store CTA connects the explanation to the tool that
tracks it.

## 3. About gains the concepts, before the formulas

About opens today with "How the strategies work, in 30 seconds" and goes
straight to 13612W and SMA12. A plain-language passage goes in front of it:
what momentum means here, why the strategies count *how many* assets are
rising rather than only ranking them, and why a falling count rotates the
portfolio defensively.

The formula section stays, after it — this is a side path for readers who
want the mechanism, not a replacement.

## 4. Plain-language reasoning strings

Backend copy only; the maths, the response shape and the score payloads are
untouched.

Today, `VaaG4B3Service`:

> All offensive (G4) assets have positive 13612W momentum. Offensive mode:
> top G4 by momentum is EMIM.L (1.0840).

After:

> All four offensive assets are trending up, so the strategy holds the
> strongest of them — EMIM.L.

**The vocabulary `G4`, `B3`, `13612W`, `SMA12`, `canary breadth`, `CF`, `BF`
leaves these sentences entirely.** The scores remain in the score tables
directly beneath, and the signal names remain on About and the strategy
pages for anyone who wants them. A sentence read at the moment of action is
the wrong place for paper vocabulary — that was the original blocker 4, left
open deliberately until now.

All six services get the same treatment, in every branch (offensive,
defensive, hybrid, and the per-`a` PAA variants). One number may stay inline
where it names the chosen asset; lists of six scores do not.

Both surfaces pick this up at once, since the string is produced once.

## Out of scope

- Any backtest, performance figure, or chart.
- Changes to strategy maths, universes, the region system, or the API shape.
- `mobile/` — it renders the new reasoning automatically and needs no edit.
- A dark mode for the web (`DESIGN.md` defers it).
- Screenshots or App Store metadata.

## Verification

- `npm run lint` and `npm run build` in `web/`; browse desktop and 375px,
  checking the comparison stacks rather than overflows.
- `dotnet test` in `backend/`. No existing test asserts on reasoning
  strings, so also read the rendered sentence on a strategy page for each of
  the six strategies, in both an offensive and a defensive state (the
  as-of date is fixed to today on the web, so a defensive reading may need a
  strategy that is currently defensive rather than a chosen date).
- Confirm no `G4`, `B3`, `13612W`, `SMA12`, `CF` or `BF` remains in any
  `Reasoning:` string: grep the strategy services.
