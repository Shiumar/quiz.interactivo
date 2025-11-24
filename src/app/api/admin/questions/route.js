import prisma from '@/lib/prisma';

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

  return new Response(JSON.stringify(created), { status: 201 });
}