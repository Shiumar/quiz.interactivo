'use client';
import { useState, useEffect } from 'react';
import Question from './Question';
import styles from '../app/page.module.css';
import btnStyles from './Button.module.css';

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizPlayer({ questions = [] }) {
  const [index, setIndex] = useState(0);
  const [notice, setNotice] = useState(null);
  // store answers per question id so results persist when navigating
  const [answers, setAnswers] = useState({});

  // Do not shuffle during SSR to avoid hydration mismatches. Start with server-provided order,
  // then shuffle on the client after mount.
  const [shuffled, setShuffled] = useState(() => (questions || []).map((q) => ({ ...q, options: q.options || [] })));

  // Shuffle and initialize answers on client after mount
  useEffect(() => {
    // Only run in browser
    const qCopy = (questions || []).map((q) => ({ ...q, options: shuffleArray(q.options || []) }));
    const s = shuffleArray(qCopy);
    setShuffled(s);

    setAnswers((prev) => {
      const next = { ...prev };
      for (const q of s) {
        if (!next[q.id]) next[q.id] = { selected: null, checked: false, isCorrect: null };
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [/* run when questions prop changes */ JSON.stringify(questions.map((q) => q.id))]);

  if (!shuffled || shuffled.length === 0) return <p>No hay preguntas todavía</p>;

  const question = shuffled[index];

  const currentAnswer = answers[question.id] || { selected: null, checked: false, isCorrect: null };

  function onAnswerChangeForCurrent(payload) {
    setAnswers((prev) => ({ ...prev, [question.id]: { ...(prev[question.id] || {}), ...payload } }));
  }

  // temporary debug logging for answers map
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug('[QuizPlayer] answers:', answers);
  }, [answers]);

  function nextQuestion() {
    setIndex((i) => {
      if (i >= shuffled.length - 1) {
        setNotice('No hay más preguntas');
        setTimeout(() => setNotice(null), 1600);
        return i;
      }
      return i + 1;
    });
  }

  function prevQuestion() {
    setIndex((i) => {
      if (i <= 0) {
        setNotice('No hay más preguntas');
        setTimeout(() => setNotice(null), 1600);
        return i;
      }
      return i - 1;
    });
  }

  return (
    <div style={{ width: '100%' }}>
      <Question key={question.id} question={question} answer={currentAnswer} onAnswerChange={onAnswerChangeForCurrent} />

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem', alignItems: 'center' }}>
        {index > 0 && (
          <button type="button" className={btnStyles.button} onClick={prevQuestion}>
            Anterior pregunta
          </button>
        )}
        <button type="button" className={btnStyles.button} onClick={nextQuestion}>
          Siguiente pregunta
        </button>
        {notice && <div style={{ marginLeft: '1rem', color: '#333', fontWeight: 600 }}>{notice}</div>}
      </div>
    </div>
  );
}
