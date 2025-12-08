import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const quizzes = await prisma.quiz.findMany({
      orderBy: { internalId: 'asc' },
      select: {
        id: true,
        internalId: true,
        title: true
      }
    });
    return NextResponse.json(quizzes);
  } catch (error) {
    return NextResponse.json({ error: 'Error cargando quizzes' }, { status: 500 });
  }
}