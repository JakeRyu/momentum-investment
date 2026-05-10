using System.Net;
using System.Net.Security;
using System.Security.Authentication;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;
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

// VAA-G4/B3 decision.
//
// Ticker universe is supplied explicitly by the caller (offensive[] +
// defensive[]). Region selection lives entirely on the mobile side, so the
// backend stays agnostic about US vs UK and any per-user overrides.
//
// Example:
//   /api/vaa-g4b3/decision?asOf=2026-05-05
//     &offensive=SPY&offensive=EFA&offensive=EEM&offensive=AGG
//     &defensive=LQD&defensive=IEF&defensive=SHY
app.MapGet("/api/vaa-g4b3/decision", async (
    DateOnly asOf,
    string[] offensive,
    string[] defensive,
    YahooFinanceClient yahoo,
    VaaG4B3Service vaa,
    IMemoryCache cache,
    CancellationToken ct) =>
{
    if (offensive is null || offensive.Length == 0)
    {
        return Results.BadRequest("Query parameter 'offensive' must contain at least one ticker.");
    }
    if (defensive is null || defensive.Length == 0)
    {
        return Results.BadRequest("Query parameter 'defensive' must contain at least one ticker.");
    }

    var universe = new VaaUniverse(offensive, defensive);
    var prices = await FetchHistoriesAsync(universe.AllTickers(), yahoo, cache, ct);
    if (prices is null) return Results.Problem("Failed to fetch one or more price histories.");

    var decision = vaa.Decide(asOf, universe, prices);
    return Results.Ok(decision);
});

// DAA-G12 decision (Keller & Keuning, 2018).
//
// Three ticker buckets supplied by the caller — canary, risky, cash. Same
// region-agnostic contract as VAA: mobile resolves which tickers to send
// and the backend just executes the strategy.
//
// Example:
//   /api/daa-g12/decision?asOf=2026-05-05
//     &canary=VWO&canary=BND
//     &risky=SPY&risky=IWM&risky=QQQ&risky=VGK&risky=EWJ&risky=VWO
//     &risky=VNQ&risky=GSG&risky=GLD&risky=TLT&risky=HYG&risky=LQD
//     &cash=SHY&cash=IEF&cash=LQD
app.MapGet("/api/daa-g12/decision", async (
    DateOnly asOf,
    string[] canary,
    string[] risky,
    string[] cash,
    YahooFinanceClient yahoo,
    DaaG12Service daa,
    IMemoryCache cacheStore,
    CancellationToken ct) =>
{
    if (canary is null || canary.Length == 0)
    {
        return Results.BadRequest("Query parameter 'canary' must contain at least one ticker.");
    }
    if (risky is null || risky.Length == 0)
    {
        return Results.BadRequest("Query parameter 'risky' must contain at least one ticker.");
    }
    if (cash is null || cash.Length == 0)
    {
        return Results.BadRequest("Query parameter 'cash' must contain at least one ticker.");
    }

    var universe = new DaaG12Universe(canary, risky, cash);
    var prices = await FetchHistoriesAsync(universe.AllTickers(), yahoo, cacheStore, ct);
    if (prices is null) return Results.Problem("Failed to fetch one or more price histories.");

    var decision = daa.Decide(asOf, universe, prices);
    return Results.Ok(decision);
});

// PAA-G12 decision (Keller & van Putten, 2016).
//
// Two ticker buckets supplied by the caller — risky and cash. Same
// region-agnostic contract as VAA/DAA: mobile resolves which tickers to
// send and the backend just executes the strategy. The momentum signal
// here is SMA(12) on monthly closes (not 13612W).
//
// Optional `a` query parameter (0|1|2) selects the protection factor
// per Keller's PAA paper:
//   a = 0 (Aggressive) → defensive only when zero risky assets are good
//   a = 1 (Moderate)   → defensive at n ≤ 3 good
//   a = 2 (Vigilant)   → defensive at n ≤ 6 good (default; Keller's baseline)
//
// The response's StrategyId carries the variant ("paa-g12-a0|a1|a2").
//
// Example:
//   /api/paa/decision?asOf=2026-05-05&a=2
//     &risky=SPY&risky=IWM&risky=QQQ&risky=VGK&risky=EWJ&risky=EEM
//     &risky=VNQ&risky=GSG&risky=GLD&risky=HYG&risky=LQD&risky=TLT
//     &cash=IEF&cash=SHY&cash=LQD
app.MapGet("/api/paa/decision", async (
    DateOnly asOf,
    string[] risky,
    string[] cash,
    int? a,
    YahooFinanceClient yahoo,
    PaaService paa,
    IMemoryCache cacheStore,
    CancellationToken ct) =>
{
    if (risky is null || risky.Length == 0)
    {
        return Results.BadRequest("Query parameter 'risky' must contain at least one ticker.");
    }
    if (cash is null || cash.Length == 0)
    {
        return Results.BadRequest("Query parameter 'cash' must contain at least one ticker.");
    }

    int protectionFactor = a ?? PaaService.DefaultA;
    if (protectionFactor is < 0 or > 2)
    {
        return Results.BadRequest(
            "Query parameter 'a' must be 0 (Aggressive), 1 (Moderate), or 2 (Vigilant).");
    }

    var universe = new PaaUniverse(risky, cash);
    var prices = await FetchHistoriesAsync(universe.AllTickers(), yahoo, cacheStore, ct);
    if (prices is null) return Results.Problem("Failed to fetch one or more price histories.");

    var decision = paa.Decide(asOf, universe, prices, protectionFactor);
    return Results.Ok(decision);
});

// HAA decision (Keller & Keuning, 2023) — Hybrid Asset Allocation.
//
// Three roles supplied by the caller — risky[] (8 by default), canary
// (single ticker, default TIP), cash (single ticker, default BIL). The
// canary's 13612W gates the offensive/defensive switch:
//   - canary 13612W ≤ 0 → 100% in cash
//   - canary 13612W > 0 → top T=4 risky by 13612W at 1/T each
//
// Same region-agnostic contract as VAA/DAA/PAA: mobile resolves which
// tickers to send and the backend just executes the strategy.
//
// Example:
//   /api/haa/decision?asOf=2026-05-08
//     &risky=SPY&risky=IWM&risky=VEA&risky=VWO
//     &risky=VNQ&risky=DBC&risky=IEF&risky=TLT
//     &canary=TIP&cash=BIL
app.MapGet("/api/haa/decision", async (
    DateOnly asOf,
    string[] risky,
    string? canary,
    string? cash,
    YahooFinanceClient yahoo,
    HaaService haa,
    IMemoryCache cacheStore,
    CancellationToken ct) =>
{
    if (risky is null || risky.Length == 0)
    {
        return Results.BadRequest("Query parameter 'risky' must contain at least one ticker.");
    }
    if (string.IsNullOrWhiteSpace(canary))
    {
        return Results.BadRequest("Query parameter 'canary' is required.");
    }
    if (string.IsNullOrWhiteSpace(cash))
    {
        return Results.BadRequest("Query parameter 'cash' is required.");
    }

    var universe = new HaaUniverse(risky, canary.Trim(), cash.Trim());
    var prices = await FetchHistoriesAsync(universe.AllTickers(), yahoo, cacheStore, ct);
    if (prices is null) return Results.Problem("Failed to fetch one or more price histories.");

    var decision = haa.Decide(asOf, universe, prices);
    return Results.Ok(decision);
});

// BAA-G12 decision (Keller, 2022) — Bold Asset Allocation.
//
// Three roles supplied by the caller — canary[] (3 by default: TIP, IEF,
// BIL), risky[] (12 by default), cash[] (5 by default). Same
// region-agnostic contract as VAA/DAA/PAA/HAA.
//
// Bold canary gate: ALL canaries must have positive 13612W to enter
// offensive (unanimous AND, not breadth count). Otherwise defensive
// holds 100% in the single top-SMA12 cash asset.
//
// Example:
//   /api/baa/decision?asOf=2026-05-08
//     &canary=TIP&canary=IEF&canary=BIL
//     &risky=SPY&risky=IWM&risky=QQQ&risky=VGK&risky=EWJ&risky=EEM
//     &risky=VNQ&risky=GSG&risky=GLD&risky=TLT&risky=HYG&risky=LQD
//     &cash=BIL&cash=IEF&cash=TLT&cash=BND&cash=LQD
app.MapGet("/api/baa/decision", async (
    DateOnly asOf,
    string[] canary,
    string[] risky,
    string[] cash,
    YahooFinanceClient yahoo,
    BaaService baa,
    IMemoryCache cacheStore,
    CancellationToken ct) =>
{
    if (canary is null || canary.Length == 0)
    {
        return Results.BadRequest("Query parameter 'canary' must contain at least one ticker.");
    }
    if (risky is null || risky.Length == 0)
    {
        return Results.BadRequest("Query parameter 'risky' must contain at least one ticker.");
    }
    if (cash is null || cash.Length == 0)
    {
        return Results.BadRequest("Query parameter 'cash' must contain at least one ticker.");
    }

    var universe = new BaaUniverse(canary, risky, cash);
    var prices = await FetchHistoriesAsync(universe.AllTickers(), yahoo, cacheStore, ct);
    if (prices is null) return Results.Problem("Failed to fetch one or more price histories.");

    var decision = baa.Decide(asOf, universe, prices);
    return Results.Ok(decision);
});

// LAA decision (Keller, 2019) — Lethargic Asset Allocation.
//
// Unlike VAA/DAA/PAA, LAA needs macro data: the US unemployment rate
// (FRED UNRATE) and a daily equity-trend signal (default SPY 200d SMA).
// The endpoint takes the asset universe as query params and fetches
// the FRED series automatically (cached daily — UNRATE only updates
// monthly, so caching for 24h is plenty).
//
// Three asset slots: 3 permanent + 1 risky (default QQQ) + 1 cash
// (default SHY). Plus a signal equity (default SPY) and FRED series
// id (default UNRATE) which the mobile caller can override per region.
//
// Example:
//   /api/laa/decision?asOf=2026-05-05
//     &permanent=IWD&permanent=GLD&permanent=IEF
//     &risky=QQQ&cash=SHY
//     &signalEquity=SPY&unemploymentSeriesId=UNRATE
app.MapGet("/api/laa/decision", async (
    DateOnly asOf,
    string[] permanent,
    string? risky,
    string? cash,
    string? signalEquity,
    string? unemploymentSeriesId,
    YahooFinanceClient yahoo,
    FredClient fred,
    LaaService laa,
    IMemoryCache cacheStore,
    CancellationToken ct) =>
{
    if (permanent is null || permanent.Length != 3)
    {
        return Results.BadRequest("Query parameter 'permanent' must contain exactly 3 tickers.");
    }
    if (string.IsNullOrWhiteSpace(risky))
    {
        return Results.BadRequest("Query parameter 'risky' is required.");
    }
    if (string.IsNullOrWhiteSpace(cash))
    {
        return Results.BadRequest("Query parameter 'cash' is required.");
    }

    var universe = new LaaUniverse(
        Permanent:            permanent,
        Risky:                risky.Trim(),
        Cash:                 cash.Trim(),
        SignalEquity:         string.IsNullOrWhiteSpace(signalEquity) ? "SPY" : signalEquity.Trim(),
        UnemploymentSeriesId: string.IsNullOrWhiteSpace(unemploymentSeriesId) ? "UNRATE" : unemploymentSeriesId.Trim());

    var prices = await FetchHistoriesAsync(universe.AllDailyTickers(), yahoo, cacheStore, ct);
    if (prices is null) return Results.Problem("Failed to fetch one or more price histories.");

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
    return Results.Ok(decision);
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
        "/api/vaa-g4b3/decision?asOf=YYYY-MM-DD&offensive=A&offensive=B&...&defensive=X&defensive=Y&...",
        "/api/daa-g12/decision?asOf=YYYY-MM-DD&canary=A&canary=B&risky=...&cash=...",
        "/api/paa/decision?asOf=YYYY-MM-DD&risky=A&risky=B&...&cash=X&cash=Y&...&a=0|1|2",
        "/api/haa/decision?asOf=YYYY-MM-DD&risky=A&risky=B&...&canary=TIP&cash=BIL",
        "/api/baa/decision?asOf=YYYY-MM-DD&canary=A&canary=B&canary=C&risky=...&cash=...",
        "/api/laa/decision?asOf=YYYY-MM-DD&permanent=A&permanent=B&permanent=C&risky=X&cash=Y&signalEquity=SPY&unemploymentSeriesId=UNRATE",
        "/api/etf/probe?ticker=EMIM.L",
    },
}));

app.Run();
