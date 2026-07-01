# low_tide — project state

Snapshot for resuming after a break. Last worked: 2026-06-30.

## What this is

**low_tide** = the *Kachemak Bay intertidal data analysis tool* — a static web app
for exploring low-tide species/observation data. It is deployed as a sibling app
alongside **HWITW** (How Weird is the Weather) on a shared DigitalOcean droplet.

This folder holds the source (zipped + extracted) and the **deployment framework**
I built. The app source itself is deployed **verbatim — no source edits**.

**Handoffs:** the collaborator ships new versions as zip files. A zip may be a
**full** tree (mirror into `deploy/app/` with rsync `--delete`) or a **partial**
set of just-changed files (copy those files in — do NOT `--delete`, that would wipe
the tree). Workflow each time: unzip → diff against `deploy/app/` → apply → smoke-test
locally → deploy → verify live → `git add -A && commit && push` (one commit per
handoff, so her versions diff cleanly). Handoff history:
- `website.zip` — initial deploy (2026-06-08).
- `website 2.zip` — 2026-06-29 (full): split the data into **two datasets** (Seldovia +
  Coastal studies) with an area selector; bigger temp data.
- `website 3.zip` — 2026-06-29 (partial, 2 files): `libs/utils.js` gains a
  `clearListeners()` helper; `low_tide_data_analasis.js` uses it + a new `clear()`
  method to tear down the custom-species UI (drops the old `{once:true}` listener).
- `website 4.zip` — 2026-06-30 (partial, 1 file): `Get_temp_data.py` — on a NOAA
  non-200, `print`+`return` instead of `raise`, so a NOAA outage no longer aborts
  the whole refresh (Google Sheets still update; temp stays last-good). Directly
  addresses the NOAA fragility noted in "Data refresh (cron)".

## Current status: DEPLOYED & LIVE ✅

- **low_tide:** http://209.38.5.101/  (its own DigitalOcean Reserved IP — bare "naked IP", HTTP only)
- **HWITW:**    http://164.92.75.176/ (droplet's primary IP — untouched, still working)

All containers are `restart: unless-stopped` and the Reserved IP is permanently
assigned, so everything survives a droplet reboot. Safe to walk away.

## Key facts (the non-obvious stuff)

- **The app is 100% static.** `static/index_lt.html` + JS with pre-baked data.
  Two datasets, picked via the area selector (`<select id=area_select>`):
  `static/seldovia_sheet.js` (~2.7MB) and `static/costal_studies_sheet.js` (~558KB),
  plus shared `static/Temp_data.js` (~758KB). (The old single `static/sheet.js` was
  retired in the 2026-06-29 handoff.) The frontend makes **zero** backend calls.
  It's served by plain `nginx:alpine` with the `static/` dir as the web root, so
  assets resolve at `/` (e.g. `/seldovia_sheet.js`), **not** under `/static/`.
- **`webapp.py` is dead weight here.** It's a vestigial copy of HWITW's Flask
  server: it `import wxdata` (a module that isn't present in this project) and
  redirects `/` to a nonexistent `index.html`. We do NOT run it. If anyone asks
  "why isn't the Flask app running" — it can't, and nothing needs it.
- **Linux case-sensitivity fix (deploy-layer, not a source edit):** `index_lt.html`
  loads `temp_data.js` but the actual file is `Temp_data.js`. Invisible on the
  dev's case-insensitive Mac; a 404 on Linux (breaks "Show temperature"). Fixed by
  creating a lowercase alias on the droplet at deploy time:
  `cp app/static/Temp_data.js app/static/temp_data.js`. The two names can't coexist
  on the Mac, so this alias only exists on the Linux host, not in this repo.
  Still true in the new version — `index_lt.html` loads lowercase `temp_data.js`.
  ⚠️ Never create/`rm` the lowercase alias locally: on the case-insensitive Mac,
  `rm temp_data.js` deletes `Temp_data.js` (same file). Only do the alias on the
  droplet. To smoke-test locally, the lowercase ref already resolves to `Temp_data.js`.

## Infrastructure

DigitalOcean account `hig314@gmail.com`, `doctl` is authenticated locally.
SSH: `ssh root@164.92.75.176` (local `~/.ssh/id_rsa`, key "macbook" on the account).

- Droplet **hwitw** (id `574919305`), sfo3, 2GB/1vCPU/50GB, Ubuntu+Docker. ~1.4GB
  RAM free, 41GB disk free.
- Reserved IP **209.38.5.101** (assigned to that droplet) → low_tide's bare URL.
- Multi-app Docker host under `/opt`, all on the external network `web_external`:
  - `/opt/caddy/`   — Caddy 2, owns :80/:443, routes to apps by container name.
  - `/opt/hwitw/`   — HWITW Flask app (gunicorn :5000 internal).
  - `/opt/lowtide/` — this app (nginx :80 internal). ← created this session.
- **Routing:** Caddy has one `:80` listener and splits the two apps on the **Host
  header**. DO 1:1-NATs the reserved IP onto eth0, but the browser still sends
  `Host: 209.38.5.101`, so `@lowtide host 209.38.5.101 -> reverse_proxy lowtide:80`,
  everything else -> hwitw. No second listener / per-IP bind needed.

## This folder

- `deploy/` — the deployment framework (see `deploy/README.md` for full ops):
  - `docker-compose.yml`, `nginx.conf` — the lowtide stack (deployed to `/opt/lowtide/`).
  - `Caddyfile` — reference copy of the updated `/opt/caddy/Caddyfile`.
  - `opt-README.md` — reference copy of the droplet's updated `/opt/README.md`.
  - `app/` — verbatim copy of the low_tide project (the `website/` contents).
  - `refresh/` — the **data-refresh cron** (our infra): `refresh.sh` + `README.md`.
    Deployed to `/opt/lowtide/refresh/`. See "Data refresh (cron)" below.
- `extracted/` — unzipped originals. `website/website/` = low_tide source;
  `data_analysis/.../low_tide_app/` = the full HWITW repo (helm/docker/data tools).
- `website.zip`, `Low_tide_data_analasys_web.zip` — the original archives.

This folder is a **git repo** (`main`), pushed to a private GitHub repo
`github.com/hig314/low_tide`. Archives (`*.zip`) and `extracted/` are gitignored;
the deployed source of truth lives in `deploy/app/`. Each collaborator zip handoff
is applied into `deploy/app/` and committed, so her versions diff cleanly.

## Common ops

    # status / logs
    ssh root@164.92.75.176 'docker ps'
    ssh root@164.92.75.176 'docker logs lowtide --tail 50'

    # redeploy after changing app content or the framework (from deploy/).
    # NOTE: the four data-blob excludes are deliberate — the cron owns live data;
    # a code handoff must not clobber freshly-fetched blobs (rsync also won't
    # --delete excluded files on the remote). See "Data refresh (cron)" below.
    rsync -az --delete --exclude '.DS_Store' --exclude '__pycache__' --exclude '._*' \
      --exclude 'static/seldovia_sheet.js' --exclude 'static/costal_studies_sheet.js' \
      --exclude 'static/Temp_data.js' --exclude 'static/temp_data.js' \
      docker-compose.yml nginx.conf app  root@164.92.75.176:/opt/lowtide/
    ssh root@164.92.75.176 '
      cp -f /opt/lowtide/app/static/Temp_data.js /opt/lowtide/app/static/temp_data.js
      chmod -R a+rX /opt/lowtide/app
      cd /opt/lowtide && docker compose up -d'

    # data blobs refresh AUTOMATICALLY via cron (see below) — no manual step needed.
    # To force a refresh now:
    ssh root@164.92.75.176 'REFRESH_BACKOFF=5 /opt/lowtide/refresh/refresh.sh; tail -5 /opt/lowtide/refresh/refresh.log'

    # verify live after deploy (Caddy routes lowtide on Host: 209.38.5.101; assets at /)
    curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: 209.38.5.101' \
      http://164.92.75.176/seldovia_sheet.js

## Data refresh (cron)

Live data blobs refresh **daily at 04:00 America/Anchorage** on the droplet via
`/opt/lowtide/refresh/refresh.sh` (source: `deploy/refresh/`, full notes in
`deploy/refresh/README.md`). Cron uses `CRON_TZ=America/Anchorage` so 4 AM holds
across DST.

- **Runs her `download.py` UNMODIFIED** in a staging dir `/opt/lowtide/refresh/work/`
  (our own venv with `requests`), then publishes the 3 regenerated blobs into the
  live `app/static/` and recreates the lowercase `temp_data.js` alias.
- **Sources (public, no auth):** 2 Google Sheets (Seldovia + Costal studies) and
  NOAA station 9455500 water temperature. The NOAA temp fetch is **incremental**
  and stateful — the `Temp_data` pickle lives in `work/` and must persist; never
  delete it (else it refetches from 2004).
- **Isolation = cron owns data, handoffs own code.** The deploy rsync excludes the
  4 generated blobs (see Common ops) so the two never collide. We touch none of her
  files; all cron infra lives in `deploy/refresh/` ↔ `/opt/lowtide/refresh/`.
- **Failure = log-only, and NOAA outages now degrade gracefully.** NOAA's
  `water_temperature` product 5xx's intermittently. Since the `website 4.zip`
  handoff, `Get_temp_data.py` skips (print+return) instead of raising, so a NOAA
  blip no longer aborts the run — the Google Sheets still refresh and temp holds at
  last-good (the early return is before the pickle write, so no corruption). Skipped
  days self-heal on the next success (incremental backfill). `refresh.sh` still adds
  belt-and-suspenders: retries, keeps last-good on any hard failure, and logs.
- Check it: `ssh root@164.92.75.176 'crontab -l; tail -20 /opt/lowtide/refresh/refresh.log'`

## Possible follow-ups (not done, not blocking)

- HTTPS: not possible on a bare IP (Let's Encrypt won't issue for IPs). If a domain
  is pointed at 209.38.5.101, add a domain block to the Caddyfile and Caddy
  auto-issues TLS. A commented example is in `deploy/Caddyfile`.
- The droplet is small (2GB/1vCPU). low_tide is just static nginx so it's light,
  but keep an eye on RAM if HWITW or future siblings grow.
- **No JS cache-busting.** Scripts load as plain `src="…​.js"` (no `?v=`/hash), so
  after a handoff that changes JS, a browser can serve a stale cached copy until a
  hard refresh (this bit us once on the `website 3.zip` `clearListeners` change —
  the deploy was correct; the browser cache was stale). If it recurs, add a no-cache
  header for `*.js` in our `nginx.conf` (deploy-layer, doesn't touch her files).
