using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;
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
builder.Services.AddHttpClient<YahooFinanceClient>();
builder.Services.AddSingleton<VaaG4B3Service>();
builder.Services.AddSingleton<DaaG12Service>();
builder.Services.AddSingleton<PaaService>();

// Permissive CORS for the Expo dev client. Tighten before any real deploy.
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
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

// PAA-G12 decision (Keller & van Putten, 2016) — PAA2 variant (a=2).
//
// Two ticker buckets supplied by the caller — risky and cash. Same
// region-agnostic contract as VAA/DAA: mobile resolves which tickers to
// send and the backend just executes the strategy. The momentum signal
// here is SMA(12) on monthly closes (not 13612W).
//
// Example:
//   /api/paa/decision?asOf=2026-05-05
//     &risky=SPY&risky=IWM&risky=QQQ&risky=VGK&risky=EWJ&risky=EEM
//     &risky=VNQ&risky=GSG&risky=GLD&risky=HYG&risky=LQD&risky=TLT
//     &cash=IEF&cash=SHY&cash=LQD
app.MapGet("/api/paa/decision", async (
    DateOnly asOf,
    string[] risky,
    string[] cash,
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

    var universe = new PaaUniverse(risky, cash);
    var prices = await FetchHistoriesAsync(universe.AllTickers(), yahoo, cacheStore, ct);
    if (prices is null) return Results.Problem("Failed to fetch one or more price histories.");

    var decision = paa.Decide(asOf, universe, prices);
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
        "/api/paa/decision?asOf=YYYY-MM-DD&risky=A&risky=B&...&cash=X&cash=Y&...",
        "/api/etf/probe?ticker=EMIM.L",
    },
}));

app.Run();
