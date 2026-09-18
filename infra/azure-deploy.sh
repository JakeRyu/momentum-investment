#!/usr/bin/env bash
#
# Provision (idempotent) and deploy the Momentum Investment backend to
# Azure Container Apps in uksouth. Designed so the same script handles
# both first-time setup and ongoing redeploys — re-running with no
# changes is safe.
#
# Why ACA over App Service / Functions:
#   - The existing ASP.NET 10 minimal API maps cleanly to a container;
#     Functions would require rewriting endpoint handlers and would
#     also lose the IMemoryCache benefit between invocations.
#
# Why min-replicas 1 rather than scale-to-zero (changed 2026-09-15):
#   Scale-to-zero was the original choice, on the theory that a few
#   requests a day made idle time pure waste. The real pattern is once a
#   month — which means nobody ever arrives to a warm replica. Measured
#   from an actual zero-replica state: 22.6s cold, 0.49s warm. The one
#   moment this app is used is the one moment it must not take 22
#   seconds, so the idle charge buys the only latency that matters.
#   Sized down to 0.25 vCPU / 0.5 GiB to halve that charge, verified by
#   measurement rather than assumption: all six strategies answer in
#   0.50s at the smaller size, against 0.49s at double it. Server-side
#   work is ~0.18s of that (the rest is connection setup from the
#   measuring client), and a full price-cache miss adds only ~0.03s per
#   ticker. Compute was never the constraint here.
#
# Why CORS origins are seeded in the create branch only:
#   The API's allow-list (`Cors:AllowedOrigins`) is empty by default, and
#   a missing origin fails in a way only a browser ever sees — native app
#   fetches send no Origin header, so the app keeps working while every
#   request from the web site is blocked. Recreating the app without
#   seeding them would look healthy from the phone. The update branch
#   deliberately does NOT manage env vars: `--replace-env-vars` would
#   drop the `Fred__ApiKey` secret reference, and forcing this list on
#   every redeploy would silently undo an origin added by hand. Adding a
#   domain is rare and deliberate — the playbook has the one-liner.
#
# Required env vars (only on FIRST deploy):
#   FRED_API_KEY — your FRED API key. Stored as a Container Apps secret
#                  and exposed to the app as `Fred__ApiKey`.
#
# Optional overrides (sane defaults):
#   RG           — resource group           (default: momentum-investment)
#   LOCATION     — Azure region             (default: uksouth)
#   ACR          — container registry name  (default: momentumacr<random>;
#                  MUST be globally unique and lowercase alphanumeric)
#   ENV_NAME     — Container Apps env name  (default: momentum-env)
#   APP          — Container App name       (default: momentum-api)
#   IMAGE_TAG    — image tag                (default: yyyymmddHHMMSS)
#
# Examples:
#   FRED_API_KEY=abc123 ACR=momentumacrjihyung ./infra/azure-deploy.sh
#   ./infra/azure-deploy.sh                                 # redeploy after first
#
# Prereqs: az CLI logged in (`az login`), correct subscription set
# (`az account set --subscription <id>`).

set -euo pipefail

# ---------------------------------------------------------------------
# Config

RG=${RG:-momentum-investment}
LOCATION=${LOCATION:-uksouth}
# ACR names must be globally unique. The default appends a stable hash
# of the user's home dir so repeat runs from the same machine pick the
# same name; first-time users will likely want to set ACR explicitly.
ACR_DEFAULT="momentumacr$(printf '%s' "${HOME:-fallback}" | shasum | cut -c1-6)"
ACR=${ACR:-$ACR_DEFAULT}
ENV_NAME=${ENV_NAME:-momentum-env}
APP=${APP:-momentum-api}
IMAGE_NAME=${IMAGE_NAME:-momentum-api}
IMAGE_TAG=${IMAGE_TAG:-$(date -u +%Y%m%d%H%M%S)}

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
BACKEND_DIR=$(cd "$SCRIPT_DIR/../backend" && pwd)

# ---------------------------------------------------------------------
# Sanity checks

command -v az >/dev/null 2>&1 || {
    echo "az CLI not found. Install: https://docs.microsoft.com/cli/azure/install-azure-cli" >&2
    exit 1
}

if ! az account show >/dev/null 2>&1; then
    echo "az CLI not logged in. Run: az login" >&2
    exit 1
fi

echo "Subscription: $(az account show --query name -o tsv) ($(az account show --query id -o tsv))"
echo "Region:       $LOCATION"
echo "Resource Grp: $RG"
echo "Registry:     $ACR"
echo "App:          $APP"
echo "Image tag:    $IMAGE_TAG"
echo

# ---------------------------------------------------------------------
# Provision (idempotent — Azure CLI returns existing resources unchanged)

echo "→ Resource group..."
az group create -n "$RG" -l "$LOCATION" -o none

echo "→ Container registry..."
az acr create -g "$RG" -n "$ACR" --sku Basic --admin-enabled true -o none

echo "→ Container Apps environment..."
# `az containerapp env create` is NOT safely idempotent: re-running it
# generates a fresh Log Analytics workspace and PUTs the environment,
# which both leaks workspaces and can fail transiently. Only create when
# the environment doesn't exist yet (same guard pattern as the app below).
if ! az containerapp env show -g "$RG" -n "$ENV_NAME" >/dev/null 2>&1; then
    az containerapp env create -g "$RG" -n "$ENV_NAME" -l "$LOCATION" -o none
fi

# ---------------------------------------------------------------------
# Build + push image (server-side build via ACR Tasks — no local docker
# needed). Tag includes timestamp so every deploy lands a unique image
# and Container Apps reliably pulls it.

echo "→ Building $IMAGE_NAME:$IMAGE_TAG (server-side via ACR Tasks)..."
az acr build \
    --registry "$ACR" \
    --image "$IMAGE_NAME:$IMAGE_TAG" \
    "$BACKEND_DIR" \
    -o none

# Resolve registry login server + admin creds for the Container App's
# image-pull config.
ACR_LOGIN=$(az acr show -n "$ACR" --query loginServer -o tsv)
ACR_USER=$(az acr credential show -n "$ACR" --query username -o tsv)
ACR_PASS=$(az acr credential show -n "$ACR" --query 'passwords[0].value' -o tsv)
IMAGE_REF="$ACR_LOGIN/$IMAGE_NAME:$IMAGE_TAG"

# ---------------------------------------------------------------------
# Create or update the Container App

if az containerapp show -g "$RG" -n "$APP" >/dev/null 2>&1; then
    echo "→ Updating container app $APP to $IMAGE_TAG..."
    # Scale and size are repeated here, not just in the create branch
    # below: the app already exists, so create never runs again and this
    # is the only path that reaches a live deployment.
    az containerapp update \
        -g "$RG" -n "$APP" \
        --image "$IMAGE_REF" \
        --min-replicas 1 \
        --max-replicas 1 \
        --cpu 0.25 --memory 0.5Gi \
        -o none
    # Admin creds may have rotated since first deploy — refresh registry
    # auth in case.
    az containerapp registry set \
        -g "$RG" -n "$APP" \
        --server "$ACR_LOGIN" \
        --username "$ACR_USER" \
        --password "$ACR_PASS" \
        -o none
else
    # First deploy — FRED key required.
    if [[ -z "${FRED_API_KEY:-}" ]]; then
        echo "FRED_API_KEY env var is required for the first deploy." >&2
        echo "Get one at https://fred.stlouisfed.org/docs/api/api_key.html" >&2
        exit 1
    fi

    echo "→ Creating container app $APP..."
    az containerapp create \
        -g "$RG" -n "$APP" \
        --environment "$ENV_NAME" \
        --image "$IMAGE_REF" \
        --registry-server "$ACR_LOGIN" \
        --registry-username "$ACR_USER" \
        --registry-password "$ACR_PASS" \
        --target-port 8080 \
        --ingress external \
        --min-replicas 1 \
        --max-replicas 1 \
        --cpu 0.25 --memory 0.5Gi \
        --secrets "fred-key=$FRED_API_KEY" \
        --env-vars \
            "ASPNETCORE_ENVIRONMENT=Production" \
            "Fred__ApiKey=secretref:fred-key" \
            "Cors__AllowedOrigins__0=https://monthlyrule.com" \
            "Cors__AllowedOrigins__1=https://investment.ecomcraft.co.uk" \
            "Cors__AllowedOrigins__2=https://orange-desert-0b606e003.7.azurestaticapps.net" \
        -o none
fi

# ---------------------------------------------------------------------
# Report

FQDN=$(az containerapp show -g "$RG" -n "$APP" --query 'properties.configuration.ingress.fqdn' -o tsv)

cat <<EOF

✓ Deployed: https://$FQDN
  Health:   https://$FQDN/
  Logs:     az containerapp logs show -g $RG -n $APP --follow --format text

Update mobile/.env then restart Expo:

  echo 'EXPO_PUBLIC_API_BASE_URL=https://$FQDN' > mobile/.env
  cd mobile && npx expo start --clear

EOF
