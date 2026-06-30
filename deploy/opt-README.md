# /opt — web app host (DigitalOcean droplet "hwitw", sfo3)

Reusable multi-app Docker host. Each app is an `/opt/<app>/` compose stack on
the shared external network `web_external`; **caddy** owns ports 80/443 and
reverse-proxies to apps by their service/container name.

## Apps & addressing
- **HWITW** — primary droplet IP `http://164.92.75.176/`.
- **low_tide** — Reserved IP `http://209.38.5.101/` (its own bare "naked IP").

Both share Caddy's single `:80` listener; Caddy splits them on the **Host header**
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
  - Static-only: `nginx:alpine` serving `app/static/` (verbatim project copy);
    `index_lt.html` + pre-baked `sheet.js`/`Temp_data.js`, no backend calls.
  - Container `lowtide` exposes :80 internally. Caddy proxies the reserved IP
    (Host `209.38.5.101`) → lowtide:80.
  - Deploy-time fix: `cp app/static/Temp_data.js app/static/temp_data.js` (the
    HTML references the lowercase name; Linux is case-sensitive, the dev's Mac
    wasn't). Source files are otherwise untouched.

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
    cd /opt/lowtide && docker compose up -d         # (re)start low_tide after content sync
    docker ps                         # status
    docker logs hwitw   --tail 50     # HWITW app logs
    docker logs lowtide --tail 50     # low_tide (nginx) logs
    docker logs caddy   --tail 50     # proxy logs

## Adding a domain (later)
Add to `/opt/caddy/Caddyfile`, e.g. for low_tide:
    lowtide.example.org { encode gzip; reverse_proxy lowtide:80 }
Point the domain's A record at this droplet (the relevant IP); Caddy auto-issues
Let's Encrypt TLS. Then optionally redirect the IP block to the domain.

## Adding another app
Create `/opt/<app>/docker-compose.yml` on `web_external` (external network),
`docker compose up -d`, then add a Caddy block routing to it (by Host/domain, or
attach another reserved IP and match its Host like low_tide).
