#!/usr/bin/env python3
"""
Independent verification of the SMA12 momentum used by PAA-G12 (Wouter
Keller, "Protective Asset Allocation", 2016) and the monthly lookback
shared with the C# backend.

  momentum = p₀ / SMA(p₀..p₁₁) − 1
  SMA(p₀..p₁₁) = (p₀ + p₁ + … + p₁₁) / 12

where p₀ is the price on the as-of date and p₁..p₁₁ are the eleven
preceding monthly closes. Note that p₀ is *included* in the SMA — Keller's
PAA paper defines `SMA12_t = (1/12)·Σ_{i=0}^{11} p_{t−i}`.

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

    print()
    print("All assertions passed.")


if __name__ == "__main__":
    main()
