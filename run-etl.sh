#!/bin/sh

# Redirect all output to Docker stdout
exec 1>/dev/stdout
exec 2>/dev/stdout

# Change to app directory
cd /app

# Source environment variables
. /app/.env.sh

# Run the ETL job
npm run etl:run:prod
