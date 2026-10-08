# Korean Strategy Pages — Design

Date: 2026-10-08
Scope: `web/` only. No backend or mobile changes.

## Background

Each strategy page opens with a one-line `tagline` and two or three
paragraphs of `longDescription` from `web/src/strategies.ts`. They are
English only. The Korean course (`/ko/learn`, PR #42) links its readers
to these English pages.

Korean readers search for these strategies by name ("VAA 전략",
"DAA 전략"). A Korean page per strategy gives that search a Korean
landing page and gives the Korean course somewhere Korean to link to.

## The line this design keeps

The Korean lessons spec (2026-09-24) left strategy pages out because
showing **today's decision** in Korean to the Korean public sits close to
the line Korean law draws around unregistered investment advice
(유사투자자문업). That reason is about the decision, not about the
explanation. How a published rule works is the same kind of content as
the lessons.

So the Korean pages explain the rule and **do not compute or show a
decision**. A reader who wants the current reading follows a link to the
English page, as the Korean lessons already do.

## Pages

Six routes, `/ko/strategies/{vaa,daa,paa,haa,baa,laa}`, rendered by a new
`routes/KoStrategyPage.tsx`. A separate component rather than a `lang`
prop on `StrategyPage`: the Korean page has no decision tool, no
`AppPromo` and no `LessonKey`, so a shared component would be mostly
branches.

From top to bottom:

| Part | Content |
|---|---|
| Head | Same markup as the English page: dotted short name, English full name as `h1` (names stay English, like the course chrome) |
| Lede | Korean one-line summary |
| Body | Korean explanation, two or three paragraphs |
| Paper line | `논문 ·` + the paper's English title, linked, and year |
| Backtest | `BacktestFigure` as is, in English, when the strategy has one — the same figure Korean lesson 3 already reuses |
| In place of the decision | A short Korean section: what this strategy holds right now is on the English page (linked), plus links to the Korean lessons on momentum, the canary (only for strategies with one) and when to act on the signal |
| Back link | `← 여섯 전략` to the list on `/ko/learn` |

Left out on purpose:

- **`DecisionTool` and the "Today's Decision" banner.** See above.
- **`AppPromo`.** It sells the app's UK UCITS mapping. Korean readers buy
  the US-listed funds the strategies name, so it does not apply.

The page root carries `lang="ko"`. `PageMeta` gets a Korean title and
description, `path` = the Korean URL, and `alternates` pairing it with
`/strategies/{id}`.

## Content

`web/src/strategies.ko.ts` holds, per `StrategyId`, a Korean `tagline`
and `longDescription: string[]`. `strategies.ts` is not touched.

The text is a Korean edition, not a line-by-line translation, as the
lessons were. Facts and numbers must match the English description and
the paper. Terms follow `web/src/lessons/ko/GLOSSARY.md`; a term not in
the glossary is added there and confirmed with the user before it is
used. Claude drafts, the user edits. Claude flags factual problems in the
user's edits, not style.

The rule `strategies.test.ts` applies to English taglines (no author
names or years) applies to the Korean ones too.

## Links in and out

- **English strategy page** gets a `LangSwitch` to its Korean twin, and
  `alternates` in its `PageMeta`.
- **Korean strategy page** gets a `LangSwitch` back to the English page.
- **`/ko/learn`** gets a "여섯 전략" list under the lesson list: each
  strategy's short name, linked to its Korean page, with the Korean
  tagline.
- **Korean lessons:** the one inline link to `/strategies/vaa`
  (`lessons/ko/RunningIt.tsx`) points to `/ko/strategies/vaa` instead.
- **`StrategyComparison`** rows link to `/strategies/{id}`. It gains an
  optional prop for the link prefix so Korean lesson 6
  (`lessons/ko/ChoosingOne.tsx`) can point its rows at the Korean pages.
  The table's English taglines and column heads stay as they are.
- **Sitemap:** six new URLs (29 → 35). Without them the pages are not
  prerendered and return 404 on direct load.

## Tests

- Every `StrategyId` has a Korean entry with a non-empty tagline and at
  least one paragraph; Korean taglines carry no author names or years.
- Each `/ko/strategies/{id}` renders (not the 404 page), with
  `lang="ko"`, and contains no decision tool.
- An unknown id under `/ko/strategies/` renders the 404 page.
- The English and Korean pages link to each other.
- `sitemap.test.ts` covers the six new URLs (extend its strategy check to
  both prefixes).
- Korean lesson 6's table rows link to `/ko/strategies/{id}`; the English
  table still links to `/strategies/{id}`.

## Out of scope

- Korean Home, About, Privacy.
- Translating the comparison table's taglines or column heads.
- Any Korean decision, even a link that pre-fills one.
- Korean account, tax or domestic-ETF content.
