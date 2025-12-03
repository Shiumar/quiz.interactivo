"use client";
import { useState } from 'react';
import adminStyles from '../app/admin/page.module.css';
import { ToastProvider, useToast } from './toast/ToastContext';
import { ConfirmProvider, useConfirm } from './confirm/ConfirmContext';

function InnerAdminManageClient({ questions: initialQuestions = [], quizInternalId = null }) {
  const [questions, setQuestions] = useState((initialQuestions || []).slice().sort((a,b)=>a.internalId - b.internalId));
  const [status, setStatus] = useState(null);
  const { push } = useToast();
  const confirm = useConfirm();

  async function fetchQuestions() {
    try {
      const res = await fetch('/api/admin/questions');
      if (!res.ok) throw new Error('Error fetching questions');
      const data = await res.json();
      setQuestions((data || []).slice().sort((a,b)=>a.internalId - b.internalId));
    } catch (err) {
      push(err.message || String(err), { type: 'error' });
    }
  }

  async function handleResequence() {
    if (!quizInternalId) {
      push('quizInternalId no disponible', { type: 'error' });
      return;
    }
    const ok = await confirm('¿Recompactar todos los internalIds secuencialmente (1, 2, 3...)? Esta operación solo se ejecutará si se detectan gaps.');
    if (!ok) return;
    setStatus({ type: 'pending', action: 'resequence' });
    try {
      const res = await fetch('/api/admin/questions/resequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizInternalId, confirm: true }),
      });
      if (!res.ok) {
        let errMsg = 'Error al resequenciar';
        try {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const js = await res.json();
            errMsg = js?.error || JSON.stringify(js) || errMsg;
          } else {
            const t = await res.text();
            errMsg = t || errMsg;
          }
        } catch (e) {}
        throw new Error(errMsg);
      }
      const json = await res.json();
      if (json.needsResequence) {
        push('Preguntas resequenciadas exitosamente', { type: 'success' });
        await fetchQuestions();
      } else {
        push(json.message || 'Las preguntas ya estaban en orden', { type: 'info' });
      }
      setStatus({ type: 'success', action: 'resequence' });
      setTimeout(() => setStatus(null), 2000);
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
      push(err.message || String(err), { type: 'error' });
      setTimeout(() => setStatus(null), 3000);
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Borrar esta pregunta? Esta acción no se puede deshacer.')) return;
    setStatus({ type: 'pending', id });
    try {
      const res = await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error del servidor');
      // refresh list from server
      await fetchQuestions();
      setStatus({ type: 'success', id });
      push('Pregunta borrada', { type: 'success' });
      setTimeout(() => setStatus(null), 2000);
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
      push(err.message, { type: 'error' });
      setTimeout(() => setStatus(null), 3000);
    }
  }

  return (
    <div style={{ width: '100%' }}>
      {status?.type === 'success' && <div className={adminStyles.message} style={{ background: '#d4edda', color: '#155724', border: '1px solid #c3e6cb', marginBottom: '1rem' }}>Pregunta borrada</div>}
      {status?.type === 'error' && <div className={adminStyles.message} style={{ background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', marginBottom: '1rem' }}>{status.message}</div>}

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleResequence}
          disabled={status?.type === 'pending' && status.action === 'resequence'}
          style={{ padding: '0.5rem 1rem', borderRadius: 6, background: '#8b5cf6', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          {status?.type === 'pending' && status.action === 'resequence' ? 'Resequenciando...' : 'Recompactar IDs'}
        </button>
        <span style={{ fontSize: '0.9rem', color: '#666' }}>Reorganiza los internalIds secuencialmente (1, 2, 3...)</span>
      </div>

      {questions.length === 0 && <p>No hay preguntas para este quiz.</p>}

      {questions.map((q) => (
        <QuestionEditor
          key={q.id}
          q={q}
          questions={questions}
          fetchQuestions={fetchQuestions}
          onDeleted={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))}
          setStatus={setStatus}
          status={status}
        />
      ))}
    </div>
  );
}

export default function AdminManageClient(props) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <InnerAdminManageClient {...props} />
      </ConfirmProvider>
    </ToastProvider>
  );
}

function QuestionEditor({ q, questions = [], onDeleted, setStatus, status, fetchQuestions }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(q.text);
  const [opts, setOpts] = useState((q.options || []).map((o) => ({ id: o.id, text: o.text, isCorrect: !!o.isCorrect, internalId: o.internalId })));
  const { push } = useToast();
  const confirm = useConfirm();

  function updateOpt(index, patch) {
    setOpts((prev) => {
      const next = prev.slice();
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  async function handleSave() {
    // validate exactly one correct option
    const correctCount = opts.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      // use toast if available, otherwise alert
      try { push('Debe marcar exactamente UNA opción como correcta.', { type: 'error' }); } catch (e) { alert('Debe marcar exactamente UNA opción como correcta.'); }
      return;
    }
    // confirm if correct answer changed
    const originalCorrect = q.options.find((o) => o.isCorrect)?.id ?? null;
    const newCorrect = opts.find((o) => o.isCorrect)?.id ?? null;
    if (originalCorrect !== newCorrect) {
      // use modal confirm
      const userOk = await confirm('Está cambiando la respuesta correcta. ¿Desea continuar?');
      if (!userOk) return;
    }

    setStatus({ type: 'pending', id: q.id });
    try {
      const res = await fetch(`/api/admin/questions/${q.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, options: opts }),
      });
      if (!res.ok) {
        // try to show server-provided error message (JSON or plain text)
        let errMsg = 'Error al guardar';
        try {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const js = await res.json();
            errMsg = js?.error || JSON.stringify(js) || errMsg;
          } else {
            const t = await res.text();
            errMsg = t || errMsg;
          }
        } catch (e) {}
        throw new Error(errMsg);
      }
      const json = await res.json();
      setStatus({ type: 'success', id: q.id });
      try { window.dispatchEvent(new CustomEvent('quiz:question-updated', { detail: { id: q.id } })); } catch (e) {}
      await fetchQuestions();
      setTimeout(() => setStatus(null), 2000);
      setEditing(false);
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
      setTimeout(() => setStatus(null), 3000);
    }
  }

  return (
    <fieldset className={adminStyles.optionsFieldset} style={{ padding: '1rem', marginBottom: '1rem' }}>
      <legend style={{ fontWeight: 700 }}>{q.text} <span style={{ fontWeight: 400, marginLeft: 8, fontSize: '0.9rem' }}>(`internalId`: {q.internalId})</span></legend>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {!editing && opts.map((o) => (
          <div key={o.id} className={adminStyles.optionGroup} style={{ alignItems: 'center' }}>
            <div style={{ fontSize: '0.95rem', color: '#000' }}>{o.text}{o.isCorrect ? ' (Correcta)' : ''}</div>
          </div>
        ))}

        {editing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 600, color: '#000' }}>Texto de la pregunta</label>
            <input value={text} onChange={(e) => setText(e.target.value)} style={{ padding: '0.5rem', borderRadius: 6, color: '#000' }} />
            <div style={{ marginTop: '0.5rem' }}>
                {opts.map((o, i) => (
                    <div key={o.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input style={{ flex: 1, padding: '0.4rem', color: '#000' }} value={o.text} onChange={(e) => updateOpt(i, { text: e.target.value })} />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#000' }}>
                        <input type="radio" name={`correct-${q.id}`} checked={o.isCorrect} onChange={() => setOpts((prev) => prev.map((p, idx) => ({ ...p, isCorrect: idx === i })))} />
                        <span style={{ fontSize: '0.9rem' }}>Correcta</span>
                      </label>
                      <div style={{ minWidth: 90, fontSize: '0.85rem', color: '#111' }}>ID: {o.internalId ?? '(n/a)'}</div>
                      <button type="button" onClick={async () => {
                        const ok = await confirm('¿Reasignar internalId de esta opción? Se mostrará el valor original.');
                        if (!ok) return;
                        const newVal = prompt('Nuevo internalId (entero)');
                        if (!newVal) return;
                        try {
                          const res = await fetch(`/api/admin/options/${o.id}/reassign-internal`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newInternalId: Number(newVal), confirm: true }) });
                          if (!res.ok) {
                            let errMsg = 'Error al reasignar internalId';
                            try {
                              const ct = res.headers.get('content-type') || '';
                              if (ct.includes('application/json')) {
                                const js = await res.json();
                                errMsg = js?.error || JSON.stringify(js) || errMsg;
                              } else {
                                const t = await res.text();
                                errMsg = t || errMsg;
                              }
                            } catch (e) {}
                            throw new Error(errMsg);
                          }
                          push('internalId reasignado', { type: 'success' });
                          await fetchQuestions?.();
                        } catch (err) {
                          push(err.message || String(err), { type: 'error' });
                        }
                      }} style={{ marginLeft: 6 }}>Reasignar ID</button>
                    </div>
                  ))}
              <div style={{ marginTop: '0.5rem' }}>
                <button type="button" onClick={handleSave} style={{ marginRight: '0.5rem', padding: '0.5rem 0.8rem', borderRadius: 6, background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer' }} disabled={status?.type === 'pending'}>
                  {status?.type === 'pending' ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" onClick={() => setEditing(false)} style={{ padding: '0.5rem 0.8rem', borderRadius: 6 }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
        {!editing && (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              style={{ background: '#4f46e5', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              Editar
            </button>
            <button type="button" onClick={async () => {
              const ok = await confirm('¿Reasignar internalId de la pregunta? Se mostrará el valor original.');
              if (!ok) return;
              const newVal = prompt('Nuevo internalId (entero)');
              if (!newVal) return;
              try {
                const res = await fetch(`/api/admin/questions/${q.id}/reassign-internal`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newInternalId: Number(newVal), confirm: true }) });
                if (!res.ok) {
                  let errMsg = 'Error al reasignar internalId';
                  try {
                    const ct = res.headers.get('content-type') || '';
                    if (ct.includes('application/json')) {
                      const js = await res.json();
                      errMsg = js?.error || JSON.stringify(js) || errMsg;
                    } else {
                      const t = await res.text();
                      errMsg = t || errMsg;
                    }
                  } catch (e) {}
                  throw new Error(errMsg);
                }
                push('internalId de pregunta reasignado', { type: 'success' });
                await fetchQuestions?.();
              } catch (err) {
                push(err.message || String(err), { type: 'error' });
              }
            }} style={{ background: '#f59e0b', color: '#000', padding: '0.5rem 1rem', border: 'none', borderRadius: 6, cursor: 'pointer', marginLeft: 6 }}>Reasignar ID</button>
            <button
              type="button"
              onClick={async () => {
                const ok = await confirm('¿Borrar esta pregunta? Esta acción no se puede deshacer.');
                if (!ok) return;
                setStatus({ type: 'pending', id: q.id });
                try {
                  const res = await fetch(`/api/admin/questions/${q.id}`, { method: 'DELETE' });
                  if (!res.ok) throw new Error('Error del servidor');
                  setStatus({ type: 'success', id: q.id });
                  onDeleted();
                  push('Pregunta borrada', { type: 'success' });
                  setTimeout(() => setStatus(null), 2000);
                } catch (err) {
                  setStatus({ type: 'error', message: err.message });
                  push(err.message, { type: 'error' });
                  setTimeout(() => setStatus(null), 3000);
                }
              }}
              style={{ background: '#ff4d4f', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: 6, cursor: 'pointer' }}
              disabled={status?.type === 'pending' && status.id === q.id}
            >
              {status?.type === 'pending' && status.id === q.id ? 'Borrando...' : 'Borrar pregunta'}
            </button>
          </>
        )}
      </div>
    </fieldset>
  );
}
