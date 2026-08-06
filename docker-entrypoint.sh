#!/bin/sh
set -e
echo "Sincronizando esquema de base de datos..."
npx prisma db push --skip-generate --accept-data-loss=false || true
exec "$@"
