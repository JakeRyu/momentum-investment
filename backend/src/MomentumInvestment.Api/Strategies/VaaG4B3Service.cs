using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace MomentumInvestment.Api.Strategies;

/// <summary>
/// VAA-G4/B3 (Vigilant Asset Allocation, conservative variant).
///
/// Universe is passed in (see <see cref="VaaUniverse"/>) so the same
/// strategy logic can run against US-listed ETFs or LSE-listed UCITS
/// substitutes without forking the code path.
///
/// Rule: if any offensive (G4) asset has 13612W momentum &lt;= 0
/// ("bad" momentum), switch to defensive mode and pick the top
/// defensive (B3) asset by momentum. Otherwise, pick the top offensive
/// asset by momentum.
/// </summary>
public sealed class VaaG4B3Service : IAllocationStrategy<VaaUniverse>
{
    public string StrategyId => "vaa-g4b3";

    private readonly ILogger<VaaG4B3Service> _logger;

    public VaaG4B3Service(ILogger<VaaG4B3Service>? logger = null)
    {
        _logger = logger ?? NullLogger<VaaG4B3Service>.Instance;
    }

    public AllocationDecision Decide(
        DateOnly asOf,
        VaaUniverse universe,
        IReadOnlyDictionary<string, IReadOnlyList<DailyClose>> dailyByTicker)
    {
        var offensiveScores = universe.Offensive
            .Select(t => new AssetMomentum(t, MomentumScorer.Score13612W(t, asOf, dailyByTicker, _logger), Bucket: "Offensive"))
            .ToList();

        var defensiveScores = universe.Defensive
            .Select(t => new AssetMomentum(t, MomentumScorer.Score13612W(t, asOf, dailyByTicker, _logger), Bucket: "Defensive"))
            .ToList();

        var allScores = offensiveScores.Concat(defensiveScores).ToList();

        bool anyOffensiveBad = offensiveScores.Any(s => s.Score <= 0m);

        if (anyOffensiveBad)
        {
            var top = defensiveScores.OrderByDescending(s => s.Score).First();
            return new AllocationDecision(
                StrategyId: StrategyId,
                AsOf: asOf,
                ModeLabel: "Defensive",
                Allocations: new[] { new Allocation(top.Ticker, 1.0m) },
                Scores: allScores,
                Reasoning:
                    $"At least one of the four offensive assets has stopped trending up, so the " +
                    $"strategy has moved fully into the strongest defensive holding — {top.Ticker}.");
        }
        else
        {
            var top = offensiveScores.OrderByDescending(s => s.Score).First();
            return new AllocationDecision(
                StrategyId: StrategyId,
                AsOf: asOf,
                ModeLabel: "Offensive",
                Allocations: new[] { new Allocation(top.Ticker, 1.0m) },
                Scores: allScores,
                Reasoning:
                    $"All four offensive assets are trending up, so the strategy holds the " +
                    $"strongest of them — {top.Ticker}.");
        }
    }
}
