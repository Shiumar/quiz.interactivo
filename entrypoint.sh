#!/bin/sh
set -e
echo "Verificando el Cliente de Prisma..."
pnpm exec prisma generate

echo "Sincronizando esquema de base de datos..."
pnpm exec prisma db push

echo "Poblando (Seeding) la base de datos..."
pnpm exec prisma db seed

echo ""
echo "============================================================"
echo "   🚀 ¡APLICACIÓN INICIADA EXITOSAMENTE! 🚀"
echo "============================================================"
echo "   🏠 Frontend:   http://localhost:3000"
echo "   🐘 pgAdmin:    http://localhost:8080"
echo "      - User:     admin@admin.com"
echo "      - Pass:     root"
echo "============================================================"
echo ""
echo "Iniciando servidor Next.js..."
exec "$@"