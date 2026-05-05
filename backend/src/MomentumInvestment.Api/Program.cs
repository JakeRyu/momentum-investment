using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;
using MomentumInvestment.Api.Vaa;
using MomentumInvestment.Api.YahooFinance;

var builder = WebApplication.CreateBuilder(args);

// Serialize enums as their string names ("Offensive"/"Defensive") instead of
// integers, so the mobile client can switch on them directly.
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddMemoryCache();
builder.Services.Configure<YahooFinanceOptions>(builder.Configuration.GetSection("YahooFinance"));
builder.Services.AddHttpClient<YahooFinanceClient>();
builder.Services.AddSingleton<VaaG4B3Service>();

// Permissive CORS for the Expo dev client. Tighten before any real deploy.
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();
app.UseCors();

app.MapGet("/api/vaa-g4b3/decision", async (
    DateOnly asOf,
    YahooFinanceClient yahoo,
    VaaG4B3Service vaa,
    IMemoryCache cache,
    CancellationToken ct) =>
{
    var allTickers = VaaG4B3Service.OffensiveUniverse
        .Concat(VaaG4B3Service.DefensiveUniverse)
        .Distinct();

    var prices = new Dictionary<string, IReadOnlyList<DailyClose>>();
    foreach (var ticker in allTickers)
    {
        // Daily history doesn't depend on asOf, so cache per-ticker. 6h TTL
        // gives reasonably fresh data without hammering Yahoo on every request.
        var key = $"daily:{ticker}";
        var history = await cache.GetOrCreateAsync(key, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(6);
            return await yahoo.GetDailyAdjustedClosesAsync(ticker, ct);
        });

        if (history is null)
        {
            return Results.Problem($"Failed to fetch price history for {ticker}.");
        }
        prices[ticker] = history;
    }

    var decision = vaa.Decide(asOf, prices);
    return Results.Ok(decision);
});

app.MapGet("/", () => Results.Ok(new { status = "ok", endpoint = "/api/vaa-g4b3/decision?asOf=YYYY-MM-DD" }));

app.Run();
