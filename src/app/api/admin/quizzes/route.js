import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { title } = body;

    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'El título es obligatorio.' }, { status: 400 });
    }

    const existing = await prisma.quiz.findFirst({ where: { title: title.trim() } });
    if (existing) {
      return NextResponse.json({ error: 'Ya existe un quiz con ese nombre.' }, { status: 409 });
    }

    const newQuiz = await prisma.quiz.create({
      data: { title: title.trim() }
    });

    return NextResponse.json({ success: true, quiz: newQuiz }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}