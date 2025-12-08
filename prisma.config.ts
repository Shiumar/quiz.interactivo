import { defineConfig } from '@prisma/config';
// import 'dotenv/config'; // Descomenta esto si ejecutas el archivo manualmente fuera de los scripts npm

export default defineConfig({
  datasource: {
    // El signo '!' elimina el error de tipo
    url: process.env.DATABASE_URL!, 
  },
  // RECUERDA: Para Prisma 7, la sección seed debe ir dentro de 'migrations'
  migrations: {
    seed: 'pnpm exec tsx prisma/seed.ts',
  },
});