# Plants

A plant data API for hobby app developers, plus a dashboard where developers sign up, create API keys and watch usage.

| Folder | What it is | Port |
|---|---|---|
| [`api/`](api) | AdonisJS API: plants, companions, frost dates, planting calendar, hardiness zones, moon phases, API keys, status page data | 3333 |
| [`web/`](web) | Nuxt 4 + shadcn-vue dashboard. Its server holds the session and talks to the API for the browser | 3000 |

More detail lives next to the code: [`api/DATA_REVIEW.md`](api/DATA_REVIEW.md) (data checks), [`api/MONITORING.md`](api/MONITORING.md) (status page and monitor), [`api/EMAIL.md`](api/EMAIL.md) (verification and password reset), [`web/README.md`](web/README.md) (dashboard and sign-in design). The API's own reference is served at `/docs`.

## What was and was not verified

- **Verified:** every development step below, and a production **build and run of the dashboard** (`web`).
- **Not verified:** a production build of the **API** (`node ace build`) and running it on **Postgres**. The development database is SQLite. The production steps for those are the standard AdonisJS ones; treat them as a starting point and test them before relying on them.
- There is no automated test suite yet; checks are the type-checks and `plants:audit` below.

## Prerequisites

- Node.js 24 (what this was built and tested on) and npm
- Git
- Internet access for the first data import (about 60 MB of public datasets)
- `tar` that can read zip files. Windows 10+ and macOS have it. On Linux, GNU `tar` cannot, and the ZIP-code import will fail. Install `bsdtar` (`libarchive-tools` on Debian/Ubuntu) or unzip the file by hand. This is untested on Linux.

## 1. Clone

```bash
git clone https://github.com/pixelscript-io/plants.git
cd plants
```

## 2. Run it locally (development and testing)

### API

```bash
cd api
npm install
cp .env.example .env
node ace generate:key          # writes APP_KEY into .env
node ace migration:run         # creates the SQLite database in api/tmp/
```

Load the data. Each command is repeatable, and they need internet:

```bash
node ace import:usda               # USDA PLANTS names (public domain)
node ace import:noaa-frost         # NOAA frost dates (public domain)
node ace import:zips               # Census ZIP centroids (public domain)
node ace import:hardiness-zones    # USDA zones by ZIP, via Oregon State (unaltered, needs attribution)

node ace db:seed --files database/seeders/plant_seeder.ts --files database/seeders/companion_seeder.ts --files database/seeders/amendment_seeder.ts

node ace plants:audit --warnings   # consistency checks; must report no errors
node ace plants:publish --all      # plants stay hidden from the API until published
```

Start it:

```bash
npm run dev                    # http://localhost:3333
```

- API reference: <http://localhost:3333/docs>
- Health: <http://localhost:3333/api/v1/health>
- In development, set `SERVE_UNPUBLISHED=true` in `.env` if you want to see unpublished plants.
- Emails are not sent in development. Each is written as JSON to `api/tmp/mail/`; open the file to get the confirmation or reset link.
- The status page needs a heartbeat recorder running in a second terminal: `npm run monitor`.

### Dashboard

In another terminal:

```bash
cd web
npm install
npm run dev                    # http://localhost:3000
```

No `.env` is needed for development (it points at the API on port 3333). The server prints a warning that it is using an insecure development session secret, which is expected.

Sign up at <http://localhost:3000/signup>, then open the confirmation link from `api/tmp/mail/` to be allowed to create API keys.

### Checks

```bash
# API
cd api
npm run typecheck
node ace plants:audit

# Dashboard
cd web
npx vue-tsc --noEmit                              # app code
npx vue-tsc --noEmit -p .nuxt/tsconfig.server.json  # server code
```

## 3. Production

Run three things: the **API**, the **monitor** (records heartbeats for the status page) and the **dashboard**. Use HTTPS in front of the dashboard. Put the monitor and the dashboard on different hosts from the API if you can, so one outage does not take down the status page too.

### API

```bash
cd api
npm ci
npm run build                  # writes api/build/
cd build
cp ../.env .env                # or provide the variables below another way
npm ci --omit=dev
node ace migration:run --force
# load the data once (same import commands as above, run from build/)
node bin/server.js
```

Required settings (see `api/.env.example`):

| Variable | Notes |
|---|---|
| `NODE_ENV` | `production` |
| `APP_KEY` | Generate with `node ace generate:key`. Keep it secret and stable. |
| `HOST`, `PORT`, `APP_URL` | Where the API listens, and its public URL |
| `LIMITER_STORE` | `database` |
| `MAIL_TRANSPORT` | **Must be `smtp`.** The API refuses to start with `file`. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE`, `MAIL_FROM` | Your mail provider. Set up SPF/DKIM for the sender domain. |
| `WEB_URL` | The dashboard's public address. Links in emails point here. |

Notes:

- **Database.** The current config uses SQLite in `tmp/`, which must be on persistent storage and is suited to a single instance. To use Postgres, install `pg`, switch the connection in `config/database.ts` (a commented example is there) and add the `DB_*` settings. This has not been tested here.
- **CORS.** `config/cors.ts` allows no origins in production. The dashboard does not need any (its server makes the calls), but browser apps calling the API directly do.
- Plants are hidden until published (`node ace plants:publish --all`). Leave `SERVE_UNPUBLISHED` unset or `false`.

### Monitor

```bash
node ace monitor:run --url https://your-api.example.com   # runs until stopped; use systemd, a container, or similar
```

Without it the status page shows "Monitoring is delayed". More in `api/MONITORING.md`.

### Dashboard

```bash
cd web
npm ci
npm run build
NUXT_SESSION_PASSWORD="<32+ random characters>" \
NUXT_API_URL="https://your-api.example.com/api/v1" \
NUXT_PUBLIC_API_BASE="https://your-api.example.com/api/v1" \
NUXT_PUBLIC_DOCS_URL="https://your-api.example.com/docs" \
node .output/server/index.mjs        # PORT defaults to 3000
```

| Variable | Notes |
|---|---|
| `NUXT_SESSION_PASSWORD` | **Required.** 32+ random characters that seal the session cookie. The server refuses to start without it. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. Changing it signs everyone out. |
| `NUXT_API_URL` | Where the dashboard's server reaches the API (can be an internal address) |
| `NUXT_PUBLIC_API_BASE`, `NUXT_PUBLIC_DOCS_URL` | The API's public URLs, shown in the UI |
| `NUXT_COOKIE_SECURE` | `true` by default in production (HTTPS only). Set `false` only to try a production build over plain http locally. |
| `NUXT_TRUST_PROXY` | `true` only behind a reverse proxy you control, so `X-Forwarded-*` headers can be trusted |

The production build sends a strict Content-Security-Policy and HSTS, and the session cookie is `Secure` with the `__Host-` prefix, so serve it over HTTPS.

## Useful commands

| Command (in `api/`) | Purpose |
|---|---|
| `node ace plants:audit --warnings` | Check plant, companion and amendment data for contradictions |
| `node ace plants:publish --all` or `<slug> ...` | Make plants visible; `--unpublish` hides them. Refuses to run if the audit has errors. |
| `node ace import:*` | Reload any source dataset |
| `node ace db:seed --files ...` | Reload the curated plants, companions and amendments (publish state is kept) |
| `npm run monitor` | Record heartbeats for the status page |
| `node ace list` | Everything else |

## Licenses and attribution

Plant names come from the USDA PLANTS Database, frost dates from NOAA, ZIP locations from the US Census (all public domain). Hardiness zones by ZIP belong to Oregon State University and are served unaltered with attribution; read [their terms](https://prism.oregonstate.edu/phzm) before charging for access. Companion, amendment and care data are curated here and described in `api/DATA_REVIEW.md`.
