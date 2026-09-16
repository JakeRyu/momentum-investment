namespace MomentumInvestment.Api.Strategies;

/// <summary>
/// One asset's portfolio weight in a strategy's chosen allocation.
/// Weights across all <see cref="Allocation"/> entries in a single
/// <see cref="AllocationDecision"/> sum to 1.0 (ignoring floating-point
/// rounding).
/// </summary>
public sealed record Allocation(string Ticker, decimal Weight);

/// <summary>
/// One asset's 13612W score and its role in the strategy's universe.
///
/// <see cref="Bucket"/> is a strategy-specific label so the mobile client
/// can group scores for display:
///   - VAA-G4/B3: "Offensive" | "Defensive"
///   - DAA-G12:   "Canary"    | "Risky"     | "Cash"
/// </summary>
public sealed record AssetMomentum(string Ticker, decimal Score, string Bucket);

/// <summary>
/// Generic per-strategy decision response. Replaces the strategy-specific
/// VaaDecision so the mobile client can render any Keller-family strategy
/// (single-asset like VAA, multi-asset like DAA, hybrid mixes) with one
/// rendering path: "show the allocations, show the scores grouped by bucket".
///
/// Two dates, and they mean different things:
///   <see cref="AsOf"/>        what the caller asked for, echoed back. The
///                             lookback anchors (−1/−3/−6/−12 months) are
///                             measured from it, so two requests a day apart
///                             score differently even off the same closes.
///   <see cref="PricesAsOf"/>  the latest close the reading could reach. On a
///                             weekend, a holiday, or before the US open,
///                             this is earlier than <see cref="AsOf"/>.
///
/// <see cref="AsOf"/> keeps its original meaning deliberately. Clients in the
/// field read it, and this field was added beside it rather than over it.
/// </summary>
public sealed record AllocationDecision(
    string StrategyId,
    DateOnly AsOf,
    DateOnly PricesAsOf,
    string ModeLabel,
    IReadOnlyList<Allocation> Allocations,
    IReadOnlyList<AssetMomentum> Scores,
    string Reasoning)
{
    /// <summary>
    /// "current" or "outdated" — whether the calling app is old enough that
    /// we no longer stand behind what it renders. See
    /// <see cref="ClientVersion"/>.
    ///
    /// It sits outside the primary constructor on purpose. The strategy
    /// services build these records and have no business knowing about HTTP
    /// headers, so the endpoints stamp it on afterwards with `with`. The
    /// default means every caller that never gets stamped — every unit
    /// test, and the website, which sends no version — reads as current.
    /// </summary>
    public string ClientStatus { get; init; } = ClientVersion.Current;
}
