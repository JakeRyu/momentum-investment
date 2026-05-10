#!/usr/bin/env python3
"""
Independent verification of the SMA12 momentum and bond-fraction formula
used by PAA-G12 (Wouter Keller, "Protective Asset Allocation", 2016) and
the monthly lookback shared with the C# backend.

  momentum = p₀ / SMA(p₀..p₁₁) − 1
  SMA(p₀..p₁₁) = (p₀ + p₁ + … + p₁₁) / 12

where p₀ is the price on the as-of date and p₁..p₁₁ are the eleven
preceding monthly closes. Note that p₀ is *included* in the SMA — Keller's
PAA paper defines `SMA12_t = (1/12)·Σ_{i=0}^{11} p_{t−i}`.

  BF = max(0, min(1, (N − n) / N1))
  N1 = N − a·N/4

where N is the risky-universe size, n is the count of good risky assets,
and a ∈ {0, 1, 2} is the protection factor (PAA / PAA1 / PAA2 = Aggressive
/ Moderate / Vigilant). The boundary closed forms checked below pin down
the C# `PaaService` logic across all three a-variants.

Lookback semantics
------------------
  p_i = trading-day-on-or-before (asOf − i months), i ∈ [0, 11]

If a target lands on a non-trading day (weekend or holiday), the most
recent trading day before the target is used instead. This matches the
13612W lookback in `verify_13612w.py`; the only difference is which
months are sampled.

This script is the source-of-truth reference the C# unit tests are built
against.
"""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import List


@dataclass(frozen=True)
class DailyClose:
    d: date
    close: Decimal


def add_months(d: date, months: int) -> date:
    """Return d shifted by `months` months, clamping day if target month is shorter."""
    y = d.year + (d.month - 1 + months) // 12
    m = (d.month - 1 + months) % 12 + 1
    first_next = date(y + (1 if m == 12 else 0), 1 if m == 12 else m + 1, 1)
    last_day_in_target = first_next.toordinal() - date(y, m, 1).toordinal()
    return date(y, m, min(d.day, last_day_in_target))


def find_on_or_before(target: date, history: List[DailyClose]) -> DailyClose:
    """Return latest entry in chronologically-sorted history with date <= target."""
    for entry in reversed(history):
        if entry.d <= target:
            return entry
    raise ValueError(f"no price data on or before {target.isoformat()}")


def monthly_lookback_prices(
    asOf: date, history: List[DailyClose], months_back: int
) -> List[DailyClose]:
    """P₀ at index 0, P₁ at index 1, ..., P_{months_back} at the last index."""
    return [
        find_on_or_before(add_months(asOf, -m), history)
        for m in range(months_back + 1)
    ]


def sma_momentum(closes_including_current: List[Decimal]) -> Decimal:
    """p₀ / mean(p₀..p_N) − 1 — Keller PAA SMA12 definition (current included)."""
    if not closes_including_current:
        raise ValueError("need at least one close")
    sma = sum(closes_including_current) / Decimal(len(closes_including_current))
    return closes_including_current[0] / sma - 1


def almost_equal(a: Decimal, b: Decimal, places: int = 20) -> bool:
    """Equality up to `places` decimal places. Decimal arithmetic truncates
    at ~28 digits, so two paths that mathematically yield the same rational
    can differ in the last digit or two — same situation a precision-aware
    `Assert.Equal` overload handles on the C# side."""
    return abs(a - b) < Decimal(10) ** -places


def bond_fraction(N: int, n: int, a: int) -> Decimal:
    """PAA bond fraction (Keller & van Putten, 2016).

      BF = max(0, min(1, (N − n) / N1))
      N1 = N − a·N/4

    where N is the risky-universe size, n is the count of "good" risky
    assets (positive momentum), and a ∈ {0, 1, 2} is the protection
    factor. For (N=12, a=0/1/2) this gives N1 = 12/9/6.
    """
    n1 = Decimal(N) - Decimal(a) * Decimal(N) / Decimal(4)
    raw = (Decimal(N) - Decimal(n)) / n1
    return max(Decimal(0), min(Decimal(1), raw))


def main():
    # 1. Calculator: flat prices → 0.
    assert sma_momentum([Decimal(100)] * 12) == 0
    print("flat prices: SMA momentum = 0 OK")

    # 2. Calculator: P₀ lifted, others flat → known closed-form.
    #    P₀ = 110, P₁..P₁₁ = 100. SMA = (110 + 11·100)/12 = 1210/12.
    #    momentum = 110 / (1210/12) − 1 = 1320/1210 − 1 = 110/1210 = 1/11.
    closes = [Decimal(110)] + [Decimal(100)] * 11
    s = sma_momentum(closes)
    expected = Decimal(1) / Decimal(11)
    assert almost_equal(s, expected), f"expected {expected}, got {s}"
    print(f"P₀=110, others=100: momentum = {s} (≈ 1/11) OK")

    # 3. Calculator: P₀ dropped symmetrically.
    #    P₀ = 90, P₁..P₁₁ = 100. SMA = 1190/12.
    #    momentum = 90 / (1190/12) − 1 = 1080/1190 − 1 = −110/1190.
    closes = [Decimal(90)] + [Decimal(100)] * 11
    s = sma_momentum(closes)
    expected = -Decimal(110) / Decimal(1190)
    assert almost_equal(s, expected), f"expected {expected}, got {s}"
    print(f"P₀=90,  others=100: momentum = {s} (≈ −110/1190) OK")

    # 3b. Hand-checked closed-form: P₀ = 130, P₁..P₁₁ = 100.
    #    SMA = 1230/12 = 102.5 (exact). 130/102.5 = 52/41. − 1 = 11/41.
    closes = [Decimal(130)] + [Decimal(100)] * 11
    s = sma_momentum(closes)
    expected = Decimal(11) / Decimal(41)
    assert almost_equal(s, expected), f"expected {expected}, got {s}"
    print(f"P₀=130, others=100: momentum = {s} (≈ 11/41) OK")

    # 4. Lookback: weekend skip-back, same shape as the 13612W test.
    history = [
        DailyClose(date(2026, 3, 13), Decimal(95)),   # Fri before Sun 2026-03-15
        DailyClose(date(2026, 4, 15), Decimal(100)),  # Wed (asOf)
    ]
    prices = monthly_lookback_prices(date(2026, 4, 15), history, months_back=1)
    assert prices[0].d == date(2026, 4, 15)
    assert prices[1].d == date(2026, 3, 13)
    print("weekend skip-back: 2026-03-15 (Sun) → 2026-03-13 (Fri) OK")

    # 5. End-to-end: synthetic asOf with 12 perfectly-placed entries.
    asOf = date(2026, 5, 4)
    history = [
        DailyClose(add_months(asOf, -m), Decimal(100)) for m in range(11, 0, -1)
    ]
    history.append(DailyClose(asOf, Decimal(110)))
    prices = monthly_lookback_prices(asOf, history, months_back=11)
    closes = [p.close for p in prices]
    s = sma_momentum(closes)
    print(f"synthetic asOf={asOf}, P₀=110 / others=100: momentum = {s}")
    assert almost_equal(s, Decimal(1) / Decimal(11))

    # 6. Bond fraction across protection factors a ∈ {0, 1, 2}.
    #    Independent reference for the C# PaaService bond-fraction logic;
    #    the unit-test fixtures pin down the same rational closed forms.
    print()
    print("Bond fraction reference (N=12):")

    # 6a. PAA0 (a=0, N1=12). Defensive only at n=0; no protection floor.
    assert bond_fraction(12, 12, 0) == Decimal(0), "PAA0 n=12 → BF=0"
    assert bond_fraction(12, 11, 0) == Decimal(1) / Decimal(12), "PAA0 n=11 → 1/12"
    assert bond_fraction(12, 1,  0) == Decimal(11) / Decimal(12), "PAA0 n=1  → 11/12"
    assert bond_fraction(12, 0,  0) == Decimal(1), "PAA0 n=0  → 1"
    print("  a=0: n=12→0, n=11→1/12, n=1→11/12, n=0→1 OK")

    # 6b. PAA1 (a=1, N1=9). Defensive at n ≤ 3.
    assert bond_fraction(12, 12, 1) == Decimal(0), "PAA1 n=12 → BF=0"
    assert bond_fraction(12, 4,  1) == Decimal(8) / Decimal(9), "PAA1 n=4 → 8/9"
    assert bond_fraction(12, 3,  1) == Decimal(1), "PAA1 n=3 → 1 (boundary)"
    assert bond_fraction(12, 0,  1) == Decimal(1), "PAA1 n=0 → 1 (capped)"
    print("  a=1: n=12→0, n=4→8/9, n=3→1, n=0→1 OK")

    # 6c. PAA2 (a=2, N1=6). Defensive at n ≤ 6 (Keller's Vigilant default).
    assert bond_fraction(12, 12, 2) == Decimal(0), "PAA2 n=12 → BF=0"
    assert bond_fraction(12, 7,  2) == Decimal(5) / Decimal(6), "PAA2 n=7 → 5/6"
    assert bond_fraction(12, 6,  2) == Decimal(1), "PAA2 n=6 → 1 (boundary)"
    assert bond_fraction(12, 0,  2) == Decimal(1), "PAA2 n=0 → 1 (capped)"
    print("  a=2: n=12→0, n=7→5/6, n=6→1, n=0→1 OK")

    print()
    print("All assertions passed.")


if __name__ == "__main__":
    main()
