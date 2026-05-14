# Design System — Brutalist Quarterly

Visual direction for the Momentum Investment web frontend, chosen
2026-05-14 via `/design-shotgun` (StrategyPage exploration, variant C).
Reference mockup: [variant-C.html](../.gstack/projects/JakeRyu-momentum-investment/designs/strategypage-20260514/variant-C.html)
(stored under `~/.gstack/projects/JakeRyu-momentum-investment/designs/`).

## Aesthetic

A contemporary brutalist publication crossed with a hedge fund quarterly
report. Magazine spread layout, oversized italic display serif as the
visual hook, classical serif body text, heavy 5px black rules between
sections, asymmetric grid. Treat the page like an editorial spread — the
data sits secondary to the typography, presented as pull-quotes rather
than dashboard widgets.

Mood reference: The Economist column structure × Apartamento typography
× hedge-fund quant brief sobriety.

## Color

Three colors only. No purple. No gradients. No drop shadows.

| Token | Value | Role |
|---|---|---|
| `--bg` | `#f5f1e8` (cream) | Page background |
| `--ink` | `#0a0a0a` (near-black) | All text, all rules, all borders |
| `--red` | `#e63946` (sodium red) | Single bright accent — drop-cap, decision header, allocated marker, state pill |

No dark-mode auto-switch in this direction (the cream/black contrast is
the identity). If a dark mode is added later, it should invert ink↔bg
and keep `--red` unchanged.

## Typography

Three faces. Mix aggressively.

| Token | Stack | Role |
|---|---|---|
| `--display` | `"Times New Roman", "Tiempos Headline", Georgia, serif` (italic, weight 800) | Hero page titles, 80-120px |
| `--body` | `"Source Serif Pro", "Tiempos Text", Georgia, serif` | All body copy, 16-17px, line-height 1.5 |
| `--mono` | `"IBM Plex Mono", ui-monospace, Menlo, monospace` (bold for tickers) | Tickers, scores, section labels, decision header, micro-caps top bar |

IBM Plex Mono is loaded via Google Fonts in `web/index.html`. The serif
faces fall back to system Times/Georgia — close enough at our sizes.

Key sizes:

- **Hero (display, italic)**: 110-120px desktop, scales down via clamp.
  Hard left-aligned, two lines split on visual rhythm.
- **Section header (mono caps, red)**: 64-80px, weight 800, letter-spacing -1px.
- **Lede paragraph (body)**: 24px, drop-cap on first letter (60-70px,
  sodium red, weight 700, normal style — not italic).
- **Body (body)**: 16-17px, justified in 3-col blocks, normal weight.
- **Tickers (mono, bold)**: 220px hero, 14-15px in tables.
- **Micro caps (mono)**: 10-11px, letter-spacing +2-3px, ALL CAPS.

## Layout

- Max content width: ~1200px desktop, centered.
- Generous outer padding: 28-64px depending on breakpoint.
- Asymmetric grids: prefer 2/3 + 1/3 splits over 50/50. 3-column body
  for long-form description (`column-count: 3` with 24-28px gap).
- **Heavy rule**: 5px solid `--ink`. Used between major sections (above
  hero, above decision, above footer).
- **Thin rule**: 1px solid `--ink`. Used inside dense blocks (under
  micro-header, between sub-sections).
- No rounded corners anywhere. Sharp 90° only.
- No drop shadows.

## Components

### Hero (page title)

```
[stencil mono tag — V.A.A. — G4/B3]
[display italic serif, 110px, 2 lines]
```

The strategy short-code tag sits above; the long name spans two
typographic lines below.

### Lede

Single paragraph immediately after the hero, 24px body serif, justified,
max-width ~60ch. Drop-cap on the first letter: 60-70px, sodium red,
floats left, weight 700, line-height 0.85.

### 3-col body

Long-form description (1-3 paragraphs from strategy metadata) renders as
`column-count: 3` with 28px gap. Justified. Each paragraph after the
first prefixes with a sodium red `■` bullet inline.

### Section header (Today's Decision)

Below a heavy 5px black rule. Stencil monospace caps, 64-80px, color
`--red`, hard left-aligned. Right-aligned `As of YYYY.MM.DD` in body
serif italic, 14px.

### Decision spread (asymmetric 2/3 + 1/3)

- **Left (2/3 width)**: massive stencil mono ticker (220px desktop), one
  per allocation row when there's a single asset; below it, the weight
  spelled out in serif italic ("One hundred percent of the portfolio").
  A small red-bordered pill "STATE · DEFENSIVE" sits beneath.
- **Right (1/3 width)**: rationale paragraph in 16px serif italic, narrow
  column. This is the strategy's `reasoning` text.

For multi-asset allocations (DAA, BAA offensive, HAA risky), the hero
stencil tickers stack vertically with their weights, still in the
left 2/3, still stencil mono.

### Score grid

Two side-by-side columns labeled by bucket (`OFFENSIVE / G4`,
`DEFENSIVE / B3`, etc.) in stencil-mono caps. Each row:

- Ticker (mono bold, 14px)
- Score (mono, with `+`/`-` and 4 decimals; negatives in `--red`)
- Dot-matrix bar: 10 cells, `●` filled for magnitude / `○` empty for
  remainder. Positive = ink-colored dots, negative = muted gray
  (`#999`).
- Allocated rows: append a sodium red `■` square at the right edge.

### Footer

Heavy 5px rule above. Small caps centered, 9-10px, mono, letter-spacing
+1.5px. Disclaimer + paper short-codes + API debug line, all on
separate lines, all centered.

## Out of scope (this design phase)

- Dark mode (TBD; if added, invert ink/bg only, keep red).
- Home grid restyling — Home page inherits the new globals (cream, serif
  body, red accent) but its strategy-card grid structure stays. Card
  hover treatment may evolve in a future pass.
- About page typography — inherits globals. Body serif works well for
  long-form Keller bio.
- Mobile-first responsive — current breakpoints are desktop-led;
  responsive polish lands as a separate task.

## Operational notes

- DESIGN.md is the design source of truth. When `/design-shotgun` runs
  again, it will read this file and bias new variants toward this
  aesthetic. Override explicitly if a future page legitimately needs to
  diverge.
- The approved mockup lives at `~/.gstack/projects/JakeRyu-momentum-investment/designs/strategypage-20260514/variant-C.html`
  with `approved.json` next to it.
