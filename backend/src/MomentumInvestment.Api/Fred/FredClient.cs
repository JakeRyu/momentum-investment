using System.Globalization;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace MomentumInvestment.Api.Fred;

/// <summary>
/// Minimal client over FRED's official JSON API.
///   GET https://api.stlouisfed.org/fred/series/observations
///       ?series_id={seriesId}&amp;api_key={key}&amp;file_type=json
///
/// Used by LAA for the US unemployment rate (UNRATE) signal. Requires
/// a free API key (see <see cref="FredOptions.ApiKey"/>); register at
/// <c>https://fredaccount.stlouisfed.org/apikeys</c>.
///
/// Returns observations chronologically sorted (oldest → newest). FRED
/// writes missing values as the string "." — those are skipped, the
/// caller never sees them.
/// </summary>
public sealed class FredClient
{
    private readonly HttpClient _httpClient;
    private readonly FredOptions _options;

    public FredClient(HttpClient httpClient, IOptions<FredOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;

        if (!_httpClient.DefaultRequestHeaders.UserAgent.Any())
        {
            _httpClient.DefaultRequestHeaders.TryAddWithoutValidation("User-Agent", _options.UserAgent);
        }
    }

    public async Task<IReadOnlyList<MonthlyObservation>> GetMonthlySeriesAsync(
        string seriesId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(seriesId))
        {
            throw new ArgumentException("Series ID must be non-empty.", nameof(seriesId));
        }
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            throw new InvalidOperationException(
                "FRED API key is not configured. Set 'Fred:ApiKey' via " +
                "`dotnet user-secrets set \"Fred:ApiKey\" \"<your-key>\"` " +
                "in backend/src/MomentumInvestment.Api.");
        }

        var url =
            $"{_options.BaseUrl}/fred/series/observations" +
            $"?series_id={Uri.EscapeDataString(seriesId)}" +
            $"&api_key={Uri.EscapeDataString(_options.ApiKey)}" +
            $"&file_type=json";

        using var response = await _httpClient.GetAsync(url, cancellationToken).ConfigureAwait(false);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        return ParseJson(json, seriesId);
    }

    /// <summary>
    /// Parses a FRED JSON response body into ordered monthly observations.
    /// Tolerates:
    ///   - the standard <c>{ "observations": [ { "date": "...", "value": "..." }, ... ] }</c> envelope
    ///   - missing values written as <c>"."</c> (skipped)
    ///   - unexpected extra fields on the envelope or per-observation
    /// </summary>
    internal static IReadOnlyList<MonthlyObservation> ParseJson(string json, string seriesId)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        if (!root.TryGetProperty("observations", out var observationsEl) ||
            observationsEl.ValueKind != JsonValueKind.Array)
        {
            throw new FormatException(
                $"FRED JSON for '{seriesId}' missing 'observations' array.");
        }

        var observations = new List<MonthlyObservation>(observationsEl.GetArrayLength());

        foreach (var obs in observationsEl.EnumerateArray())
        {
            if (!obs.TryGetProperty("date", out var dateEl) ||
                dateEl.ValueKind != JsonValueKind.String)
            {
                throw new FormatException(
                    $"FRED observation for '{seriesId}' missing/invalid 'date' field.");
            }
            if (!obs.TryGetProperty("value", out var valueEl) ||
                valueEl.ValueKind != JsonValueKind.String)
            {
                throw new FormatException(
                    $"FRED observation for '{seriesId}' missing/invalid 'value' field.");
            }

            var dateText = dateEl.GetString();
            var valueText = valueEl.GetString();

            if (string.IsNullOrEmpty(dateText)) continue;
            if (string.IsNullOrEmpty(valueText) || valueText == ".")
            {
                // FRED's missing-value sentinel — observation date exists
                // but the value isn't published yet. Skip.
                continue;
            }

            if (!DateOnly.TryParseExact(
                    dateText, "yyyy-MM-dd", CultureInfo.InvariantCulture,
                    DateTimeStyles.None, out var date))
            {
                throw new FormatException(
                    $"FRED JSON for '{seriesId}' has unparseable date '{dateText}'.");
            }
            if (!decimal.TryParse(
                    valueText, NumberStyles.Number, CultureInfo.InvariantCulture, out var value))
            {
                throw new FormatException(
                    $"FRED JSON for '{seriesId}' has unparseable value '{valueText}' on {dateText}.");
            }

            observations.Add(new MonthlyObservation(date, value));
        }

        if (observations.Count == 0)
        {
            throw new InvalidOperationException(
                $"FRED JSON for '{seriesId}' contained no usable observations.");
        }

        // FRED returns oldest → newest already (sort_order=asc default);
        // sort defensively in case a future FRED change ever reorders.
        observations.Sort((a, b) => a.ObservationDate.CompareTo(b.ObservationDate));
        return observations;
    }
}
