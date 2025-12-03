"use client";
import React, { useState } from 'react';
import QuizPlayer from './QuizPlayer';
import LocalQuizLoader from './LocalQuizLoader';
import btnStyles from './Button.module.css';

export default function QuizLoader({ serverQuizzes = [] }) {
  const [mode, setMode] = useState('server');
  const [selectedQuizId, setSelectedQuizId] = useState(() => (serverQuizzes && serverQuizzes[0] ? serverQuizzes[0].id : null));

  const selectedQuiz = (serverQuizzes || []).find((q) => q.id === selectedQuizId) || (serverQuizzes && serverQuizzes[0]) || null;
  const serverQuestions = selectedQuiz ? (selectedQuiz.questions || []) : [];

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <button type="button" className={btnStyles.button} onClick={() => setMode('server')} style={{ background: mode === 'server' ? '#4f46e5' : undefined }}>
          Usar preguntas del servidor
        </button>
        <button type="button" className={btnStyles.button} onClick={() => setMode('local')} style={{ background: mode === 'local' ? '#4f46e5' : undefined }}>
          Cargar preguntas desde `preguntas.json`
        </button>

        {mode === 'server' && serverQuizzes && serverQuizzes.length > 0 && (
          <select value={selectedQuizId ?? ''} onChange={(e) => setSelectedQuizId(e.target.value)} style={{ marginLeft: 8 }}>
            {serverQuizzes.map((qq) => (
              <option key={qq.id} value={qq.id}>{qq.name ? `${qq.name} (Q${qq.internalId})` : `Quiz ${qq.internalId}`}</option>
            ))}
          </select>
        )}
      </div>

      {mode === 'server' && <QuizPlayer questions={serverQuestions} />}
      {mode === 'local' && <LocalQuizLoader />}
    </div>
  );
}
