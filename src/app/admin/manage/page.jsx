import prisma from '@/lib/prisma';
import styles from '../page.module.css';
import AdminManageClient from '@/components/AdminManageClient';

export const revalidate = 0;

export default async function ManagePage() {
  const quiz = await prisma.quiz.findFirst({ include: { questions: { include: { options: true } } } });
  const questions = (quiz?.questions ?? []).sort((a,b) => a.internalId - b.internalId);

  return (
    <main className={styles.adminContainer}>
      <h1 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Administrar Preguntas</h1>
      <AdminManageClient questions={questions} quizInternalId={quiz?.internalId} />
    </main>
  );
}
