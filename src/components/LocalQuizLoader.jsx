"use client";
import React, { useEffect, useState } from 'react';
import QuizPlayer from './QuizPlayer';

export default function LocalQuizLoader() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizName, setQuizName] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/preguntas.json');
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const json = await res.json();
        if (!mounted) return;

        if (Array.isArray(json)) {
          const mapped = json.map((q, idx) => ({
            ...q,
            id: q.id || `local-q-${idx}`,
            options: (q.options || []).map((op, j) => ({ id: op.id || `local-${idx}-o-${j}`, ...op })),
          }));
          setQuestions(mapped);
          setQuizName(null);
        } else if (json && Array.isArray(json.questions)) {
          const mapped = json.questions.map((q, idx) => ({
            ...q,
            id: q.id || `local-q-${idx}`,
            options: (q.options || []).map((op, j) => ({ id: op.id || `local-${idx}-o-${j}`, ...op })),
          }));
          setQuestions(mapped);
          setQuizName(json.quiz?.name || null);
        } else {
          throw new Error('Formato inválido');
        }
        setError(null);
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setQuestions([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div>Cargando preguntas locales...</div>;
  if (error) return <div style={{ color: '#b91c1c' }}>Error: {error}</div>;
  if (questions.length === 0) return <div>No hay preguntas en el archivo local.</div>;

  return (
    <>
      {quizName && <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>{quizName}</h3>}
      <QuizPlayer questions={questions} />
    </>
  );
}
