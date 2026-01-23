#!/bin/sh
set -e

# Convert .env file to shell exports for cron
if [ -f /app/.env ]; then
  cat /app/.env | grep -v '^#' | grep -v '^$' | sed 's/^/export /' > /app/.env.sh
fi

# Start crond
exec "$@"
