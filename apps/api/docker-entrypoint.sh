#!/bin/sh
set -e

# Run database migrations in production
echo "Running database migrations..."
yarn prisma migrate deploy --schema=./prisma/schema.prisma

echo "Starting application..."
exec node dist/main.js
