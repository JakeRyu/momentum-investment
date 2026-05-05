using System.Text.Json;
using Microsoft.Extensions.Options;
using MomentumInvestment.Api.Vaa;

namespace MomentumInvestment.Api.YahooFinance;

/// <summary>
/// Minimal client over Yahoo's unofficial v8 chart endpoint.
///   GET https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?range=2y&interval=1d
///
/// Returns daily adjusted closes sorted chronologically. Callers handle
/// any date-based lookup (e.g. trailing-month lookback) themselves.
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
}
