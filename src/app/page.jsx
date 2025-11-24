// src/app/page.jsx (server component)
import Header from '../components/Header';
import Question from '../components/Question';
import styles from './page.module.css';
import prisma from '@/lib/prisma';

export default async function HomePage() {
  const quiz = await prisma.quiz.findFirst({
    include: { questions: { include: { options: true } } },
  });

  const question = quiz?.questions?.[0] ?? null;

  return (
    <main className={styles.quizContainer}>
      <Header />
      <div className={styles.quizContent}>
        {question ? <Question question={question} /> : <p>No hay preguntas todavía</p>}
      </div>
    </main>
  );
}