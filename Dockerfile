# Etapa de Construcción (Builder)
FROM node:24-alpine AS builder
WORKDIR /app

# Aceptar argumento de construcción
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Instalar pnpm
RUN npm install -g pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar todas las dependencias
RUN pnpm install --frozen-lockfile

# Copiar el proyecto
COPY . .

# --- GENERACIÓN PRISMA 7 ---
RUN pnpm exec prisma generate

# Construir la aplicación (Usamos turbopack igual que en producción)
RUN pnpm exec next build --turbopack

# Etapa de Ejecución (Runner)
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 1. INSTALACIÓN DE SISTEMA
RUN npm install -g pnpm && \
    apk add --no-cache dumb-init

# 2. CREACIÓN DE USUARIO (SEGURIDAD)
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Instalar SOLO dependencias de producción
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ARREGLO CRÍTICO: Instalar herramientas para el entrypoint
RUN pnpm add prisma
RUN pnpm add tsx

# 3. COPIAR ARCHIVOS CON PERMISOS
# Copiamos los artefactos y configuración necesarios para que la app y el seed funcionen
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh

# Permisos de ejecución
RUN chmod +x ./entrypoint.sh && \
    sed -i 's/\r$//' ./entrypoint.sh || true

EXPOSE 3000
ENV PORT=3000

# 4. CAMBIO DE USUARIO FINAL
USER nextjs

ENTRYPOINT ["dumb-init", "--", "sh", "./entrypoint.sh"]
CMD ["pnpm", "start"]