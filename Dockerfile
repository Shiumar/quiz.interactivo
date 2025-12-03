# Etapa 1: Constructor (Builder)
# CAMBIO: Actualizado a node:25-alpine según tu indicación
FROM node:25-alpine AS builder
WORKDIR /app

# Aceptar el argumento de construcción DATABASE_URL
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Instalar pnpm
RUN npm install -g pnpm

# Copiar archivos de definición de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar todas las dependencias
RUN pnpm install --frozen-lockfile

# Copiar el resto del código fuente
COPY . .

# --- GENERACIÓN DE PRISMA 7 ---
RUN echo "Build-time DATABASE_URL is: $DATABASE_URL"
RUN pnpm exec prisma generate

# Construir la aplicación Next.js
RUN pnpm exec next build --turbopack

# Etapa 2: Producción
# CAMBIO: Actualizado a node:25-alpine
FROM node:25-alpine
WORKDIR /app

# 1. INSTALACIÓN DE SISTEMA
RUN npm install -g pnpm && \
    apk add --no-cache dumb-init

# 2. CREACIÓN DE USUARIO (SEGURIDAD)
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copiar definiciones de dependencias
COPY package.json pnpm-lock.yaml ./

# 3. INSTALACIÓN DE DEPENDENCIAS
RUN pnpm install --frozen-lockfile --prod
# ARREGLO CRÍTICO: Instalar Prisma CLI
RUN pnpm add prisma

# 4. COPIAR ARCHIVOS CON PERMISOS CORRECTOS
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh

# Asegurar permisos
RUN chmod +x /app/entrypoint.sh && \
    sed -i 's/\r$//' /app/entrypoint.sh || true

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

# 5. CAMBIO DE USUARIO
USER nextjs

ENTRYPOINT ["dumb-init", "--", "sh", "/app/entrypoint.sh"]
CMD ["pnpm", "start"]