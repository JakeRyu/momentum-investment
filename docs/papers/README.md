# Source papers

The six Keller papers this project implements. The PDFs themselves are
**not** committed — SSRN permits download, not redistribution, and this
repository is public. `docs/papers/*.pdf` is git-ignored; download them
here and they will sit alongside this file, ignored.

Every backtest figure published on the site is transcribed from these
PDFs and pinned by `web/src/strategies.test.ts`. The figures, their
variants, and the divergences between paper and implementation are
recorded in
[the phase 4 design doc](../superpowers/specs/2026-09-13-phase-4-learn-course-design.md).

| Strategy | Paper | SSRN |
|---|---|---|
| PAA | Protective Asset Allocation: A Simple Momentum-Based Alternative for Term Deposits (2016) | [abstract_id=2759734](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2759734) |
| VAA | Breadth Momentum and Vigilant Asset Allocation: Winning More by Losing Less (2017) | [abstract_id=3002624](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3002624) |
| DAA | Breadth Momentum and the Canary Universe: Defensive Asset Allocation (2018) | [abstract_id=3212862](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3212862) |
| LAA | Growth-Trend Timing and 60-40 Variations: Lethargic Asset Allocation (2019) | [abstract_id=3498092](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3498092) |
| BAA | Relative and Absolute Momentum in Times of Rising/Low Yields: Bold Asset Allocation (2022) | [abstract_id=4166845](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4166845) |
| HAA | Dual and Canary Momentum with Rising Yields/Inflation: Hybrid Asset Allocation (2023) | [abstract_id=4346906](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4346906) |

Expected local filenames, which the figure-verification work referred to:

```
ssrn-2759734-paa.pdf
ssrn-3002624-vaa.pdf
ssrn-3212862-daa.pdf
ssrn-3498092-laa.pdf
ssrn-4166845-baa.pdf
ssrn-4346906-haa.pdf
```

SSRN serves these behind a Cloudflare challenge, so automated fetching
fails; download them in a browser.
