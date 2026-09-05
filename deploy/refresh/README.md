# Data refresh (cron)

Automated daily refresh of the low_tide data blobs from their public sources.
This is **our infrastructure** — it runs the collaborator's `download.py`
**unmodified**; we never edit her files.

## What it does

`refresh.sh` runs on the droplet, daily at **04:00 America/Anchorage**, and:

1. Copies the collaborator's current `*.py` from `/opt/lowtide/app/` into a
   staging dir `/opt/lowtide/refresh/work/`.
2. Runs `download.py` there (in our venv) to regenerate the data blobs from:
   - **Google Sheets** (Seldovia "Master list" + "Costal studies") — public CSV export.
   - **NOAA Tides & Currents** station 9455500 — incremental water temperature.
3. On success, copies the five regenerated blobs (`seldovia_sheet.js`,
   `costal_studies_sheet.js`, `Temp_data.js`, `seldovia_locations.js`,
   `costal_studies_locations.js`) into the live served dir
   `/opt/lowtide/app/static/` and recreates the lowercase `temp_data.js` alias.

The **`Temp_data` pickle** in `work/` is stateful (incremental temp fetch back
to 2004) and must persist between runs — it lives in `work/`, seeded once at setup
and never deleted.

## Isolation: cron owns the data, handoffs own the code

The generated blobs are **excluded from the handoff deploy rsync** so pushing a
code update never overwrites freshly-fetched live data:

    --exclude 'static/seldovia_sheet.js'
    --exclude 'static/costal_studies_sheet.js'
    --exclude 'static/Temp_data.js'
    --exclude 'static/temp_data.js'
    --exclude 'static/seldovia_locations.js'
    --exclude 'static/costal_studies_locations.js'

(rsync does not delete excluded files on the remote either, so `--delete` is safe.
That last point is load-bearing for the two `*_locations.js` blobs: they are
generated-only — NOT in git at all — so without the exclude, `--delete` would
wipe them off the droplet on every deploy.)
The other three blobs stay tracked in git (they arrived in her zips), so handoff
diffs stay clean; live and repo copies intentionally diverge. To force-push her
version of a blob once, drop its `--exclude` for that single deploy.

**SOP: after every code deploy, run a manual refresh** (see Ops below). Code
updates can add new generated blobs or change blob contents (e.g. the 2026-09-04
update added the two `*_locations.js` files, which the page 404s on until the
refresh publishes them), and the refresh also proves the new pipeline runs.

## Failure behavior

Log-only. NOAA's `water_temperature` product 5xx's intermittently; since the
2026-06-30 update her `Get_temp_data.py` skips (print+return) on a non-200
instead of raising, so a NOAA blip no longer aborts the run — Sheets still
refresh and temp holds at last-good. `refresh.sh` still retries a few times on
hard failures, and if a run still fails it **keeps the last-good live data**
and logs it. The incremental temp fetch backfills automatically on
the next success, so a skipped day self-heals.

## Ops

    # tail the log
    ssh root@164.92.75.176 'tail -40 /opt/lowtide/refresh/refresh.log'

    # run a refresh by hand (short backoff for impatience)
    ssh root@164.92.75.176 'REFRESH_BACKOFF=5 /opt/lowtide/refresh/refresh.sh; tail -20 /opt/lowtide/refresh/refresh.log'

    # see the schedule
    ssh root@164.92.75.176 'crontab -l'

## First-time setup (already done; recorded for rebuild)

    ssh root@164.92.75.176 '
      mkdir -p /opt/lowtide/refresh/work/static
      python3 -m venv /opt/lowtide/refresh/venv
      /opt/lowtide/refresh/venv/bin/pip install -q --upgrade pip requests
      cp -f /opt/lowtide/app/Temp_data /opt/lowtide/refresh/work/Temp_data   # seed incremental state
    '
    # deploy refresh.sh, then install crontab (see below):
    #   0 12,13 * * * [ "$(TZ=America/Anchorage date +\%H)" = "04" ] && /opt/lowtide/refresh/refresh.sh

## Why the odd cron line (true 4 AM Anchorage across DST)

Ubuntu's stock ISC cron does **not** support `CRON_TZ` (it's silently treated as
a plain env var) — the original `CRON_TZ=America/Anchorage` + `0 4 * * *` setup
actually fired at 04:00 **UTC** (~8 PM Anchorage). The fix: fire at both 12:00
and 13:00 UTC (4 AM AKDT and 4 AM AKST respectively) with a guard that only runs
the script when the current Anchorage hour is 04. Exactly one of the two fires
each day, and it tracks DST with no droplet timezone change. `%` is escaped as
`\%` because cron treats a bare `%` as a newline.
