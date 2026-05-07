# MomentumInvestment.Api — Configuration & Deployment

This project loads configuration from the standard ASP.NET Core sources, in
descending precedence:

1. Command-line arguments
2. Environment variables
3. User secrets (Development environment only)
4. `appsettings.{Environment}.json`
5. `appsettings.json`

For local dev, use `dotnet user-secrets`. For any deployed environment
(staging, prod, Azure App Service, container hosts), use **environment
variables** — never check secrets into `appsettings.json`.

## Local development (Mac)

```bash
cd backend/src/MomentumInvestment.Api

# One-time: initialise user secrets store for this project.
dotnet user-secrets init

# Set the FRED API key (32-char alphanumeric from
# https://fredaccount.stlouisfed.org/apikeys).
dotnet user-secrets set "Fred:ApiKey" "<your-fred-api-key>"

# Inspect what's stored:
dotnet user-secrets list
```

User secrets live in `~/.microsoft/usersecrets/<id>/secrets.json` outside
the repo, so they never get committed.

## Required environment variables (deployed)

ASP.NET Core converts double-underscores in env var names to the colon
key separator, i.e. `Fred__ApiKey` → `Fred:ApiKey`. This is the canonical
way to pass nested settings to a deployed instance.

| Env var | Purpose | Example | Required? |
| --- | --- | --- | --- |
| `Fred__ApiKey` | FRED API key for LAA's UNRATE fetch. Get one at https://fredaccount.stlouisfed.org/apikeys | `abc123def456…` (32 chars) | **Yes** — LAA `/api/laa/decision` returns 5xx without it |
| `ASPNETCORE_ENVIRONMENT` | Standard ASP.NET environment marker | `Production` | Recommended (defaults to `Production` in published builds, `Development` for `dotnet run`) |
| `ASPNETCORE_URLS` | Bind address(es). Override the dev default of `http://0.0.0.0:5050` | `http://+:8080` | Required for most container hosts |

## Optional environment variables (overrides)

These have working defaults baked into `appsettings.json` and only need
to be set if the upstream URL or UA needs to change in a deployed
environment.

| Env var | Default | Notes |
| --- | --- | --- |
| `Fred__BaseUrl` | `https://api.stlouisfed.org` | The FRED JSON API root. Don't point at `fred.stlouisfed.org` — that's the keyless CSV download host and we no longer use it (see CLAUDE.md → Strategy: LAA for the migration history) |
| `Fred__UserAgent` | `Mozilla/5.0 (compatible; MomentumInvestment/0.1)` | Sent on every FRED request |
| `YahooFinance__BaseUrl` | `https://query1.finance.yahoo.com` | Yahoo's unofficial v8 chart endpoint root |
| `YahooFinance__UserAgent` | `Mozilla/5.0 (compatible; MomentumInvestment/0.1)` | Yahoo rejects requests without a UA, so this is required even though it has a default |

## Per-platform examples

### Azure App Service

In the App Service blade → **Configuration** → **Application settings**:

```
Fred__ApiKey                = <your-fred-api-key>
ASPNETCORE_ENVIRONMENT      = Production
```

App Service automatically sets `ASPNETCORE_URLS` and `WEBSITES_PORT`, so
no need to set those.

### Docker / containers

```bash
docker run \
  -e Fred__ApiKey="<your-fred-api-key>" \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e ASPNETCORE_URLS=http://+:8080 \
  -p 8080:8080 \
  momentum-investment-api:latest
```

Or via `docker-compose.yml`:

```yaml
services:
  api:
    image: momentum-investment-api:latest
    environment:
      Fred__ApiKey: "${FRED_API_KEY}"
      ASPNETCORE_ENVIRONMENT: Production
      ASPNETCORE_URLS: http://+:8080
    ports:
      - "8080:8080"
```

The host-side `FRED_API_KEY` should come from a secrets manager / `.env`
file that's gitignored — don't paste the key into the compose file
itself.

### Systemd unit (bare metal Linux)

```ini
[Service]
Environment=Fred__ApiKey=<your-fred-api-key>
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://0.0.0.0:5050
ExecStart=/usr/bin/dotnet /opt/momentum-investment/MomentumInvestment.Api.dll
```

Use `EnvironmentFile=/etc/momentum-investment/secrets.env` with mode 0600
if you want to keep the key out of the unit file itself.

## Verification after deploy

LAA is the only endpoint that depends on the FRED key. Smoke-test it
after a deploy:

```bash
curl -s -w "\n[%{http_code} in %{time_total}s]\n" \
  "$BASE_URL/api/laa/decision?asOf=$(date -u +%F)&permanent=IWD&permanent=GLD&permanent=IEF&risky=QQQ&cash=SHY" \
  | jq .
```

Failure modes:

- **HTTP 500** with body containing `FRED API key is not configured` —
  `Fred__ApiKey` env var isn't set or didn't bind. Check the deployed
  environment's variables and that the casing/double-underscore matches
  exactly.
- **HTTP 500** with `Bad Request. The value for variable api_key is not
  a 32 character alpha-numeric lower-case string` — the key is set but
  invalid. Re-copy from https://fredaccount.stlouisfed.org/apikeys.
- **HTTP 500** with TLS / timeout errors — different class of issue;
  see the FRED HttpClient comment in `Program.cs` for context. The
  workarounds (TLS 1.2, no revocation check) are already applied in
  the registration; confirm they're in effect by checking the deployed
  build matches `main`.

## What is **not** an env var

- The mobile app's `EXPO_PUBLIC_API_BASE_URL` lives in the **mobile**
  project's `.env` file, not here. It's the URL the iOS client uses to
  reach this API; setting it in the API deployment does nothing.
- CORS is currently `AllowAnyOrigin` (see `Program.cs`). When deploying
  for real, **change this in code** before a public deploy — there's no
  config knob for the allowed origin yet.
