'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function AdminPage() {
  const [formData, setFormData] = useState({
    text: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  function handleQuestionChange(e) {
    setFormData({ ...formData, text: e.target.value });
  }

  function handleOptionChange(index, field, value) {
    const newOptions = [...formData.options];
    if (field === 'text') {
      newOptions[index].text = value;
    } else if (field === 'isCorrect') {
      newOptions[index].isCorrect = value === 'true';
    }
    setFormData({ ...formData, options: newOptions });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!formData.text.trim()) {
      setMessage('La pregunta no puede estar vacía.');
      setLoading(false);
      return;
    }

    if (formData.options.some(opt => !opt.text.trim())) {
      setMessage('Todos los campos de opciones deben tener texto.');
      setLoading(false);
      return;
    }

    if (!formData.options.some(opt => opt.isCorrect)) {
      setMessage('Al menos una opción debe ser marcada como correcta.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: formData.text,
          options: formData.options,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setMessage(`Error: ${error.error || 'No se pudo crear la pregunta.'}`);
        setLoading(false);
        return;
      }

      const result = await response.json();
      setMessage(`✓ Pregunta creada correctamente (ID: ${result.id})`);
      setFormData({
        text: '',
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
      });
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }

    setLoading(false);
  }

  return (
    <main className={styles.adminContainer}>
      <h1>Admin - Crear Pregunta</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="question">Pregunta:</label>
          <textarea
            id="question"
            value={formData.text}
            onChange={handleQuestionChange}
            placeholder="Ingresa la pregunta aquí"
            disabled={loading}
          />
        </div>

        <fieldset className={styles.optionsFieldset} disabled={loading}>
          <legend>Opciones:</legend>
          {formData.options.map((opt, idx) => (
            <div key={idx} className={styles.optionGroup}>
              <input
                type="text"
                value={opt.text}
                onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                placeholder={`Opción ${idx + 1}`}
              />
              <select
                value={opt.isCorrect ? 'true' : 'false'}
                onChange={(e) => handleOptionChange(idx, 'isCorrect', e.target.value)}
              >
                <option value="false">Incorrecta</option>
                <option value="true">Correcta</option>
              </select>
            </div>
          ))}
        </fieldset>

        <button type="submit" disabled={loading} className={styles.submitButton}>
          {loading ? 'Guardando...' : 'Crear Pregunta'}
        </button>
      </form>

      {message && <div className={styles.message}>{message}</div>}
    </main>
  );
}
