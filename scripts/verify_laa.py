#!/usr/bin/env python3
"""
Independent verification of the Growth-Trend (GT) timing rule used by LAA
(Wouter Keller, 2019, "Lethargic Asset Allocation").

LAA toggles between two portfolios depending on the GT signal:

  - Risk-On  (default): 25% IWD + 25% GLD + 25% IEF + 25% QQQ
  - Risk-Off:           25% IWD + 25% GLD + 25% IEF + 25% SHY  (QQQ → SHY)

Risk-Off triggers when BOTH:
  - SPY < SMA200(SPY)        — equity-trend signal bearish
  - UNRATE > SMA12(UNRATE)   — unemployment trend bearish

Window semantics
----------------
  SMA200(SPY)  = mean of the 200 most recent SPY closes ≤ asOf, *including*
                 the close at asOf if there is one. Same convention as
                 PaaService's SMA12.
  SMA12(UNRATE) = mean of the 12 most recent monthly UNRATE observations
                  with observation_date ≤ asOf.

Score formulae (for the response payload):
  spyTrend = SPY/SMA200 − 1
  ueTrend  = UNRATE/SMA12 − 1

Both follow "value/SMA − 1" so they read consistently (positive = above SMA).

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


@dataclass(frozen=True)
class MonthlyObs:
    d: date
    value: Decimal


def find_index_on_or_before(target: date, history) -> int:
    for i in range(len(history) - 1, -1, -1):
        if history[i].d <= target:
            return i
    raise ValueError(f"no entry on or before {target.isoformat()}")


def daily_sma(asOf: date, history: List[DailyClose], window: int) -> Decimal:
    """Mean of the trailing `window` daily closes ending on the latest entry
    whose date ≤ asOf. Includes the asOf entry if present (matches the C#
    SmaCalculator.DailySma semantics)."""
    end = find_index_on_or_before(asOf, history)
    start = end - window + 1
    if start < 0:
        raise ValueError(f"need {window} entries, only {end + 1} available")
    return sum(h.close for h in history[start : end + 1]) / Decimal(window)


def monthly_sma(asOf: date, history: List[MonthlyObs], window: int) -> Decimal:
    end = find_index_on_or_before(asOf, history)
    start = end - window + 1
    if start < 0:
        raise ValueError(f"need {window} entries, only {end + 1} available")
    return sum(h.value for h in history[start : end + 1]) / Decimal(window)


def value_on_or_before(asOf: date, history) -> Decimal:
    end = find_index_on_or_before(asOf, history)
    h = history[end]
    return h.close if isinstance(h, DailyClose) else h.value


def gt_decision(
    asOf: date,
    spy: List[DailyClose],
    unrate: List[MonthlyObs],
):
    """Return (mode, spy_trend, ue_trend, spy_close, spy_sma, ue_value, ue_sma)."""
    spy_close = value_on_or_before(asOf, spy)
    spy_sma = daily_sma(asOf, spy, window=200)
    ue_value = value_on_or_before(asOf, unrate)
    ue_sma = monthly_sma(asOf, unrate, window=12)

    spy_bearish = spy_close < spy_sma
    ue_bearish = ue_value > ue_sma
    risk_off = spy_bearish and ue_bearish

    spy_trend = spy_close / spy_sma - Decimal(1)
    ue_trend = ue_value / ue_sma - Decimal(1)

    return (
        "Risk-Off" if risk_off else "Risk-On",
        spy_trend,
        ue_trend,
        spy_close,
        spy_sma,
        ue_value,
        ue_sma,
    )


def almost_equal(a: Decimal, b: Decimal, places: int = 18) -> bool:
    return abs(a - b) < Decimal(10) ** -places


def make_flat_spy(asOf: date, today_close: Decimal) -> List[DailyClose]:
    """200 prior days at 100 + today at today_close (201 entries total).
    This matches the LaaServiceTests `FlatSpyHistory` fixture so values
    here mirror the C# expected values."""
    entries = [
        DailyClose(date.fromordinal(asOf.toordinal() - i), Decimal(100))
        for i in range(200, 0, -1)
    ]
    entries.append(DailyClose(asOf, today_close))
    return entries


def make_unrate(asOf: date, current_value: Decimal) -> List[MonthlyObs]:
    """11 prior months at 4.0 + current month at current_value."""
    first_month = date(asOf.year, asOf.month, 1)
    # 11 months before the current month
    entries = []
    y, m = first_month.year, first_month.month
    for back in range(11, 0, -1):
        my, mm = y, m - back
        while mm <= 0:
            mm += 12
            my -= 1
        entries.append(MonthlyObs(date(my, mm, 1), Decimal("4.0")))
    entries.append(MonthlyObs(first_month, current_value))
    return entries


def main():
    asOf = date(2026, 5, 4)

    # 1. Both bearish → Risk-Off.
    spy = make_flat_spy(asOf, Decimal(95))
    ue = make_unrate(asOf, Decimal("5.0"))
    mode, spy_t, ue_t, spy_c, spy_s, ue_v, ue_s = gt_decision(asOf, spy, ue)
    assert mode == "Risk-Off", mode
    # SPY: 199·100 + 95 = 19995, /200 = 99.975. trend = 95/99.975 − 1.
    assert spy_s == Decimal("99.975"), spy_s
    assert spy_c == Decimal(95)
    # UE: 11·4 + 5 = 49, /12 = 49/12. trend = 5/(49/12) − 1 = 60/49 − 1 = 11/49.
    assert ue_s == Decimal(49) / Decimal(12)
    assert ue_v == Decimal("5.0")
    assert almost_equal(ue_t, Decimal(11) / Decimal(49))
    print(f"both bearish: {mode}, spy_trend={spy_t}, ue_trend={ue_t}")
    print(f"               (ue_trend ≈ 11/49 = {Decimal(11)/Decimal(49)})")

    # 2. SPY bearish only → Risk-On.
    mode, _, _, _, _, _, _ = gt_decision(
        asOf, make_flat_spy(asOf, Decimal(95)), make_unrate(asOf, Decimal("3.0"))
    )
    assert mode == "Risk-On", mode
    print(f"spy-only bearish: {mode}")

    # 3. UE bearish only → Risk-On.
    mode, _, _, _, _, _, _ = gt_decision(
        asOf, make_flat_spy(asOf, Decimal(105)), make_unrate(asOf, Decimal("5.0"))
    )
    assert mode == "Risk-On", mode
    print(f"ue-only bearish: {mode}")

    # 4. Neither bearish → Risk-On.
    mode, _, _, _, _, _, _ = gt_decision(
        asOf, make_flat_spy(asOf, Decimal(110)), make_unrate(asOf, Decimal("3.5"))
    )
    assert mode == "Risk-On", mode
    print(f"neither bearish: {mode}")

    # 5. Boundary: SPY exactly at SMA → not bearish (strict <).
    mode, spy_t, ue_t, _, _, _, _ = gt_decision(
        asOf, make_flat_spy(asOf, Decimal(100)), make_unrate(asOf, Decimal("4.0"))
    )
    assert mode == "Risk-On", mode
    assert spy_t == Decimal(0)
    assert ue_t == Decimal(0)
    print(f"both at SMA boundary: {mode}, spy_trend=0, ue_trend=0")

    # 6. Boundary: SPY tiny below SMA + UE tiny above → Risk-Off.
    spy = make_flat_spy(asOf, Decimal("99.99"))
    ue = make_unrate(asOf, Decimal("4.01"))
    mode, _, _, _, _, _, _ = gt_decision(asOf, spy, ue)
    assert mode == "Risk-Off", mode
    print(f"tiny diffs both ways: {mode}")

    # 7. Hand-verified specific scores at the asOf used in the C# tests:
    spy = make_flat_spy(asOf, Decimal(95))
    ue = make_unrate(asOf, Decimal("5.0"))
    _, spy_t, ue_t, _, _, _, _ = gt_decision(asOf, spy, ue)
    expected_spy = Decimal(95) / Decimal("99.975") - Decimal(1)
    assert almost_equal(spy_t, expected_spy)
    expected_ue = Decimal(11) / Decimal(49)
    assert almost_equal(ue_t, expected_ue)
    print(
        f"\nReference values for LaaServiceTests:\n"
        f"  Decide(asOf=2026-05-04, spyClose=95, ueValue=5.0):\n"
        f"    SPY close = 95          SPY SMA200 = 99.975\n"
        f"    UE  value = 5.0         UE  SMA12  = 49/12 ≈ {Decimal(49)/Decimal(12)}\n"
        f"    SPY trend = {spy_t}\n"
        f"    UE  trend = {ue_t} (= 11/49)"
    )

    print()
    print("All assertions passed.")


if __name__ == "__main__":
    main()
