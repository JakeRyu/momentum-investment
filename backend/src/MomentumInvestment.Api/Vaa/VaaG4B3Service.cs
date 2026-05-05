using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace MomentumInvestment.Api.Vaa;

/// <summary>
/// VAA-G4/B3 (Vigilant Asset Allocation, conservative variant).
///
/// Universe:
///   - G4 (offensive): SPY, EFA, EEM, AGG
///   - B3 (defensive): LQD, IEF, SHY
///
/// Rule: if any G4 asset has 13612W momentum &lt;= 0 ("bad" momentum),
/// switch to defensive mode and pick the top B3 asset by momentum.
/// Otherwise, pick the top G4 asset by momentum.
/// </summary>
public sealed class VaaG4B3Service
{
    public static readonly IReadOnlyList<string> OffensiveUniverse =
        new[] { "SPY", "EFA", "EEM", "AGG" };

    public static readonly IReadOnlyList<string> DefensiveUniverse =
        new[] { "LQD", "IEF", "SHY" };

    private readonly ILogger<VaaG4B3Service> _logger;

    public VaaG4B3Service(ILogger<VaaG4B3Service>? logger = null)
    {
        _logger = logger ?? NullLogger<VaaG4B3Service>.Instance;
    }

    public VaaDecision Decide(
        DateOnly asOf,
        IReadOnlyDictionary<string, IReadOnlyList<DailyClose>> dailyByTicker)
    {
        var offensiveScores = OffensiveUniverse
            .Select(t => new AssetMomentum(t, ScoreFor(t, asOf, dailyByTicker)))
            .ToList();

        var defensiveScores = DefensiveUniverse
            .Select(t => new AssetMomentum(t, ScoreFor(t, asOf, dailyByTicker)))
            .ToList();

        bool anyOffensiveBad = offensiveScores.Any(s => s.Score <= 0m);

        if (anyOffensiveBad)
        {
            var top = defensiveScores.OrderByDescending(s => s.Score).First();
            return new VaaDecision(
                AsOfMonth: asOf,
                Mode: VaaMode.Defensive,
                SelectedTicker: top.Ticker,
                SelectedScore: top.Score,
                OffensiveScores: offensiveScores,
                DefensiveScores: defensiveScores,
                Reasoning:
                    $"At least one offensive (G4) asset has non-positive 13612W momentum. " +
                    $"Defensive mode: top B3 by momentum is {top.Ticker} ({top.Score:F4}).");
        }
        else
        {
            var top = offensiveScores.OrderByDescending(s => s.Score).First();
            return new VaaDecision(
                AsOfMonth: asOf,
                Mode: VaaMode.Offensive,
                SelectedTicker: top.Ticker,
                SelectedScore: top.Score,
                OffensiveScores: offensiveScores,
                DefensiveScores: defensiveScores,
                Reasoning:
                    $"All offensive (G4) assets have positive 13612W momentum. " +
                    $"Offensive mode: top G4 by momentum is {top.Ticker} ({top.Score:F4}).");
        }
    }

    private decimal ScoreFor(
        string ticker,
        DateOnly asOf,
        IReadOnlyDictionary<string, IReadOnlyList<DailyClose>> daily)
    {
        if (!daily.TryGetValue(ticker, out var history))
        {
            throw new InvalidOperationException($"Missing daily history for ticker '{ticker}'.");
        }

        var p = LookbackPriceLookup.FindLookbackPrices(asOf, history);
        var score = MomentumScoreCalculator.Calculate13612W(
            p.P0.AdjClose, p.P1.AdjClose, p.P3.AdjClose, p.P6.AdjClose, p.P12.AdjClose);

        _logger.LogInformation(
            "13612W {Ticker,-4} p0={P0,9:F4} ({D0:yyyy-MM-dd}) p1={P1,9:F4} ({D1:yyyy-MM-dd}) p3={P3,9:F4} ({D3:yyyy-MM-dd}) p6={P6,9:F4} ({D6:yyyy-MM-dd}) p12={P12,9:F4} ({D12:yyyy-MM-dd}) -> score={Score,8:F4}",
            ticker,
            p.P0.AdjClose, p.P0.Date,
            p.P1.AdjClose, p.P1.Date,
            p.P3.AdjClose, p.P3.Date,
            p.P6.AdjClose, p.P6.Date,
            p.P12.AdjClose, p.P12.Date,
            score);

        return score;
    }
}
