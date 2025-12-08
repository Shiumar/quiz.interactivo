"use client";
import { useState } from 'react';
import { ToastProvider, useToast } from '../toast/ToastContext';
import { ConfirmProvider, useConfirm } from '../confirm/ConfirmContext';

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

  return (
    <div className="w-full">
      {/* Mensajes de Estado */}
      {status?.type === 'success' && (
        <div className="p-4 rounded-lg text-center font-medium bg-green-100 text-green-800 border border-green-200 mb-6 shadow-sm animate-in fade-in slide-in-from-top-2">
          Acción completada con éxito
        </div>
      )}
      {status?.type === 'error' && (
        <div className="p-4 rounded-lg text-center font-medium bg-red-100 text-red-800 border border-red-200 mb-6 shadow-sm animate-in fade-in slide-in-from-top-2">
          {status.message}
        </div>
      )}

      {/* Barra de Herramientas */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <button
          type="button"
          onClick={handleResequence}
          disabled={status?.type === 'pending' && status.action === 'resequence'}
          className="px-5 py-2.5 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-50 transition-all shadow-md active:scale-95 text-sm"
        >
          {status?.type === 'pending' && status.action === 'resequence' ? 'Procesando...' : 'Recompactar IDs'}
        </button>
        <span className="text-sm text-gray-500 font-medium">
          ℹ️ Reorganiza los IDs internos (1, 2, 3...) si hay saltos.
        </span>
      </div>

      {questions.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <p className="text-gray-500 font-medium">No hay preguntas registradas para este quiz.</p>
        </div>
      )}

      <div className="flex flex-col gap-6">
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
    </div>
  );
}

function QuestionEditor({ q, setStatus, status, fetchQuestions, onDeleted }) {
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
    const correctCount = opts.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      push('Debe marcar exactamente UNA opción como correcta.', { type: 'error' });
      return;
    }
    const originalCorrect = q.options.find((o) => o.isCorrect)?.id ?? null;
    const newCorrect = opts.find((o) => o.isCorrect)?.id ?? null;
    if (originalCorrect !== newCorrect) {
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
      if (!res.ok) throw new Error('Error al guardar');
      
      setStatus({ type: 'success', id: q.id });
      await fetchQuestions();
      setTimeout(() => setStatus(null), 2000);
      setEditing(false);
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
      setTimeout(() => setStatus(null), 3000);
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-gray-900 text-lg flex-1">
          {q.text} 
          <span className="inline-block ml-3 px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md font-mono">
            ID: {q.internalId}
          </span>
        </h3>
      </div>
      
      <div className="flex flex-col gap-3 mt-2">
        {/* VISTA DE LECTURA */}
        {!editing && opts.map((o) => (
          <div key={o.id} className={`flex items-center gap-3 p-3 rounded-lg border ${o.isCorrect ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
            <div className={`w-4 h-4 rounded-full flex-shrink-0 ${o.isCorrect ? 'bg-green-500 ring-2 ring-green-200' : 'bg-gray-300'}`} />
            <div className={`text-base font-medium ${o.isCorrect ? 'text-green-900' : 'text-gray-700'}`}>{o.text}</div>
            {o.isCorrect && <span className="ml-auto text-xs font-bold text-green-700 bg-green-200 px-2 py-1 rounded-full uppercase tracking-wide">Correcta</span>}
          </div>
        ))}

        {/* VISTA DE EDICIÓN */}
        {editing && (
          <div className="flex flex-col gap-6 animate-in fade-in">
            <div className="flex flex-col gap-2">
              <label className="font-bold text-gray-700 text-sm uppercase tracking-wide">Editar Pregunta</label>
              <input 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                className="p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none w-full text-gray-900 font-medium transition-all" 
              />
            </div>
            
            <div className="space-y-3">
                <label className="font-bold text-gray-700 text-sm uppercase tracking-wide">Opciones</label>
                {opts.map((o, i) => (
                    <div key={o.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center p-3 border-2 border-gray-100 rounded-lg bg-gray-50 focus-within:border-blue-300 focus-within:bg-blue-50/30 transition-colors">
                      <input 
                        className="p-2 border border-gray-300 rounded text-gray-900 w-full focus:outline-none focus:border-blue-500 bg-white" 
                        value={o.text} 
                        onChange={(e) => updateOpt(i, { text: e.target.value })} 
                      />
                      
                      <label className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-gray-200 transition-colors">
                        <input 
                          type="radio" 
                          name={`correct-${q.id}`} 
                          checked={o.isCorrect} 
                          onChange={() => setOpts((prev) => prev.map((p, idx) => ({ ...p, isCorrect: idx === i })))} 
                          className="accent-green-600 w-5 h-5 cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-gray-700">Correcta</span>
                      </label>
                      
                      <div className="text-xs text-gray-400 font-mono w-16 text-center">ID: {o.internalId ?? '-'}</div>
                      
                      <button 
                        type="button" 
                        onClick={async () => {
                          const ok = await confirm('¿Reasignar internalId de esta opción?');
                          if (!ok) return;
                          const newVal = prompt('Nuevo internalId:');
                          if (!newVal) return;
                          try {
                            await fetch(`/api/admin/options/${o.id}/reassign-internal`, { 
                              method: 'POST', 
                              headers: { 'Content-Type': 'application/json' }, 
                              body: JSON.stringify({ newInternalId: Number(newVal), confirm: true }) 
                            });
                            await fetchQuestions();
                          } catch (err) { alert(err.message); }
                        }} 
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline px-2 font-bold"
                        title="Cambiar ID interno"
                      >
                        ID ✎
                      </button>
                    </div>
                  ))}
            </div>
            
            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
              <button 
                type="button" 
                onClick={handleSave} 
                disabled={status?.type === 'pending'} 
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-sm shadow-md hover:shadow-lg transition-all"
              >
                {status?.type === 'pending' ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
              <button 
                type="button" 
                onClick={() => setEditing(false)} 
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {!editing && (
        <div className="mt-6 flex gap-3 border-t border-gray-100 pt-4 justify-end">
            <button
              type="button"
              onClick={async () => {
                 const newVal = prompt('Nuevo internalId para la pregunta:');
                 if(newVal) {
                    await fetch(`/api/admin/questions/${q.id}/reassign-internal`, { method: 'POST', body: JSON.stringify({ newInternalId: Number(newVal), confirm: true }) });
                    fetchQuestions();
                 }
              }}
              className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm font-bold hover:bg-amber-200 transition-colors"
            >
              🔢 Reasignar ID
            </button>
            
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-200 transition-colors"
            >
              ✏️ Editar
            </button>
            
            <button
              type="button"
              onClick={async () => {
                const ok = await confirm('¿Borrar esta pregunta?');
                if (!ok) return;
                try {
                  await fetch(`/api/admin/questions/${q.id}`, { method: 'DELETE' });
                  onDeleted();
                } catch (err) { alert(err.message); }
              }}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:bg-red-200 transition-colors ml-auto border border-red-200"
            >
              🗑️ Borrar
            </button>
        </div>
      )}
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