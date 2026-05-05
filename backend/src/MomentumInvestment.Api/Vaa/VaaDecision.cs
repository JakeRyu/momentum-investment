namespace MomentumInvestment.Api.Vaa;

public enum VaaMode
{
    Offensive,
    Defensive,
}

public sealed record AssetMomentum(string Ticker, decimal Score);

public sealed record VaaDecision(
    DateOnly AsOfMonth,
    VaaMode Mode,
    string SelectedTicker,
    decimal SelectedScore,
    IReadOnlyList<AssetMomentum> OffensiveScores,
    IReadOnlyList<AssetMomentum> DefensiveScores,
    string Reasoning);
