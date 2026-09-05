#!/usr/bin/env bash
#
# low_tide data refresh  —  OUR infrastructure (not the collaborator's).
#
# Runs the collaborator's download.py UNMODIFIED in an isolated staging dir and
# publishes the regenerated data blobs to the live nginx-served directory.
# Designed so cron "owns" the live data while code handoffs own the code — the
# handoff rsync excludes these blobs so the two never clobber each other.
#
# Safe to re-run by hand. Uses flock (no overlapping runs), retries transient
# NOAA 5xx errors, and on any failure keeps the last-good data live + logs it.
#
#   Layout on the droplet:
#     /opt/lowtide/refresh/refresh.sh   <- this script
#     /opt/lowtide/refresh/venv/        <- our isolated venv (requests)
#     /opt/lowtide/refresh/work/        <- staging: her scripts + the stateful
#                                          Temp_data pickle + generated output
#     /opt/lowtide/refresh/refresh.log  <- log
#     /opt/lowtide/app/static/          <- LIVE served dir (publish target)
#
set -uo pipefail

REFRESH_DIR=/opt/lowtide/refresh
WORK="$REFRESH_DIR/work"
VENV="$REFRESH_DIR/venv"
LIVE=/opt/lowtide/app
LOG="$REFRESH_DIR/refresh.log"
LOCK="$REFRESH_DIR/refresh.lock"
PY="$VENV/bin/python"

RETRIES="${REFRESH_RETRIES:-3}"
BACKOFF="${REFRESH_BACKOFF:-120}"   # seconds between retries (override for testing)

BLOBS=(seldovia_sheet.js costal_studies_sheet.js Temp_data.js seldovia_locations.js costal_studies_locations.js)

log(){ echo "$(date '+%Y-%m-%d %H:%M:%S%z') $*" >> "$LOG"; }

# --- rotate the log if it gets big (>5MB) ---
if [ -f "$LOG" ] && [ "$(wc -c < "$LOG")" -gt 5242880 ]; then mv -f "$LOG" "$LOG.1"; fi

# --- single-instance lock ---
exec 9>"$LOCK"
if ! flock -n 9; then
  log "SKIP: another refresh is already running"
  exit 0
fi

log "=== refresh start ==="

mkdir -p "$WORK/static"

# --- pull the collaborator's CURRENT scripts from the live app (code from app/,
#     executed by our venv). This way a handoff that changes download.py is
#     picked up automatically, with zero edits on our side. ---
cp -f "$LIVE"/*.py "$WORK"/ 2>/dev/null

# --- back up the precious incremental pickle before touching it ---
[ -f "$WORK/Temp_data" ] && cp -f "$WORK/Temp_data" "$WORK/Temp_data.bak"

cd "$WORK" || { log "FAIL: cannot cd $WORK"; exit 1; }

# --- run her pipeline, retrying transient NOAA outages ---
ok=0
for attempt in $(seq 1 "$RETRIES"); do
  log "run download.py (attempt $attempt/$RETRIES)"
  if "$PY" download.py >> "$LOG" 2>&1; then ok=1; break; fi
  if [ "$attempt" -lt "$RETRIES" ]; then
    log "attempt $attempt failed (often transient NOAA 5xx); backoff ${BACKOFF}s"
    sleep "$BACKOFF"
  fi
done

if [ "$ok" -ne 1 ]; then
  log "FAIL: download.py did not succeed after $RETRIES attempts; keeping last-good live data"
  # restore pickle in case a partial run left it inconsistent
  [ -f "$WORK/Temp_data.bak" ] && cp -f "$WORK/Temp_data.bak" "$WORK/Temp_data"
  log "=== refresh end (failed) ==="
  exit 1
fi

# --- publish: copy regenerated blobs into the live dir, recreate the lowercase
#     temp_data.js alias (Linux case-sensitivity fix), fix perms for nginx ---
published=0
for f in "${BLOBS[@]}"; do
  if [ -s "$WORK/static/$f" ]; then
    cp -f "$WORK/static/$f" "$LIVE/static/$f" && published=$((published+1))
  else
    log "WARN: $WORK/static/$f missing or empty; not published"
  fi
done
cp -f "$LIVE/static/Temp_data.js" "$LIVE/static/temp_data.js"
chmod -R a+rX "$LIVE/static"

log "OK: published $published/${#BLOBS[@]} blobs"
log "=== refresh end (success) ==="
