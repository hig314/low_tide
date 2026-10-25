# low_tide archive — archive.lowtidedata.org

A frozen, stable copy of the site, unaffected by ongoing work on the live one.

- **Source:** `github.com/katmai-mckittrick/low_tide_archive` (her fork of this
  repo), **pinned** to one commit — currently `303fd0e`. Updating the archive
  is a deliberate redeploy, never automatic.
- **Data:** generated **once** at deploy time by running her `download.py`; no
  refresh cron (she deleted `refresh.sh` in the fork, and nothing in the app
  downloads at runtime — the cron was the only path). Snapshot taken
  2026-10-24 (temps through 2026-10-24, 8332 entries, aligned). The temp
  history was a **full refetch from 2004**, run with `TZ=America/Anchorage` in
  the empty dir `/opt/lowtide-archive/download-once/refetch/` — not seeded from
  the live pickle, which is missing 2026-10-19 (see CLAUDE.md).
- **Droplet:** `/opt/lowtide-archive/` on the shared droplet, containers
  `lowtide-archive` (nginx) + `lowtide-archive-api` (NMDS, 0.5 CPU / 768 MB).
  Uses `../api/Dockerfile`. One-time download staging + log:
  `/opt/lowtide-archive/download-once/`.
- **Routing:** Cloudflare A record `archive` → 209.38.5.101 (grey cloud);
  Caddy block `archive.lowtidedata.org { reverse_proxy lowtide-archive:80 }`.

## Redeploy (new pinned commit)

    git fetch archive && git archive <commit> deploy/app | tar -x -C <tmp>
    rsync -az --delete --exclude '.DS_Store' --exclude '__pycache__' --exclude '._*' \
      --exclude 'static/seldovia_sheet.js' --exclude 'static/costal_studies_sheet.js' \
      --exclude 'static/Temp_data.js' --exclude 'static/temp_data.js' \
      --exclude 'static/seldovia_locations.js' --exclude 'static/costal_studies_locations.js' \
      <tmp>/deploy/app root@164.92.75.176:/opt/lowtide-archive/
    ssh root@164.92.75.176 'chmod -R a+rX /opt/lowtide-archive/app &&
      cd /opt/lowtide-archive && docker compose restart lowtide-archive-api'

The excludes keep the frozen data. To re-snapshot data too, repeat the
one-time download: empty dir, copy in `app/*.py`, run
`TZ=America/Anchorage /opt/lowtide/refresh/venv/bin/python download.py`, check
alignment, copy the 5 blobs into `app/static/` and recreate `temp_data.js`.
Always set the TZ: in UTC, a run after 4 PM Anchorage drops a day.
