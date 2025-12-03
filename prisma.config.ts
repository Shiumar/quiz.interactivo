import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
  seed: {
    command: 'pnpm dlx tsx prisma/seed.ts',
  },
});