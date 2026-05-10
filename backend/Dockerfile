# syntax=docker/dockerfile:1.7
#
# Multi-stage Dockerfile for the Momentum Investment .NET 10 API.
#
# - Build stage uses the SDK image to restore + publish.
# - Runtime stage is the smaller aspnet image (no SDK).
# - Listens on 0.0.0.0:8080 — matches Azure Container Apps' default
#   target port. For a different host (App Service, Cloud Run, etc.)
#   override ASPNETCORE_URLS.
# - Runs as the built-in non-root `app` user shipped with the .NET 8+
#   base images. Reduces blast radius if the container is ever
#   compromised; required by some hosts (e.g. ACA's stricter security
#   profiles).
#
# Build context is the `backend/` directory:
#
#   docker build -t momentum-api:local backend/
#   docker run --rm -p 8080:8080 \
#     -e Fred__ApiKey=$FRED_KEY \
#     momentum-api:local

ARG DOTNET_VERSION=10.0

# ---------------------------------------------------------------------
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION} AS build
WORKDIR /src

# Copy csproj first so `dotnet restore` is cached as long as project
# references / NuGet versions don't change. Tests are intentionally not
# copied — the prod image doesn't need them, and excluding them speeds
# up the docker context.
COPY src/MomentumInvestment.Api/MomentumInvestment.Api.csproj src/MomentumInvestment.Api/
RUN dotnet restore src/MomentumInvestment.Api/MomentumInvestment.Api.csproj

# Then the rest of the source.
COPY src/MomentumInvestment.Api/ src/MomentumInvestment.Api/

WORKDIR /src/src/MomentumInvestment.Api
RUN dotnet publish \
    -c Release \
    -o /app/publish \
    --no-restore \
    /p:UseAppHost=false

# ---------------------------------------------------------------------
# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION} AS runtime
WORKDIR /app

# Bring in the published output only — no SDK, no source.
COPY --from=build /app/publish ./

# Listen on 8080 for ACA. Production env disables dev-only middleware
# (CORS AllowAnyOrigin, etc. — see Program.cs).
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

EXPOSE 8080

# Built-in non-root user shipped with the .NET 8+ aspnet image
# (UID 1654). `$APP_UID` is set in the base image; using it makes the
# Dockerfile resilient to upstream UID changes.
USER $APP_UID

ENTRYPOINT ["dotnet", "MomentumInvestment.Api.dll"]
