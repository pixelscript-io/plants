# Plants API dashboard

A Nuxt 4 app where API users sign up, create API keys and monitor usage. It is built with
[shadcn-vue](https://www.shadcn-vue.com) using its default configuration and sidebar layout, and talks to
the AdonisJS API in `../api`.

## Run it

```bash
# API (port 3333)
cd ../api && npm run dev

# Dashboard (port 3000)
cd web && npm install && npm run dev
```

Open <http://localhost:3000>. Copy `.env.example` to `.env` to change settings. Everything works with the
defaults in development.

| Variable | Default | Purpose |
|---|---|---|
| `NUXT_API_URL` | `http://localhost:3333/api/v1` | **Server only.** Where the dashboard's server reaches the API (can be an internal address). |
| `NUXT_SESSION_PASSWORD` | _(dev fallback)_ | **Server only. Required in production**: 32+ random characters that seal the session cookie. The server refuses to start without it. |
| `NUXT_COOKIE_SECURE` | `true` in production builds | Send the session cookie only over HTTPS. Set `false` only to try a production build over plain http. |
| `NUXT_TRUST_PROXY` | `false` | Trust `X-Forwarded-*` headers. Enable only behind a reverse proxy you control. |
| `NUXT_PUBLIC_API_BASE` | `http://localhost:3333/api/v1` | The API's public URL, shown in code examples. The browser never calls it. |
| `NUXT_PUBLIC_DOCS_URL` | `http://localhost:3333/docs` | API reference linked from the sidebar |

## Pages

| Route | What it does |
|---|---|
| `/login`, `/signup` | Account access. Signed-out visitors to any other page are redirected to login. |
| `/forgot-password`, `/reset-password` | Request a reset email, then choose a new password from the emailed link. Open to anyone, signed in or not. |
| `/verify-email` | Where the confirmation link in the signup email lands. Open to anyone. |
| `/` | Overview: key count, requests today and over 30 days, a usage chart, a first-request snippet. |
| `/keys` | List, create and revoke API keys. A new key is shown in full once, with a copy button. |
| `/plants` | Plant explorer: search by common, alternate or scientific name, filter by type, sun, water and life cycle. Search and page live in the URL, so they can be shared. |
| `/plants/:slug` | Plant detail: growing conditions, planting windows, companions (with reasons), soil amendments, a planting calendar for any US ZIP code, and data sources. |
| `/status` | **Public** API status page (no login): overall state, per-component status, 90-day uptime bars, 24-hour response times and incidents. Refreshes every 30 seconds and says so when the API cannot be reached. Needs the monitor running; see `../api/MONITORING.md`. |
| `/usage` | Usage for all keys or one key over 7, 30 or 90 days: totals, errors, rate-limited requests, daily quota and a per-day table. |
| `/account` | Profile, the limits that apply to your keys, and log out. |

## How sign-in works

The dashboard's own server (Nitro) sits between the browser and the API, so the API token never reaches page
scripts:

```
browser  --(httpOnly session cookie)-->  dashboard server  --(Bearer token)-->  Plants API
```

- **Login and signup** (`/api/auth/login`, `/api/auth/signup`) call the API, then store the returned token
  inside a **sealed** (encrypted and tamper-proof) cookie. The browser is told who signed in, never the token.
- **The cookie** is `HttpOnly` (scripts cannot read it), `SameSite=Lax`, and over HTTPS also `Secure` with the
  `__Host-` prefix, which pins it to this exact origin. It lasts 7 days, matching the API token's lifetime.
- **Everything the dashboard asks of the API** goes through `/api/proxy/*`, which adds the token on the server.
  Only `account/*` routes and the public `status` endpoint are reachable; login, signup, `account/logout` and the
  key-authenticated data routes are not, and paths with dots or odd characters are refused.
- **Session state** comes from `/api/auth/session`, because JavaScript cannot see the cookie.
- **Logout** revokes the token on the API and deletes the cookie, so a copied cookie stops working.
- **CSRF**: besides `SameSite=Lax`, every state-changing request is refused if it declares itself cross-site or
  its `Origin` is not this site.
- **Brute force**: the API locks an email out for 15 minutes after 10 failed logins (existing and unknown emails
  alike), and the dashboard server allows 20 login attempts per minute per IP address. The IP limit is in memory,
  per instance and best effort; the API's lockout is the real defence.
- **Headers**: all responses carry `nosniff`, `X-Frame-Options: DENY`, a referrer policy and a permissions
  policy. Production builds add HSTS and a Content-Security-Policy whose `connect-src 'self'` means injected
  script cannot send data to any other server, or call the API directly.
- **Email verification and password reset** go through the same server (`/api/auth/verify-email`,
  `/api/auth/forgot-password`, `/api/auth/reset-password`, and `account/resend-verification` via the proxy), with
  the same CSRF check and per-IP throttles. The emailed token is read from the URL and removed from the address
  bar at once (and the page sends no referrer), so it does not linger in history. A completed reset ends this
  browser's session, because the API has signed the account out everywhere. Unconfirmed users see a banner with a
  resend button, and cannot create keys. See `../api/EMAIL.md`.
- **Old sessions**: anyone who signed in under the previous design still has a script-readable `plants_token`
  cookie. The server revokes that token and deletes the cookie on their next visit
  (`server/middleware/legacy-cookie.ts`, which can be removed once it is no longer needed).

## How the plant explorer gets its data

The public plant endpoints need an API key, but the dashboard signs in with an account token (and keys are
shown only once). So the explorer calls three account-authenticated routes on the API instead:
`GET /account/plants`, `GET /account/plants/:slug` and `GET /account/calendar`. They use the same controllers
and data as the public routes, are limited to 120 requests per minute per user, and are not counted as API key
usage. They are internal to the dashboard and are not in the public OpenAPI spec.

## Structure

- `app/pages`, `app/layouts` (`default` is the sidebar shell, `auth` is the centered card)
- `app/components/ui`: shadcn-vue components, generated by `npx shadcn-vue@latest add <name>`
- `app/composables`: `useApi` (API client), `useAuth` (session), `useApiKeys`, `useFormat`
- `app/middleware/auth.global.ts`: route guard
- `app/types/api.ts`: API response types

## Known limits

- **CSP allows inline scripts** (`'unsafe-inline'`) because Nuxt embeds its configuration in the page. A
  nonce-based policy would remove that, but needs an additional module.
- **No "sign out everywhere"**, and no list of active sessions. Each login creates a separate 7-day token.
- **The API token lives 7 days** and is not renewed while in use, so users are asked to sign in again weekly.
- **Signup is only throttled per IP** (in memory, at the dashboard server). Verification stops unconfirmed
  accounts from creating keys, but does not stop the accounts themselves from being created.
- **No password change while signed in**, and no two-factor authentication.
- **Signup reveals taken addresses** ("email has already been taken"). Password reset does not.
- The key limit per account is enforced by the API; the dashboard shows its error message but not a "2 of 3" count.
- Billing and plan changes are intentionally not included.
