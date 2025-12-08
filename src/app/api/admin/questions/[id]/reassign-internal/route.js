import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
  const { id } = await params; // UUID de la pregunta
  try {
    const body = await req.json();
    const { newInternalId, confirm } = body;

    // 1. Validaciones
    if (!newInternalId) {
      return NextResponse.json({ error: 'newInternalId requerido' }, { status: 400 });
    }
    if (!confirm) {
      return NextResponse.json({ error: 'Se requiere confirmación explícita' }, { status: 400 });
    }

    // 2. Verificar que el destino esté libre
    // Buscamos por la Clave Primaria (internalId) en el scope global o del quiz? 
    // Nota: Según tu schema, internalId es único globalmente (autoincrement).
    const exists = await prisma.question.findUnique({
      where: { internalId: Number(newInternalId) }
    });

    if (exists) {
      return NextResponse.json({ error: `El ID ${newInternalId} ya está en uso.` }, { status: 400 });
    }

    // 3. Actualización Directa
    // Actualizamos el internalId. Al no tocar el campo 'id' (UUID),
    // la relación con PlayerResponse se mantiene intacta.
    // Las opciones vinculadas (Option) deberían actualizarse automáticamente si la DB tiene ON UPDATE CASCADE,
    // de lo contrario, Prisma se encarga de la consistencia.
    const updated = await prisma.question.update({
      where: { id: id },
      data: { internalId: Number(newInternalId) },
      include: { options: true }
    });

    return NextResponse.json({ 
      ok: true, 
      message: 'ID reasignado correctamente', 
      updated 
    });

  } catch (err) {
    console.error('Error reasignando pregunta:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}