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
/// </summary>
public sealed record AllocationDecision(
    string StrategyId,
    DateOnly AsOf,
    string ModeLabel,
    IReadOnlyList<Allocation> Allocations,
    IReadOnlyList<AssetMomentum> Scores,
    string Reasoning);
