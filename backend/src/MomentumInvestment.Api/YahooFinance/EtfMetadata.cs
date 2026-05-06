namespace MomentumInvestment.Api.YahooFinance;

/// <summary>
/// The subset of Yahoo's chart-meta payload we surface to the client when
/// probing whether a user-supplied ticker exists. All fields except
/// <see cref="Ticker"/> are best-effort — Yahoo's meta block is not
/// uniformly populated across instruments.
/// </summary>
public sealed record EtfMetadata(
    string Ticker,
    string Name,
    string Currency,
    string Exchange,
    DateOnly? FirstAvailableDate);

/// <summary>
/// Thrown when Yahoo cannot resolve the supplied ticker (HTTP 404 or
/// chart.error in the response body).
/// </summary>
public sealed class TickerNotFoundException : Exception
{
    public string Ticker { get; }

    public TickerNotFoundException(string ticker, string? description = null)
        : base(description is null
            ? $"Ticker '{ticker}' not found on Yahoo Finance."
            : $"Ticker '{ticker}' not found on Yahoo Finance: {description}")
    {
        Ticker = ticker;
    }
}
