# Azure Container Apps Deploy Playbook

Step-by-step playbook for the **first** deployment of the
MomentumInvestment.Api backend to Azure Container Apps in `uksouth`,
plus the mobile app cutover from LAN IP to the deployed FQDN.

This is a one-time setup. Subsequent redeploys are a single
`./infra/azure-deploy.sh` call (the script is idempotent).

---

## Goal

1. Provision Azure resources (RG, ACR, Container Apps env, Container App)
2. Build + push the API image
3. Verify all 6 strategy endpoints from the deployed FQDN
4. Switch `mobile/.env` to the deployed URL
5. Smoke-test from the user's iPhone via Expo Go

After this, the user's phone reaches the backend over the public
internet — no more dependency on the Mac being on the same LAN.

---

## Pre-flight checks

Run these in order. Stop if any fail and fix before proceeding.

### 1. Repo is clean

```bash
cd /Users/jryu/Projects/momentum-investment
git status --short
```

There may be uncommitted Azure-prep changes from the previous session
(Dockerfile, infra/azure-deploy.sh, Program.cs CORS edits, AGENTS.md
consolidation, etc.). **Commit these first** before deploying — confirm
the message with the user, then commit. The deploy itself shouldn't
mix with unrelated changes.

Suggested commit message (one line, matching project style):

```
feat: containerise backend + Azure Container Apps deploy script
```

Body if user wants the long form: list Dockerfile, .dockerignore,
infra/azure-deploy.sh, Program.cs CORS env-awareness,
appsettings.json Cors section, README ACA section, AGENTS.md
consolidation (CLAUDE.md → pointer).

### 2. Backend tests pass

Don't deploy a broken main. Run:

```bash
cd /Users/jryu/Projects/momentum-investment/backend
dotnet test
```

Expect ~85 tests passing. If anything fails, stop and surface to user.

Also re-run the Python verifiers as a sanity check:

```bash
cd /Users/jryu/Projects/momentum-investment
for v in scripts/verify_*.py; do python3 "$v" || break; done
```

### 3. Azure CLI logged in and on the right subscription

```bash
az account show --query '{name:name, id:id, user:user.name}' -o json
```

If this errors, user needs to `az login` first. If multiple
subscriptions, confirm with user which one to deploy to (e.g. their
personal Azure account, not a work one). Set explicitly:

```bash
az account set --subscription "<subscription-id>"
```

### 4. FRED API key is available

Check user-secrets:

```bash
cd /Users/jryu/Projects/momentum-investment/backend/src/MomentumInvestment.Api
dotnet user-secrets list
```

Must contain `Fred:ApiKey`. If missing, user needs to set it first
(see `backend/src/MomentumInvestment.Api/README.md`).

### 5. Pick an ACR name (globally unique requirement)

Azure Container Registry names must be globally unique across all of
Azure, lowercase alphanumeric, 5-50 chars. **Ask the user explicitly**
what they want — e.g. `momentumacrjihyung`, `momentumacrjryu`, etc. —
and confirm before running the deploy. The `infra/azure-deploy.sh`
default is a hash of `$HOME` which works but is opaque; explicit names
are better for the user's own reference later.

---

## (Optional) Local docker smoke test

If docker is available locally, a quick container test before pushing
to Azure can catch issues fast:

```bash
cd /Users/jryu/Projects/momentum-investment

# Pull FRED key out of user-secrets without echoing it.
FRED_KEY=$(cd backend/src/MomentumInvestment.Api && \
    dotnet user-secrets list | awk -F' = ' '/^Fred:ApiKey/ {print $2}')
test -n "$FRED_KEY" || { echo "FRED key not in user-secrets" >&2; exit 1; }

docker build -t momentum-api:local backend/
docker run --rm -d \
    -p 8080:8080 \
    -e Fred__ApiKey="$FRED_KEY" \
    --name momentum-api momentum-api:local

# Health
curl -fsS http://localhost:8080/ | jq .

# VAA — fastest smoke (no FRED dep)
curl -fsS 'http://localhost:8080/api/vaa-g4b3/decision?asOf=2026-05-08&offensive=SPY&offensive=EFA&offensive=EEM&offensive=AGG&defensive=LQD&defensive=IEF&defensive=SHY' \
    | jq '.modeLabel, .allocations'

# LAA — exercises FRED key wiring
curl -fsS 'http://localhost:8080/api/laa/decision?asOf=2026-05-08&permanent=IWD&permanent=GLD&permanent=IEF&risky=QQQ&cash=SHY' \
    | jq '.modeLabel'

docker stop momentum-api
```

If LAA returns 200 with a `modeLabel` value, FRED key wiring is
working. Skip this section if docker isn't installed — the Azure-side
build catches the same class of issues (slower feedback loop, but
sufficient).

---

## First Azure deploy

```bash
cd /Users/jryu/Projects/momentum-investment

# Confirm the ACR name with the user one more time. Then:
export ACR=<chosen-name>

# Pull FRED key out of user-secrets.
export FRED_API_KEY=$(cd backend/src/MomentumInvestment.Api && \
    dotnet user-secrets list | awk -F' = ' '/^Fred:ApiKey/ {print $2}')
test -n "$FRED_API_KEY" || { echo "FRED key not in user-secrets" >&2; exit 1; }

# Run the deploy script. Takes ~5-7 minutes (ACR provisioning + image
# build + Container Apps env + first app create).
./infra/azure-deploy.sh
```

Watch for:

- **"name not available" on ACR creation** → another Azure customer
  has the name. Pick a different ACR name and retry.
- **"insufficient quota"** → user's subscription needs the Container
  Apps RP registered or has a quota cap. Surface to user with the
  exact `az` error.
- **"Image pull failed"** → registry creds didn't propagate; the
  script handles refresh on update path, but first-deploy may need
  a 30s retry.

The script's final output prints the deployed FQDN, e.g.
`https://momentum-api.kindforest-12345abc.uksouth.azurecontainerapps.io`.
Capture this URL — it's needed for the next steps.

---

## Verify deployed endpoints

```bash
# Replace with the actual FQDN printed by the deploy script.
FQDN=<from-deploy-output>

# Root
curl -fsS "https://$FQDN/" | jq .

# VAA — no FRED dep
curl -fsS "https://$FQDN/api/vaa-g4b3/decision?asOf=2026-05-08&offensive=SPY&offensive=EFA&offensive=EEM&offensive=AGG&defensive=LQD&defensive=IEF&defensive=SHY" \
    | jq '.modeLabel, .allocations'

# DAA / PAA / HAA / BAA — the new strategies
curl -fsS "https://$FQDN/api/daa-g12/decision?asOf=2026-05-08&canary=VWO&canary=BND&risky=SPY&risky=IWM&risky=QQQ&risky=VGK&risky=EWJ&risky=VWO&risky=VNQ&risky=GSG&risky=GLD&risky=TLT&risky=HYG&risky=LQD&cash=SHY&cash=IEF&cash=LQD" \
    | jq '.modeLabel'
curl -fsS "https://$FQDN/api/paa/decision?asOf=2026-05-08&a=2&risky=SPY&risky=IWM&risky=QQQ&risky=VGK&risky=EWJ&risky=EEM&risky=VNQ&risky=GSG&risky=GLD&risky=HYG&risky=LQD&risky=TLT&cash=IEF&cash=SHY&cash=LQD" \
    | jq '.strategyId, .modeLabel'
curl -fsS "https://$FQDN/api/haa/decision?asOf=2026-05-08&risky=SPY&risky=IWM&risky=VEA&risky=VWO&risky=VNQ&risky=DBC&risky=IEF&risky=TLT&canary=TIP&cash=BIL" \
    | jq '.modeLabel'
curl -fsS "https://$FQDN/api/baa/decision?asOf=2026-05-08&canary=TIP&canary=IEF&canary=BIL&risky=SPY&risky=IWM&risky=QQQ&risky=VGK&risky=EWJ&risky=EEM&risky=VNQ&risky=GSG&risky=GLD&risky=TLT&risky=HYG&risky=LQD&cash=BIL&cash=IEF&cash=TLT&cash=BND&cash=LQD" \
    | jq '.modeLabel'

# LAA — exercises FRED key (this is the one that proves the secret is
# wired correctly through Container Apps secrets).
curl -fsS "https://$FQDN/api/laa/decision?asOf=2026-05-08&permanent=IWD&permanent=GLD&permanent=IEF&risky=QQQ&cash=SHY" \
    | jq '.modeLabel, .reasoning'
```

If LAA returns 200 with a non-error reasoning, the deploy is fully
healthy. If LAA 5xx with `FRED API key is not configured`, fix:

```bash
az containerapp secret set \
    -g momentum-investment -n momentum-api \
    --secrets "fred-key=<the-key>"
az containerapp update \
    -g momentum-investment -n momentum-api \
    --set-env-vars "Fred__ApiKey=secretref:fred-key"
```

---

## Switch the mobile app to the deployed FQDN

```bash
# Replace placeholder with actual FQDN.
echo "EXPO_PUBLIC_API_BASE_URL=https://$FQDN" > /Users/jryu/Projects/momentum-investment/mobile/.env

# Clear-cache restart so EXPO_PUBLIC_* vars are re-bundled.
cd /Users/jryu/Projects/momentum-investment/mobile
npx expo start --clear
```

The `--clear` flag is essential. `EXPO_PUBLIC_*` env vars are
inlined at bundle time, so a normal restart can keep the old IP
cached.

---

## Phone smoke test (user-driven)

Tell the user to:

1. Open Expo Go on the iPhone, scan the QR
2. Open each strategy in turn (VAA, PAA0/1/2, DAA, HAA, BAA, LAA)
3. Confirm each loads (data may take 1-2 seconds on cold start —
   Container Apps spins up an instance from zero on the first request
   after idle)
4. Toggle PAA's segmented control — confirm switching is instant once
   warmed up

If any strategy errors with a network timeout, check Container Apps
logs:

```bash
az containerapp logs tail -g momentum-investment -n momentum-api
```

Common cause: unofficial Yahoo API rate-limited the new outbound IP.
Wait a few minutes and retry. If persistent, the User-Agent in
`backend/src/MomentumInvestment.Api/YahooFinance/YahooFinanceOptions.cs`
may need updating (see AGENTS.md "Gotchas" section).

---

## Commit the deploy + mobile cutover

```bash
cd /Users/jryu/Projects/momentum-investment
git add mobile/.env
git status --short
```

Confirm only `mobile/.env` is staged (the FQDN change). Suggested
commit:

```
chore: point mobile at deployed Azure backend
```

---

## Rollback / cleanup (only if user requests)

To delete everything cleanly:

```bash
az group delete -n momentum-investment --yes
```

This removes the RG and all child resources (ACR, env, app). User can
recreate from scratch by re-running the deploy script.

To roll back to a previous image without deleting the app:

```bash
# List recent images
az acr repository show-tags -n <ACR> --repository momentum-api --top 5 --orderby time_desc

# Pin to a previous tag
az containerapp update -g momentum-investment -n momentum-api \
    --image <ACR>.azurecr.io/momentum-api:<previous-tag>
```

---

## Cost expectations

After the first deploy, ongoing cost on a personal Azure subscription:

- **ACR Basic**: ~£4/month (always-on, can't scale to zero)
- **Container Apps env**: free
- **Container App** with `min-replicas=0`: pay-per-use only. Idle = £0.
  Active vCPU-seconds + memory-seconds — for personal usage (handful
  of requests/day), expect well under £1/month.
- **Egress**: minimal at this volume.

Total: ~£4-6/month, easily covered by the Azure free monthly credit.
If the user wants to drop the ~£4 ACR cost, GitHub Container Registry
is a free alternative — but that's out of scope for the first deploy.
