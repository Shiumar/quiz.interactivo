import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
  const { id } = await params; // Este es el UUID de la opción
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
    // Buscamos por la Primary Key (internalId)
    const exists = await prisma.option.findUnique({
      where: { internalId: Number(newInternalId) }
    });

    if (exists) {
      return NextResponse.json({ error: `El ID ${newInternalId} ya está en uso.` }, { status: 400 });
    }

    // 3. Actualización Segura
    // Actualizamos solo el ID interno. Como PlayerResponse apunta al UUID (campo 'id'),
    // el historial de juego se mantiene intacto.
    const updated = await prisma.option.update({
      where: { id: id }, // Buscamos por el UUID (@unique)
      data: { internalId: Number(newInternalId) }
    });

    return NextResponse.json({ 
      ok: true, 
      message: 'ID reasignado correctamente', 
      updated 
    });

  } catch (err) {
    console.error('Error reasignando opción:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}