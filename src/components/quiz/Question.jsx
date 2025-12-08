'use client';
import { useState, useRef, useEffect } from 'react';
import Option from '../ui/Option';
import Button from '../ui/Button';
import { useConfirm } from '../confirm/ConfirmContext';

export default function Question({ question, answer = {}, onAnswerChange = () => {}, mode }) {
  const isSkipped = !!answer.skipped;
  const [selected, setSelected] = useState(answer.selected ?? null);
  const [checked, setChecked] = useState(answer.checked || isSkipped || false);
  
  const isSyncingRef = useRef(false);
  const prevAnswerRef = useRef(answer);
  
  const [focusedIndex, setFocusedIndex] = useState(0);
  const buttonRefs = useRef([]); 
  const submitRef = useRef(null);
  
  const confirm = useConfirm();

  function handleSelect(id) {
    if ((checked || isSkipped) && mode === 'play') return;
    
    setSelected(id);
    
    if (mode === 'test' || (!checked && !isSkipped)) {
      setChecked(false); 
      onAnswerChange({ selected: id, checked: false, isCorrect: null });
    }
  }

  useEffect(() => { prevAnswerRef.current = answer; }, [answer]);

  useEffect(() => {
    if (!answer) return;
    isSyncingRef.current = true;
    if (answer.selected !== undefined && answer.selected !== selected) setSelected(answer.selected);
    if (answer.checked !== undefined || answer.skipped) setChecked(!!answer.checked || !!answer.skipped);
    setTimeout(() => { isSyncingRef.current = false; }, 0);
  }, [answer?.selected, answer?.checked, answer?.isCorrect, answer?.skipped]);

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!selected) return;
    
    if (mode === 'play') {
      const isSure = await confirm('¿Es esta tu respuesta definitiva?');
      if (!isSure) return;
    }
    
    const selectedOption = question.options?.find((o) => o.id === selected) || null;
    const isCorrect = !!selectedOption?.isCorrect;
    
    setChecked(true);
    onAnswerChange({ selected, checked: true, isCorrect });
  }

  function handleKeyDown(e) {
    const totalOptions = question.options.length;
    const cols = typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1; 
    
    const submitIndex = totalOptions;
    let newIndex = focusedIndex;
    let delta = 0;

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') delta = -1;
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') delta = 1;
    else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') delta = -cols;
    else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') delta = cols;

    if (delta !== 0) {
      e.preventDefault();
      newIndex = focusedIndex + delta;
      if (newIndex < 0) newIndex = 0;
      if (newIndex > submitIndex) newIndex = submitIndex;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (focusedIndex === submitIndex) {
        handleSubmit();
      } else {
        handleSelect(question.options[focusedIndex].id);
      }
    }

    if (newIndex !== focusedIndex) {
      setFocusedIndex(newIndex);
    }
  }

  useEffect(() => {
    setTimeout(() => {
        if (focusedIndex === question.options.length) {
            const btn = document.querySelector('button[type="submit"]');
            btn?.focus();
        } else {
            const optBtn = document.querySelector(`button[data-opt-index="${focusedIndex}"]`);
            optBtn?.focus();
        }
    }, 10);
  }, [focusedIndex, question.options.length]);

  const selectedOption = question.options?.find((o) => o.id === selected) || null;

  return (
    <div 
      className="flex flex-col w-full animate-in slide-in-from-right-8 fade-in duration-300" 
      onKeyDown={handleKeyDown}
    >
      
      {/* Título de Pregunta */}
      <div className="bg-[var(--bg-card)] border-l-4 border-[var(--primary)] rounded-r-lg p-5 mb-4 shadow-sm transition-colors duration-300">
        <h2 className="m-0 text-xl md:text-2xl font-black text-[var(--text-main)] leading-tight text-center">
          {question.text}
        </h2>
      </div>

      {/* Grid de Opciones */}
      <div 
        className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full" 
        role="radiogroup" 
        aria-labelledby={`q-${question.id}`}
      >
        {question.options.map((opt, index) => {
          const isSelected = selected === opt.id;
          let visualState = null;
          if (checked && !isSkipped && isSelected) {
             visualState = opt.isCorrect ? 'correct' : 'incorrect';
          }

          return (
            <Option
              key={opt.id}
              text={opt.text}
              isSelected={isSelected}
              state={visualState}
              disabled={(checked || isSkipped) && mode === 'play'}
              onClick={() => {
                setFocusedIndex(index);
                handleSelect(opt.id);
              }}
              data-opt-index={index}
            />
          );
        })}
      </div>

      {/* Botón Comprobar: CAMBIO (Centrado y Texto Grande) */}
      {!checked && !isSkipped && (
        <div className="mt-4 flex justify-center">
           <Button 
             text="Comprobar Respuesta"
             onClick={handleSubmit}
             disabled={!selected}
             className={`
               w-full md:w-auto text-lg px-12 py-3 shadow-md transition-all font-black tracking-wide rounded-full
               ${!selected ? 'opacity-50 cursor-not-allowed bg-slate-400' : 'bg-[#6b46c1] hover:bg-[#5a3fb8] hover:scale-105'}
             `}
             type="submit"
           />
        </div>
      )}

      {/* Feedback Visual */}
      <div className="mt-2 min-h-[3rem]">
        {isSkipped && (
          <div className="p-3 rounded-lg font-bold text-center bg-amber-100 text-amber-800 border border-amber-200 animate-in zoom-in">
            <p>⚠️ ¡Pregunta saltada! ⚠️(0 puntos)</p>
          </div>
        )}

        {checked && !isSkipped && selectedOption && (
          <div 
            className={`
              p-4 rounded-lg font-bold text-center text-lg shadow-sm transform transition-all animate-in zoom-in
              ${selectedOption.isCorrect 
                ? 'bg-[var(--accent-success)] text-white' 
                : 'bg-[var(--accent-error)] text-white'}
            `}
          >
            {selectedOption.isCorrect 
              ? <span className="flex items-center justify-center gap-2">✨ ¡Correcto! ¡Muy bien! ✨</span>
              : <span>{mode === 'play' ? '❌ ¡Incorrecto! ❌' : '❌ ¡Incorrecto! ❌ Intenta otra vez.'}</span>
            }
          </div>
        )}
      </div>
    </div>
  );
}