using System.Net;
using System.Net.Security;
using System.Security.Authentication;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;
using MomentumInvestment.Api;
using MomentumInvestment.Api.Fred;
using MomentumInvestment.Api.Strategies;
using MomentumInvestment.Api.YahooFinance;

var builder = WebApplication.CreateBuilder(args);

// Serialize enums as their string names instead of integers, so the mobile
// client can switch on them directly. (DateOnly already serializes as
// "yyyy-MM-dd" without help.)
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddMemoryCache();
builder.Services.Configure<YahooFinanceOptions>(builder.Configuration.GetSection("YahooFinance"));
builder.Services.Configure<FredOptions>(builder.Configuration.GetSection("Fred"));
builder.Services.AddHttpClient<YahooFinanceClient>();

// FRED HttpClient — talks to api.stlouisfed.org (the JSON API).
//
// Background: we initially used fred.stlouisfed.org/graph/fredgraph.csv
// (no API key needed), but on Jake's macOS .NET's TLS handshake to that
// hostname stalled — ClientHello sent, ServerHello never arrived. curl
// on the same machine worked fine via Secure Transport, and Rider's
// Netty client also failed, suggesting that hostname's TLS endpoint
// dislikes the OpenSSL-style ClientHello produced by JVM/.NET stacks.
//
// Switched to api.stlouisfed.org which is on different infrastructure
// (different TLS termination), and requires a free API key set via
// `dotnet user-secrets set "Fred:ApiKey" "..."`. The handler tweaks
// below are precautionary for the same TLS class of issue: HTTP/1.1
// forced (no ALPN ambiguity), TLS 1.2 only (skip 1.3 negotiation),
// revocation-check disabled (curl-equivalent), and a tight 15s timeout
// so a stuck handshake surfaces as a clean 5xx rather than blocking
// the endpoint for ~75s.
builder.Services.AddHttpClient<FredClient>(client =>
{
    client.DefaultRequestVersion = HttpVersion.Version11;
    client.DefaultVersionPolicy = HttpVersionPolicy.RequestVersionOrLower;
    client.Timeout = TimeSpan.FromSeconds(15);
}).ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
{
    ConnectTimeout = TimeSpan.FromSeconds(10),
    SslOptions = new SslClientAuthenticationOptions
    {
        EnabledSslProtocols = SslProtocols.Tls12,
        CertificateRevocationCheckMode = System.Security.Cryptography.X509Certificates.X509RevocationMode.NoCheck,
    },
});
builder.Services.AddSingleton<VaaG4B3Service>();
builder.Services.AddSingleton<DaaG12Service>();
builder.Services.AddSingleton<PaaService>();
builder.Services.AddSingleton<LaaService>();
builder.Services.AddSingleton<HaaService>();
builder.Services.AddSingleton<BaaService>();

// CORS — dev gets the wide-open policy Expo Go needs; production reads
// an allow-list from `Cors:AllowedOrigins` (empty by default).
//
// Note for the deployed setup: the iOS native fetch used by Expo Go
// does NOT send an Origin header, so CORS does not gate mobile-app
// requests at all — it only matters if a browser starts hitting these
// endpoints. The allow-list is here for hygiene; leaving it empty in
// production blocks browsers without affecting the mobile app.
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
            return;
        }

        var origins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? Array.Empty<string>();

        if (origins.Length > 0)
        {
            policy.WithOrigins(origins).AllowAnyMethod().AllowAnyHeader();
        }
        // else: no origins allowed — browser cross-origin requests will
        // be rejected by the browser's preflight check.
    });
});

var app = builder.Build();
app.UseCors();

// Shared helper for fetching the daily-adjusted-close history for a ticker
// universe with per-ticker caching. Daily data doesn't depend on asOf so we
// cache by ticker only with a 6h TTL — fresh enough for daily decisions
// without hammering Yahoo on every request.
async Task<Dictionary<string, IReadOnlyList<DailyClose>>?> FetchHistoriesAsync(
    IEnumerable<string> tickers,
    YahooFinanceClient yahoo,
    IMemoryCache cache,
    CancellationToken ct)
{
    var prices = new Dictionary<string, IReadOnlyList<DailyClose>>();
    foreach (var ticker in tickers)
    {
        var key = $"daily:{ticker}";
        var history = await cache.GetOrCreateAsync(key, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(6);
            return await yahoo.GetDailyAdjustedClosesAsync(ticker, ct);
        });

        if (history is null) return null;
        prices[ticker] = history;
    }
    return prices;
}

// Stamps the caller's staleness onto a decision on the way out. The
// strategy services build these records without knowing a request exists,
// so this is the seam where an HTTP concern is allowed to meet one.
AllocationDecision WithClientStatus(AllocationDecision decision, HttpRequest request)
    => decision with
    {
        ClientStatus = ClientVersion.Status(request.Headers[ClientVersion.HeaderName]),
    };

// A fetch failure used to be indistinguishable from a bad substitution,
// because every ticker came from the caller. Now the server knows which
// ones the holder replaced, so it can point at the setting to check —
// what someone holding a delisted substitute (IUSV.L, delisted 2026-06)
// needs in order to know where to look.
static string FetchFailure(IReadOnlyDictionary<string, string> substitutions)
    => substitutions.Count == 0
        ? "Failed to fetch one or more price histories."
        : "Failed to fetch one or more price histories. Substituted tickers in this request: "
          + string.Join(", ", substitutions.Select(kv => $"{kv.Key}→{kv.Value}"))
          + ". Check those substitutions are still listed.";

// VAA-G4/B3 decision.
//
// The universe is the server's: VaaUniverse.Us, guarded by
// PaperFingerprintTests. A caller may substitute tickers it holds
// locally — a UK holder of CSPX.L rather than SPY — and nothing else.
// The server stays region-agnostic: a substitution is an opaque pair of
// strings and US-vs-UK remains entirely the client's concept.
//
// Example:
//   /api/vaa-g4b3/decision?asOf=2026-09-14
//     &substitute=SPY:CSPX.L&substitute=IEF:IDTM.L
app.MapGet("/api/vaa-g4b3/decision", async (
    DateOnly asOf,
    string[]? substitute,
    YahooFinanceClient yahoo,
    VaaG4B3Service vaa,
    IMemoryCache cache,
    HttpRequest req,
    CancellationToken ct) =>
{
    var canonical = VaaUniverse.Us;
    var (map, error) = TickerSubstitution.Parse(substitute, canonical.SubstitutableTickers());
    if (error is not null) return Results.BadRequest(error);

    var universe = canonical.WithSubstitutions(map!);
    var prices = await FetchHistoriesAsync(universe.AllTickers(), yahoo, cache, ct);
    if (prices is null) return Results.Problem(FetchFailure(map!));

    var decision = vaa.Decide(asOf, universe, prices);
    return Results.Ok(WithClientStatus(decision, req));
});

// DAA-G12 decision (Keller & Keuning, 2018).
//
// The universe is the server's: DaaG12Universe.Us. As with VAA, the only
// thing a caller may change is which tickers it holds in place of the
// canonical ones.
//
// Example:
//   /api/daa-g12/decision?asOf=2026-09-14&substitute=SPY:CSPX.L
app.MapGet("/api/daa-g12/decision", async (
    DateOnly asOf,
    string[]? substitute,
    YahooFinanceClient yahoo,
    DaaG12Service daa,
    IMemoryCache cacheStore,
    HttpRequest req,
    CancellationToken ct) =>
{
    var canonical = DaaG12Universe.Us;
    var (map, error) = TickerSubstitution.Parse(substitute, canonical.SubstitutableTickers());
    if (error is not null) return Results.BadRequest(error);

    var universe = canonical.WithSubstitutions(map!);
    var prices = await FetchHistoriesAsync(universe.AllTickers(), yahoo, cacheStore, ct);
    if (prices is null) return Results.Problem(FetchFailure(map!));

    var decision = daa.Decide(asOf, universe, prices);
    return Results.Ok(WithClientStatus(decision, req));
});

// PAA-G12 decision (Keller & van Putten, 2016).
//
// The universe is the server's: PaaUniverse.Us. The momentum signal here
// is SMA(12) on monthly closes (not 13612W).
//
// `a` survives the move to a server-owned universe because a protection
// factor is a user's choice about how defensive to be, not a statement
// about which assets they hold:
//   a = 0 (Aggressive) → defensive only when zero risky assets are good
//   a = 1 (Moderate)   → defensive at n ≤ 3 good
//   a = 2 (Vigilant)   → defensive at n ≤ 6 good (default; Keller's baseline)
//
// The response's StrategyId carries the variant ("paa-g12-a0|a1|a2").
//
// Example:
//   /api/paa/decision?asOf=2026-09-14&a=2&substitute=SPY:CSPX.L
app.MapGet("/api/paa/decision", async (
    DateOnly asOf,
    int? a,
    string[]? substitute,
    YahooFinanceClient yahoo,
    PaaService paa,
    IMemoryCache cacheStore,
    HttpRequest req,
    CancellationToken ct) =>
{
    var canonical = PaaUniverse.Us;
    var (map, error) = TickerSubstitution.Parse(substitute, canonical.SubstitutableTickers());
    if (error is not null) return Results.BadRequest(error);

    int protectionFactor = a ?? PaaService.DefaultA;
    if (protectionFactor is < 0 or > 2)
    {
        return Results.BadRequest(
            "Query parameter 'a' must be 0 (Aggressive), 1 (Moderate), or 2 (Vigilant).");
    }

    var universe = canonical.WithSubstitutions(map!);
    var prices = await FetchHistoriesAsync(universe.AllTickers(), yahoo, cacheStore, ct);
    if (prices is null) return Results.Problem(FetchFailure(map!));

    var decision = paa.Decide(asOf, universe, prices, protectionFactor);
    return Results.Ok(WithClientStatus(decision, req));
});

// HAA decision (Keller & Keuning, 2023) — Hybrid Asset Allocation.
//
// The universe is the server's: HaaUniverse.Us. The canary's 13612W
// gates the offensive/defensive switch:
//   - canary 13612W ≤ 0 → 100% in cash
//   - canary 13612W > 0 → top T=4 risky by 13612W at 1/T each
//
// Example:
//   /api/haa/decision?asOf=2026-09-14&substitute=SPY:CSPX.L
app.MapGet("/api/haa/decision", async (
    DateOnly asOf,
    string[]? substitute,
    YahooFinanceClient yahoo,
    HaaService haa,
    IMemoryCache cacheStore,
    HttpRequest req,
    CancellationToken ct) =>
{
    var canonical = HaaUniverse.Us;
    var (map, error) = TickerSubstitution.Parse(substitute, canonical.SubstitutableTickers());
    if (error is not null) return Results.BadRequest(error);

    var universe = canonical.WithSubstitutions(map!);
    var prices = await FetchHistoriesAsync(universe.AllTickers(), yahoo, cacheStore, ct);
    if (prices is null) return Results.Problem(FetchFailure(map!));

    var decision = haa.Decide(asOf, universe, prices);
    return Results.Ok(WithClientStatus(decision, req));
});

// BAA-G12 decision (Keller, 2022) — Bold Asset Allocation.
//
// The universe is the server's: BaaUniverse.Us. This endpoint is why the
// whole contract changed — the app was sending a canary of TIP/IEF/BIL
// while the paper and the web used SPY/VWO/VEA/BND, and both were green.
//
// Bold canary gate: ALL canaries must have positive 13612W to enter
// offensive (unanimous AND, not breadth count). Otherwise defensive
// holds 100% in the single top-SMA12 cash asset.
//
// Example:
//   /api/baa/decision?asOf=2026-09-14&substitute=SPY:CSPX.L
app.MapGet("/api/baa/decision", async (
    DateOnly asOf,
    string[]? substitute,
    YahooFinanceClient yahoo,
    BaaService baa,
    IMemoryCache cacheStore,
    HttpRequest req,
    CancellationToken ct) =>
{
    var canonical = BaaUniverse.Us;
    var (map, error) = TickerSubstitution.Parse(substitute, canonical.SubstitutableTickers());
    if (error is not null) return Results.BadRequest(error);

    var universe = canonical.WithSubstitutions(map!);
    var prices = await FetchHistoriesAsync(universe.AllTickers(), yahoo, cacheStore, ct);
    if (prices is null) return Results.Problem(FetchFailure(map!));

    var decision = baa.Decide(asOf, universe, prices);
    return Results.Ok(WithClientStatus(decision, req));
});

// LAA decision (Keller, 2019) — Lethargic Asset Allocation.
//
// Unlike VAA/DAA/PAA, LAA needs macro data: the US unemployment rate
// (FRED UNRATE) and a daily equity-trend signal (SPY 200d SMA). The
// universe is the server's — LaaUniverse.Us — and the FRED series is
// fetched automatically (cached daily; UNRATE only updates monthly, so
// caching for 24h is plenty).
//
// SPY is NOT substitutable here. It appears only as the Growth-Trend
// signal, a US business-cycle indicator, not as something the holder
// owns — see LaaUniverse.SubstitutableTickers.
//
// Example:
//   /api/laa/decision?asOf=2026-09-14&substitute=QQQ:EQQQ.L
app.MapGet("/api/laa/decision", async (
    DateOnly asOf,
    string[]? substitute,
    YahooFinanceClient yahoo,
    FredClient fred,
    LaaService laa,
    IMemoryCache cacheStore,
    HttpRequest req,
    CancellationToken ct) =>
{
    var canonical = LaaUniverse.Us;
    var (map, error) = TickerSubstitution.Parse(substitute, canonical.SubstitutableTickers());
    if (error is not null) return Results.BadRequest(error);

    var universe = canonical.WithSubstitutions(map!);
    var prices = await FetchHistoriesAsync(universe.AllDailyTickers(), yahoo, cacheStore, ct);
    if (prices is null) return Results.Problem(FetchFailure(map!));

    // FRED monthly series — cache per series id with a 24h TTL. UNRATE
    // releases on the first Friday of each month, so caching this long
    // can't miss more than one update per month.
    var fredKey = $"fred:{universe.UnemploymentSeriesId}";
    var unemployment = await cacheStore.GetOrCreateAsync(fredKey, async entry =>
    {
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24);
        return await fred.GetMonthlySeriesAsync(universe.UnemploymentSeriesId, ct);
    });
    if (unemployment is null)
    {
        return Results.Problem($"Failed to fetch FRED series '{universe.UnemploymentSeriesId}'.");
    }

    var decision = laa.Decide(asOf, universe, prices, unemployment);
    return Results.Ok(WithClientStatus(decision, req));
});

// Validates a single ticker against Yahoo Finance and returns the meta
// block (currency, exchange, longName, first-trade date). Used by the
// mobile app when the user adds a custom ETF that isn't in the curated
// catalog.
//
//   GET /api/etf/probe?ticker=EMIM.L
//   200 → { ticker, name, currency, exchange, firstAvailableDate }
//   400 → empty/whitespace ticker
//   404 → Yahoo cannot resolve the ticker
//   500 → upstream Yahoo failure
app.MapGet("/api/etf/probe", async (
    string? ticker,
    YahooFinanceClient yahoo,
    CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(ticker))
    {
        return Results.BadRequest(new { error = "Query parameter 'ticker' is required." });
    }

    try
    {
        var meta = await yahoo.GetMetadataAsync(ticker.Trim(), ct);
        return Results.Ok(meta);
    }
    catch (TickerNotFoundException ex)
    {
        return Results.NotFound(new { error = ex.Message, ticker = ex.Ticker });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Probe failed: {ex.Message}");
    }
});

app.MapGet("/", () => Results.Ok(new
{
    status = "ok",
    endpoints = new[]
    {
        "/api/vaa-g4b3/decision?asOf=YYYY-MM-DD[&substitute=ORIGINAL:REPLACEMENT]",
        "/api/daa-g12/decision?asOf=YYYY-MM-DD[&substitute=ORIGINAL:REPLACEMENT]",
        "/api/paa/decision?asOf=YYYY-MM-DD[&a=0|1|2][&substitute=ORIGINAL:REPLACEMENT]",
        "/api/haa/decision?asOf=YYYY-MM-DD[&substitute=ORIGINAL:REPLACEMENT]",
        "/api/baa/decision?asOf=YYYY-MM-DD[&substitute=ORIGINAL:REPLACEMENT]",
        "/api/laa/decision?asOf=YYYY-MM-DD[&substitute=ORIGINAL:REPLACEMENT]",
        "/api/etf/probe?ticker=EMIM.L",
    },
}));

app.Run();
