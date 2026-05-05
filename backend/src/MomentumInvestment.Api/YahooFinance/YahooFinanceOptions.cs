namespace MomentumInvestment.Api.YahooFinance;

public sealed class YahooFinanceOptions
{
    public string BaseUrl { get; init; } = "https://query1.finance.yahoo.com";
    public string UserAgent { get; init; } = "Mozilla/5.0 (compatible; MomentumInvestment/0.1)";
}
