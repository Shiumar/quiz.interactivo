// src/app/page.jsx
import QuizLoader from '@/components/quiz/QuizLoader';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const quizzes = await prisma.quiz.findMany({
    include: { questions: { include: { options: true } } },
    orderBy: { internalId: 'asc' },
  });

  return (
    // CAMBIO: bg-gray-50 -> bg-[var(--bg-main)]
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 bg-[var(--bg-main)] transition-colors duration-300">
      
      <main className="
        w-full max-w-[1400px] 
        bg-[var(--bg-card)] 
        rounded-3xl shadow-xl border border-[var(--border)]
        flex flex-col items-center 
        p-4 md:p-8
        transition-all duration-300
      ">
        <div className="w-full">
          <QuizLoader serverQuizzes={quizzes} />
        </div>
      </main>
    </div>
  );
}