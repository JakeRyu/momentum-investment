#!/usr/bin/env python3
"""
Independent verification of the HAA (Hybrid Asset Allocation, Keller &
Keuning 2023) decision rule.

HAA's mechanics are simpler than VAA/DAA/PAA — the 13612W signal itself
is verified separately in `verify_13612w.py`; HAA just composes:

  - Canary gate:  13612W(canary) ≤ 0  →  100% in cash
  - Offensive:    13612W(canary) >  0  →  top T=4 risky by 13612W at 1/T

So this script is a closed-form check of the gate + ranking, mirroring
the C# HaaServiceTests fixtures so any divergence between Python and C#
means one of them is wrong.
"""

from dataclasses import dataclass
from decimal import Decimal
from typing import List


T = 4  # top-T risky selection


@dataclass(frozen=True)
class Asset:
    ticker: str
    score: Decimal


def haa_decide(canary: Asset, risky: List[Asset], cash: str) -> List[tuple]:
    """Returns a list of (ticker, weight) tuples summing to 1.0."""
    if canary.score <= 0:
        return [(cash, Decimal(1))]

    top = sorted(risky, key=lambda a: a.score, reverse=True)[:T]
    weight = Decimal(1) / Decimal(T)
    return [(a.ticker, weight) for a in top]


def main() -> None:
    # Fixture matches the C# HaaServiceTests "all positive" case:
    # SPY > IWM > VEA > VWO > VNQ > DBC > IEF > TLT, scores 1.90 → 0.57.
    risky_all_positive = [
        Asset("SPY", Decimal("1.90")),
        Asset("IWM", Decimal("1.71")),
        Asset("VEA", Decimal("1.52")),
        Asset("VWO", Decimal("1.33")),
        Asset("VNQ", Decimal("1.14")),
        Asset("DBC", Decimal("0.95")),
        Asset("IEF", Decimal("0.76")),
        Asset("TLT", Decimal("0.57")),
    ]

    # 1. Canary bullish + all risky positive → top 4.
    decision = haa_decide(
        canary=Asset("TIP", Decimal("0.19")),
        risky=risky_all_positive,
        cash="BIL",
    )
    expected = [
        ("SPY", Decimal("0.25")),
        ("IWM", Decimal("0.25")),
        ("VEA", Decimal("0.25")),
        ("VWO", Decimal("0.25")),
    ]
    assert decision == expected, f"expected {expected}, got {decision}"
    print("Canary bullish + 8 good risky → top 4 at 25% OK")

    # 2. Canary bearish → 100% cash, regardless of risky.
    decision = haa_decide(
        canary=Asset("TIP", Decimal("-0.19")),
        risky=risky_all_positive,
        cash="BIL",
    )
    assert decision == [("BIL", Decimal(1))], f"expected 100% BIL, got {decision}"
    print("Canary bearish → 100% BIL (overrides positive risky) OK")

    # 3. Canary exactly 0 → defensive (≤ 0 inclusive).
    decision = haa_decide(
        canary=Asset("TIP", Decimal("0")),
        risky=risky_all_positive,
        cash="BIL",
    )
    assert decision == [("BIL", Decimal(1))], "boundary at 0 should be defensive"
    print("Canary at exactly 0 → defensive (boundary inclusive) OK")

    # 4. Canary bullish + only some risky positive → top 4 still picked
    #    regardless of sign (HAA trusts the canary, not per-asset sign).
    risky_mixed = [
        Asset("SPY", Decimal("1.90")),
        Asset("IWM", Decimal("1.71")),
        Asset("VEA", Decimal("1.52")),
        Asset("VWO", Decimal("-0.19")),
        Asset("VNQ", Decimal("-0.38")),
        Asset("DBC", Decimal("-0.57")),
        Asset("IEF", Decimal("-0.76")),
        Asset("TLT", Decimal("-0.95")),
    ]
    decision = haa_decide(
        canary=Asset("TIP", Decimal("0.19")),
        risky=risky_mixed,
        cash="BIL",
    )
    tickers = [t for (t, _) in decision]
    assert tickers == ["SPY", "IWM", "VEA", "VWO"], (
        f"expected top 4 by score (incl. one negative), got {tickers}"
    )
    print("Canary bullish + 3 good + 5 bad → top 4 includes 1 negative OK")

    # 5. Canary bullish + all risky negative → still top 4 (least-bad).
    risky_all_negative = [
        Asset("SPY", Decimal("-0.19")),
        Asset("IWM", Decimal("-0.38")),
        Asset("VEA", Decimal("-0.57")),
        Asset("VWO", Decimal("-0.76")),
        Asset("VNQ", Decimal("-0.95")),
        Asset("DBC", Decimal("-1.14")),
        Asset("IEF", Decimal("-1.33")),
        Asset("TLT", Decimal("-1.52")),
    ]
    decision = haa_decide(
        canary=Asset("TIP", Decimal("0.19")),
        risky=risky_all_negative,
        cash="BIL",
    )
    tickers = [t for (t, _) in decision]
    assert tickers == ["SPY", "IWM", "VEA", "VWO"], (
        "all-negative risky should still produce top 4 by score under bullish canary"
    )
    print("Canary bullish + all risky negative → top 4 least-bad OK")

    print()
    print("All HAA assertions passed.")


if __name__ == "__main__":
    main()
