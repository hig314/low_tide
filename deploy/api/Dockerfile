# NMDS backend for low_tide: runs the app's webapp.py UNMODIFIED under gunicorn.
# Build context is deploy/ (see docker-compose.yml) so the app's own
# requirements.txt drives the install; gunicorn is ours (deploy layer).
# The app code is NOT baked in: deploy/app is bind-mounted read-only at /app,
# so a code handoff needs only rsync + restart. Rebuild when requirements change.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1

COPY app/requirements.txt /tmp/requirements.txt
RUN pip install -r /tmp/requirements.txt gunicorn \
 && useradd --system --create-home app

USER app
WORKDIR /app
EXPOSE 5000

# One sync worker: the droplet has 1 vCPU shared with HWITW, and an NMDS fit is
# CPU-bound (~5 s for 400 surveys on a fast Mac; slower here). Requests queue
# rather than run in parallel. 120 s timeout matches nginx's proxy_read_timeout.
CMD ["gunicorn", "--workers", "1", "--timeout", "120", "--bind", "0.0.0.0:5000", \
     "--access-logfile", "-", "webapp:app"]
