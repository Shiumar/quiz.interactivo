'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Button from '../ui/Button';

export default function Results({ questions, answers, onRestart, onReview, quizId, username, onExit, mode }) {
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'success' | 'error'
  const [serverMessage, setServerMessage] = useState('');
  const hasSavedRef = useRef(false); // Evita doble guardado en React StrictMode

  // --- CÁLCULO DE PUNTAJE ---
  let correctCount = 0;
  let skippedCount = 0;

  questions.forEach((q) => {
    const ans = answers[q.id];
    if (ans?.isCorrect) {
      correctCount++;
    } else if (!ans?.checked) {
      skippedCount++;
    }
  });

  const total = questions.length;
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  
  // Colores dinámicos para el puntaje (usando variables de tema)
  const scoreColorClass = percentage >= 50 ? "text-[var(--accent-success)]" : "text-[var(--accent-error)]";
  // Colores para el SVG (no aceptan clases arbitrarias de Tailwind tan fácil, usaremos currentColor)
  const strokeColorClass = percentage >= 50 ? "text-[var(--accent-success)]" : "text-[var(--accent-error)]";

  // --- EFECTO: GUARDADO AUTOMÁTICO ---
  useEffect(() => {
    // Solo guardamos si:
    // 1. Es modo 'play' (Competitivo)
    // 2. Tenemos usuario
    // 3. No es un quiz local
    // 4. No hemos guardado ya
    if (mode === 'play' && username && quizId !== 'local' && !hasSavedRef.current) {
      hasSavedRef.current = true;
      handleSaveScore();
    }
  }, [username, quizId, mode]);

  // --- FUNCIÓN DE GUARDADO ---
  async function handleSaveScore() {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/game/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId,
          username,
          answers // Enviamos detalles para análisis de regresión
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al guardar');

      setServerMessage(data.message);
      setSaveStatus('success');
    } catch (err) {
      setSaveStatus('error');
      setServerMessage(err.message);
    }
  }

  return (
    <div className="max-w-2xl mx-auto text-center animate-in fade-in slide-in-from-bottom-8 duration-700 mt-8 mb-12">
      
      <div className="bg-[var(--bg-card)] p-8 md:p-10 rounded-3xl shadow-2xl border border-[var(--border)] relative overflow-hidden transition-colors duration-300">
        {/* Decoración de fondo superior */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500"></div>

        <h2 className="text-3xl md:text-4xl font-black mb-8 text-[var(--text-main)] tracking-tight">
          Resumen de Partida
        </h2>
        
        {/* Círculo de Puntaje (SVG Animado) */}
        <div className="relative inline-flex justify-center items-center mb-8">
          <svg className="w-48 h-48 transform -rotate-90">
            {/* Círculo base */}
            <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-[var(--border)] opacity-30" />
            {/* Círculo de progreso */}
            <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
              className={strokeColorClass}
              strokeDasharray={2 * Math.PI * 88}
              strokeDashoffset={2 * Math.PI * 88 * (1 - percentage / 100)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-black ${scoreColorClass}`}>{percentage}%</span>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Aciertos</span>
          </div>
        </div>

        {/* Estadísticas en Grid */}
        <div className="grid grid-cols-2 gap-4 mb-10 text-left bg-[var(--bg-main)] p-6 rounded-2xl border border-[var(--border)]">
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider">Correctas</p>
            <p className="text-2xl font-bold text-[var(--text-main)]">{correctCount} <span className="text-[var(--text-muted)] text-lg font-normal">/ {total}</span></p>
          </div>
          <div>
             <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider">Saltadas</p>
             <p className="text-2xl font-bold text-[var(--text-main)]">{skippedCount}</p>
          </div>
        </div>

        {/* --- FEEDBACK DEL SERVIDOR --- */}
        {quizId !== 'local' && username && mode === 'play' && (
          <div className="mb-10 bg-[var(--primary-light)] p-6 rounded-2xl border border-[var(--primary)]/20 flex items-start gap-4 text-left shadow-sm">
            <div className="text-3xl select-none">🤖</div>
            <div className="flex-1">
              <p className="text-xs font-bold text-[var(--primary)] uppercase mb-1 tracking-wide">Análisis del Sistema</p>
              
              {saveStatus === 'saving' && (
                <p className="text-[var(--text-muted)] animate-pulse font-medium">Analizando tu desempeño...</p>
              )}
              
              {saveStatus === 'success' && (
                <div className="animate-in fade-in duration-500">
                  <p className="text-lg font-bold text-[var(--text-main)] leading-snug">"{serverMessage}"</p>
                </div>
              )}

              {saveStatus === 'error' && (
                <div>
                  <p className="text-[var(--accent-error)] font-bold">Error guardando: {serverMessage}</p>
                  <button onClick={handleSaveScore} className="text-xs underline mt-2 text-[var(--accent-error)] hover:opacity-80 font-bold">
                    Intentar de nuevo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mensaje para Modo Test (Informativo) */}
        {mode === 'test' && (
          <div className="mb-8 p-4 bg-[var(--bg-main)] rounded-xl text-[var(--text-muted)] text-sm border border-[var(--border)] font-medium">
            💡 Estás en modo práctica, este resultado no se guarda en el ranking.
          </div>
        )}

        {/* --- BOTONES DE ACCIÓN --- */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button 
              text="🔍 Revisar Respuestas 🔍" 
              onClick={onReview} 
              className="bg-[var(--secondary)] text-[var(--text-main)] hover:bg-[var(--border)] border-none shadow-none font-bold" 
            />
            <Button 
              text="🔄 Jugar de nuevo 🔄" 
              onClick={onRestart} 
              className="bg-slate-800 hover:bg-slate-900 font-bold text-white" 
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/leaderboard" className="w-full">
              <Button 
                text="🏆 Ver Rankings 🏆" 
                className="w-full bg-amber-400 text-amber-950 hover:bg-amber-500 font-extrabold shadow-md hover:shadow-lg" 
              />
            </Link>
            <Button 
              text="🚪 Salir al Menú 🚪" 
              onClick={onExit} 
              className="bg-[var(--bg-card)] text-[var(--accent-error)] border-2 border-red-100 hover:bg-red-50 hover:border-red-200 font-bold shadow-none" 
            />
          </div>
        </div>

      </div>
    </div>
  );
}