import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const body = await req.json();
    const { quizInternalId, confirm } = body;
    if (!quizInternalId) return new Response(JSON.stringify({ error: 'quizInternalId requerido' }), { status: 400 });
    if (!confirm) return new Response(JSON.stringify({ error: 'Se requiere confirmación explícita para resequence' }), { status: 400 });

    // fetch all questions and options ordered by current internalId
    const questions = await prisma.question.findMany({
      where: { quizInternalId },
      orderBy: { internalId: 'asc' },
      include: { options: { orderBy: { internalId: 'asc' } } },
    });

    if (questions.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: 'No hay preguntas para reasignar', needsResequence: false }), { status: 200 });
    }

    // check if resequencing is needed
    const needsResequence = checkIfResequenceNeeded(questions);
    if (!needsResequence) {
      return new Response(JSON.stringify({ 
        ok: true, 
        message: 'Las preguntas ya están secuenciadas correctamente (1, 2, 3...)', 
        needsResequence: false,
        questions 
      }), { status: 200 });
    }

    // build mapping: old -> new sequential internalIds
    let nextQId = 1;
    let nextOptId = 1;
    const qMap = {}; // old internalId -> new internalId
    const optMap = {}; // old internalId -> new internalId

    for (const q of questions) {
      qMap[q.internalId] = nextQId;
      nextQId++;
      for (const opt of q.options) {
        optMap[opt.internalId] = nextOptId;
        nextOptId++;
      }
    }

    // perform transaction: use temporary negative ids to avoid conflicts, then update to positive
    const result = await prisma.$transaction(async (tx) => {
      // step 1: rename all old questions to negative temp ids
      for (const q of questions) {
        const tempId = -(qMap[q.internalId]);
        await tx.question.update({
          where: { id: q.id },
          data: { internalId: tempId },
        });
      }

      // step 2: rename all old options to negative temp ids
      for (const q of questions) {
        for (const opt of q.options) {
          const tempId = -(optMap[opt.internalId]);
          await tx.option.update({
            where: { id: opt.id },
            data: { internalId: tempId },
          });
        }
      }

      // step 3: rename all from negative temp ids to final positive ids
      for (const q of questions) {
        const newId = qMap[q.internalId];
        await tx.question.update({
          where: { internalId: -newId },
          data: { internalId: newId },
        });
      }

      for (const q of questions) {
        for (const opt of q.options) {
          const newId = optMap[opt.internalId];
          await tx.option.update({
            where: { internalId: -newId },
            data: { internalId: newId },
          });
        }
      }

      // fetch and return updated questions
      const updated = await tx.question.findMany({
        where: { quizInternalId },
        orderBy: { internalId: 'asc' },
        include: { options: { orderBy: { internalId: 'asc' } } },
      });

      return { questions: updated, mapping: { questions: qMap, options: optMap } };
    });

    return new Response(JSON.stringify({ 
      ok: true, 
      message: `${questions.length} preguntas reasignadas secuencialmente`, 
      needsResequence: true,
      result 
    }), { status: 200 });
  } catch (err) {
    console.error('Resequence error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

/**
 * Checks if questions and their options have gaps in their internalIds.
 * Returns true if resequencing is needed.
 */
function checkIfResequenceNeeded(questions) {
  if (questions.length === 0) return false;

  // check questions are 1, 2, 3, ..., n
  for (let i = 0; i < questions.length; i++) {
    if (questions[i].internalId !== i + 1) {
      console.log(`Question gap detected: expected ${i + 1}, got ${questions[i].internalId}`);
      return true;
    }
  }

  // check options are 1, 2, 3, ..., m (globally, not per question)
  let expectedOptId = 1;
  for (const q of questions) {
    if (!q.options) continue;
    for (const opt of q.options) {
      if (opt.internalId !== expectedOptId) {
        console.log(`Option gap detected: expected ${expectedOptId}, got ${opt.internalId}`);
        return true;
      }
      expectedOptId++;
    }
  }

  return false;
}
