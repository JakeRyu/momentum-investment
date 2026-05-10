#!/usr/bin/env python3
"""
Independent verification of the BAA-G12 (Bold Asset Allocation, Keller
2022) decision rule.

The component signals (13612W, SMA12) are verified separately in
`verify_13612w.py` and `verify_paa.py`. This script only checks BAA's
composition logic:

  - Bold canary gate: ALL canaries 13612W > 0  →  offensive
                       any canary  13612W ≤ 0  →  defensive
  - Offensive: top T=6 risky by 13612W at 1/T each
  - Defensive: top 1 cash by SMA12 at 100%

The strict-AND canary makes BAA the most aggressive crash-protector
in the Keller family — even one bearish signal forces full defensive
allocation. Mirrors `BaaServiceTests` so any divergence between Python
and C# means one of them is wrong.
"""

from dataclasses import dataclass
from decimal import Decimal
from typing import List


T = 6  # top-T offensive selection


@dataclass(frozen=True)
class Asset:
    ticker: str
    score: Decimal


def baa_decide(
    canary: List[Asset],   # scores via 13612W
    risky: List[Asset],    # scores via 13612W
    cash: List[Asset],     # scores via SMA12
) -> List[tuple]:
    """Returns a list of (ticker, weight) tuples summing to 1.0."""
    all_canary_good = all(c.score > 0 for c in canary)

    if all_canary_good:
        top = sorted(risky, key=lambda a: a.score, reverse=True)[:T]
        weight = Decimal(1) / Decimal(T)
        return [(a.ticker, weight) for a in top]
    else:
        top_cash = max(cash, key=lambda a: a.score)
        return [(top_cash.ticker, Decimal(1))]


def main() -> None:
    # Canonical canary set — all positive (no defensive trigger).
    canary_all_positive = [
        Asset("TIP", Decimal("0.19")),
        Asset("IEF", Decimal("0.095")),
        Asset("BIL", Decimal("0.019")),
    ]
    # 12 risky scored highest → lowest by 13612W.
    risky = [
        Asset("SPY", Decimal("1.90")),
        Asset("IWM", Decimal("1.71")),
        Asset("QQQ", Decimal("1.52")),
        Asset("VGK", Decimal("1.33")),
        Asset("EWJ", Decimal("1.14")),
        Asset("EEM", Decimal("0.95")),
        Asset("VNQ", Decimal("0.76")),
        Asset("GSG", Decimal("0.57")),
        Asset("GLD", Decimal("0.38")),
        Asset("TLT", Decimal("0.285")),
        Asset("HYG", Decimal("0.228")),
        Asset("LQD", Decimal("0.209")),
    ]
    # 5 cash candidates with SMA12 scores. TLT highest.
    cash = [
        Asset("BIL", Decimal("0.0009")),
        Asset("IEF", Decimal("0.0046")),
        Asset("TLT", Decimal("0.0137")),
        Asset("BND", Decimal("0.0036")),
        Asset("LQD", Decimal("0.0100")),
    ]

    # 1. All canaries positive → offensive top 6.
    decision = baa_decide(canary_all_positive, risky, cash)
    expected_offensive = [
        ("SPY", Decimal(1) / Decimal(6)),
        ("IWM", Decimal(1) / Decimal(6)),
        ("QQQ", Decimal(1) / Decimal(6)),
        ("VGK", Decimal(1) / Decimal(6)),
        ("EWJ", Decimal(1) / Decimal(6)),
        ("EEM", Decimal(1) / Decimal(6)),
    ]
    assert decision == expected_offensive, f"expected offensive top 6, got {decision}"
    print("All canaries positive → offensive top 6 at 1/6 each OK")

    # 2. One canary negative → defensive (top cash by SMA12).
    canary_one_bad = [
        Asset("TIP", Decimal("-0.19")),
        Asset("IEF", Decimal("0.095")),
        Asset("BIL", Decimal("0.019")),
    ]
    decision = baa_decide(canary_one_bad, risky, cash)
    assert decision == [("TLT", Decimal(1))], f"expected 100% TLT, got {decision}"
    print("One canary negative → 100% top cash (TLT by SMA12) OK")

    # 3. Canary exactly 0 → defensive (strict > 0 gate).
    canary_one_zero = [
        Asset("TIP", Decimal("0")),
        Asset("IEF", Decimal("0.095")),
        Asset("BIL", Decimal("0.019")),
    ]
    decision = baa_decide(canary_one_zero, risky, cash)
    assert decision == [("TLT", Decimal(1))], (
        "canary exactly at 0 should fail the strict-AND gate"
    )
    print("Canary at exactly 0 → defensive (strict > 0 boundary) OK")

    # 4. All canaries negative → defensive, cash unchanged.
    canary_all_bad = [
        Asset("TIP", Decimal("-0.19")),
        Asset("IEF", Decimal("-0.38")),
        Asset("BIL", Decimal("-0.019")),
    ]
    decision = baa_decide(canary_all_bad, risky, cash)
    assert decision == [("TLT", Decimal(1))]
    print("All canaries negative → still 100% top cash OK")

    # 5. Cash ranking is independent of risky scores.
    #    Swap cash so BND is highest. Defensive should pick BND, not TLT.
    cash_bnd_highest = [
        Asset("BIL", Decimal("0.0009")),
        Asset("IEF", Decimal("0.0046")),
        Asset("TLT", Decimal("0.0050")),
        Asset("BND", Decimal("0.0150")),  # ← highest now
        Asset("LQD", Decimal("0.0100")),
    ]
    decision = baa_decide(canary_one_bad, risky, cash_bnd_highest)
    assert decision == [("BND", Decimal(1))]
    print("Defensive picks top SMA12 cash (BND) — ranking independent of risky OK")

    # 6. Sanity: T offensive picks should have sum = 1.0 within rounding.
    decision = baa_decide(canary_all_positive, risky, cash)
    total = sum(w for (_, w) in decision)
    assert total == Decimal(1), f"expected sum 1.0, got {total}"
    print("Offensive weights sum to 1.0 OK")

    print()
    print("All BAA assertions passed.")


if __name__ == "__main__":
    main()
