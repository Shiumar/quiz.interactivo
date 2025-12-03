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
    const exists = await prisma.option.findFirst({ where: { internalId: newInternalId } });
    if (exists) return new Response(JSON.stringify({ error: 'El internalId destino ya existe' }), { status: 400 });

    // fetch current option
    const opt = await prisma.option.findUnique({ where: { id } });
    if (!opt) return new Response(JSON.stringify({ error: 'Option no encontrada' }), { status: 404 });

    // perform transactional copy-move
    const tempUuid = crypto.randomUUID();
    let updated;
    await prisma.$transaction(async (tx) => {
      // create new option with new internalId
      await tx.option.create({ data: { internalId: newInternalId, id: tempUuid, text: opt.text, isCorrect: opt.isCorrect, questionInternalId: opt.questionInternalId } });
      // delete old option
      await tx.option.delete({ where: { id } });
      // set new option's id to old id to preserve public uuid
      updated = await tx.option.update({ where: { internalId: newInternalId }, data: { id: opt.id } });
    });

    return new Response(JSON.stringify({ ok: true, message: 'internalId de opción reasignado', updated }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
