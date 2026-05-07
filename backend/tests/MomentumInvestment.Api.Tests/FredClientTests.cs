using MomentumInvestment.Api.Fred;
using Xunit;

namespace MomentumInvestment.Api.Tests;

/// <summary>
/// JSON parsing for the FRED API endpoint
/// (<c>api.stlouisfed.org/fred/series/observations?file_type=json</c>).
/// The actual HTTP fetch is exercised end-to-end on the Mac dev box;
/// these tests pin the parser shape so missing-value sentinels, weird
/// envelopes, and ordering all behave.
/// </summary>
public sealed class FredClientTests
{
    [Fact]
    public void ParseJson_StandardResponse_ReturnsObservationsInChronologicalOrder()
    {
        var json = """
        {
          "observations": [
            { "date": "2026-01-01", "value": "4.0" },
            { "date": "2026-02-01", "value": "4.1" },
            { "date": "2026-03-01", "value": "4.2" }
          ]
        }
        """;

        var observations = FredClient.ParseJson(json, "UNRATE");

        Assert.Equal(3, observations.Count);
        Assert.Equal(new DateOnly(2026, 1, 1), observations[0].ObservationDate);
        Assert.Equal(4.0m, observations[0].Value);
        Assert.Equal(new DateOnly(2026, 3, 1), observations[2].ObservationDate);
        Assert.Equal(4.2m, observations[2].Value);
    }

    [Fact]
    public void ParseJson_DotIsMissingValueSentinel_Skipped()
    {
        var json = """
        {
          "observations": [
            { "date": "2026-01-01", "value": "4.0" },
            { "date": "2026-02-01", "value": "." },
            { "date": "2026-03-01", "value": "4.2" }
          ]
        }
        """;

        var observations = FredClient.ParseJson(json, "UNRATE");

        Assert.Equal(2, observations.Count);
        Assert.Equal(new DateOnly(2026, 1, 1), observations[0].ObservationDate);
        Assert.Equal(new DateOnly(2026, 3, 1), observations[1].ObservationDate);
    }

    [Fact]
    public void ParseJson_TolerateExtraEnvelopeFields()
    {
        // FRED's real response includes realtime_start/end, count, limit,
        // sort_order, etc. Make sure the parser doesn't choke on them.
        var json = """
        {
          "realtime_start": "2026-05-07",
          "realtime_end": "2026-05-07",
          "observation_start": "1948-01-01",
          "observation_end": "9999-12-31",
          "units": "lin",
          "count": 2,
          "offset": 0,
          "limit": 100000,
          "observations": [
            {
              "realtime_start": "2026-05-07",
              "realtime_end": "2026-05-07",
              "date": "2026-01-01",
              "value": "4.0"
            },
            {
              "realtime_start": "2026-05-07",
              "realtime_end": "2026-05-07",
              "date": "2026-02-01",
              "value": "4.1"
            }
          ]
        }
        """;

        var observations = FredClient.ParseJson(json, "UNRATE");

        Assert.Equal(2, observations.Count);
        Assert.Equal(4.0m, observations[0].Value);
        Assert.Equal(4.1m, observations[1].Value);
    }

    [Fact]
    public void ParseJson_OutOfOrderInput_SortedAscending()
    {
        // Defensive sort: even if a future FRED change ever returns rows
        // out of order, the parser yields chronological output.
        var json = """
        {
          "observations": [
            { "date": "2026-03-01", "value": "4.2" },
            { "date": "2026-01-01", "value": "4.0" },
            { "date": "2026-02-01", "value": "4.1" }
          ]
        }
        """;

        var observations = FredClient.ParseJson(json, "UNRATE");

        Assert.Equal(new DateOnly(2026, 1, 1), observations[0].ObservationDate);
        Assert.Equal(new DateOnly(2026, 2, 1), observations[1].ObservationDate);
        Assert.Equal(new DateOnly(2026, 3, 1), observations[2].ObservationDate);
    }

    [Fact]
    public void ParseJson_AllValuesMissing_Throws()
    {
        var json = """
        {
          "observations": [
            { "date": "2026-01-01", "value": "." },
            { "date": "2026-02-01", "value": "." }
          ]
        }
        """;

        Assert.Throws<InvalidOperationException>(() => FredClient.ParseJson(json, "UNRATE"));
    }

    [Fact]
    public void ParseJson_MissingObservationsArray_Throws()
    {
        // FRED returns an "error_message" envelope on bad keys; we don't
        // try to parse those — just surface a clear FormatException.
        var json = """
        {
          "error_code": 400,
          "error_message": "Bad Request. The value for variable api_key is not a 32 character alpha-numeric lower-case string."
        }
        """;

        Assert.Throws<FormatException>(() => FredClient.ParseJson(json, "UNRATE"));
    }

    [Fact]
    public void ParseJson_MalformedNumber_Throws()
    {
        var json = """
        {
          "observations": [
            { "date": "2026-01-01", "value": "not-a-number" }
          ]
        }
        """;

        Assert.Throws<FormatException>(() => FredClient.ParseJson(json, "UNRATE"));
    }

    [Fact]
    public void ParseJson_MissingDateField_Throws()
    {
        var json = """
        {
          "observations": [
            { "value": "4.0" }
          ]
        }
        """;

        Assert.Throws<FormatException>(() => FredClient.ParseJson(json, "UNRATE"));
    }
}
