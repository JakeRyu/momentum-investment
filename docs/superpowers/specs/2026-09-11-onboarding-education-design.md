# Onboarding & Education Split — Design

Date: 2026-09-11
Scope: `mobile/` and `web/`. No backend changes in phases 1–2; phase 3
includes a copy-only change to strategy reasoning strings.

## Background

The MVP is complete: six Keller strategies live end-to-end, the iPhone app
is on the App Store (#9), and the web funnel points at it. The next goal is
promotion — real users, not just a working tool.

User feedback says the app is hard to use without background knowledge. A
walk-through of the actual screens confirms five distinct blockers:

1. **Home is a form, not a dashboard.** `HomeScreen` demands three
   decisions (as-of date, region, strategy) before any result appears. The
   as-of date picker — a power-user control — sits at the top.
2. **Choosing among six strategies is impossible for a newcomer.** The
   blurbs in `mobile/src/strategies.ts` are paper language ("SMA12 breadth
   with selectable protection level a ∈ {0, 1, 2}"). There is no axis to
   compare on and no recommendation.
3. **The app contains zero explanatory content.** No about, help, or
   glossary anywhere in `mobile/`. All of it lives on the web.
4. **The result screen shows tickers and bare numbers.** `SPY 100%` with no
   fund name; reasoning text citing "G4" and "13612W"; scores like `+0.1234`
   with no unit or direction; an `OFFENSIVE MODE` badge that is never
   defined. The web already has one-line ticker descriptions
   (`web/src/etfDescriptions.ts`); the app has no equivalent.
5. **Nothing says what to do with the answer.** These are monthly-rebalance
   strategies, but no user-facing text states the cadence, what action the
   allocation implies, or when to come back. Re-opening the app mid-month
   can show a different answer with no indication that this is expected.

## Division of labour

The split is by **question type**, not by amount of text:

- **Web answers "why and how does this work"** — the interest stage.
  Unlimited depth, comparison tables, concepts, papers.
- **Mobile answers "what do I do right now"** — the action stage. One
  screen, minimum taps.

Blockers 1, 2 and 3 are therefore web work: a newcomer should arrive at the
App Store already knowing which strategy they want and why. An in-app About
screen is explicitly **not** planned.

Blockers 4 and 5 stay in the app, because they are part of the answer rather
than education:

- **Timing differs.** The web is read once, before download; the app is
  opened a month later at the moment money moves. "Is it time to rebalance?"
  is a question that recurs every visit and cannot be pre-answered on a web
  page.
- **Not every user passes through the web.** App Store search is a direct
  entry path, and the app currently has no outbound link of any kind — a
  user stuck in the app has no exit. This reverses the Phase A decision to
  decline a mobile back-link (see
  `2026-09-11-app-funnel-phase-b-design.md`, Out of scope).

Crucially, closing 4 and 5 costs three lines of screen space, not a
tutorial. Depth still goes to the web behind one link.

## Phase 1 — Mobile: make the decision self-explanatory

Highest leverage per unit of change, and it ships first because App Store
review adds latency that web deploys do not have.

1. **Fund names under tickers.** Port `web/src/etfDescriptions.ts` into
   `mobile/src/` and render the one-liner beneath the allocation ticker
   (hero and list forms) in `DecisionScreen`.
2. **Mode caption.** One line beside/below the mode badge stating what the
   mode means in plain terms (e.g. Offensive → "holding risk assets";
   Defensive → "out of risk assets, in bonds/cash"; Hybrid → "partially
   de-risked").
3. **Next-action line.** A single line stating the cadence and the next
   checkpoint — "Rebalance monthly · next at end of September". Deliberately
   month-granular, not a trading-day date: it avoids importing an exchange
   calendar into the client and is accurate enough as guidance.
4. **Collapse the score tables.** Per-bucket momentum tables become
   tap-to-expand, closed by default. This *removes* density from the default
   view, offsetting the three lines added above.
5. **Outbound link.** A footer link opening the matching web strategy page
   for depth.

## Phase 2 — Mobile: home as dashboard

Reverses the home screen: on launch, immediately fetch and show the decision
for the last-used strategy. Strategy, region and as-of move to compact
controls (chips or a settings sheet) rather than a top-level form.

Effect: taps-to-answer goes 4 → 0, and the newcomer is no longer asked to
make an uninformed choice before seeing anything. The as-of date picker
stops being the first thing a newcomer meets.

Kept out of phase 1 because it is the larger structural change and benefits
from phase 1's result presentation already being settled.

## Phase 3 — Web: the funnel

1. **Strategy comparison table** — all six on one grid, compared on
   aggressiveness, volatility/drawdown character, trading frequency, and
   complexity, with an explicit "start here" recommendation. This directly
   attacks blocker 2; comparison is the main path because a funnel visitor
   wants to know "is one of these for me?", not to study.
2. **"Running this for real"** — a section on the monthly workflow: when to
   check, what a rebalance involves, what the app does for you. Ends in the
   App Store CTA. This is blocker 5's educational half.
3. **Concept explainer as the side path** — extend About with momentum,
   breadth, and why defensive rotation happens, for readers who want it.
4. **Plain-language reasoning strings** (backend copy only). The current
   text ("All offensive (G4) assets have positive 13612W momentum") is
   rendered on both surfaces. Rewriting it in plain language serves both;
   the technical framing remains available in the score tables and the
   strategy long-descriptions.

Ordering within phase 3 is 1 → 2 → 3 → 4.

## Out of scope

- In-app About / glossary / onboarding tutorial screens (web's job).
- Push notifications or rebalance reminders. A likely phase 4, but it
  changes the app's permissions story and deserves its own design.
- Decision history / "what changed since last month". Attractive, but needs
  persistence the app does not have.
- Any change to strategy maths, universes, or the region system.

## Verification

Per phase:

- **Phase 1 / 2 (mobile):** `npx tsc --noEmit` in `mobile/`, then run in the
  iOS simulator and walk each strategy — check the fund names, mode caption,
  next-action line, collapsed tables, and the outbound link. Note: bump
  `app.json` version to match the App Store Connect prepared version before
  any build.
- **Phase 3 (web):** `npm run lint` and `npm run build` in `web/`, then
  browse desktop and 375px. No existing test asserts on reasoning strings,
  so the backend copy change is verified by `dotnet test` (no regression)
  plus reading the rendered text on a strategy page for each of the six
  strategies in both offensive and defensive states.
