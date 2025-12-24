#!/bin/sh

set -e

echo "Waiting for PostgreSQL to be ready..."
until PGPASSWORD=$DB_PASSWORD pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; do
  sleep 2
done
echo "PostgreSQL is ready."

echo "Applying database migrations..."
./node_modules/.bin/drizzle-kit migrate --config=drizzle.config.ts

echo "Starting the application..."
exec "$@"