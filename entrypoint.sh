#!/bin/sh
set -e

# 1. Verificando Cliente de Prisma
echo "Verificando el Cliente de Prisma..."
pnpm exec prisma generate

# 2. Aplicar migraciones
echo "Ejecutando migraciones de base de datos..."
pnpm exec prisma migrate deploy

# 3. Sembrar (Seed) la base de datos
# ESTO GARANTIZA QUE EL SEED SIEMPRE SE EJECUTE
echo "Poblando (Seeding) la base de datos..."
pnpm exec prisma db seed

# 4. Mensaje de Éxito en los LOGS (Para usuarios de docker nativo)
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