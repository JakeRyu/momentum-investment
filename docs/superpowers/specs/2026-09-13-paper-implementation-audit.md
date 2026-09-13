# Paper-vs-implementation audit, all six strategies

2026-09-13. Run before phase 4 stage 2, because stage 2 makes drawdown a
comparison axis across all six — and a wrong figure in a comparison is
worse than a wrong figure on one page, since the reader chooses on it.

Method: for each strategy, compare five dimensions between the paper's
own parameter block and the backend service — **universe tickers,
momentum filter, top-N, breadth rule, cash rule**. Sources are the PDFs
listed in `docs/papers/README.md`.

## Summary

| Strategy | Universe | Filter | Top-N | Breadth | Cash | Figure |
|---|---|---|---|---|---|---|
| VAA | ✅ | ✅ | ✅ | ✅ | ✅ | **published** (note 16 figures) |
| DAA | ✅ | ✅ | ✅ | ✅ | ✅ | **published** |
| PAA | ⚠️ proxy | ✅ | ✅ | ✅ | ❌ | published, disclosed |
| LAA | ✅ | ⚠️ | ✅ | ✅ | ✅ | published, disclosed |
| HAA | ✅ | ❌ | ✅ | ❌ | ❌ | **withheld** |
| BAA | ⚠️ proxy | ❌ | ⚠️ | ❌ | ❌ | **withheld** |

✅ matches · ⚠️ defensible divergence, disclose · ❌ blocking

Two of the six are clean. Two diverge in ways worth disclosing. Two are
materially different strategies from the papers they cite.

---

## VAA — clean

`VaaG4B3Service`, `VaaUniverse.Us`

| Dimension | Paper (VAA-G4, T/B=1/1) | Site | |
|---|---|---|---|
| Offensive | SPY, EFA, EEM, AGG | same | ✅ |
| Cash | SHY, IEF, LQD | same | ✅ |
| Filter | 13612W | `Score13612W` | ✅ |
| Top-N | T=1 offensive, 1 defensive | `.First()` both | ✅ |
| Breadth | B=1 — any offensive ≤ 0 → fully defensive | `Any(s => s.Score <= 0m)` | ✅ |

**No fix needed.** The ticker-set issue was already resolved in stage 1:
the paper's Table 8 backtest used VEA/VWO/BND (note 13), so the site
publishes note 16's figures for SPY/EFA/EEM/AGG — 18.8% / −16.4%.

---

## DAA — clean

`DaaG12Service`, `DaaG12Universe.Us`

| Dimension | Paper (Fig. 8: T=6, B=2, NR=12, NP=2) | Site | |
|---|---|---|---|
| Canary | VWO, BND | same | ✅ |
| Risky | G12 with Vanguard substitutions | SPY, IWM, QQQ, VGK, EWJ, VWO, VNQ, GSG, GLD, TLT, HYG, LQD | ✅ |
| Cash | C3 = SHY, IEF, LQD | same | ✅ |
| Filter | 13612W | `Score13612W` | ✅ |
| Top-N / breadth | T=6, B=2, CF = b/B | `T = 6`, `B = 2` | ✅ |

The VWO-not-EEM and VNQ-not-IYR choices are the **paper's own**: DAA
footnote 9 states it uses Vanguard's VEA/VWO/BND and VNQ where VAA used
iShares. Earlier suspicion here was unfounded.

**No fix needed.**

---

## PAA — one real divergence

`PaaService`, `PaaUniverse.Us`

| Dimension | Paper (Fig. 6: PAA2, a=2, Top6, L=12) | Site | |
|---|---|---|---|
| Risky | SPY, QQQ, IWM, VGK, EWJ, EEM, **IYR**, GSG, GLD, HYG, LQD, TLT | same but **VNQ** for IYR | ⚠️ |
| Cash | **IEF alone** | IEF, SHY, LQD — top-1 by SMA12 | ❌ |
| Filter | SMA12 | `ScoreSMA12` | ✅ |
| Top-N | T=6 | `T = 6` | ✅ |
| Breadth | a=2, BF from n | `DefaultA = 2` | ✅ |

**Fix 1 (cash).** Fig. 6's PAA2 uses IEF as the single safe bond; the
paper explores a larger bond universe separately in §5, and those are not
Fig. 6's numbers. The site's three-asset cash sleeve includes **LQD, a
corporate-credit fund** — in a credit-stress month it can be selected as
"cash" and behave nothing like a Treasury, which is precisely the regime
the drawdown figure measures.

Options: narrow cash to IEF to match Fig. 6, or keep the sleeve and keep
disclosing. Currently disclosed in the rendered `variant` string.

**Fix 2 (IYR → VNQ).** Both are US REIT funds; the DAA paper makes the
same substitution deliberately. Cosmetic — no action beyond a comment.

---

## LAA — one near-equivalence

`LaaService`, `LaaUniverse.Us`

| Dimension | Paper (Fig. 12) | Site | |
|---|---|---|---|
| Permanent | IWD, GLD, IEF at 25% each | same | ✅ |
| Rotating | QQQ ↔ SHY at 25% | same | ✅ |
| SPY trend | **SMA10 on month-end prices** | `SpyTrendWindow = 200` trading days | ⚠️ |
| UE trend | SMA12 monthly on UNRATE | `UeTrendWindow = 12` monthly | ✅ |
| Gate | risk-off only if both bearish | same | ✅ |

**Fix 3 (SPY trend window).** The paper states SMA10-monthly three
separate times. ~10 months ≈ 210 trading days, so the signals are close,
but on a monthly gate that exists to avoid whipsaw the two do not produce
identical histories, and Fig. 12's −15.0% is an SMA10 number.

Lowest-severity of the real divergences. Currently disclosed in the
rendered `variant` string. Switching to SMA10-monthly would make the
citation exact.

---

## HAA — three divergences, one of them the paper's titular mechanism

`HaaService`, `HaaUniverse.Us` — **figure withheld**

| Dimension | Paper (Fig 6: HAA-Balanced, G8/T4, L=1) | Site | |
|---|---|---|---|
| Risky | SPY, IWM, VWO, VEA, VNQ, DBC, IEF, TLT | same set | ✅ |
| Canary | TIP (NP=1) | TIP | ✅ |
| Filter | **13612U** — unweighted mean of 1/3/6/12m (`L=1`), all three universes | `Score13612W` (weighted 12/4/2/1) | ❌ |
| Top-N | TO=4 | `T = 4` | ✅ |
| **Dual momentum** | **bad Top-4 assets replaced by cash → fractional cash** (CF=25% when 1 of 4 is bad) | not implemented — top 4 held at 1/4 each regardless of sign | ❌ |
| Cash | BIL, IEF (ND=2, TD=1) | BIL only | ❌ |

**Fix 4 (filter).** `MomentumScorer` needs a `Score13612U` — the
unweighted mean — and `HaaService` must use it for risky, canary and cash.
Paper §4: "we will only use the unweighted 13612U momentum … for each of
the offensive, the defensive, and [the protective] universe."

**Fix 5 (dual momentum) — newly found by this audit, and the largest.**
HAA is *Hybrid* Asset Allocation because it combines canary crash
protection with **traditional dual momentum on the risky sleeve**. The
paper: "bad canary TIP in one month always results in 100% cash, while
absolute momentum (replace bad Top4 asset by cash) often results in
'fractional' cash per month (eg CF=25% when 1 out Top4 is bad)."

The site implements only the canary half. It holds the top 4 by score even
when those scores are negative — so in a broad drawdown where TIP has not
yet turned, the site stays 100% invested where the paper would be
partly or wholly in cash. **This changes live output**, and it is the
mechanism the strategy is named for.

**Fix 6 (cash sleeve).** Fig. 6 picks the better of BIL/IEF. The paper
also presents an `ND=1`, BIL-only variant for simplicity — so BIL-only is
defensible, but then Fig. 6's figures are not the right ones to publish.

---

## BAA — four divergences; a different strategy from the one it cites

`BaaService`, `BaaUniverse.Us` — **figure withheld**

| Dimension | Paper (Fig 3: BAA-G12) | Site | |
|---|---|---|---|
| Canary | **SPY, VWO, VEA, BND** (NP=4, B=1) | **TIP, IEF, BIL** | ❌ |
| Risky | SPY, QQQ, IWM, VGK, EWJ, VWO, VNQ, DBC, GLD, TLT, HYG, LQD | same but EEM for VWO, GSG for DBC | ⚠️ |
| Risky filter | **SMA12** (`LO=12`) | `Score13612W` | ❌ |
| Canary filter | 13612W (`LP=0`) | `Score13612W` | ✅ |
| Top-N risky | TO=6 | `T = 6` | ✅ |
| Cash | **TIP, DBC, BIL, IEF, TLT, LQD, BND — top 3** (ND=7, TD=3), bad picks → BIL | BIL, IEF, TLT, BND, LQD — **top 1** | ❌ |
| Cash filter | SMA12 (`LD=12`) | `ScoreSMA12` | ✅ |

**Fix 7 (canary universe).** The canary *is* the crash-protection
mechanism; swapping four risk assets for three bond/TIPS assets changes
what the strategy reacts to, and therefore its drawdown profile.

**Fix 8 (risky filter) — newly found by this audit.** The paper's design
is explicitly "slow relative momentum with fast absolute momentum": SMA12
for ranking the risky sleeve, 13612W only for the canary. The site uses
13612W for both, losing that separation.

**Fix 9 (cash sleeve).** Top-3 of seven, equal-weighted, with bad picks
replaced by BIL — versus the site's single best of five.

**Fix 10 (proxy tickers).** EEM/VWO and GSG/DBC are ordinary proxy pairs.
Cosmetic.

---

## What to do with this

**Before stage 2 ships a comparison with a drawdown axis:** VAA, DAA, PAA
and LAA are publishable today (two with disclosures already rendered).
HAA and BAA must stay withheld. Stage 2's comparison must therefore
render "—" for two of six rather than assume all six have a figure.

**Recommended order:**

1. **Make this a merge gate, not a review habit.** Record each strategy's
   paper configuration as a fingerprint next to its universe and assert it
   in a test, so a drift in `BaaUniverse.Us` or a filter swap fails CI
   instead of waiting for someone to re-read a PDF. This is the durable
   fix — every divergence above survived multiple reviews precisely
   because nothing compared code to paper automatically.
2. **HAA reconciliation** (fixes 4, 5, 6) — its own change and release.
   Fix 5 changes live allocations for app users.
3. **BAA reconciliation** (fixes 7, 8, 9) — its own change and release.
   Larger than HAA's; effectively a rewrite of the strategy's signals.
4. **PAA and LAA** (fixes 1, 3) — optional. Either narrow to the paper's
   configuration and publish exact citations, or keep the current
   behaviour and keep the disclosures. A decision, not a defect.

Fixes 2 and 10 are proxy-ticker comments, no code change.

**Scope note.** Every fix that changes a signal changes what the shipped
iPhone app tells its users to hold. None of them belong inside a web
presentation stage.
