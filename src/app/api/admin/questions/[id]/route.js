import prisma from '@/lib/prisma';

export async function DELETE(req, { params }) {
  const { id } = await params;
  try {
    // fetch question to know internalId
    const q = await prisma.question.findUnique({ where: { id } });
    if (!q) return new Response(JSON.stringify({ error: 'Pregunta no encontrada' }), { status: 404 });
    // delete options first to avoid FK constraint errors
    await prisma.option.deleteMany({ where: { questionInternalId: q.internalId } });
    const deleted = await prisma.question.delete({ where: { id } });
    return new Response(JSON.stringify({ ok: true, deleted }), { status: 200 });
  } catch (err) {
    // debug: log stack
    try { console.error(err.stack || err); } catch (e) {}
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { text, options } = body;

    // fetch question to get internal id
    const q = await prisma.question.findUnique({ where: { id } });
    if (!q) return new Response(JSON.stringify({ error: 'Pregunta no encontrada' }), { status: 404 });
    // server-side validation: require options array and exactly one correct option
    if (!Array.isArray(options) || options.length === 0) {
      return new Response(JSON.stringify({ error: 'Se requiere un array de opciones no vacío' }), { status: 400 });
    }
    // ensure no empty option texts
    for (const opt of options) {
      if (!opt.text || !String(opt.text).trim()) {
        return new Response(JSON.stringify({ error: 'Todas las opciones deben tener texto no vacío' }), { status: 400 });
      }
    }
    const correctCount = options.filter((o) => !!o.isCorrect).length;
    if (correctCount !== 1) {
      return new Response(JSON.stringify({ error: 'Debe existir exactamente UNA opción correcta' }), { status: 400 });
    }

    // update question text if provided
    if (typeof text === 'string') {
      await prisma.question.update({ where: { id }, data: { text } });
    }

    // Upsert options: preserve existing options when id provided, update or create accordingly
    const incomingIds = options.filter((o) => o.id).map((o) => o.id);

    for (const opt of options) {
      if (opt.id) {
        // try update; if not found, create with provided id
        await prisma.option.upsert({
          where: { id: opt.id },
          update: { text: opt.text || '', isCorrect: !!opt.isCorrect },
          create: { id: opt.id, text: opt.text || '', isCorrect: !!opt.isCorrect, questionInternalId: q.internalId },
        });
      } else {
        // create new option
        await prisma.option.create({ data: { text: opt.text || '', isCorrect: !!opt.isCorrect, questionInternalId: q.internalId } });
      }
    }

    // delete any options that exist in DB but were not sent in payload
    await prisma.option.deleteMany({ where: { questionInternalId: q.internalId, AND: [{ id: { notIn: incomingIds.length ? incomingIds : [''] } }] } });

    const updated = await prisma.question.findUnique({ where: { id }, include: { options: true } });
    return new Response(JSON.stringify({ ok: true, updated }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
