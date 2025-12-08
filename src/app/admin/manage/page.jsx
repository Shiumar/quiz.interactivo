import prisma from '@/lib/prisma';
import AdminManageClient from '@/components/admin/AdminManageClient';

export const revalidate = 0;

export default async function ManagePage() {
  // Buscamos el primer quiz por defecto para mostrar algo, 
  // idealmente esto debería ser más dinámico, pero para esta fase está bien.
  const quiz = await prisma.quiz.findFirst({ 
    include: { 
      questions: { 
        include: { options: true } 
      } 
    },
    orderBy: { internalId: 'asc' }
  });
  
  const questions = (quiz?.questions ?? []).sort((a,b) => a.internalId - b.internalId);

  return (
    <div className="min-h-[calc(100vh-80px)] p-4 flex justify-center bg-[var(--bg-main)] transition-colors duration-300">
      <main className="w-full max-w-5xl my-8 p-8 bg-[var(--bg-card)] rounded-3xl shadow-xl border border-[var(--border)] transition-colors duration-300">
        
        <h1 className="text-3xl font-black text-center text-[var(--text-main)] mb-8 tracking-tight">
          Administrar Preguntas
        </h1>
        
        {/* Aquí podrías agregar un selector de quiz en el futuro si quisieras gestionar otros */}
        <div className="mb-6 text-center">
            <span className="bg-[var(--secondary)] text-[var(--text-muted)] px-3 py-1 rounded-full text-sm font-bold">
                Editando: {quiz?.title || 'Sin Quiz'}
            </span>
        </div>
        
        <AdminManageClient 
          questions={questions} 
          quizInternalId={quiz?.internalId} 
        />
        
      </main>
    </div>
  );
}