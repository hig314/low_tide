# low_tide — project state

Snapshot for resuming after a break. Last worked: 2026-10-25.

## ▶ Where we left off (2026-10-25) — read this first

**Everything is deployed, verified and committed. Nothing is mid-flight.**
One known live-data bug is waiting on the user's go-ahead (open item 0).

- **Live:** https://lowtidedata.org — main + NMDS pages (verified in a browser
  2026-10-18). Containers `lowtide` + `lowtide-api`.
- **Archive (new 2026-10-24):** https://archive.lowtidedata.org — frozen copy of
  her fork `katmai-mckittrick/low_tide_archive`, **pinned at `60274a7`**; data
  snapshot 2026-10-24 (temps through 10-24, aligned, incl. 10-19); **no cron, by
  design**. `/opt/lowtide-archive/`, containers `lowtide-archive` +
  `lowtide-archive-api`. Both pages verified in a browser (NMDS graph: 202 points,
  ~2.5 s). Updates are deliberate re-pins only — recipe in
  `deploy/archive/README.md`. Fork's newer `47355ae` is README-only: nothing to deploy.
- **HWITW + Caddy:** up; Caddy gained the `archive` block (backup
  `/opt/caddy/Caddyfile.bak-20261024`).
- **Code deployed (live):** her `main` through `f330cf7`; her later `15ae42a` is
  README-only (not deployed — README isn't in `deploy/app/`).
- **Data (live):** daily cron healthy — last run 2026-10-25 12:00 UTC, success,
  5/5 blobs. ⚠️ But the live temp pickle is **missing 2026-10-19**, so every
  temperature since shows one day early (item 0).
- **Droplet:** 6 containers up, ~1.2 GB RAM available, 37 GB disk free (2026-10-25).
- **Repo:** `main` clean and in sync with GitHub at `80406d9`; no open PRs or
  branches. Local remote `archive` = her fork (for re-pins).
- **Rollback / backups on the droplet** (prune once things have run clean for a
  while): `/opt/lowtide/{docker-compose.yml,nginx.conf}.bak-20261018`,
  `/opt/lowtide/refresh/work/Temp_data.pre-fix-20261018` and `.pre-refetch-20261018`,
  `/opt/caddy/Caddyfile.bak-20261024`.

**Open items** — details in "Possible follow-ups":
0. **Live temp pickle missing 2026-10-19 — fix offered, awaiting the user's OK.**
   Plan (~5 min): add `TZ=America/Anchorage` to refresh.sh's download.py call,
   then full staged refetch of the live pickle (backup first; expect only the
   positions after 10-18 to change), run refresh.sh, verify. Cause under
   "Data refresh (cron)" → "Day-drop bug". Until fixed, any manual refresh must
   run with `TZ=America/Anchorage` in front.
1. **Alert on refresh failure.** Failures are still log-only; that's how the
   outage went unnoticed.
2. Notes to send her: NMDS page hangs after a non-OK response (`low_tide_NMDS.js`
   `run_graph`); `main/index_lt.html` still loads `../test.js`.
3. Housekeeping: prune the backups above; optional Cloudflare DNSSEC/CAA.

**First thing on restart:** `ssh root@164.92.75.176 'docker ps; tail -3
/opt/lowtide/refresh/refresh.log'` (expect 6 containers up — incl. the 2 archive
ones — and `refresh end (success)`), then `git fetch origin archive` and
`git log --oneline main..origin/main` (live handoffs) +
`git log --oneline 60274a7..archive/main` (archive changes; deploy only on request).
SSH is `ufw limit`ed (6 connections / 30 s): batch commands into few ssh calls.

## What this is

**low_tide** = the *Kachemak Bay intertidal data analysis tool* — a mostly static
web app (plus one small backend endpoint for the NMDS page) for exploring low-tide
species/observation data. It is deployed as a sibling app
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
- **git push** — 2026-10-18 (13 commits + our PR #1): **pages moved into
  subfolders** — `static/main/index_lt.html` and a new **NMDS page**
  `static/NMDS/index_NMDS.html` (+ an `info.html` each); shared code split out to
  `static/ltda_root.js`. The NMDS page has the app's **first backend call**
  (`POST /requests/NMDS`, answered by `webapp.py` + new `MDS.py`/`lzw.py`,
  scikit-learn). Her `requirements.txt` wasn't pip-installable (listed stdlib
  modules); we fixed it via **PR #1, which she merged** — her files go through PRs,
  never direct edits. Deploy-layer changes ours: `lowtide-api` container, nginx
  `/static/` alias + redirects + `/requests/` proxy. See change log.
- **git push** — 2026-10-18, two follow-ups to `Get_temp_data.py`: `d807c91` fixes
  the refresh crash (previous day = last label − 1), `f330cf7` removes the debug
  `print` it added. Both deployed code-only (rsync + SOP refresh, no containers).

## Public repo — what that means

Since 2026-10-18 the GitHub repo is **public**, and that includes this file and
everything under `deploy/`. Host IPs, the DNS layout and the account email
written here are fine to share: they're public anyway through DNS, WHOIS-adjacent
data or the site itself. **Never commit secrets**: no API tokens (`doctl`, Cloudflare,
GitHub), SSH keys, `.env` files or passwords. Credentials stay on the Mac
(`doctl` auth, `~/.ssh`) or on the droplet. Before each commit, check the diff for
anything token-shaped. A history scan when the repo went public found nothing
sensitive in any of its 17 commits. The data sources (Google Sheets, NOAA) are
already public and need no auth.

## Change log (deploy-layer sessions, newest first)

- **2026-10-24 — archive site.** https://archive.lowtidedata.org: her fork
  `low_tide_archive` pinned at `303fd0e` (deploy-layer files in
  `deploy/archive/`: compose, nginx.conf with the api name changed, README;
  reuses `deploy/api/Dockerfile`). Cloudflare A `archive` → 209.38.5.101 (grey,
  added by the user). Same day re-pinned to `60274a7` (her fix: the fork's
  `low_tide_NMDS.js` had been overwritten with the HTML; static-only rsync,
  NMDS graph verified in a browser). Caddy block added + reloaded (backup
  `/opt/caddy/Caddyfile.bak-20261024`), cert issued at once. Data: `download.py`
  run once, full temp refetch from 2004 with `TZ=America/Anchorage` (8332
  entries, aligned). No cron — deliberate. Verified: all pages/blobs 200 over
  HTTPS, info links point to the fork, api answers like live. Found the live
  pickle's missing 10-19 (see "Data refresh"). Also: SSH is `ufw limit`ed
  (6 connections / 30 s → ~1 min "Connection refused"); batch ssh commands.

- **2026-10-18 — data refresh restored.** Deployed her `Get_temp_data.py` fix
  (`d807c91`), code-only (rsync, no container changes). First successful refresh
  since 2026-09-07; all 5 blobs republished. Then, at the user's request, a
  **full temp refetch from 2004** (NOAA had backfilled its summer outage and
  fixed bad late-June values); 71 positions changed, all 2026. Details + the
  pickle's positional layout under "Data refresh (cron)".

- **2026-10-18 — NMDS backend + subfolder pages.** Deployed the 2026-10-18 git
  handoff. New `deploy/api/Dockerfile` → container **`lowtide-api`** (her
  `webapp.py` unmodified under gunicorn; 1 worker, 120 s timeout, 0.75 CPU,
  768 MB, private `lowtide_internal` network). `nginx.conf`: `/static/X` aliases
  `/X`, `/` 302 → `/static/main/index_lt.html`, `/index_lt.html` 301 → same,
  `absolute_redirect off`, `no-cache` on `.js`/`.html` (closes the old
  cache-busting follow-up), `/requests/` proxy with 10/min/IP rate limit (burst 5,
  429), 1 MB body cap. Tested locally in Docker first, then live (all pages,
  redirects, bare IP, NMDS graph in a browser; 400 rows ≈ 14 s on the droplet).
  Droplet backups: `/opt/lowtide/{docker-compose.yml,nginx.conf}.bak-20261018`.
  ⚠️ Found during the SOP refresh: **the data refresh had been failing daily since
  2026-09-08** — fixed the same day, see the entry above.
- **2026-10-18 — repo made public.** `github.com/hig314/low_tide` switched from
  private to public. Docs updated to match (this file, `deploy/README.md`). No
  infra, app or data changes.

- **2026-09-21 — domain.** Put the site on **https://lowtidedata.org** (commit
  `e054709`). Registered at Cloudflare; DNS-only A records `@`+`www` → 209.38.5.101;
  added two Caddy site blocks on the droplet (apex → `lowtide:80`, `www` → 301 to
  apex) and hot-reloaded; Let's Encrypt cert issued immediately (expires 2026-12-20,
  auto-renews). Backup of the prior Caddyfile: `/opt/caddy/Caddyfile.bak-20260921`.
  No app files, nginx config, compose, cron or data touched. Bare-IP URL kept as a
  fallback. Docs updated: `deploy/Caddyfile`, `deploy/README.md`, `deploy/opt-README.md`
  (+ droplet `/opt/README.md`), this file.
- **2026-09-04 — first git handoff** (commit `702fe02`): location blobs in refresh,
  6 rsync excludes, true-4AM-Anchorage cron. See "Handoffs" above.

## Current status: DEPLOYED & LIVE ✅

- **low_tide:** **https://lowtidedata.org/** (since 2026-09-21; `www.` 301s to the apex; HTTPS via
  Caddy + Let's Encrypt, auto-renewing). `/` redirects to `/static/main/index_lt.html`;
  NMDS page at `/static/NMDS/index_NMDS.html`. The Reserved IP http://209.38.5.101/ still works as a
  bare-IP HTTP fallback — old links don't break.
- **NMDS backend:** container `lowtide-api`, reached only via nginx at `/requests/`.
- **Data:** refreshing daily (fixed 2026-10-18); temps current, but 2026-10-19 missing (see open item 0).
- **Archive:** https://archive.lowtidedata.org — frozen, no cron (see `deploy/archive/README.md`).
- **HWITW:**    http://164.92.75.176/ (droplet's primary IP — untouched, still working)

All containers are `restart: unless-stopped` and the Reserved IP is permanently
assigned, so everything survives a droplet reboot. Safe to walk away.

## Key facts (the non-obvious stuff)

- **The app is static except one endpoint.** Pages `static/main/index_lt.html` and
  `static/NMDS/index_NMDS.html` + JS with pre-baked data; shared code in
  `static/ltda_root.js` + `static/libs/`. Page-to-page links are hard-coded to
  `/static/...` (her Flask dev layout), hence our nginx `/static/` alias.
  Two datasets, picked via the area selector (`<select id=area_select>`):
  `static/seldovia_sheet.js` (~2.7MB) and `static/costal_studies_sheet.js` (~558KB),
  plus shared `static/Temp_data.js` (~758KB) and, since 2026-09-04, two location
  blobs `static/seldovia_locations.js` + `static/costal_studies_locations.js`.
  ⚠️ The location blobs are **generated-only — not in git**; they exist solely on
  the droplet (published by the refresh). That makes their rsync excludes
  load-bearing: without them, `--delete` wipes them off the live site.
  The only backend call is the NMDS page's `POST /requests/NMDS`.
  Static files are served by plain `nginx:alpine` with the `static/` dir as the web
  root, so every asset resolves both at `/X` and (via the alias) `/static/X`.
- **`webapp.py` is live since 2026-10-18** — but only its `/requests/NMDS` route
  (with `MDS.py` + `lzw.py`), run unmodified by gunicorn in `lowtide-api`. Its
  `/wxapp/*` routes are HWITW leftovers (`wxdata` isn't imported) and its `/`
  redirect is irrelevant (nginx owns `/`). The `Authorization: Basic weird:weather`
  header the NMDS page sends is also an HWITW leftover; nothing checks it. NMDS is
  CPU-bound: ~14 s for 400 rows on the droplet (one worker, so requests queue).
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

- Droplet **hwitw** (id `574919305`), sfo3, 2GB/1vCPU/50GB, Ubuntu+Docker. ~1.3GB
  RAM available, 38GB disk free (2026-10-18, after adding `lowtide-api`).
- Reserved IP **209.38.5.101** (assigned to that droplet) → low_tide's bare URL.
- **Domain `lowtidedata.org`** — registered 2026-09-21 at **Cloudflare Registrar** (account
  hig314@gmail.com; nameservers clara/george.ns.cloudflare.com). DNS: A `@` and A `www` →
  209.38.5.101, **proxy OFF (grey cloud)** — deliberate, so Caddy talks to browsers directly
  and does its own ACME issuance. If the orange cloud is ever turned on, Cloudflare terminates
  TLS itself and you must set its SSL mode to **Full (strict)** or the site loops/breaks.
- Multi-app Docker host under `/opt`, all on the external network `web_external`:
  - `/opt/caddy/`   — Caddy 2, owns :80/:443, routes to apps by container name.
  - `/opt/hwitw/`   — HWITW Flask app (gunicorn :5000 internal).
  - `/opt/lowtide/` — this app: `lowtide` (nginx :80 internal) + `lowtide-api`
    (gunicorn :5000, reachable only from nginx on `lowtide_internal`).
- **Routing:** the domain has its own Caddy site blocks (`lowtidedata.org` →
  `reverse_proxy lowtide:80`, `www` → redirect; Caddy auto-redirects HTTP→HTTPS for them;
  certs persist in `/opt/caddy/data/caddy_data/`). For the bare IPs, Caddy has one `:80`
  listener and splits the two apps on the **Host header**. DO 1:1-NATs the reserved IP onto eth0, but the browser still sends
  `Host: 209.38.5.101`, so `@lowtide host 209.38.5.101 -> reverse_proxy lowtide:80`,
  everything else -> hwitw. No second listener / per-IP bind needed.

## This folder

- `deploy/` — the deployment framework (see `deploy/README.md` for full ops):
  - `docker-compose.yml`, `nginx.conf`, `api/Dockerfile` — the lowtide stack
    (nginx + NMDS backend), deployed to `/opt/lowtide/`.
  - `Caddyfile` — reference copy of the updated `/opt/caddy/Caddyfile`.
  - `opt-README.md` — reference copy of the droplet's updated `/opt/README.md`.
  - `app/` — verbatim copy of the low_tide project (the `website/` contents).
  - `refresh/` — the **data-refresh cron** (our infra): `refresh.sh` + `README.md`.
    Deployed to `/opt/lowtide/refresh/`. See "Data refresh (cron)" below.
  - `archive/` — the frozen archive site (compose, nginx.conf, README), deployed
    to `/opt/lowtide-archive/`. Its app is her fork, not `app/`.
- `extracted/` — unzipped originals. `website/website/` = low_tide source;
  `data_analysis/.../low_tide_app/` = the full HWITW repo (helm/docker/data tools).
- `website.zip`, `Low_tide_data_analasys_web.zip` — the original archives.

This folder is a **git repo** (`main`), pushed to the **public** GitHub repo
`github.com/hig314/low_tide` (owned by hig314; katmai-mckittrick has write access;
private until 2026-10-18). Archives (`*.zip`) and `extracted/` are gitignored;
the deployed source of truth lives in `deploy/app/`. Each collaborator zip handoff
is applied into `deploy/app/` and committed, so her versions diff cleanly.

## Common ops

    # status / logs
    ssh root@164.92.75.176 'docker ps'
    ssh root@164.92.75.176 'docker logs lowtide --tail 50'
    ssh root@164.92.75.176 'docker logs lowtide-api --tail 50'

    # Code-only handoff (just her app files changed, no deploy-layer edits): the
    # rsync below + chmod + SOP refresh is enough; refresh.sh copies her *.py into
    # work/ itself. webapp.py/MDS.py/lzw.py changes need `docker compose restart
    # lowtide-api`; requirements.txt changes need the full --build line.

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
      docker-compose.yml nginx.conf api app  root@164.92.75.176:/opt/lowtide/
    # --force-recreate: rsync swaps nginx.conf's inode and a single-file bind mount
    # keeps the old one until recreate. --build: picks up requirements.txt changes.
    ssh root@164.92.75.176 '
      cp -f /opt/lowtide/app/static/Temp_data.js /opt/lowtide/app/static/temp_data.js
      chmod -R a+rX /opt/lowtide/app /opt/lowtide/api
      cd /opt/lowtide && docker compose up -d --build --force-recreate'

    # SOP: ALWAYS run a manual data refresh after a code deploy (a code update can
    # add/change generated blobs — e.g. the 2026-09-04 one added the location
    # blobs, which 404 until the refresh publishes them — and the refresh proves
    # the new pipeline runs). The cron also refreshes daily on its own.
    ssh root@164.92.75.176 'REFRESH_BACKOFF=5 /opt/lowtide/refresh/refresh.sh; tail -5 /opt/lowtide/refresh/refresh.log'

    # if refresh.sh itself changed, rsync it too and restore the execute bit
    # (rsync -a copies local perms; a chmod-stripped local copy bit us once):
    rsync -az refresh/refresh.sh root@164.92.75.176:/opt/lowtide/refresh/refresh.sh
    ssh root@164.92.75.176 'chmod +x /opt/lowtide/refresh/refresh.sh'

    # verify live after deploy (assets resolve at both /X and /static/X)
    curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://lowtidedata.org/   # 302 -> /static/main/
    curl -s -o /dev/null -w '%{http_code}\n' https://lowtidedata.org/static/NMDS/index_NMDS.html
    curl -s -o /dev/null -w '%{http_code}\n' https://lowtidedata.org/seldovia_sheet.js
    # NMDS backend: open the NMDS page, click Generate; or check the logs
    ssh root@164.92.75.176 'docker logs lowtide-api --tail 5'
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
  delete it in place (a full refetch is possible — use the staged recipe below).
- **Isolation = cron owns data, handoffs own code.** The deploy rsync excludes the
  6 generated blob names (5 blobs + the `temp_data.js` alias; see Common ops) so
  the two never collide. We touch none of her
  files; all cron infra lives in `deploy/refresh/` ↔ `/opt/lowtide/refresh/`.
- **Failure = log-only, and NOAA outages now degrade gracefully.** NOAA's
  `water_temperature` product 5xx's intermittently. Since the `website 4.zip`
  handoff, `Get_temp_data.py` skips (print+return) instead of raising, so a NOAA
  blip no longer aborts the run — the Google Sheets still refresh and temp holds at
  last-good (the early return is before the pickle write, so no corruption). Skipped
  days self-heal on the next success (incremental backfill). `refresh.sh` still adds
  belt-and-suspenders: retries, keeps last-good on any hard failure, and logs.
- Check it: `ssh root@164.92.75.176 'crontab -l; tail -20 /opt/lowtide/refresh/refresh.log'`
- **`Temp_data` pickle is POSITIONAL — never trim or dedupe it.** The page looks
  temperatures up by index = days since 2004-01-01 (`low_tide_data_procesting.js`);
  the `date` labels are ignored. Entry count == calendar days from 2004-01-02.
  NOAA gaps are filled with N copies labeled with the date *after* the gap
  (currently 3× `2011-01-01`, 12× `2012-01-01`). Those duplicates are what keep
  alignment; removing them shifts every later temperature. Alignment check:
  `len(data) == (last − first).days + 1`.
- **Full refetch (2026-10-18):** NOAA later backfilled its Jun 30–Sep 5 2026 outage
  and corrected bad late-June values (06-28/29 were 1.85 °C → now 8.67/5.67), so we
  rebuilt the pickle from 2004. Safe recipe, never delete in place: run her
  `Get_temp_data.update_data(today)` with the refresh venv in an empty staging dir
  (one-year chunks, saves per chunk, rerun resumes; ~1 run, a few seconds), compare
  with the live pickle (alignment + which positions changed: only 71, all 2026),
  then `mv` the live one aside and copy the new one in, and run `refresh.sh`.
  Backups in `work/`: `Temp_data.pre-fix-20261018`, `Temp_data.pre-refetch-20261018`.
- **Resolved outage (2026-09-08 → 2026-10-18): the refresh failed daily for six
  weeks** (data frozen at 2026-09-07, sheets too, since the crash aborted
  `download.py` before them). Cause: the 69 duplicates sat at the *end* of the
  pickle, and `update_data` derived the day gap from the last two labels → 0 →
  `new_data[-1]` IndexError. Her fix (commit `d807c91`) takes the previous day as
  last label − 1. Tested locally on a copy of the live pickle (aligned, same-day
  rerun idempotent), deployed 2026-10-18; refresh succeeded first try, 41 days
  backfilled, 8326 entries aligned. Pre-fix backup on the droplet:
  `work/Temp_data.pre-fix-20261018`. Failures are log-only, which is why nobody
  noticed for six weeks — see follow-ups.
- **Day-drop bug (found 2026-10-24): never run download.py in UTC after 4 PM
  Anchorage.** `download.py` calls `update_data(datetime.today())`; the droplet is
  UTC but NOAA hours are `lst_ldt` (Alaska). Between 00:00 UTC and Alaska
  midnight, the run stores tomorrow's UTC date as the resume label while the data
  ends a day earlier; the next run starts from that label and silently skips a
  day (no duplicate fills it → every later temp shifts by one). The 4 AM cron is
  safe (UTC date = Alaska date then); our manual SOP refresh on 2026-10-18
  evening (03:00 UTC 10-19) dropped **2026-10-19** from the live pickle. Fix:
  `TZ=America/Anchorage` on the download.py call (deploy-layer, refresh.sh) and
  repair the live pickle — full refetch via the staged recipe (done that way for
  the archive: only the last 5 positions differed, each shifted one day). Until
  then, run manual refreshes with `TZ=America/Anchorage` in front.
- Her `d807c91` also added a debug `print(Temp_data)` (~420 KB per run into
  `refresh.log`); she removed it in `f330cf7` (deployed 2026-10-18; a run now
  logs ~300 bytes). `refresh.sh` rotates the log at 5 MB, keeping one `.1`.

## Possible follow-ups (not done, not blocking)

- ~~HTTPS~~ — done 2026-09-21 via lowtidedata.org. Optional Cloudflare hardening not
  yet done: enable DNSSEC (one click for a Cloudflare-registered domain) and add a CAA
  record `0 issue "letsencrypt.org"`. Neither affects the running site.
- HWITW has no domain; if it ever gets one, same recipe (see `deploy/opt-README.md`).
- The droplet is small (2GB/1vCPU). low_tide's nginx is light; `lowtide-api` idles
  ~130 MB and is capped at 0.75 CPU / 768 MB. Keep an eye on RAM if HWITW or future
  siblings grow, and on NMDS latency if usage picks up (one worker; requests queue).
- Prune the 2026-10-18 droplet backups (see "Where we left off") once stable.
- ~~No JS cache-busting~~ — done 2026-10-18: nginx sends `Cache-Control: no-cache`
  on `.js`/`.html` (browsers revalidate via ETag; unchanged files are cheap 304s).
- **Refresh failures are silent** (log-only; a 6-week outage went unnoticed). Worth an alert (e.g. email or a
  healthcheck ping on failure) so a multi-week outage can't recur unnoticed.
- Notes for her (not blocking): the NMDS page's `run_graph` calls
  `response.json()` even on a non-OK response, so a 429/502/504 leaves the page
  stuck (`waiting` never resets) until reload; `main/index_lt.html` loads
  `../test.js`, which re-inits `date_slider` (one console error, harmless).
