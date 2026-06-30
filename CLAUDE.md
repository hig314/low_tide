# low_tide — project state

Snapshot for resuming after a break. Last worked: 2026-06-29.

## What this is

**low_tide** = the *Kachemak Bay intertidal data analysis tool* — a static web app
for exploring low-tide species/observation data. It is deployed as a sibling app
alongside **HWITW** (How Weird is the Weather) on a shared DigitalOcean droplet.

This folder holds the source (zipped + extracted) and the **deployment framework**
I built. The app source itself is deployed **verbatim — no source edits**.

**Handoffs:** the collaborator ships new versions as zip files (no shared git repo —
see follow-ups). Each new zip is unzipped, mirrored into `deploy/app/` with rsync
`--delete`, smoke-tested locally, then deployed. Handoff history:
- `website.zip` — initial deploy (2026-06-08).
- `website 2.zip` — 2026-06-29: split the data into **two datasets** (Seldovia +
  Coastal studies) with an area selector; bigger temp data. Deployed & verified.

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
- `extracted/` — unzipped originals. `website/website/` = low_tide source;
  `data_analysis/.../low_tide_app/` = the full HWITW repo (helm/docker/data tools).
- `website.zip`, `Low_tide_data_analasys_web.zip` — the original archives.

## Common ops

    # status / logs
    ssh root@164.92.75.176 'docker ps'
    ssh root@164.92.75.176 'docker logs lowtide --tail 50'

    # redeploy after changing app content or the framework (from deploy/)
    rsync -az --delete --exclude '.DS_Store' --exclude '__pycache__' --exclude '._*' \
      docker-compose.yml nginx.conf app  root@164.92.75.176:/opt/lowtide/
    ssh root@164.92.75.176 '
      cp -f /opt/lowtide/app/static/Temp_data.js /opt/lowtide/app/static/temp_data.js
      chmod -R a+rX /opt/lowtide/app
      cd /opt/lowtide && docker compose up -d'

    # refresh the data blobs: run the project's download.py locally to regenerate
    # static/seldovia_sheet.js + static/costal_studies_sheet.js + static/Temp_data.js,
    # then redeploy as above.

    # verify live after deploy (Caddy routes lowtide on Host: 209.38.5.101; assets at /)
    curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: 209.38.5.101' \
      http://164.92.75.176/seldovia_sheet.js

## Possible follow-ups (not done, not blocking)

- **Git repo:** there is none. Each collaborator handoff is a separate zip, compared
  by hand. A `git init` here would let us diff her versions cleanly. Proposed, not
  yet done.
- HTTPS: not possible on a bare IP (Let's Encrypt won't issue for IPs). If a domain
  is pointed at 209.38.5.101, add a domain block to the Caddyfile and Caddy
  auto-issues TLS. A commented example is in `deploy/Caddyfile`.
- The droplet is small (2GB/1vCPU). low_tide is just static nginx so it's light,
  but keep an eye on RAM if HWITW or future siblings grow.
