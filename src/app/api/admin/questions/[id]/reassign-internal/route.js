import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req, { params }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { newInternalId, confirm } = body;
    if (!newInternalId) return new Response(JSON.stringify({ error: 'newInternalId requerido' }), { status: 400 });
    if (!confirm) return new Response(JSON.stringify({ error: 'Se requiere confirmación explícita para reassign' }), { status: 400 });

    // ensure newInternalId not in use
    const exists = await prisma.question.findFirst({ where: { internalId: newInternalId } });
    if (exists) return new Response(JSON.stringify({ error: 'El internalId destino ya existe' }), { status: 400 });

    // fetch current question
    const q = await prisma.question.findUnique({ where: { id }, include: { options: true } });
    if (!q) return new Response(JSON.stringify({ error: 'Question no encontrada' }), { status: 404 });

    // perform transactional copy-move: create new question with new internalId, move options, delete old
    const tempUuid = crypto.randomUUID();
    let updated;
    await prisma.$transaction(async (tx) => {
      // create new question with new internalId and temp uuid
      await tx.question.create({ data: { internalId: newInternalId, id: tempUuid, text: q.text, quizInternalId: q.quizInternalId } });
      // move options to new internalId
      await tx.option.updateMany({ where: { questionInternalId: q.internalId }, data: { questionInternalId: newInternalId } });
      // delete old question
      await tx.question.delete({ where: { id } });
      // set new question's id to old id (after old deleted) to preserve public uuid
      updated = await tx.question.update({ where: { internalId: newInternalId }, data: { id: q.id }, include: { options: true } });
    });

    return new Response(JSON.stringify({ ok: true, message: 'internalId de pregunta reasignado', updated }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

