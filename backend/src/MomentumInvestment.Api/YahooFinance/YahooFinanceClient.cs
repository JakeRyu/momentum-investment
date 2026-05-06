using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Options;
using MomentumInvestment.Api.Strategies;

namespace MomentumInvestment.Api.YahooFinance;

/// <summary>
/// Minimal client over Yahoo's unofficial v8 chart endpoint.
///   GET https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?range=2y&interval=1d
///
/// Returns daily adjusted closes sorted chronologically. Callers handle
/// any date-based lookup (e.g. trailing-month lookback) themselves.
///
/// Also exposes a lightweight <see cref="GetMetadataAsync"/> for ticker
/// validation when users add custom ETFs.
/// </summary>
public sealed class YahooFinanceClient
{
    private readonly HttpClient _httpClient;
    private readonly YahooFinanceOptions _options;

    public YahooFinanceClient(HttpClient httpClient, IOptions<YahooFinanceOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;

        if (!_httpClient.DefaultRequestHeaders.UserAgent.Any())
        {
            _httpClient.DefaultRequestHeaders.TryAddWithoutValidation("User-Agent", _options.UserAgent);
        }
    }

    public async Task<IReadOnlyList<DailyClose>> GetDailyAdjustedClosesAsync(
        string ticker,
        CancellationToken cancellationToken)
    {
        var url = $"{_options.BaseUrl}/v8/finance/chart/{Uri.EscapeDataString(ticker)}?range=2y&interval=1d";

        using var response = await _httpClient.GetAsync(url, cancellationToken).ConfigureAwait(false);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        return ParseDailyCloses(json);
    }

    /// <summary>
    /// Validates a ticker exists on Yahoo and returns the meta block
    /// (currency, exchange, name, first-trade date). Uses the smallest
    /// possible chart range to keep the call cheap.
    /// </summary>
    public async Task<EtfMetadata> GetMetadataAsync(
        string ticker,
        CancellationToken cancellationToken)
    {
        var url = $"{_options.BaseUrl}/v8/finance/chart/{Uri.EscapeDataString(ticker)}?range=5d&interval=1d";

        using var response = await _httpClient.GetAsync(url, cancellationToken).ConfigureAwait(false);

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            throw new TickerNotFoundException(ticker);
        }
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        return ParseMetadata(ticker, json);
    }

    internal static IReadOnlyList<DailyClose> ParseDailyCloses(string json)
    {
        using var doc = JsonDocument.Parse(json);

        var chart = doc.RootElement.GetProperty("chart");

        if (chart.TryGetProperty("error", out var errorEl) && errorEl.ValueKind != JsonValueKind.Null)
        {
            var description = errorEl.TryGetProperty("description", out var d) ? d.GetString() : "unknown";
            throw new InvalidOperationException($"Yahoo Finance error: {description}");
        }

        var result = chart.GetProperty("result")[0];
        var timestamps = result.GetProperty("timestamp");
        var adjClose = result
            .GetProperty("indicators")
            .GetProperty("adjclose")[0]
            .GetProperty("adjclose");

        int n = timestamps.GetArrayLength();
        var closes = new List<DailyClose>(n);

        for (int i = 0; i < n; i++)
        {
            var closeEl = adjClose[i];
            if (closeEl.ValueKind == JsonValueKind.Null) continue;

            long ts = timestamps[i].GetInt64();
            var date = DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(ts).UtcDateTime);
            decimal close = closeEl.GetDecimal();
            closes.Add(new DailyClose(date, close));
        }

        // Yahoo returns chronologically already, but sort defensively.
        closes.Sort((a, b) => a.Date.CompareTo(b.Date));
        return closes;
    }

    internal static EtfMetadata ParseMetadata(string requestedTicker, string json)
    {
        using var doc = JsonDocument.Parse(json);
        var chart = doc.RootElement.GetProperty("chart");

        if (chart.TryGetProperty("error", out var errorEl) && errorEl.ValueKind != JsonValueKind.Null)
        {
            var description = errorEl.TryGetProperty("description", out var d) ? d.GetString() : null;
            throw new TickerNotFoundException(requestedTicker, description);
        }

        var resultArray = chart.GetProperty("result");
        if (resultArray.ValueKind == JsonValueKind.Null || resultArray.GetArrayLength() == 0)
        {
            throw new TickerNotFoundException(requestedTicker, "Yahoo returned no result.");
        }

        var meta = resultArray[0].GetProperty("meta");

        string symbol = TryString(meta, "symbol") ?? requestedTicker;
        string currency = TryString(meta, "currency") ?? "";
        string exchange = TryString(meta, "exchangeName") ?? "";
        string name =
            TryString(meta, "longName")
            ?? TryString(meta, "shortName")
            ?? symbol;

        DateOnly? firstDate = null;
        if (meta.TryGetProperty("firstTradeDate", out var ftd) && ftd.ValueKind == JsonValueKind.Number)
        {
            long epoch = ftd.GetInt64();
            firstDate = DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(epoch).UtcDateTime);
        }

        return new EtfMetadata(symbol, name, currency, exchange, firstDate);
    }

    private static string? TryString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var prop)) return null;
        if (prop.ValueKind != JsonValueKind.String) return null;
        var value = prop.GetString();
        return string.IsNullOrWhiteSpace(value) ? null : value;
    }
}
