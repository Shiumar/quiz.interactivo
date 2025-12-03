import prisma from '@/lib/prisma';

export async function PATCH(req, { params }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { text, isCorrect, questionInternalId } = body;

    // basic validations
    if (text !== undefined && (!String(text).trim())) {
      return new Response(JSON.stringify({ error: 'El texto de la opción no puede estar vacío' }), { status: 400 });
    }

    // if moving to another question, ensure the question exists and won't exceed max options (6)
    if (questionInternalId !== undefined) {
      const q = await prisma.question.findUnique({ where: { internalId: questionInternalId } });
      if (!q) return new Response(JSON.stringify({ error: 'Pregunta destino no encontrada' }), { status: 404 });
      const count = await prisma.option.count({ where: { questionInternalId } });
      if (count >= 6) return new Response(JSON.stringify({ error: 'La pregunta destino ya tiene el máximo de opciones (6)' }), { status: 400 });
    }

    const updated = await prisma.option.update({ where: { id }, data: { text, isCorrect, questionInternalId } });
    return new Response(JSON.stringify({ ok: true, updated }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
