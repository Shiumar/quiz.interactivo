import { PrismaClient } from '@prisma/client';

let globalPrisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = globalPrisma;

export default globalPrisma;