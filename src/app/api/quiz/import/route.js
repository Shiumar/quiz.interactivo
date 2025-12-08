import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const data = await req.json();
    
    // 1. Normalización
    const meta = data.quiz || {};
    const questions = Array.isArray(data) ? data : (data.questions || []);
    
    // Título: Usamos el del JSON o lanzamos error si no viene
    const title = meta.name || meta.title;

    if (!title || title.trim() === '') {
       return NextResponse.json({ error: 'El archivo JSON debe tener un nombre de quiz definido (quiz.name o title).' }, { status: 400 });
    }

    // 2. Validaciones de Contenido
    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'El archivo JSON no contiene preguntas válidas.' }, { status: 400 });
    }

    const isValid = questions.every(q => q.text && Array.isArray(q.options) && q.options.length > 0);
    if (!isValid) {
      return NextResponse.json({ error: 'Formato inválido: Todas las preguntas deben tener "text" y opciones.' }, { status: 400 });
    }

    // 3. VALIDACIÓN ESTRICTA DE DUPLICADOS (NUEVO)
    // Verificamos si ya existe un quiz con este título exacto (case insensitive si se desea, aquí es exacto)
    const existingQuiz = await prisma.quiz.findFirst({
      where: { title: title.trim() }
    });

    if (existingQuiz) {
      return NextResponse.json({ 
        error: `Ya existe un Quiz llamado "${title}". Por favor, cambia el nombre en el archivo o elimina el quiz existente.` 
      }, { status: 409 }); // 409 Conflict
    }

    // 4. Crear el Quiz y sus preguntas
    // Dado que la DB es 1-a-N, creamos las preguntas para este quiz específico.
    const newQuiz = await prisma.quiz.create({
      data: {
        title: title.trim(),
        questions: {
          create: questions.map(q => ({
            text: q.text,
            options: {
              create: q.options.map(opt => ({
                text: opt.text,
                isCorrect: !!opt.isCorrect
              }))
            }
          }))
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Quiz "${newQuiz.title}" importado exitosamente.`,
      quiz: newQuiz 
    });

  } catch (error) {
    console.error('Error importando quiz:', error);
    return NextResponse.json({ error: 'Error interno al procesar el archivo JSON.' }, { status: 500 });
  }
}