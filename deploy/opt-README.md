# /opt — web app host (DigitalOcean droplet "hwitw", sfo3)

Reusable multi-app Docker host. Each app is an `/opt/<app>/` compose stack on
the shared external network `web_external`; **caddy** owns ports 80/443 and
reverse-proxies to apps by their service/container name.

## Apps & addressing
- **HWITW** — primary droplet IP `http://164.92.75.176/`.
- **low_tide** — **https://lowtidedata.org/** (Cloudflare-registered domain, DNS-only /
  grey cloud, A records `@` + `www` → 209.38.5.101; `www` 301s to the apex; Caddy
  auto-issues Let's Encrypt TLS). The Reserved IP `http://209.38.5.101/` still works
  as a bare "naked IP" fallback.
- **low_tide archive** — **https://archive.lowtidedata.org/** (added 2026-10-24): a
  frozen copy, A record `archive` → 209.38.5.101 (grey cloud), own Caddy block.

The domain has its own Caddy site blocks (:443, HTTP→HTTPS redirect). The two bare
IPs share Caddy's single `:80` listener; Caddy splits them on the **Host header**
(the IP you typed). DO routes the reserved IP onto `eth0` via 1:1 NAT, but the
browser still sends `Host: 209.38.5.101`, so no second listener / per-IP bind is
needed.

## Layout
- `/opt/caddy/`  — Caddy 2 reverse proxy. Edit `Caddyfile`, then
  `cd /opt/caddy && docker compose up -d` (or `docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile`).
- `/opt/hwitw/` — HWITW (How Weird is the Weather) Flask app.
  - `repo/` = git clone of github.com/howweirdistheweather/weather_app @ branch **GTA-vertion**.
  - Image built from `repo/helm/Dockerfile` (context `repo/src`), tagged `hwitw:gta`.
  - gunicorn serves on :5000 (internal). Caddy proxies the primary IP :80 → hwitw:5000.
- `/opt/lowtide/` — low_tide intertidal data-analysis app (the "sibling app").
  - `nginx:alpine` container `lowtide` serving `app/static/` (verbatim project
    copy) with pre-baked data blobs. Pages: `/static/main/index_lt.html` (`/` 302s
    there) and `/static/NMDS/index_NMDS.html`.
  - Since 2026-10-18 also `lowtide-api` (built from `api/Dockerfile`): the app's
    `webapp.py` under gunicorn, answering the NMDS page's `POST /requests/NMDS`
    (scikit-learn). nginx proxies `/requests/` to it over the private
    `lowtide_internal` network; capped at 0.75 CPU / 768 MB, rate-limited in nginx.
  - Container `lowtide` exposes :80 internally. Caddy proxies `lowtidedata.org` and
    the reserved IP (Host `209.38.5.101`) → lowtide:80.
  - Deploy-time fix: `cp app/static/Temp_data.js app/static/temp_data.js` (the
    HTML references the lowercase name; Linux is case-sensitive, the dev's Mac
    wasn't). Source files are otherwise untouched.
- `/opt/lowtide-archive/` — frozen archive of low_tide (since 2026-10-24): same
  layout, containers `lowtide-archive` + `lowtide-archive-api` (0.5 CPU / 768 MB,
  network `archive_internal`). `app/` is a pinned commit of
  github.com/katmai-mckittrick/low_tide_archive; data generated ONCE
  (`download-once/`), **no cron — by design**. Caddy: `archive.lowtidedata.org` →
  lowtide-archive:80.

## HWITW landing page
Caddy redirects exact root `/` → `/static/hwitw-cesium.html` (the interactive Cesium
globe + grid wrapper), not the map-less `index.html`. Done at the proxy layer, so neither
the app source nor static/ is modified. The Cesium page needs no Cesium Ion token (uses
OpenStreetMap + USGS imagery).

Fully self-hosted: the wrapper's iframe `src` + `urlBase` point at relative `/static/index.html`
instead of NCEAS, so the grid is served from this host. These edits are committed upstream on
branch GTA-vertion (commit ddfbf56) and baked into the image at build time — there are no
override bind mounts (the earlier `static-overrides/` hack was retired). The ONLY thing fetched
from NCEAS is the weather JSON (`wxgrid.js` → getwxvar); see below.

## HWITW data note
The frontend (`repo/src/website/static/wxgrid.js`) fetches weather data from the
NCEAS dev backend `https://hwitw-dev.arcticdata.io/wxapp/getwxvar` — NOT from this
server. This box serves only the UI + Flask shell. The app's own `/wxapp/*` API
returns 500 here because there is no local `hwitw.wxdb` (HDF5) data file; that is
expected and unused. Hosting our own wxdb is a deferred step.

## Common ops
    cd /opt/hwitw && git -C repo pull --ff-only && docker compose build && docker compose up -d   # update HWITW
    cd /opt/lowtide && docker compose up -d --build --force-recreate   # (re)start low_tide after a sync
    docker ps                         # status
    docker logs hwitw   --tail 50     # HWITW app logs
    docker logs lowtide --tail 50     # low_tide (nginx) logs
    docker logs lowtide-api --tail 50 # low_tide NMDS backend (gunicorn) logs
    docker logs caddy   --tail 50     # proxy logs

## Domains
low_tide's domain is done (see Caddyfile: `lowtidedata.org` + `www` blocks; certs live
in `/opt/caddy/data/caddy_data/` and auto-renew). To add one for HWITW, do the same:
point an A record at 164.92.75.176 (or a new reserved IP), add
    example.org { encode gzip; reverse_proxy hwitw:5000 }
to the Caddyfile, reload, and Caddy issues TLS on first request.

## Adding another app
Create `/opt/<app>/docker-compose.yml` on `web_external` (external network),
`docker compose up -d`, then add a Caddy block routing to it (by Host/domain, or
attach another reserved IP and match its Host like low_tide).
