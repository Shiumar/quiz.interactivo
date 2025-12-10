import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
// NOTA: Importamos desde la carpeta generada, no desde @prisma/client
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;

// 1. Crear el pool de conexión de Postgres
const pool = new Pool({ connectionString });

// 2. Crear el adaptador de Prisma
const adapter = new PrismaPg(pool);

// 3. Definir el tipo global para evitar errores de TS en desarrollo
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 4. Instanciar el cliente inyectando el adaptador
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;