# low_tide — deployment framework

Deploys the **low_tide** intertidal data-analysis web app onto the existing
DigitalOcean droplet **`hwitw`** (`164.92.75.176`, sfo3), sharing resources with
the HWITW app already running there. The app source is deployed **verbatim** —
this folder is only the deployment scaffolding around it.

## What the app actually is

`low_tide` ships as a Flask project (`webapp.py`), but the running app is **100%
static**: `static/index_lt.html` + JavaScript with pre-baked data
(`static/sheet.js`, `static/Temp_data.js`, generated offline by `download.py`).
The frontend makes **no backend calls**. The Flask `webapp.py` is a vestigial
copy of HWITW's server — its `/wxapp/*` routes need a `wxdata` module that isn't
present here, and its `/` redirect points at a nonexistent `index.html`. So we
serve the static files directly with nginx; no Python runtime, no source edits.

## How it's reached — its own "naked IP"

A DigitalOcean **Reserved IP, `209.38.5.101`**, is attached to the droplet, giving
low_tide its own bare URL (no port, no domain):

    http://209.38.5.101/

HWITW keeps the droplet's primary IP, `http://164.92.75.176/`.

DO routes the reserved IP onto the droplet's `eth0` via 1:1 NAT, but the browser
still sends `Host: 209.38.5.101`. So the shared **Caddy** proxy (which owns
`:80`/`:443`) splits the two apps purely on the Host header — no second listener,
no per-interface binding. See `Caddyfile`.

## Files

- `docker-compose.yml` — `nginx:alpine` container `lowtide` on the shared external
  `web_external` network; serves `app/static/` read-only. Deployed to `/opt/lowtide/`.
- `nginx.conf` — vhost; docroot = the app's `static/`, `index index_lt.html`.
- `app/` — verbatim copy of the low_tide project (the `website/` contents).
- `Caddyfile` — the updated `/opt/caddy/Caddyfile` (Host-based split). Reference copy.

## The one Linux fix (no source edit)

`index_lt.html` loads `temp_data.js`, but the file is `Temp_data.js`. The dev's Mac
filesystem is case-insensitive so it never mattered; Linux is case-sensitive and
would 404 the "Show temperature" data. We create a lowercase **alias at deploy
time on the Linux host** (the two names can't coexist on the Mac, so it can't live
in this repo):

    cp /opt/lowtide/app/static/Temp_data.js /opt/lowtide/app/static/temp_data.js

## Deploy / update

From this `deploy/` folder:

    # 1. push framework + app to the droplet
    rsync -az --delete --exclude '.DS_Store' --exclude '__pycache__' --exclude '._*' \
      docker-compose.yml nginx.conf app  root@164.92.75.176:/opt/lowtide/

    # 2. (re)create the case-fix alias on the Linux host, then (re)start
    ssh root@164.92.75.176 '
      cp -f /opt/lowtide/app/static/Temp_data.js /opt/lowtide/app/static/temp_data.js
      chmod -R a+rX /opt/lowtide/app
      cd /opt/lowtide && docker compose up -d'

To refresh the data blobs, run the project's `download.py` locally (regenerates
`static/sheet.js` and `static/Temp_data.js`), then re-run step 1+2.

If the `Caddyfile` changes, copy it to `/opt/caddy/Caddyfile` and reload:

    scp Caddyfile root@164.92.75.176:/opt/caddy/Caddyfile
    ssh root@164.92.75.176 'docker exec caddy caddy reload --config /etc/caddy/Caddyfile'

## Ops

    ssh root@164.92.75.176 'docker ps'
    ssh root@164.92.75.176 'docker logs lowtide --tail 50'
    ssh root@164.92.75.176 'cd /opt/lowtide && docker compose restart'
