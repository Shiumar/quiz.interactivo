// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // create one quiz with one question and four options
  await prisma.quiz.create({
    data: {
      title: 'Preguntas de prueba',
      questions: {
        create: {
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
      },
    },
  });

  console.log('Seed completed');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });