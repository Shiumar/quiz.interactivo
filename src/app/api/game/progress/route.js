import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ questionIds: [] });
    }

    // Buscamos el jugador
    const player = await prisma.player.findUnique({
      where: { username },
    });

    if (!player) {
      return NextResponse.json({ questionIds: [] });
    }

    // Buscamos todas las respuestas correctas de este jugador
    // Usamos 'distinct' para obtener solo los IDs únicos
    const correctResponses = await prisma.playerResponse.findMany({
      where: {
        session: { playerId: player.id },
        isCorrect: true,
      },
      select: { questionId: true },
      distinct: ['questionId'],
    });

    const ids = correctResponses.map(r => r.questionId);

    return NextResponse.json({ questionIds: ids });

  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Error obteniendo progreso' }, { status: 500 });
  }
}