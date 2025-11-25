'use client';
import { useState } from 'react';

export default function Question({ question }) {
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);

  function handleSelect(id) {
    setSelected(id);
    setChecked(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setChecked(true);
  }

  const selectedOption = question.options?.find(o => o.id === selected);

  return (
    <form onSubmit={handleSubmit}>
      <h2>{question.text}</h2>
      <ul>
        {question.options.map(opt => (
          <li key={opt.id}>
            <label>
              <input
                type="radio"
                name="option"
                checked={selected === opt.id}
                onChange={() => handleSelect(opt.id)}
              />
              {opt.text}
            </label>
          </li>
        ))}
      </ul>
      <button type="submit" disabled={!selected}>Comprobar</button>
      {checked && selectedOption && (
        <div>
          {selectedOption.isCorrect ? <p>¡Correcto!</p> : <p>No es correcto — intenta otra vez.</p>}
        </div>
      )}
    </form>
  );
}