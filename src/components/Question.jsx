'use client';
import { useState, useRef, useEffect } from 'react';
import styles from './Question.module.css';
import solidStyles from './OptionSolid.module.css';
import buttonStyles from './Button.module.css';

export default function Question({ question, answer = {}, onAnswerChange = () => {} }) {
  const [selected, setSelected] = useState(answer.selected ?? null);
  const [checked, setChecked] = useState(answer.checked ?? false);
  const isSyncingRef = useRef(false);
  const prevAnswerRef = useRef(answer);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const buttonRefs = useRef([]);
  const submitRef = useRef(null);
  const [cols, setCols] = useState(1);

  function handleSelect(id) {
    setSelected(id);
    setChecked(false);
    onAnswerChange({ selected: id, checked: false, isCorrect: null });
  }

  // Update prev answer ref whenever answer changes
  useEffect(() => {
    prevAnswerRef.current = answer;
  }, [answer]);

  // Sync parent-provided answer to local state when it changes
  useEffect(() => {
    if (!answer) return;

    isSyncingRef.current = true;
    if (answer.selected !== undefined && answer.selected !== selected) {
      setSelected(answer.selected);
    }
    if (answer.checked !== undefined && answer.checked !== checked) {
      setChecked(!!answer.checked);
    }

    setTimeout(() => {
      isSyncingRef.current = false;
    }, 0);
  }, [answer?.selected, answer?.checked, answer?.isCorrect]);

  function handleSubmit(e) {
    e.preventDefault();
    const selectedOption = question.options?.find((o) => o.id === selected) || null;
    const isCorrect = !!selectedOption?.isCorrect;
    setChecked(true);
    onAnswerChange({ selected, checked: true, isCorrect });
    console.debug('[Question] submit result:', { selected, isCorrect });
  }

  function handleKeyDown(e) {
    const totalOptions = question.options.length;
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
        submitRef.current?.click();
      } else {
        handleSelect(question.options[focusedIndex].id);
      }
    }

    if (newIndex !== focusedIndex) {
      setFocusedIndex(newIndex);
      setTimeout(() => {
        if (newIndex === submitIndex) submitRef.current?.focus();
        else buttonRefs.current[newIndex]?.focus();
      }, 0);
    }
  }

  useEffect(() => {
    buttonRefs.current[focusedIndex]?.focus();
  }, [focusedIndex]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 720px)');
    const updateCols = () => setCols(mq.matches ? 2 : 1);
    updateCols();
    mq.addEventListener?.('change', updateCols);
    return () => mq.removeEventListener?.('change', updateCols);
  }, []);

  const selectedOption = question.options?.find((o) => o.id === selected) || null;

  useEffect(() => {
    console.debug('[Question] answer prop:', answer, 'local selected:', selected, 'checked:', checked);
  }, [answer, selected, checked]);

  return (
    <form onSubmit={handleSubmit} className={styles.form} onKeyDown={handleKeyDown}>
      <h2 className={styles.question}>{question.text}</h2>

      <div className={styles.optionsGrid} role="radiogroup" aria-labelledby={`q-${question.id}`}>
        {question.options.map((opt, index) => {
          const isSelected = selected === opt.id;
          const cls = isSelected ? `${solidStyles.optionSolid} ${solidStyles.selected}` : solidStyles.optionSolid;
          return (
            <button
              key={opt.id}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={index === focusedIndex ? 0 : -1}
              className={cls}
              onClick={() => {
                setFocusedIndex(index);
                handleSelect(opt.id);
              }}
              onKeyDown={handleKeyDown}
            >
              {opt.text}
            </button>
          );
        })}
      </div>

      <button
        ref={submitRef}
        type="submit"
        className={buttonStyles.button}
        disabled={!selected}
        tabIndex={focusedIndex === question.options.length ? 0 : -1}
      >
        Comprobar
      </button>

      {checked && selectedOption && (
        <div className={`${styles.result} ${selectedOption.isCorrect ? styles.success : styles.error}`}>
          {selectedOption.isCorrect ? <p>¡Correcto!</p> : <p>No es correcto — intenta otra vez.</p>}
        </div>
      )}
    </form>
  );
}