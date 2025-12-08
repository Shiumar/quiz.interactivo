import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { quizId, username, answers } = body;

    // Validación básica
    if (!quizId || !username || !answers) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    // 1. Buscar o Crear el Jugador
    const player = await prisma.player.upsert({
      where: { username },
      update: {}, 
      create: { username },
    });

    // 2. Obtener el Quiz para validar respuestas
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { 
        questions: { 
          include: { options: true } 
        } 
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz no encontrado' }, { status: 404 });
    }

    // 3. Calcular Puntaje y Analizar Respuestas
    let score = 0;
    let skippedCount = 0;
    const totalQuestions = quiz.questions.length;
    const responsesToSave = [];
    const wrongQuestionIds = [];

    quiz.questions.forEach((q) => {
      const userAnswer = answers[q.id];
      let isCorrect = false;
      let isSkipped = true;
      let selectedOptionId = null;

      if (userAnswer) {
        // Si userAnswer existe, verificamos si marcó 'skipped' explícitamente
        isSkipped = !!userAnswer.skipped;
        
        if (!isSkipped && userAnswer.selected) {
          selectedOptionId = userAnswer.selected;
          const correctOption = q.options.find(opt => opt.isCorrect);
          if (correctOption && correctOption.id === selectedOptionId) {
            isCorrect = true;
            score++;
          }
        }
      }

      if (isSkipped) skippedCount++;
      // Solo consideramos "error" si intentó responder y falló
      if (!isCorrect && !isSkipped) {
        wrongQuestionIds.push(q.id);
      }

      responsesToSave.push({
        questionId: q.id,
        optionId: selectedOptionId,
        isCorrect,
        isSkipped
      });
    });

    // 4. Lógica de Gamificación (Mensajes)
    let feedbackMessage = "¡Partida guardada correctamente!";
    
    // Obtener historial previo
    const previousSessions = await prisma.gameSession.findMany({
      where: {
        playerId: player.id,
        quizInternalId: quiz.internalId,
      },
      orderBy: { score: 'desc' },
      include: { responses: true }
    });

    const isFirstTime = previousSessions.length === 0;
    const bestPreviousScore = previousSessions.length > 0 ? previousSessions[0].score : 0;

    // A. Caso Especial: Saltó todo
    if (skippedCount === totalQuestions) {
        feedbackMessage = `¡Vaya prisa ${username}! 🏃💨 Saltaste todas las preguntas. ¿Miedo al éxito?`;
    } 
    // B. Primera vez jugando este quiz
    else if (isFirstTime) {
      if (score === totalQuestions) {
        feedbackMessage = `¡Increíble ${username}! 🌟 100% a la primera. ¡Eres un genio!`;
      } else if (score === 0) {
        feedbackMessage = `Vaya... 0 puntos en tu debut. 😅 ¡Solo puedes mejorar desde aquí!`;
      } else {
        feedbackMessage = `¡Bienvenido ${username}! Esa fue tu primera partida. Ahora intenta superar tu marca.`;
      }
    } 
    // C. Jugador Recurrente
    else {
      let regressionDetected = false;
      
      // Detectar si falló algo que antes sabía
      if (wrongQuestionIds.length > 0) {
        const pastCorrectResponse = await prisma.playerResponse.findFirst({
          where: {
            session: { playerId: player.id },
            questionId: { in: wrongQuestionIds },
            isCorrect: true
          }
        });
        
        if (pastCorrectResponse) {
          regressionDetected = true;
          feedbackMessage = `¡Oye ${username}! 🧐 Hoy fallaste una pregunta que antes ya habías respondido bien. ¡Más atención!`;
        }
      }

      // Si no hubo regresión, analizamos el récord
      if (!regressionDetected) {
        if (score > bestPreviousScore) {
          feedbackMessage = `¡NUEVO RÉCORD! 🏆 Superaste tu mejor marca de ${bestPreviousScore} puntos.`;
        } else if (score === bestPreviousScore) {
          feedbackMessage = `Empataste tu mejor marca. ¡Estás cerca de superarte!`;
        } else {
          feedbackMessage = `No lograste superar tu récord de ${bestPreviousScore}. ¡Sigue intentando!`;
        }
      }
    }

    // 5. Guardar la Sesión en la DB
    const newSession = await prisma.gameSession.create({
      data: {
        player: { connect: { id: player.id } },
        quiz: { connect: { internalId: quiz.internalId } },
        score,
        totalQuestions,
        responses: {
          create: responsesToSave
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: feedbackMessage,
      score,
      total: totalQuestions,
      sessionId: newSession.id
    });

  } catch (error) {
    console.error("Error al guardar partida:", error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}