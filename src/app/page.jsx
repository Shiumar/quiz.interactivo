// src/app/page.jsx (server component)
import Header from '../components/Header';
import QuizLoader from '../components/QuizLoader';
import styles from './page.module.css';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const quizzes = await prisma.quiz.findMany({
    include: { questions: { include: { options: true } } },
    orderBy: { internalId: 'asc' },
  });

  return (
    <main className={styles.quizContainer}>
      <Header />
      <div className={styles.quizContent}>
        <QuizLoader serverQuizzes={quizzes} />
      </div>
    </main>
  );
}