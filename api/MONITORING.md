# Monitoring and the status page

The public status page (`/status` in the dashboard) is built from heartbeats recorded by an **external
monitor process**. A check run from inside the API cannot see the API being down, so the monitor is a
separate process that calls the API over HTTP, the way a customer would.

## Run the monitor

```bash
node ace monitor:run                       # probe every 60 seconds until stopped
node ace monitor:run --once                # one probe, then exit (for cron or testing)
node ace monitor:run --url https://api.example.com --interval 30
```

It must be running for the status page to be meaningful. If it stops, the page shows
**"Monitoring is delayed"** after 3 minutes and reports the overall status as unknown.

> **In production** run it as its own process (a systemd service, a second container, or a scheduler
> that calls `--once` every minute), on a different host from the API if you can. The dashboard that
> serves `/status` should also be deployed separately from the API; otherwise one outage takes both down.

## What is checked

| Component | Checked by | How |
|---|---|---|
| API | monitor, over HTTP | `GET /api/v1/health` (liveness). Degraded above 1.5 s, down on error, timeout or non-2xx. |
| Database | readiness | `select 1` |
| Plant data | readiness | published plants exist |
| Frost & hardiness data | readiness | a real nearest-station lookup, plus ZIP and hardiness lookups |
| Moon phases | readiness | a real moon calculation |
| Rate limiting | readiness | a read of the limiter store |

`GET /api/v1/health/ready` runs the readiness checks and answers `503` if any is down. If the API cannot
be reached at all, every component is recorded as down.

## What is recorded

- `heartbeats`: one row per component per probe. Kept 48 hours, then pruned (hourly).
- `heartbeat_daily`: per-day counters per component. Kept indefinitely; this feeds the 90-day bars.
- `incidents`: opened after **2 consecutive** bad probes (backdated to the first), resolved after
  **2 consecutive** good ones. A degraded incident escalates to down if it gets worse. When the API is
  down, one "API is down" incident is opened rather than one per component.

Uptime is the share of probes that were not `down`; a slow (degraded) probe is not downtime.
A day is shown red after 3 failed probes, amber after 1 failed or 3 slow ones.

## Public endpoints (no API key)

| Endpoint | Purpose | Limit |
|---|---|---|
| `GET /api/v1/health` | Liveness, for load balancers | none |
| `GET /api/v1/health/ready` | Readiness details | 60/min per IP |
| `GET /api/v1/status` | Everything the status page shows; cached 15 s | 60/min per IP |

Error text on these endpoints is deliberately generic ("Check failed"). The real error is written to the
server log, so internal details such as table names never reach the public page.

## Known limits

- If the database is down, the monitor cannot record anything. It logs the failure and keeps trying, and
  the status endpoint (which reads the database) fails too, which the page shows as "Can't reach the API".
- Incidents are automatic. There are no manual updates ("identified", "monitoring") or subscriptions yet.
- Production CORS (`config/cors.ts`) allows no origins by default; the status page's origin must be allowed
  for it to read `/status`.
