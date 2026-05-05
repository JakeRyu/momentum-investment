#!/usr/bin/env python3
"""
Independent verification of the 13612W momentum score (Wouter Keller, VAA 2017)
and the date-aware lookback used by the C# backend.

  score = 12·(p0/p1 − 1) + 4·(p0/p3 − 1) + 2·(p0/p6 − 1) + 1·(p0/p12 − 1)

Lookback semantics
------------------
  p0  = trading-day-on-or-before  asOf
  p1  = trading-day-on-or-before  asOf − 1 month
  p3  = trading-day-on-or-before  asOf − 3 months
  p6  = trading-day-on-or-before  asOf − 6 months
  p12 = trading-day-on-or-before  asOf − 12 months

If a target lands on a non-trading day (weekend or holiday), the most
recent trading day before the target is used instead.

This script is the source-of-truth reference the C# unit tests are built
against, since the dev sandbox cannot build .NET locally.
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
    last_day_in_target = (first_next.toordinal() - date(y, m, 1).toordinal())
    return date(y, m, min(d.day, last_day_in_target))


def find_on_or_before(target: date, history: List[DailyClose]) -> DailyClose:
    """Return latest entry in chronologically-sorted history with date <= target."""
    for entry in reversed(history):
        if entry.d <= target:
            return entry
    raise ValueError(f"no price data on or before {target.isoformat()}")


def lookback_prices(asOf: date, history: List[DailyClose]):
    return {
        "p0":  find_on_or_before(asOf,                     history),
        "p1":  find_on_or_before(add_months(asOf, -1),     history),
        "p3":  find_on_or_before(add_months(asOf, -3),     history),
        "p6":  find_on_or_before(add_months(asOf, -6),     history),
        "p12": find_on_or_before(add_months(asOf, -12),    history),
    }


def score_13612w(p0: Decimal, p1: Decimal, p3: Decimal, p6: Decimal, p12: Decimal) -> Decimal:
    return (
        12 * (p0 / p1 - 1)
        + 4 * (p0 / p3 - 1)
        + 2 * (p0 / p6 - 1)
        + 1 * (p0 / p12 - 1)
    )


def main():
    # 1. Calculator: flat prices give 0.
    assert score_13612w(Decimal(100), Decimal(100), Decimal(100), Decimal(100), Decimal(100)) == 0
    print("flat prices: score = 0 OK")

    # 2. Calculator: 19·(r−1) construction.
    for r, expected in [("1.01", "0.19"), ("0.99", "-0.19"), ("1.05", "0.95"), ("0.95", "-0.95")]:
        s = score_13612w(Decimal(100) * Decimal(r), Decimal(100), Decimal(100), Decimal(100), Decimal(100))
        assert s == Decimal(expected), f"r={r}: expected {expected}, got {s}"
    print("19·(r−1) construction: OK")

    # 3. Lookback: weekend skip-back.
    history = [
        DailyClose(date(2026, 1, 2), Decimal(100)),  # Friday
        DailyClose(date(2026, 1, 5), Decimal(101)),  # Monday
    ]
    hit = find_on_or_before(date(2026, 1, 4), history)  # Sunday
    assert hit.d == date(2026, 1, 2)
    print("weekend skip-back: returns 2026-01-02 OK")

    # 4. End-to-end: synthetic asOf with 5 perfectly-placed entries.
    asOf = date(2026, 5, 4)
    history = [
        DailyClose(add_months(asOf, -12), Decimal("100")),
        DailyClose(add_months(asOf, -6),  Decimal("100")),
        DailyClose(add_months(asOf, -3),  Decimal("100")),
        DailyClose(add_months(asOf, -1),  Decimal("100")),
        DailyClose(asOf,                  Decimal("105")),
    ]
    p = lookback_prices(asOf, history)
    s = score_13612w(p["p0"].close, p["p1"].close, p["p3"].close, p["p6"].close, p["p12"].close)
    assert s == Decimal("0.95"), f"expected 0.95, got {s}"
    print(f"synthetic asOf={asOf} with r=1.05: score = {s} OK")

    # 5. Hand-checked numeric example: p0=3000, p1=3300, p3=3000, p6=2727.27, p12=2500.
    s = score_13612w(Decimal(3000), Decimal(3300), Decimal(3000), Decimal("2727.27"), Decimal(2500))
    print(f"hand-check (p0=3000, p1=3300, p3=3000, p6=2727.27, p12=2500): score = {s}")
    assert -Decimal("0.7") < s < -Decimal("0.6"), f"expected ≈ −0.69, got {s}"

    print()
    print("All assertions passed.")


if __name__ == "__main__":
    main()
