# Phase 4 — The Learn Course: from reference work to teaching site

Design doc, 2026-09-13. Follows
[phase 3](2026-09-13-phase-3-web-funnel-design.md).

## Why

A reader with no background cannot start from this site. The landing
page opens with "Six tactical asset allocation strategies, runnable
end-to-end on live market data" and immediately compares six acronyms
on axes (`Holds`, `De-risks`, `ETFs needed`) that assume the reader
already knows what de-risking is. The strategy pages restate the
papers rather than explain them. And the site names a ticker — `SHY`,
100% of the portfolio — without ever saying what that is or how a
person would buy it.

The site is organised as a reference work: six peer entries plus an
about page plus paper links. A beginner needs a **sequence**.

Phase 4 keeps the reference work and adds the sequence in front of it.

## What this is not

- Not a redesign. The Brutalist Quarterly identity (cream/ink/red,
  serif display, sharp corners, heavy rules) is the site's main trust
  asset — it reads as sober rather than promotional, which is the
  correct posture for a beginner audience. Phase 4 adds a second
  register inside that system; it replaces nothing.
- Not a move into advice. The site keeps stating rules and facts and
  keeps refusing to rank or recommend by expected return.
- Not a mobile app change. The app deliberately teaches nothing; that
  stays true. See "Mobile contract" below.

## The core message: drawdown, not return

The site's argument is **not** "these strategies earn more." It is
"these strategies are built to limit how far you fall." This reframing
is the spine of the whole course, and it is supported by the papers
rather than asserted by us.

Keller states the design target himself, in the VAA paper's
introduction:

> "with VAA we aim at moderate but offensive returns above 10% but
> with defensive drawdowns of less than 20%, preferably less than
> 15%."

The papers also optimise a return measure, K25, that is **defined** to
score zero when max drawdown reaches 25% — the drawdown ceiling is
built into the authors' own objective function, not applied by us
afterwards.

### Verified figures

Extracted from the six PDFs in `docs/papers/`. Each row is the variant
this site actually implements, on the paper's full-sample period.
`D` is maximum **monthly (end-of-month)** drawdown.

| Strategy | Paper variant | Period | CAGR | MaxDD | Source |
|---|---|---|---|---|---|
| VAA | VAA-G4 (T/B=1/1) | Dec 1970 – Dec 2016 | 18.9% | 13.0% | Table 8 |
| DAA | DAA-G12 (T=6, B=2) | Dec 1970 – Mar 2018 | 16.0% | 10.6% | Fig. 8 |
| PAA | PAA2 (a=2, Top6, L=12) | Dec 1970 – Dec 2015 | 13.7% | 10.4% | Fig. 6 |
| HAA | HAA-Balanced (G8/T4) | Dec 1970 – Dec 2022 | 15.9% | 9.7% | Fig. 6 |
| BAA | BAA-G12 | Dec 1970 – Jun 2022 | 14.6% | 8.7% | Fig. 3 |
| LAA | LAA (QQQ↔SHY) | Feb 1949 – Oct 2019 | 10.5% | 15.0% | Fig. 12 |

Benchmarks over comparable spans: S&P 500 buy-and-hold `D = 50.8%`,
60/40 `D = 29.4–29.5%`.

### Honesty requirements (non-negotiable)

Every drawdown figure published on the site must carry, in the same
visual block:

1. The **period**, because these are decades-long backtests.
2. The word **backtest**, never a forward-looking verb.
3. **Monthly measurement.** The papers measure end-of-month; the VAA
   paper says so explicitly. Daily drawdowns would be deeper. The site
   must say "measured at month-end" rather than let the reader assume
   an intraday floor.

And the course must include, not as fine print, the cases where it
does **not** hold:

- These are the papers' headline variants. Other variants in the same
  papers do worse — VAA's own pre-1945 span shows 24%, and the HAA
  paper reports `D/FS = 25.2%` for one alternative.
- An independent replication (AllocateSmartly) found VAA's drawdown
  moving from −16.1% to −25.2% when a single asset (AGG) was dropped
  from the universe. Small implementation choices move this number a
  lot.
- The backtests use index proxies for the pre-ETF era, not tradable
  history.

Stating these *raises* trust with the target reader. A beginner
believes "here is when it broke" more readily than "under 20%."

### Copy rule

Allowed: "The papers set out to keep the worst fall under 20%. In the
published backtests of the variants this site runs, the worst
month-end fall ranged 8.7% to 15.0%, against 50.8% for holding the
S&P 500 over the same decades."

Forbidden: any sentence where the site — rather than a cited paper —
predicts a future drawdown, return, or ceiling.

## Mobile contract

The iPhone app carries no explanatory screens by design. Its only exit
for a confused reader is a link to this site, so these paths are a
hard interface, not internal routing:

| App location | Link label | URL |
|---|---|---|
| `HomeScreen.tsx:91` | "How these strategies work →" | `/` |
| `DecisionScreen.tsx:241` | "How this strategy works →" | `/strategies/{id}` ×6 |
| App Store listing | Privacy policy | `/privacy` |

Two obligations follow:

1. **URLs must not move.** No route renames, no redirects, no
   restructuring `/strategies/:id` into `/learn/...`.
2. **The landing page must keep its promise.** The app's label says
   "how these strategies work," so a reader arriving from the app must
   find the six strategies identified **above the fold** — before the
   course entrance. This overrides the original plan to demote the
   comparison; the six-strategy summary stays at the top.

A link-integrity test covering all eight URLs is part of the
implementation plan.

## Information architecture

```
/                  Landing — six-strategy summary (app arrivals),
                   then today's live decision hook, then course entry
/learn             Course contents
/learn/:step       Eight lessons
/strategies/:id    Strategy pages — URL unchanged, copy rewritten
/about             Author, papers, method, disclaimer (reduced)
/privacy           Unchanged
```

### The eight lessons

1. **Why not just buy and hold?** Establishes the problem the papers
   solve: not low returns, but the depth of the falls. Opens with the
   S&P 500's −50.8%.
2. **What momentum actually is.** Price persistence, plainly. Moves
   the concept copy that phase 3 wrote for About.
3. **What breadth adds.** Counting how many assets are rising, and why
   a count beats a forecast. Canary universe with the coal-mine
   metaphor.
4. **One signal a month.** Promotes phase 3's existing Home section
   verbatim — the best beginner copy currently on the site. Covers
   month-end timing and what to do if you are late.
5. **What you would actually buy.** The gap this site has never
   filled. Ticker → real fund → what it holds → where you buy it →
   UCITS equivalents for UK readers. Sources from
   `web/src/etfDescriptions.ts`, which already exists and is currently
   used only inside a collapsed score row.
6. **Drawdown — why these strategies exist.** The three-layer
   structure above: design intent (Keller's own target), verified
   figures, then the honest limits.
7. **Choosing one.** A comparison of the six, reached after the reader
   can parse its axes. Reuses phase 3's comparison **data** (`holds`,
   `deRisks`, `fundsNeeded`) and its "start with VAA for simplicity"
   recommendation with the non-performance rationale intact — but
   needs a **new presentation**: phase 3's row layout is the rejected
   design. Gains a fourth axis once available, the backtest drawdown,
   which is the axis a beginner actually came for.
8. **Running it.** Hands off to the live decision tool and the app.

Lessons 2–4 and 6 are teaching pages. Lessons 1, 5, 7, 8 are
reference-shaped and may stay denser.

## Visual design

The diagnosis is rhythm, not concept. On the current landing page,
seven 5px heavy rules stack — `DESIGN.md` defines the heavy rule as a
separator "between major sections," but phase 3 put one between every
comparison row. When everything is a major section, nothing is. Three
section titles then shout in identical mono caps at identical size,
and the monthly-cycle body occupies the left 45% with nothing
balancing the right.

Changes:

- **Restore the rule hierarchy.** Heavy rule for major sections only;
  comparison rows drop to the thin rule. This alone removes the
  ladder.
- **Two-tier section headings.** The current single treatment
  (`clamp(28px, 5vw, 48px)`, mono, 800, caps) splits into a primary
  and a secondary tier so the page has a shape.
- **Teaching register for lesson pages.** Single column at ~65ch,
  `column-count: 3` and `text-align: justify` released. Newspaper
  setting is for scanning; these pages are for reading. Same fonts,
  same palette.
- **Chapter furniture.** Numbered markers and a left progress rail.
  Knowing how far along you are is the main thing that keeps a
  beginner from bouncing.
- **Definition blocks.** Red-ruled inset for term definitions, reusing
  the existing `--red` accent rather than introducing a new one.
- **Decision tool gains a gloss.** `SHY` gets "short-term US
  Treasuries · the safe corner" beside it, sourced from
  `etfDescriptions.ts`. This is the single highest-value small change
  on the site: it is the moment a beginner is currently most exposed.

No new colors, no new typefaces, no rounded corners, no shadows.
`DESIGN.md` gains a "Teaching register" section rather than being
overwritten.

## Data changes

`web/src/strategies.ts` gains a `backtest` field per strategy:

```ts
backtest: {
  variant: string;      // "VAA-G4 (T/B=1/1)"
  periodStart: string;  // "1970-12"
  periodEnd: string;    // "2016-12"
  cagrPct: number;      // 18.9
  maxDrawdownPct: number; // 13.0
  sourceLabel: string;  // "Table 8"
}
```

Rendered only through a shared component that enforces the honesty
requirements — period, the word backtest, and the month-end
qualifier — so no call site can print a bare number.

## Testing

- Unit: the backtest figures in `strategies.ts` match this document.
- Link integrity: all eight mobile-referenced URLs resolve 200.
- A test asserting the drawdown component never renders a figure
  without its period and source.
- Existing `dotnet test` suite must stay at 84/84; Phase 4 is
  web-only except where noted.

## Also fixed here

`web/src/components/AppPromo.tsx:19` still advertises "runs any date
you choose" — the date picker was removed in phase 2. This is the
third surviving instance of that copy (Home and About were fixed in
phase 3). The file's doc comment repeats the claim and needs the same
correction.

## Open questions

1. **Branching — decided (2026-09-13).** Phase 3's *design* is
   rejected and will not ship. Phase 4 branches fresh from `main`;
   `feat/web-funnel` is abandoned rather than merged.

   Phase 3's **language** is not rejected, and is carried across
   deliberately rather than rewritten:

   | Phase 3 commit | Disposition |
   |---|---|
   | `cd7c10c` plain-language reasoning, 6 services | **Cherry-pick whole** — backend only, no design |
   | `b5dabad` review fixes (backend portion) | **Cherry-pick** the 4 service files |
   | `0441cb6` taglines + comparison facts in `strategies.ts` | **Carry the data**, drop the card wiring |
   | `b406612`, `3b5829c`, `c5af564` About concept copy | **Carry the prose** into lessons 2–3 |
   | `5610d33` "One Signal a Month" prose | **Carry the prose** into lesson 4 |
   | `2773531` `StrategyComparison.tsx` + 89 CSS lines + Home wiring | **Drop** — this is the rejected design |
   | CSS fragments in `5610d33`, `b5dabad` | **Drop** |

   The separation is clean: the rejected design is essentially one
   commit, and the backend work contains no presentation code.
2. **HAA implements a different momentum filter than its paper.**
   Blocking for the HAA backtest row, and a correctness issue beyond
   this phase.

   The HAA paper is explicit that HAA uses **13612U** — the
   *unweighted* average of the 1-, 3-, 6- and 12-month total returns,
   denoted `L=1` — for all three universes (offensive, defensive,
   protective). Paper §4: "we will only use the unweighted 13612U
   momentum ... for each of the offensive, the defensive, and [the
   protective universe]". The HAA-Balanced parameter line reads
   `NO=8, TO=4, ND=2, TD=1, NP=1, L=1`.

   `HaaService.cs:49` calls `MomentumScorer.Score13612W` — the
   *weighted* 12/4/2/1 filter used by VAA/DAA/BAA. The class doc
   comment, `strategies.ts` HAA `longDescription`, and the About page
   all repeat the 13612W claim.

   Consequences: the site cannot print "MaxDD 9.7%, source: HAA paper
   Fig. 6" beside a strategy that computes a different signal than
   Fig. 6 did — that is precisely the kind of claim this phase exists
   to make honest. It also undercuts the site's core promise,
   "computed from the published rules on live market data."

   **Decided (2026-09-13): handled as a separate change, before or
   alongside phase 4 — not inside it.** It changes live output for
   HAA, including in the shipped app, so it carries its own decision,
   its own regression tests (`HaaServiceTests.cs` currently pins the
   13612W behaviour), and its own release. Phase 4 must not publish
   HAA's backtest row until that change has landed; until then the HAA
   row is withheld with a stated reason rather than printed against a
   divergent implementation.

   Separately, the paper's Fig. 6 defensive universe is `BIL, IEF`
   (`ND=2, TD=1`) while the site uses `BIL` only. This one is
   defensible — the same paper presents a `ND=1`, BIL-only variant for
   simplicity — but that variant's figures are not Fig. 6's, so the
   published row must match whichever configuration the code runs.
3. **PAA period label.** The PAA paper's Fig. 6 caption reads "Dec
   1992 – Dec 2015" but the body text defines the full sample as Dec
   1970 – Dec 2015. Caption appears to be a typo; this doc uses the
   body text. Worth a second reading before publishing.
