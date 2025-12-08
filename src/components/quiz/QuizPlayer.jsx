'use client';
import { useState, useEffect, useRef } from 'react';
import Question from './Question';
import Results from './Results';
import Button from '../ui/Button';
import { useConfirm } from '../confirm/ConfirmContext';

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizPlayer({ questions = [], mode, quizId, username, onExit }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [shuffled, setShuffled] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false); // Estado para el modo revisión
  const [notice, setNotice] = useState(null);
  
  const timerRef = useRef(null);
  const confirm = useConfirm();

  // 1. Configuración Inicial (Modo Estricto: Sin persistencia en disco)
  useEffect(() => {
    if (questions.length > 0) {
      const qCopy = questions.map((q) => ({ 
        ...q, 
        options: shuffleArray(q.options || []) 
      }));
      const s = shuffleArray(qCopy);
      setShuffled(s);
    }
  }, [questions]);

  // 2. Protección contra cierre accidental (Solo en modo juego activo)
  useEffect(() => {
    if (mode !== 'play' || isFinished) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [mode, isFinished]);

  // 3. Temporizador de 15 segundos
  useEffect(() => {
    if (!shuffled.length || isFinished || isReviewing) return;
    
    const currentQ = shuffled[index];
    const currentAns = answers[currentQ.id];
    
    if (timerRef.current) clearTimeout(timerRef.current);

    if (mode === 'play' && (currentAns?.checked || currentAns?.skipped)) {
      timerRef.current = setTimeout(() => {
        advanceIndex();
      }, 15000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index, answers, mode, shuffled, isFinished, isReviewing]);


  function onAnswerChangeForCurrent(payload) {
    if (isReviewing) return; 
    const qId = shuffled[index].id;
    setAnswers((prev) => ({ ...prev, [qId]: { ...(prev[qId] || {}), ...payload } }));
  }

  function advanceIndex() {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (index >= shuffled.length - 1) {
      setIsFinished(true); 
    } else {
      setIndex((i) => i + 1);
    }
  }

  // --- LÓGICA ESPECIAL: TERMINAR ANTES DE TIEMPO ---
  async function handleFinishEarly() {
    const ok = await confirm('¿Terminar el quiz ahora? Las preguntas restantes contarán como saltadas (0 puntos).');
    if (!ok) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    // Rellenar respuestas restantes como 'skipped'
    const newAnswers = { ...answers };
    for (let i = index; i < shuffled.length; i++) {
      const q = shuffled[i];
      if (!newAnswers[q.id]) {
        newAnswers[q.id] = { checked: false, skipped: true, isCorrect: false };
      }
    }
    
    setAnswers(newAnswers);
    setIsFinished(true);
  }

  // --- LÓGICA BOTÓN SIGUIENTE ---
  async function handleNextClick() {
    if (isReviewing) {
      advanceIndex();
      return;
    }

    const currentQ = shuffled[index];
    const currentAns = answers[currentQ.id];

    if (mode === 'play') {
      const isDone = currentAns?.checked || currentAns?.skipped;

      if (isDone) {
        advanceIndex();
      } else {
        const skip = await confirm('No has respondido aún. ¿Seguro que quieres saltar? Perderás este punto.');
        if (!skip) return;
        
        onAnswerChangeForCurrent({ checked: false, skipped: true });
      }
    } else {
      // Modo test
      advanceIndex();
    }
  }

  function prevQuestion() {
    setIndex((i) => {
      if (i <= 0) {
        setNotice('Estás en la primera pregunta');
        setTimeout(() => setNotice(null), 2000);
        return i;
      }
      return i - 1;
    });
  }

  // --- ACCIONES POST-JUEGO ---

  async function handleRestart() {
    const ok = await confirm('¿Reiniciar el quiz? Se perderá el progreso actual.');
    if (ok) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIndex(0);
      setAnswers({});
      setIsFinished(false);
      setIsReviewing(false);
      const qCopy = (questions || []).map((q) => ({ ...q, options: shuffleArray(q.options || []) }));
      setShuffled(shuffleArray(qCopy));
    }
  }
  
  async function handleBackToMenu() {
    const ok = await confirm('¿Volver al menú principal? Se perderá el progreso de esta partida.');
    if (ok) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (onExit) onExit();
    }
  }

  function handleReview() {
    setIsFinished(false);
    setIsReviewing(true);
    setIndex(0);
  }

  if (isFinished) {
    return (
      <Results 
        questions={shuffled} 
        answers={answers} 
        onRestart={handleRestart} 
        onReview={handleReview} 
        quizId={quizId}
        username={username}
        onExit={handleBackToMenu}
        mode={mode}
      />
    );
  }

  if (!shuffled || shuffled.length === 0) return <p className="text-center mt-10 text-[var(--text-muted)]">Cargando preguntas...</p>;

  const question = shuffled[index];
  const currentAnswer = answers[question.id] || {};
  
  let nextBtnText = 'Siguiente';
  if (index === shuffled.length - 1) {
     nextBtnText = isReviewing ? 'Volver a Resultados' : 'Finalizar Quiz';
  } else if (mode === 'play' && !isReviewing && (currentAnswer.checked || currentAnswer.skipped)) {
    nextBtnText = 'Continuar ahora (>>>)';
  }

  return (
    // CAMBIO: max-w-7xl para usar más pantalla
    <div className="w-full max-w-7xl mx-auto px-4 transition-colors duration-300">
      
      {/* HEADER DEL PLAYER */}
      <div className="mb-4 flex flex-col md:flex-row items-center justify-between bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border)] shadow-sm gap-3">
        
        {/* Izquierda: Indicador de Modo */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
           <div className={`px-4 py-2 rounded-full text-sm font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-sm ${mode==='play'?'bg-[var(--primary-light)] text-[var(--primary)]':'bg-[var(--secondary)] text-[var(--text-muted)]'}`}>
              <span>{isReviewing ? '🔍 Revisión' : (mode === 'play' ? '🎮 Competitivo' : '🛠️ Práctica')}</span>
           </div>
           
           {/* Botón Salir (Móvil) */}
           <button 
             onClick={handleBackToMenu} 
             className="md:hidden flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent-error)] font-bold text-xs uppercase transition-all"
           >
             ❌ Salir ❌
           </button>
        </div>
        
        {/* Centro: Contador (CORREGIDO: Centrado con Flex-1) */}
        <div className="hidden md:flex flex-1 justify-center">
           <span className="text-xl font-black text-[var(--text-main)]">
             {index + 1} <span className="text-[var(--text-muted)] text-lg">/ {shuffled.length}</span>
           </span>
        </div>

        {/* Derecha: Botones de Salida (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {!isReviewing && index < shuffled.length - 1 && (
             <button 
               onClick={handleFinishEarly}
               // CAMBIO: Estilo igualado a "Salir" (Botón sólido con borde), texto SM, Bold, Hover Rojo
               className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--accent-error)] hover:border-red-200 font-bold text-sm uppercase tracking-wide transition-all shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
               title="Terminar y ver puntaje parcial"
             >
               🏁 Terminar 🏁
             </button>
          )}
          
          <button 
            onClick={handleBackToMenu} 
            // CAMBIO: Estilo igualado
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--accent-error)] hover:border-red-200 font-bold text-sm uppercase tracking-wide transition-all shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
          >
            ❌ Salir ❌
          </button>
        </div>
      </div>

      {/* COMPONENTE DE PREGUNTA */}
      <Question 
        key={question.id} 
        question={question} 
        answer={currentAnswer} 
        onAnswerChange={onAnswerChangeForCurrent}
        mode={mode} 
      />

      {/* FOOTER: Botonera (Margen reducido mt-2) */}
      <div className="flex gap-4 justify-center mt-2 items-center pb-8">
        {(mode !== 'play' || isReviewing) && index > 0 && (
          <Button 
            onClick={prevQuestion} 
            text="← Anterior" 
            className="bg-[var(--bg-card)] text-[var(--text-muted)] border-2 border-[var(--border)] hover:bg-[var(--secondary)] px-6 py-3 shadow-sm hover:shadow" 
          />
        )}
        
        <Button 
          onClick={handleNextClick} 
          text={nextBtnText} 
          className="px-12 py-3 text-lg shadow-xl font-black tracking-wide transform transition-transform hover:scale-[1.02]" 
        />
        
        {notice && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[var(--text-main)] text-[var(--bg-card)] px-4 py-2 rounded-full text-sm font-semibold animate-bounce shadow-lg">{notice}</div>}
      </div>
    </div>
  );
}