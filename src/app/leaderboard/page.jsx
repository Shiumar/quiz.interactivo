'use client';
import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function LeaderboardPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/game/history')
      .then(res => res.json())
      .then(data => {
        setHistory(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-[calc(100vh-80px)] p-4 flex justify-center bg-[var(--bg-main)] transition-colors duration-300">
      <main className="w-full max-w-5xl my-8 p-6 bg-[var(--bg-card)] rounded-2xl shadow-xl border border-[var(--border)] transition-colors duration-300">
        
        <div className="flex justify-between items-center mb-8 border-b border-[var(--border)] pb-6">
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">
            🏆 Tabla de Resultados
          </h1>
          <Link href="/">
            <Button 
              text="Volver al Inicio" 
              className="bg-[var(--secondary)] text-[var(--text-main)] hover:bg-[var(--border)] border border-[var(--border)] text-sm py-2 shadow-none font-bold" 
            />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-center text-[var(--text-muted)] animate-pulse font-medium">Cargando resultados...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16 bg-[var(--secondary)]/30 rounded-xl border-2 border-dashed border-[var(--border)]">
            <p className="text-[var(--text-muted)] text-lg mb-4">Aún no hay partidas registradas.</p>
            <p className="text-[var(--primary)] font-bold">¡Sé el primero en jugar!</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--secondary)] text-[var(--text-muted)] uppercase text-xs font-bold tracking-wider">
                  <th className="py-4 px-6 text-left">Jugador</th>
                  <th className="py-4 px-6 text-left">Quiz</th>
                  <th className="py-4 px-6 text-center">Puntaje</th>
                  <th className="py-4 px-6 text-center">%</th>
                  <th className="py-4 px-6 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--bg-card)]">
                {history.map((session) => {
                  const percentage = Math.round((session.score / session.totalQuestions) * 100);
                  const isPerfect = percentage === 100;
                  const isPass = percentage >= 50;
                  
                  return (
                    <tr key={session.id} className="hover:bg-[var(--secondary)]/50 transition-colors">
                      <td className="py-4 px-6 text-left whitespace-nowrap font-bold text-[var(--text-main)]">
                        {session.player.username}
                      </td>
                      <td className="py-4 px-6 text-left text-[var(--text-main)]">
                        {session.quiz.title}
                      </td>
                      <td className="py-4 px-6 text-center font-mono font-medium text-[var(--text-muted)]">
                        {session.score} <span className="opacity-50">/</span> {session.totalQuestions}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span 
                          className={`
                            py-1 px-3 rounded-full text-xs font-extrabold border
                            ${isPerfect 
                              ? 'bg-[var(--accent-success)]/10 text-[var(--accent-success)] border-[var(--accent-success)]/20' 
                              : isPass 
                                ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20' 
                                : 'bg-[var(--accent-error)]/10 text-[var(--accent-error)] border-[var(--accent-error)]/20'}
                          `}
                        >
                          {percentage}%
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right text-sm text-[var(--text-main)]">
                        {new Date(session.startedAt).toLocaleDateString()} 
                        <span className="block text-xs text-[var(--text-muted)] mt-0.5">
                          {new Date(session.startedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}