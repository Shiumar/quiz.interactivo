'use client';
import Link from 'next/link';
import ThemeSwitcher from './ThemeSwitcher';

export default function Header() {
  return (
    <header className="w-full py-3 px-6 border-b border-[var(--border)] bg-[var(--bg-card)]/80 backdrop-blur-md sticky top-0 z-50 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto relative flex flex-col md:flex-row items-center justify-between">
        
        {/* Lado Izquierdo (Vacío o Logo futuro) */}
        <div className="hidden md:block w-24">
          {/* Espacio reservado para equilibrio si fuera flex, pero no afecta al absolute */}
        </div>
        
        {/* CENTRO ABSOLUTO (Solo en Desktop) */}
        <div className="md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 flex flex-col items-center mb-3 md:mb-0 z-10">
          <Link href="/" className="group no-underline flex flex-col items-center text-center">
            <h1 
              className="text-3xl font-black tracking-tight text-transparent bg-clip-text transition-all duration-300 transform group-hover:scale-110"
              style={{ backgroundImage: 'linear-gradient(to right, var(--grad-start), var(--grad-end))' }}
            >
              Quiz Interactivo
            </h1>
            <span className="text-xs font-black text-[var(--text-muted)] line-through decoration-[var(--border)] decoration-2 opacity-60 group-hover:opacity-100 transition-opacity">
              ¿Quién quiere ser Millonario?
            </span>
          </Link>
        </div>

        {/* Lado Derecho (Rankings + Tema) */}
        <div className="flex items-center gap-4 z-20">
          <ThemeSwitcher />
          
          <Link 
            href="/leaderboard" 
            className="text-2xl font-extrabold text-[var(--text-muted)] hover:text-[var(--primary)] flex items-center gap-2 transition-colors hover:scale-105 active:scale-100 transform"
          >
            <span className="text-2xl">🏆</span> Rankings
          </Link>
        </div>
      </div>
    </header>
  );
}