'use client';
import { useState, useEffect, useRef } from 'react';

export default function AdminPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  
  // Estado para Crear Pregunta
  const [formData, setFormData] = useState({
    text: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  });

  // Estado para Crear Nuevo Quiz
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [creatingQuiz, setCreatingQuiz] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Estado para Importación
  const fileInputRef = useRef(null);
  const [importStatus, setImportStatus] = useState('');

  // Cargar Quizzes
  const loadQuizzes = async () => {
    try {
      const res = await fetch('/api/quiz');
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
        if (data.length > 0 && !selectedQuizId) {
           const defaultQuiz = data.find(q => q.internalId === 1) || data[0];
           setSelectedQuizId(defaultQuiz.internalId); 
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadQuizzes(); }, []);

  // --- 1. CREAR NUEVO QUIZ ---
  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!newQuizTitle.trim()) return;
    
    setCreatingQuiz(true);
    setMessage('');
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newQuizTitle })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setMessage(`✓ Quiz "${data.quiz.title}" creado.`);
      setNewQuizTitle('');
      await loadQuizzes(); // Recargar lista
      setSelectedQuizId(data.quiz.internalId); // Auto-seleccionar el nuevo
      
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setCreatingQuiz(false);
    }
  };

  // --- 2. IMPORTAR JSON ---
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setImportStatus('Verificando...');
    setMessage('');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        setImportStatus('Subiendo...');
        
        const res = await fetch('/api/quiz/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json)
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error);

        alert(`¡Éxito! ${result.message}`);
        setImportStatus('');
        loadQuizzes(); 
      } catch (err) {
        alert('Error: ' + err.message);
        setImportStatus('');
      } finally {
        setLoading(false);
        event.target.value = ''; 
      }
    };
    reader.readAsText(file);
  };

  // --- 3. CREAR PREGUNTA ---
  function handleQuestionChange(e) {
    setFormData({ ...formData, text: e.target.value });
  }

  function handleOptionChange(index, field, value) {
    const newOptions = [...formData.options];
    if (field === 'text') newOptions[index].text = value;
    else if (field === 'isCorrect') newOptions[index].isCorrect = value === 'true';
    setFormData({ ...formData, options: newOptions });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!formData.text.trim()) { setMessage('Falta la pregunta.'); setLoading(false); return; }
    if (formData.options.some(o => !o.text.trim())) { setMessage('Faltan opciones.'); setLoading(false); return; }
    if (!formData.options.some(o => o.isCorrect)) { setMessage('Marca una correcta.'); setLoading(false); return; }
    if (!selectedQuizId) { setMessage('Selecciona un Quiz.'); setLoading(false); return; }

    try {
      const response = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: formData.text,
          options: formData.options,
          quizId: selectedQuizId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
        setLoading(false);
        return;
      }

      const result = await response.json();
      setMessage(`✓ Pregunta agregada a "${result.quizTitle}"`);
      
      setFormData({
        text: '',
        options: [
          { text: '', isCorrect: false }, { text: '', isCorrect: false },
          { text: '', isCorrect: false }, { text: '', isCorrect: false },
        ],
      });
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
    setLoading(false);
  }

  const isErrorMessage = message.startsWith('Error') || message.startsWith('Falta') || message.startsWith('Marca') || message.startsWith('Debes');

  return (
    <div className="min-h-[calc(100vh-80px)] p-4 flex justify-center bg-[var(--bg-main)] transition-colors duration-300">
      <main className="w-full max-w-5xl my-8 p-8 bg-[var(--bg-card)] rounded-3xl shadow-xl border border-[var(--border)] transition-colors duration-300">
        
        <h1 className="text-3xl font-black text-center text-[var(--text-main)] mb-8 tracking-tight">
          Panel de Administración
        </h1>

        {/* 1. SECCIÓN DE GESTIÓN DE QUIZZES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          
          {/* A. Crear Nuevo Quiz */}
          <div className="p-6 bg-[var(--secondary)]/50 rounded-2xl border border-[var(--border)]">
            <h3 className="text-lg font-bold text-[var(--text-main)] mb-4">Crear Nuevo Quiz</h3>
            <form onSubmit={handleCreateQuiz} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Título del nuevo quiz..." 
                value={newQuizTitle}
                onChange={(e) => setNewQuizTitle(e.target.value)}
                className="flex-1 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] focus:border-[var(--primary)] outline-none"
              />
              <button 
                type="submit"
                disabled={creatingQuiz || !newQuizTitle.trim()}
                className="px-4 py-2 bg-[var(--primary)] text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
              >
                {creatingQuiz ? '...' : 'Crear'}
              </button>
            </form>
          </div>

          {/* B. Importar JSON */}
          <div className="p-6 bg-[var(--secondary)]/50 rounded-2xl border-2 border-dashed border-[var(--border)] flex flex-col justify-center items-center text-center">
            <h3 className="text-lg font-bold text-[var(--text-main)] mb-1">Importar desde JSON</h3>
            <p className="text-xs text-[var(--text-muted)] mb-3">Sube un archivo .json con preguntas</p>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" style={{ display: 'none' }} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="px-6 py-2 bg-[var(--text-main)] text-[var(--bg-card)] font-bold rounded-xl hover:opacity-90 transition-all shadow-sm active:scale-95 text-sm"
            >
              {importStatus || '📂 Subir Archivo'}
            </button>
          </div>
        </div>
        
        <hr className="border-[var(--border)] mb-10" />

        {/* 2. CREAR PREGUNTA */}
        <h2 className="text-2xl font-bold text-[var(--text-main)] mb-6">Agregar Pregunta a Quiz</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          <div className="flex flex-col gap-2">
            <label className="font-bold text-[var(--text-muted)] text-xs uppercase tracking-wider">Seleccionar Quiz Destino</label>
            <div className="relative">
              <select
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                disabled={loading}
                className="w-full p-3 rounded-xl border-2 border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-main)] focus:border-[var(--primary)] outline-none transition-all font-medium appearance-none cursor-pointer"
              >
                {quizzes.length === 0 && <option value="">Cargando quizzes...</option>}
                {quizzes.map(q => (
                  <option key={q.id} value={q.internalId}>
                    {q.title} (ID: {q.internalId})
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">▼</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-[var(--text-muted)] text-xs uppercase tracking-wider">Pregunta</label>
            <textarea
              value={formData.text}
              onChange={handleQuestionChange}
              placeholder="Escribe la pregunta..."
              disabled={loading}
              className="w-full p-4 rounded-xl border-2 border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-main)] focus:border-[var(--primary)] outline-none transition-all font-medium min-h-[100px] resize-y"
            />
          </div>

          <fieldset className="border-2 border-[var(--border)] rounded-2xl p-6 flex flex-col gap-4 bg-[var(--primary-light)]/20 transition-colors" disabled={loading}>
            <legend className="font-bold text-[var(--text-main)] px-3 text-sm uppercase tracking-wide">Opciones</legend>
            {formData.options.map((opt, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                  placeholder={`Opción ${idx + 1}`}
                  className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] focus:border-[var(--primary)] outline-none transition-all"
                />
                <select
                  value={opt.isCorrect ? 'true' : 'false'}
                  onChange={(e) => handleOptionChange(idx, 'isCorrect', e.target.value)}
                  className={`p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] outline-none cursor-pointer font-medium appearance-none sm:w-40 text-center ${opt.isCorrect ? 'text-[var(--accent-success)] border-[var(--accent-success)] ring-1 ring-[var(--accent-success)] font-bold' : 'text-[var(--text-muted)]'}`}
                >
                  <option value="false">❌ Incorrecta</option>
                  <option value="true">✅ Correcta</option>
                </select>
              </div>
            ))}
          </fieldset>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-[var(--primary)] text-white font-bold text-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-all shadow-md mt-2"
          >
            {loading ? 'Guardando...' : '💾 Guardar Pregunta'}
          </button>
        </form>

        {message && (
          <div className={`mt-8 p-4 rounded-xl text-center font-bold border-2 ${isErrorMessage ? 'bg-[var(--accent-error)]/10 text-[var(--accent-error)] border-[var(--accent-error)]/20' : 'bg-[var(--accent-success)]/10 text-[var(--accent-success)] border-[var(--accent-success)]/20'}`}>
            {message}
          </div>
        )}
      </main>
    </div>
  );
}