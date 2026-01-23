#!/bin/sh

set -e

echo "Waiting for PostgreSQL to be ready..."
until PGPASSWORD=$DB_PASSWORD pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; do
  sleep 2
done
echo "PostgreSQL is ready."

echo "Applying PostgreSQL migrations..."
npm run db:migrate

echo "Applying ClickHouse migrations..."
npm run analytics:migrate:prod

echo "Starting the application..."
exec "$@"