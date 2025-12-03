import prisma from '@/lib/prisma';

/**
 * Checks if questions and their options have gaps in their internalIds.
 * Returns true if resequencing is needed.
 */
function checkIfResequenceNeeded(questions) {
  if (questions.length === 0) return false;

  // check questions are 1, 2, 3, ..., n
  for (let i = 0; i < questions.length; i++) {
    if (questions[i].internalId !== i + 1) {
      return true;
    }
  }

  // check options are 1, 2, 3, ..., m (globally, not per question)
  let expectedOptId = 1;
  for (const q of questions) {
    if (!q.options) continue;
    for (const opt of q.options) {
      if (opt.internalId !== expectedOptId) {
        return true;
      }
      expectedOptId++;
    }
  }

  return false;
}

/**
 * Recompacts question and option internalIds to be sequential (1, 2, 3, ...)
 */
async function resequenceQuestions(quizInternalId) {
  const questions = await prisma.question.findMany({
    where: { quizInternalId },
    orderBy: { internalId: 'asc' },
    include: { options: { orderBy: { internalId: 'asc' } } },
  });

  if (questions.length === 0) return null;

  // build mapping
  let nextQId = 1;
  let nextOptId = 1;
  const qMap = {};
  const optMap = {};

  for (const q of questions) {
    qMap[q.internalId] = nextQId;
    nextQId++;
    for (const opt of q.options) {
      optMap[opt.internalId] = nextOptId;
      nextOptId++;
    }
  }

  // perform transaction with negative temp ids
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

    return updated;
  });

  return result;
}

export async function POST(req) {
  const body = await req.json();
  // Expect body: { id?, text, options: [{ id?, text, isCorrect }] }
  // Auto-fetch the only quiz and assign it
  const quiz = await prisma.quiz.findFirst();
  if (!quiz) {
    return new Response(JSON.stringify({ error: 'No quiz found. Please create a quiz first.' }), { status: 404 });
  }
  const quizInternalId = quiz.internalId;

  const created = await prisma.question.create({
    data: {
      id: body.id,               // optional app-managed UUID
      text: body.text,
      quizInternalId: quizInternalId,
      options: { create: body.options ?? [] },
    },
    include: { options: true },
  });

  // check if resequencing is needed and auto-recompact if so
  const allQuestions = await prisma.question.findMany({
    where: { quizInternalId },
    orderBy: { internalId: 'asc' },
    include: { options: { orderBy: { internalId: 'asc' } } },
  });

  if (checkIfResequenceNeeded(allQuestions)) {
    console.log('Auto-resequencing detected gaps after new question creation');
    const resequenced = await resequenceQuestions(quizInternalId);
    // return the new question with updated internalIds
    return new Response(JSON.stringify({ created, resequenced, autoResequenced: true }), { status: 201 });
  }

  return new Response(JSON.stringify({ created, autoResequenced: false }), { status: 201 });
}

export async function GET() {
  try {
    const quiz = await prisma.quiz.findFirst({ include: { questions: { include: { options: true }, orderBy: { internalId: 'asc' } } } });
    const questions = quiz?.questions ?? [];
    return new Response(JSON.stringify(questions), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}