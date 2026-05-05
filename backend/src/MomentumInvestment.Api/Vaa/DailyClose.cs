namespace MomentumInvestment.Api.Vaa;

/// <summary>
/// One daily adjusted close for a single ticker. AdjClose accounts for
/// dividends and splits so total return is reflected in momentum.
/// </summary>
public sealed record DailyClose(DateOnly Date, decimal AdjClose);
