namespace MomentumInvestment.Api.Fred;

/// <summary>
/// FRED (Federal Reserve Economic Data) client configuration.
///
/// Uses FRED's official JSON API at <c>api.stlouisfed.org</c>, which
/// requires a free API key. We initially used the keyless CSV download
/// endpoint (<c>fred.stlouisfed.org/graph/fredgraph.csv</c>), but on
/// some macOS networks .NET's TLS handshake to that hostname stalls
/// while curl/Safari succeed; switching to the official API host bypasses
/// the issue and keeps us on a documented, supported endpoint.
///
/// The API key is loaded from configuration (key path <c>Fred:ApiKey</c>)
/// — set it via <c>dotnet user-secrets set "Fred:ApiKey" "..."</c> for
/// local dev so the secret never lands in <c>appsettings.json</c>.
/// </summary>
public sealed class FredOptions
{
    /// <summary>
    /// Base URL for the FRED JSON API. Override in appsettings if the
    /// endpoint ever moves.
    /// </summary>
    public string BaseUrl { get; init; } = "https://api.stlouisfed.org";

    /// <summary>
    /// User-agent sent on every request.
    /// </summary>
    public string UserAgent { get; init; } = "Mozilla/5.0 (compatible; MomentumInvestment/0.1)";

    /// <summary>
    /// FRED API key (32-char alphanumeric string from
    /// https://fredaccount.stlouisfed.org/apikeys). Required — requests
    /// without a key get HTTP 400 from FRED.
    ///
    /// Default empty so the binder doesn't fail on missing config; the
    /// client throws a clear error if the key is empty when a request
    /// is attempted.
    /// </summary>
    public string ApiKey { get; init; } = "";
}
