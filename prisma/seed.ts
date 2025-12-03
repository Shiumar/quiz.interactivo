// prisma/seed.ts
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ 
  connectionString: process.env.DATABASE_URL 
})) });

async function main() {
  console.log('Seed script starting...');
  
  await prisma.quiz.create({
    data: {
      title: 'Quien quiere ser Millonario',
      questions: {
        create: [
          {
            text: '¿En qué año se lanzó la primera versión de la World Wide Web?',
            options: {
              create: [
                { text: '1989', isCorrect: false },
                { text: '1991', isCorrect: true },
                { text: '1993', isCorrect: false },
                { text: '1987', isCorrect: false },
              ],
            },
          },
          {
            text: '¿Cuál fue el nombre del primer navegador web gráfico de uso masivo, lanzado en 1993?',
            options: {
              create: [
                { text: 'Mosaic', isCorrect: true },
                { text: 'Netscape Navigator', isCorrect: false },
                { text: 'Internet Explorer', isCorrect: false },
                { text: 'WorldWideWeb', isCorrect: false },
              ],
            },
          },
          {
            text: '¿A qué tipo de institución se conectaron los primeros cuatro nodos de la ARPANET en 1969?',
            options: {
              create: [
                { text: 'Universidades', isCorrect: true },
                { text: 'Bases Militares', isCorrect: false },
                { text: 'Empresas Privadas', isCorrect: false },
                { text: 'Hospitales', isCorrect: false },
              ],
            },
          },
          {
            text: '¿Quién es el creador del lenguaje de programación Python?',
            options: {
              create: [
                { text: 'Guido van Rossum', isCorrect: true },
                { text: 'James Gosling', isCorrect: false },
                { text: 'Bjarne Stroustrup', isCorrect: false },
                { text: 'Linus Torvalds', isCorrect: false },
              ],
            },
          },
          {
            text: '¿Cuál es la unidad más pequeña de información, representada por un 0 o un 1?',
            options: {
              create: [
                { text: 'Byte', isCorrect: false },
                { text: 'Bit', isCorrect: true },
                { text: 'Bite', isCorrect: false },
                { text: 'Kilobyte', isCorrect: false },
              ],
            },
          },
        ],
      },
    },
  });
  
  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('ERROR IN SEED SCRIPT:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });