#!/bin/sh

set -e

echo "Waiting for PostgreSQL to be ready..."
until PGPASSWORD=$DB_PASSWORD pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; do
  sleep 2
done
echo "PostgreSQL is ready."

echo "Applying migrations..."
bun run db:migrate
bun run analytics:migrate

echo "Starting process..."
exec "$@"