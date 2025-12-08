'use client';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-1 bg-black/5 dark:bg-white/10 p-1 rounded-full backdrop-blur-sm border border-black/10 dark:border-white/10">
      <button
        onClick={() => setTheme('normal')}
        className={`w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all ${
          theme === 'normal' ? 'bg-white shadow-sm scale-110 text-purple-700' : 'opacity-50 hover:opacity-100'
        }`}
        title="Modo Normal"
      >
        🟣
      </button>
      <button
        onClick={() => setTheme('warm')}
        className={`w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all ${
          theme === 'warm' ? 'bg-white shadow-sm scale-110 text-orange-600' : 'opacity-50 hover:opacity-100'
        }`}
        title="Modo Cálido"
      >
        ☀️
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all ${
          theme === 'dark' ? 'bg-slate-700 shadow-sm scale-110 text-white' : 'opacity-50 hover:opacity-100'
        }`}
        title="Modo Oscuro"
      >
        🌙
      </button>
    </div>
  );
}