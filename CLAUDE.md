# low_tide — project state

Snapshot for resuming after a break. Last worked: 2026-09-21.

## What this is

**low_tide** = the *Kachemak Bay intertidal data analysis tool* — a static web app
for exploring low-tide species/observation data. It is deployed as a sibling app
alongside **HWITW** (How Weird is the Weather) on a shared DigitalOcean droplet.

This folder holds the source (zipped + extracted) and the **deployment framework**
I built. The app source itself is deployed **verbatim — no source edits**.

**Handoffs:** as of 2026-09-04 the collaborator (katmai-mckittrick on GitHub)
**pushes directly to this repo's `main`** — no more zips. Workflow each time:
`git fetch` → review `git diff main..origin/main` (watch for new generated blobs,
new asset references, case-sensitivity) → `git pull` → deploy → **run a manual
data refresh (SOP — always, see below)** → verify live → commit+push any
deploy-layer changes of ours. (Zip-era workflow, if one ever arrives again:
unzip → diff → apply into `deploy/app/` → same from "deploy" on; one commit per
handoff.) Handoff history:
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
- **git push** — 2026-09-04 (9 commits, first git-based handoff): adds **location
  data** — `download.py` now also generates `static/seldovia_locations.js` +
  `static/costal_studies_locations.js` (from new "Location info" sheet tabs;
  `Get_data.py` grew gid/tab URL params), `index_lt.html` loads both; big
  `low_tide_data_analasis.js` rework; deletes the unused `static/noUiSlider-15.8.1/`
  duplicate (page always used `libs/nouislider/`). Deploy-layer changes ours:
  refresh.sh now publishes 5 blobs, deploy rsync excludes 6, cron fixed to true
  4 AM Anchorage.

## Current status: DEPLOYED & LIVE ✅

- **low_tide:** **https://lowtidedata.org/** (since 2026-09-21; `www.` 301s to the apex; HTTPS via
  Caddy + Let's Encrypt, auto-renewing). The Reserved IP http://209.38.5.101/ still works as a
  bare-IP HTTP fallback — old links don't break.
- **HWITW:**    http://164.92.75.176/ (droplet's primary IP — untouched, still working)

All containers are `restart: unless-stopped` and the Reserved IP is permanently
assigned, so everything survives a droplet reboot. Safe to walk away.

## Key facts (the non-obvious stuff)

- **The app is 100% static.** `static/index_lt.html` + JS with pre-baked data.
  Two datasets, picked via the area selector (`<select id=area_select>`):
  `static/seldovia_sheet.js` (~2.7MB) and `static/costal_studies_sheet.js` (~558KB),
  plus shared `static/Temp_data.js` (~758KB) and, since 2026-09-04, two location
  blobs `static/seldovia_locations.js` + `static/costal_studies_locations.js`.
  ⚠️ The location blobs are **generated-only — not in git**; they exist solely on
  the droplet (published by the refresh). That makes their rsync excludes
  load-bearing: without them, `--delete` wipes them off the live site.
  The frontend makes **zero** backend calls.
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
- **Domain `lowtidedata.org`** — registered 2026-09-21 at **Cloudflare Registrar** (account
  hig314@gmail.com; nameservers clara/george.ns.cloudflare.com). DNS: A `@` and A `www` →
  209.38.5.101, **proxy OFF (grey cloud)** — deliberate, so Caddy talks to browsers directly
  and does its own ACME issuance. If the orange cloud is ever turned on, Cloudflare terminates
  TLS itself and you must set its SSL mode to **Full (strict)** or the site loops/breaks.
- Multi-app Docker host under `/opt`, all on the external network `web_external`:
  - `/opt/caddy/`   — Caddy 2, owns :80/:443, routes to apps by container name.
  - `/opt/hwitw/`   — HWITW Flask app (gunicorn :5000 internal).
  - `/opt/lowtide/` — this app (nginx :80 internal). ← created this session.
- **Routing:** the domain has its own Caddy site blocks (`lowtidedata.org` →
  `reverse_proxy lowtide:80`, `www` → redirect; Caddy auto-redirects HTTP→HTTPS for them;
  certs persist in `/opt/caddy/data/caddy_data/`). For the bare IPs, Caddy has one `:80`
  listener and splits the two apps on the **Host header**. DO 1:1-NATs the reserved IP onto eth0, but the browser still sends
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
    # NOTE: the six data-blob excludes are deliberate — the cron owns live data;
    # a code handoff must not clobber freshly-fetched blobs, and the two
    # *_locations.js blobs exist ONLY on the droplet (not in git), so without
    # their excludes --delete would remove them from the live site. (rsync won't
    # --delete excluded files on the remote.) See "Data refresh (cron)" below.
    rsync -az --delete --exclude '.DS_Store' --exclude '__pycache__' --exclude '._*' \
      --exclude 'static/seldovia_sheet.js' --exclude 'static/costal_studies_sheet.js' \
      --exclude 'static/Temp_data.js' --exclude 'static/temp_data.js' \
      --exclude 'static/seldovia_locations.js' --exclude 'static/costal_studies_locations.js' \
      docker-compose.yml nginx.conf app  root@164.92.75.176:/opt/lowtide/
    ssh root@164.92.75.176 '
      cp -f /opt/lowtide/app/static/Temp_data.js /opt/lowtide/app/static/temp_data.js
      chmod -R a+rX /opt/lowtide/app
      cd /opt/lowtide && docker compose up -d'

    # SOP: ALWAYS run a manual data refresh after a code deploy (a code update can
    # add/change generated blobs — e.g. the 2026-09-04 one added the location
    # blobs, which 404 until the refresh publishes them — and the refresh proves
    # the new pipeline runs). The cron also refreshes daily on its own.
    ssh root@164.92.75.176 'REFRESH_BACKOFF=5 /opt/lowtide/refresh/refresh.sh; tail -5 /opt/lowtide/refresh/refresh.log'

    # if refresh.sh itself changed, rsync it too and restore the execute bit
    # (rsync -a copies local perms; a chmod-stripped local copy bit us once):
    rsync -az refresh/refresh.sh root@164.92.75.176:/opt/lowtide/refresh/refresh.sh
    ssh root@164.92.75.176 'chmod +x /opt/lowtide/refresh/refresh.sh'

    # verify live after deploy (assets at /, not /static/)
    curl -s -o /dev/null -w '%{http_code}\n' https://lowtidedata.org/seldovia_sheet.js
    # bare-IP fallback path (Caddy routes lowtide on Host: 209.38.5.101)
    curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: 209.38.5.101' \
      http://164.92.75.176/seldovia_sheet.js

    # Caddy config lives in /opt/caddy/Caddyfile (reference copy: deploy/Caddyfile).
    # After editing it:  validate, then reload (no container restart needed).
    ssh root@164.92.75.176 'cd /opt/caddy && docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile \
      && docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile'

## Data refresh (cron)

Live data blobs refresh **daily at 04:00 America/Anchorage** on the droplet via
`/opt/lowtide/refresh/refresh.sh` (source: `deploy/refresh/`, full notes in
`deploy/refresh/README.md`). Ubuntu's ISC cron **ignores `CRON_TZ`** (the
original setup silently fired at 4 AM UTC); since 2026-09-04 the crontab fires at
**12:00 and 13:00 UTC** with a guard (`TZ=America/Anchorage date +\%H` = 04) so
exactly one runs at true 4 AM Anchorage, tracking DST.

- **Runs her `download.py` UNMODIFIED** in a staging dir `/opt/lowtide/refresh/work/`
  (our own venv with `requests`), then publishes the 5 regenerated blobs (2 sheet
  + 2 location + temp) into the live `app/static/` and recreates the lowercase
  `temp_data.js` alias.
- **Sources (public, no auth):** 2 Google Sheets (Seldovia + Costal studies, now
  2 tabs each: observations + "Location info") and NOAA station 9455500 water
  temperature. The NOAA temp fetch is **incremental**
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

- ~~HTTPS~~ — done 2026-09-21 via lowtidedata.org. Optional Cloudflare hardening not
  yet done: enable DNSSEC (one click for a Cloudflare-registered domain) and add a CAA
  record `0 issue "letsencrypt.org"`. Neither affects the running site.
- HWITW has no domain; if it ever gets one, same recipe (see `deploy/opt-README.md`).
- The droplet is small (2GB/1vCPU). low_tide is just static nginx so it's light,
  but keep an eye on RAM if HWITW or future siblings grow.
- **No JS cache-busting.** Scripts load as plain `src="…​.js"` (no `?v=`/hash), so
  after a handoff that changes JS, a browser can serve a stale cached copy until a
  hard refresh (this bit us once on the `website 3.zip` `clearListeners` change —
  the deploy was correct; the browser cache was stale). If it recurs, add a no-cache
  header for `*.js` in our `nginx.conf` (deploy-layer, doesn't touch her files).
