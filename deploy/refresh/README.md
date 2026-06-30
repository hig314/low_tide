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
3. On success, copies the three regenerated blobs into the live served dir
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

(rsync does not delete excluded files on the remote either, so `--delete` is safe.)
They stay tracked in git (they arrive in her zips), so handoff diffs stay clean;
live and repo copies intentionally diverge. To force-push her version of a blob
once, drop its `--exclude` for that single deploy.

## Failure behavior

Log-only. NOAA's `water_temperature` product 5xx's intermittently, and her code
raises on any non-200 (temp is fetched first, so a blip aborts the whole run).
`refresh.sh` retries a few times, and if it still fails it **keeps the last-good
live data** and logs it. The incremental temp fetch backfills automatically on
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
    # deploy refresh.sh, then install crontab:
    #   CRON_TZ=America/Anchorage
    #   0 4 * * * /opt/lowtide/refresh/refresh.sh
