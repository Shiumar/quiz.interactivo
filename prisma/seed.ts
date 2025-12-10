import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
// CORRECCIÓN CRÍTICA: Importar desde el paquete estándar, no desde la ruta relativa antigua
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL!;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper para procesar un único objeto de Quiz
async function processQuiz(quizData: any, defaultId?: number, defaultTitle?: string) {
  // 1. Determinar Metadatos
  // Si el JSON tiene estrucctura { quiz: { IinternalId: 1, name: '...' }, questions: [...] }
  const meta = quizData.quiz || {};
  const questions = Array.isArray(quizData) ? quizData : (quizData.questions || []);
  
  const internalId = meta.internalId || defaultId; 
  const title = meta.name || meta.title || defaultTitle || 'Quiz Importado';

  console.log(`Processing: "${title}" (ID: ${internalId || 'Auto'})...`);

  // 2. Buscar o Crear el Quiz (Evita duplicados de Quiz)
  let quiz;
  if (internalId) {
    // Si tenemos un ID fijo, usamos upsert para asegurarlo
    quiz = await prisma.quiz.upsert({
      where: { internalId },
      update: { title }, // Actualizamos el título si cambió
      create: { internalId, title },
    });
  } else {
    // Si no hay ID, buscamos por Título para no duplicarlo
    quiz = await prisma.quiz.findFirst({ where: { title } });
    if (!quiz) {
      quiz = await prisma.quiz.create({ data: { title } });
    }
  }

  // 3. Procesar Preguntas (Evita duplicados de Preguntas)
  let questionsAdded = 0;
  for (const q of questions) {
    if (!q.text) continue;

    // ¿Ya existe esta pregunta en este quiz?
    const existingQuestion = await prisma.question.findFirst({
      where: {
        quizInternalId: quiz.internalId,
        text: q.text // Comparamos por texto exacto
      }
    });

    if (!existingQuestion) {
      // Crear pregunta y sus opciones
      await prisma.question.create({
        data: {
          text: q.text,
          quizInternalId: quiz.internalId,
          options: {
            create: (q.options || []).map((o: any) => ({
              text: o.text,
              isCorrect: !!o.isCorrect
            }))
          }
        }
      });
      questionsAdded++;
    }
  }

  if (questionsAdded > 0) {
    console.log(`   - ✅ Agregadas ${questionsAdded} preguntas nuevas.`);
  } else {
    console.log(`   - ℹ️ Sin cambios (todas las preguntas ya existían).`);
  }
}

async function main() {
  console.log('🌱 Iniciando Seed Inteligente...');
  
  // -------------------------------------------------------
  // 1. QUIZ HARDCODED (Millonario) - ID 1
  // -------------------------------------------------------
  const millonarioQuiz = {
    quiz: { internalId: 1, name: 'Cultura Informática' },
    questions: [
      {
        text: '¿En qué año se lanzó la primera versión de la World Wide Web?',
        options: [
          { text: '1989', isCorrect: false },
          { text: '1991', isCorrect: true },
          { text: '1993', isCorrect: false },
          { text: '1987', isCorrect: false },
        ]
      },
      {
        text: '¿Cuál fue el nombre del primer navegador web gráfico de uso masivo, lanzado en 1993?',
        options: [
          { text: 'Mosaic', isCorrect: true },
          { text: 'Netscape Navigator', isCorrect: false },
          { text: 'Internet Explorer', isCorrect: false },
          { text: 'WorldWideWeb', isCorrect: false },
        ]
      },
      {
        text: '¿A qué tipo de institución se conectaron los primeros cuatro nodos de la ARPANET en 1969?',
        options: [
          { text: 'Universidades', isCorrect: true },
          { text: 'Bases Militares', isCorrect: false },
          { text: 'Empresas Privadas', isCorrect: false },
          { text: 'Hospitales', isCorrect: false },
        ]
      },
      {
        text: '¿Quién es el creador del lenguaje de programación Python?',
        options: [
          { text: 'Guido van Rossum', isCorrect: true },
          { text: 'James Gosling', isCorrect: false },
          { text: 'Bjarne Stroustrup', isCorrect: false },
          { text: 'Linus Torvalds', isCorrect: false },
        ]
      },
      {
        text: '¿Cuál es la unidad más pequeña de información, representada por un 0 o un 1?',
        options: [
          { text: 'Byte', isCorrect: false },
          { text: 'Bit', isCorrect: true },
          { text: 'Bite', isCorrect: false },
          { text: 'Kilobyte', isCorrect: false },
        ]
      },
      {
        text: '¿Qué componente de hardware es considerado el "cerebro" de la computadora?',
        options: [
          { text: 'El Disco Duro', isCorrect: false },
          { text: 'La Memoria RAM', isCorrect: false },
          { text: 'La CPU (Procesador)', isCorrect: true },
          { text: 'La Tarjeta Madre', isCorrect: false },
        ]
      },
      {
        text: '¿Quién es considerada la primera programadora de la historia por su trabajo con la Máquina Analítica?',
        options: [
          { text: 'Marie Curie', isCorrect: false },
          { text: 'Ada Lovelace', isCorrect: true },
          { text: 'Grace Hopper', isCorrect: false },
          { text: 'Katherine Johnson', isCorrect: false },
        ]
      },
      {
        text: '¿Cuál es la función principal de un servidor DNS en Internet?',
        options: [
          { text: 'Asignar direcciones IP dinámicas a los dispositivos', isCorrect: false },
          { text: 'Traducir nombres de dominio a direcciones IP', isCorrect: true },
          { text: 'Encriptar la conexión entre el cliente y el servidor', isCorrect: false },
          { text: 'Enrutar los paquetes de datos entre redes', isCorrect: false },
        ]
      },
      {
        text: '¿Qué puerto estándar utiliza el protocolo HTTP para el tráfico web NO encriptado?',
        options: [
          { text: 'Puerto 3000', isCorrect: false },
          { text: 'Puerto 8080', isCorrect: false },
          { text: 'Puerto 443', isCorrect: false },
          { text: 'Puerto 80', isCorrect: true },
        ]
      },
      {
        text: '¿Cuál de estos lenguajes de programación es tradicionalmente "compilado" directamente a código máquina (no a bytecode)?',
        options: [
          { text: 'C#', isCorrect: false },
          { text: 'Cobol', isCorrect: false },
          { text: 'C++', isCorrect: true },
          { text: 'Ensamblador', isCorrect: false },
        ]
      },
    ]
  };

  await processQuiz(millonarioQuiz);

  // -------------------------------------------------------
  // 2. IMPORTACIÓN AUTOMÁTICA DE ARCHIVOS JSON
  // -------------------------------------------------------
  console.log('\n📂 Escaneando carpeta public/ por archivos JSON...');
  
  const publicDir = path.join(process.cwd(), 'public');
  
  if (fs.existsSync(publicDir)) {
    const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      console.log(`   -> Encontrado: ${file}`);
      try {
        const content = fs.readFileSync(path.join(publicDir, file), 'utf-8');
        const jsonData = JSON.parse(content);

        // Soporte para Archivos que contienen múltiples quizzes [Quiz1, Quiz2]
        if (Array.isArray(jsonData) && jsonData.some((x: any) => x.quiz && x.questions)) {
           console.log(`      Detectado archivo con múltiples quizzes.`);
           for (const item of jsonData) {
             await processQuiz(item);
           }
        } 
        // Soporte para Archivo de un solo quiz
        else {
           await processQuiz(jsonData, undefined, `Quiz de ${file}`);
        }

      } catch (err) {
        console.error(`❌ Error procesando ${file}:`, err);
      }
    }
  } else {
    console.warn('⚠️ Carpeta public/ no encontrada.');
  }
  
  console.log('\n🏁 Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('ERROR IN SEED SCRIPT:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });