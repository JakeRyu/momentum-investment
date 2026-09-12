# Phase 2 — The Decision That Is In Force

Date: 2026-09-11
Scope: `mobile/` only. No backend, no `web/`, no API changes.
Parent: `2026-09-11-onboarding-education-design.md` (phase 2 section)

## Background

Phase 1 made the decision screen self-explanatory but left two things wrong,
both surfaced by testing it.

**It headlines the wrong number.** Keller's rule computes a signal at
month-end close and holds that allocation through the following month. So on
any given day the allocation a user *should be holding* comes from the last
month-end. Phase 1 shows today's live reading, which is a preview of a
rebalance that has not happened yet. A user who rebalances late is still
meant to move to the month-end allocation — acting on a mid-month signal is a
different, untested rule, and re-trading mid-month only adds cost before the
next month-end rebalance anyway.

**The home screen is a form.** It demands three decisions — as-of date,
region, strategy — before any result appears, with a power-user date picker
at the top.

A third fact reshaped the design: **the owner runs two strategies at once.**
Any design built around "pick a strategy" forces that user to switch back and
forth every month. Strategy choice is not the app's job anyway — the spec
assigns that to the web.

## The shape

Three screens.

```
Home                    Detail                      Settings
my strategies'    tap   one strategy's        gear  my strategies
in-force          -->   decision in full      -->   region
allocations             [holding | preview]         ETF universe ->
```

### Registered strategies, not a chosen one

The user *registers* the strategies they actually run. Home shows a card per
registered strategy. A newcomer starts with one (VAA) already registered — no
empty state, no forced choice, and the "immediately show a decision" goal
holds. Someone who wants all six registers all six.

This removes strategy selection from the app's critical path entirely: the
web answers "which strategy is for me", the app is told the answer once.

### Home: what to hold, per strategy

Each card carries the **in-force allocation** — the decision computed at the
last month-end, stable for the whole month:

```
VAA · Vigilant                    DEFENSIVE
Hold now — set at the 31 August rebalance
  SHY                                 100%
                                  [ done ]
```

**Tickers and weights only, no fund names.** The card is the moment of
*execution* — what you type into a broker — and fund names would double its
height. Names belong on the detail screen, the moment of *understanding*.

**Full allocation, not a summary.** A card the user must tap to act on saves
little and costs a tap every month.

Allocations are **not combined across strategies**. A ticker held by two
strategies appears on both cards with each strategy's own weight, because the
owner funds the two separately. No capital split is configured and no
portfolio state is tracked.

### The execution check

A new month flips the in-force decision to one the user has not acted on yet,
and nothing on screen distinguishes "you still need to do this" from "you
already did". That distinction is the whole reason the date picker existed.

Each card carries a **done** toggle. Marking it stores one string per
strategy — the in-force decision's month, e.g. `"2026-08"`. When the month
rolls over, the in-force month no longer matches the stored one and the card
reverts to pending by itself. Cards that are pending are visually
distinguished; cards already done recede.

This is not portfolio tracking and not decision history (both still out of
scope). It is one string per registered strategy, and it resets itself.

### Detail: a segmented view, not a stack

The detail screen is phase 1's decision screen plus a two-way segmented
control:

- **Holding** (default) — the in-force decision, `asOf` = last calendar day
  of the previous month.
- **Preview** — today's reading, explicitly not yet in force.

Segmented rather than stacked because stacking would duplicate the score
tables and the reasoning text. Switching reuses phase 1's entire rendering
path and shows one decision at a time. The screen already hosts a segmented
control in that position (PAA's protection factor), so the pattern is
established.

The cadence line adapts: in Holding it reads that the allocation was set at
the last month-end and names the next rebalance; in Preview it says the
reading is not yet in force and can still change.

On the last day of a month the two segments converge in usefulness — Preview
*is* the decision about to take effect. That falls out of the design with no
special case.

### Settings

A new screen behind the gear: registered strategies (a checklist), region,
and a link to the existing ETF universe screen.

`ETFConfigScreen` is already ~985 lines doing ticker browsing, custom-ticker
probing and overrides. Adding two more concerns to it would make one screen
do three jobs. The new screen is two lists and a link.

Home's card list ends with a **"Add another strategy →"** row into settings,
so registration is discoverable without putting a control on the critical
path.

## Mechanics

**The in-force `asOf` is the last calendar day of the previous month.** Not
the last *trading* day: the backend already resolves `p0` to the
trading-day-on-or-before the requested date, verified against the live API
(a Sunday `asOf` returns a decision, not an error). So no exchange calendar
is needed on the client — the same reason phase 1's cadence line stayed
month-granular.

**Home issues one request per registered strategy**, in parallel, each with
the in-force `asOf`. The preview is fetched only when the detail screen
opens, which halves the cold-start cost of the common case. A failed card
shows its own error and does not take down the screen.

**`rebalanceHint` simplifies.** With the picker gone, `asOf` is only ever the
last month-end or today, so its past-date branch is no longer reachable from
the UI and the function collapses to the two cases the segments need.

**`NotImplementedScreen` is deleted.** All six strategies have
`implemented: true`, so the branch that routes to it cannot be taken.

## Out of scope

- Combining allocations across strategies, and any notion of how capital is
  split between them.
- Decision history, or any record of past months beyond the single
  done-marker string.
- Push notifications or rebalance reminders — still a candidate for a later
  phase, with its own permissions story.
- The plain-language rewrite of `reasoning` (phase 3).
- Any change to strategy maths, universes, or the region system.

## Verification

`cd mobile && npx tsc --noEmit && npx jest`, then the iOS simulator:

1. Fresh install: one card (VAA), decision visible without any input.
2. Two registered strategies: both cards load in parallel, one failing does
   not blank the other.
3. Card shows the in-force allocation; detail's Holding segment matches it.
4. Preview segment differs from Holding mid-month and agrees with what
   phase 1 used to show.
5. Done toggle persists across a relaunch; changing the device clock to the
   next month reverts the card to pending.
6. Settings: registering and unregistering a strategy adds and removes its
   card; region change re-resolves tickers on both cards.
