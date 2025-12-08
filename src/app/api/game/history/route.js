import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Para que no cachee los resultados viejos

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('quizId');

    // Filtro opcional: si mandan quizId, filtramos por ese quiz. Si no, traemos todos.
    const whereClause = quizId ? { quiz: { id: quizId } } : {};

    const history = await prisma.gameSession.findMany({
      where: whereClause,
      take: 50, // Limitamos a las ultimas 50 partidas para no explotar la tabla
      orderBy: { startedAt: 'desc' }, // Las más recientes primero
      include: {
        player: {
          select: { username: true }
        },
        quiz: {
          select: { title: true }
        }
      }
    });

    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json({ error: 'Error cargando historial' }, { status: 500 });
  }
}