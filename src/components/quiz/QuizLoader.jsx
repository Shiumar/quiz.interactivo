"use client";
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import QuizPlayer from './QuizPlayer';
import Button from '../ui/Button';
import { ConfirmProvider } from '../confirm/ConfirmContext';

function InnerQuizLoader({ serverQuizzes = [] }) {
  const router = useRouter();
  const [config, setConfig] = useState({ mode: null, quizId: null, questions: null });
  const [username, setUsername] = useState(''); 
  const [skipCorrect, setSkipCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Estado para el modal de importación de archivo
  const [importData, setImportData] = useState(null);
  
  const fileInputRef = useRef(null);

  const allQuizzes = [
    { id: 'mix', title: '🔀 Mix Aleatorio (Todos)', isMix: true },
    { id: 'local', title: '📍 Quiz Local (JSON Default)', isLocal: true },
    ...serverQuizzes
  ];

  // --- LÓGICA DE CARGA DE ARCHIVOS ---
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        validateAndPrepareImport(json);
      } catch (err) {
        alert('Error al leer el archivo JSON: ' + err.message);
      }
      event.target.value = ''; // Limpiar input para permitir recargar el mismo archivo
    };
    reader.readAsText(file);
  };

  const validateAndPrepareImport = (json) => {
    const rawQuestions = Array.isArray(json) ? json : (json.questions || []);
    if (!rawQuestions || rawQuestions.length === 0) {
      alert('El archivo no contiene preguntas válidas.');
      return;
    }
    // Validación básica de estructura
    const isValid = rawQuestions.every(q => q.text && Array.isArray(q.options));
    if (!isValid) {
      alert('Formato incorrecto. Cada pregunta debe tener "text" y "options".');
      return;
    }
    
    const quizTitle = json.quiz?.name || json.title || 'Quiz Importado';
    setImportData({ json, rawQuestions, quizTitle });
  };

  const handleImportDecision = async (decision) => {
    if (!importData) return;
    const { json, rawQuestions, quizTitle } = importData;
    setImportData(null); // Cerrar modal

    if (decision === 'save') {
      await importToDatabase(json);
    } else {
      loadEphemeralQuiz(rawQuestions, quizTitle);
    }
  };

  const importToDatabase = async (json) => {
    setIsLoading(true);
    setStatusMessage('Importando a la base de datos...');
    try {
      const res = await fetch('/api/quiz/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json)
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error desconocido');

      alert('¡Quiz importado con éxito!');
      router.refresh(); // Recarga la lista de quizzes del servidor
    } catch (err) {
      alert('Error al importar: ' + err.message);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const loadEphemeralQuiz = (questions, title) => {
    // Normalizar IDs para el modo temporal
    const formattedQuestions = questions.map((q, idx) => ({
      ...q,
      id: q.id || `temp-q-${idx}`,
      options: (q.options || []).map((op, j) => ({ id: op.id || `temp-${idx}-o-${j}`, ...op }))
    }));
    
    // Iniciar inmediatamente en modo juego local
    setConfig({ mode: 'play', quizId: 'local', questions: formattedQuestions });
    if (!username) setUsername('Invitado');
  };
  // --- FIN LÓGICA ARCHIVOS ---


  async function handleStart(selectedQuizId, selectedMode) {
    if (selectedMode === 'play' && !username.trim()) {
      alert('Por favor, ingresa tu nombre para jugar.');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Preparando preguntas...');

    try {
      let questions = [];
      
      if (selectedQuizId === 'mix') {
        questions = serverQuizzes.flatMap(q => q.questions);
      } else if (selectedQuizId === 'local') {
        const res = await fetch('/preguntas.json');
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        const json = await res.json();
        const raw = Array.isArray(json) ? json : json.questions;
        questions = raw.map((q, idx) => ({
          ...q, id: q.id || `local-q-${idx}`,
          options: (q.options || []).map((op, j) => ({ id: op.id || `local-${idx}-o-${j}`, ...op }))
        }));
      } else {
        const quiz = serverQuizzes.find(q => q.id === selectedQuizId);
        questions = quiz ? quiz.questions : [];
      }

      // Filtrar preguntas ya respondidas si el checkbox está activo
      if (skipCorrect && username.trim() && selectedQuizId !== 'local') {
        setStatusMessage('Verificando tu historial...');
        const progressRes = await fetch(`/api/game/progress?username=${encodeURIComponent(username)}`);
        
        if (progressRes.ok) {
          const { questionIds } = await progressRes.json();
          // Filtramos las que ya respondió (IDs coinciden)
          questions = questions.filter(q => !questionIds.includes(q.id));
          
          if (questions.length === 0) {
            throw new Error("¡Increíble! Ya dominas todas las preguntas de esta selección. 🎉");
          }
        }
      }

      if (questions.length === 0) throw new Error('No se encontraron preguntas disponibles.');

      setConfig({ mode: selectedMode, quizId: selectedQuizId, questions });
    } catch (err) {
      alert(err.message);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  }

  function handleExit() {
    setConfig({ mode: null, quizId: null, questions: null });
  }

  if (config.questions) {
    return (
      <QuizPlayer 
        questions={config.questions} 
        mode={config.mode} 
        quizId={config.quizId}
        username={username}
        onExit={handleExit} 
      />
    );
  }

  return (
    <>
      {/* MODAL DE IMPORTACIÓN */}
      {importData && (
        <div className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-card)] p-8 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all scale-100 border-2 border-[var(--border)]">
            <h3 className="text-xl font-black text-[var(--text-main)] mb-2">Archivo Detectado</h3>
            <p className="text-[var(--text-muted)] mb-6">
              Has cargado <strong>"{importData.quizTitle}"</strong> con {importData.rawQuestions.length} preguntas.
              <br/><br/>
              ¿Qué deseas hacer con él?
            </p>
            
            <div className="flex flex-col gap-3">
              <button onClick={() => handleImportDecision('save')} className="w-full p-4 bg-[var(--primary)] text-white rounded-xl font-bold hover:bg-[var(--primary-hover)] transition-colors flex items-center justify-center gap-2 shadow-md hover:scale-[1.02]">
                <span>💾 Guardar en Base de Datos 💾</span>
                <span className="text-white/80 text-xs font-normal">(Permanente + Ranking)</span>
              </button>
              <button onClick={() => handleImportDecision('play')} className="w-full p-4 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 shadow-md hover:scale-[1.02]">
                <span>⚡ Jugar Ahora ⚡</span>
                <span className="text-amber-100 text-xs font-normal">(Temporal, sin guardar)</span>
              </button>
              <button onClick={() => setImportData(null)} className="w-full p-3 text-[var(--text-muted)] hover:bg-[var(--secondary)] rounded-lg mt-2">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-6xl mx-auto mt-4 text-center px-4 flex flex-col justify-center h-full">
        
        {/* SECCIÓN CARGA DE ARCHIVO */}
        <div className="mb-6 p-4 bg-[var(--bg-card)] rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] transition-colors shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <p className="text-base font-bold text-[var(--text-main)]">¿Tienes preguntas nuevas?</p>
            <p className="text-sm text-[var(--text-muted)]">Carga tu propio archivo .json</p>
          </div>
          <div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".json" 
              style={{ display: 'none' }} 
            />
            {/* Botón Cargar: Oscuro y visible, con íconos simétricos */}
            <Button 
              text="📂 Cargar JSON 📂" 
              onClick={() => fileInputRef.current?.click()}
              className="bg-slate-800 text-white border-none hover:bg-slate-900 text-sm py-2.5 px-6 shadow-md font-bold tracking-wide"
            />
          </div>
        </div>

        {/* TÍTULO CORREGIDO */}
        <h2 className="text-3xl font-black mb-6 text-[var(--text-main)] tracking-tight">Configura tu Partida</h2>
        
        {/* GRID CONFIGURACIÓN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6 items-end">
          <div className="text-left">
            <label className="block mb-2 font-bold text-[var(--text-muted)] text-xs uppercase tracking-wider">1. Tu Nombre</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: Pepito Gamer"
              className="w-full p-4 rounded-xl border-2 border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-main)] focus:border-[var(--primary)] focus:bg-[var(--bg-card)] focus:ring-4 focus:ring-[var(--primary-light)] outline-none transition-all font-medium text-lg"
            />
          </div>

          <div className="text-left">
            <label className="block mb-2 font-bold text-[var(--text-muted)] text-xs uppercase tracking-wider">2. Elige un Quiz</label>
            <div className="relative">
              <select 
                id="quiz-selector"
                className="w-full p-4 rounded-xl border-2 border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-main)] focus:border-[var(--primary)] focus:bg-[var(--bg-card)] focus:ring-4 focus:ring-[var(--primary-light)] outline-none transition-all font-medium text-lg appearance-none cursor-pointer"
              >
                {allQuizzes.map(q => {
                  let label = q.title || `Quiz ${q.internalId}`;
                  if (q.isMix) label = q.title;
                  else if (!q.isLocal) label += ` (${q.questions?.length || 0} pregs)`;
                  return <option key={q.id} value={q.id}>{label}</option>;
                })}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">▼</div>
            </div>
          </div>
        </div>

        {/* CHECKBOX CORREGIDO */}
        <div className="mb-8 text-left flex items-center gap-3 p-4 bg-[var(--primary-light)] rounded-xl border border-[var(--primary)]/20 hover:border-[var(--primary)]/50 transition-colors cursor-pointer" onClick={() => username && setSkipCorrect(!skipCorrect)}>
          <input 
            type="checkbox" 
            checked={skipCorrect}
            onChange={() => {}}
            disabled={!username}
            className="w-5 h-5 accent-[var(--primary)] cursor-pointer"
          />
          <div className={`${!username ? 'opacity-50' : ''}`}>
            <p className="text-sm font-bold text-[var(--text-main)]">Saltar preguntas ya dominadas</p>
            <p className="text-xs text-[var(--text-muted)]">Solo te mostraremos las que te faltan por acertar.</p>
          </div>
        </div>

        {/* Botones de Modo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* BOTÓN PRÁCTICA: Texto blanco (text-white) para contraste sobre fondo oscuro */}
          <Button 
            className="bg-slate-800 hover:bg-slate-900 text-white py-6 border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transition-all h-full"
            onClick={() => handleStart(document.getElementById('quiz-selector').value, 'test')}
            disabled={isLoading}
            text={
              <div className="flex flex-col items-center">
                <span className="font-bold text-xl">🛠️ Modo Práctica 🛠️</span>
                <span className="text-sm opacity-90 mt-1 uppercase tracking-wide text-slate-300">Sin límites • Corrección inmediata</span>
              </div>
            }
          />

          <Button 
            onClick={() => handleStart(document.getElementById('quiz-selector').value, 'play')}
            disabled={isLoading || !username.trim()}
            className={`${!username.trim() ? 'opacity-50 grayscale cursor-not-allowed' : ''} bg-[var(--primary)] hover:bg-[var(--primary-hover)] py-6 border-b-4 border-black/20 active:border-b-0 active:translate-y-1 transition-all h-full`}
            text={
               <div className="flex flex-col items-center">
                <span className="font-bold text-xl text-white">🎮 Modo Competitivo 🎮</span>
                <span className="text-sm text-white/80 mt-1 uppercase tracking-wide">Con Ranking • Sin retroceder</span>
              </div>
            }
          />
        </div>
        
        {isLoading && <p className="mt-6 text-[var(--primary)] font-bold animate-pulse text-lg">{statusMessage || 'Cargando...'}</p>}
      </div>
    </>
  );
}

export default function QuizLoader(props) {
  return (
    <ConfirmProvider>
      <InnerQuizLoader {...props} />
    </ConfirmProvider>
  );
}