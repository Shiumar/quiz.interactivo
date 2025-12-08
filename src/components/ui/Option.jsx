export default function Option({ text, isSelected, state, onClick, disabled, ...props }) {

  // Base classes con borde y foco dinámico
  let baseClasses = "w-full text-center p-4 mb-3 rounded-xl font-bold border-2 transition-all duration-200 transform outline-none focus:ring-4 focus:ring-offset-2 focus:ring-[var(--primary)]/20";
  
  // Estado Normal: Fondo tarjeta, texto principal, borde sutil
  let colorClasses = "bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-main)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:-translate-y-0.5 hover:shadow-md";

  // Seleccionado: Color primario (Morado/Naranja/Indigo según tema)
  if (isSelected) {
    colorClasses = "bg-[var(--primary)] border-[var(--primary)] text-white shadow-lg scale-[1.02]";
  }

  // Resultados
  if (state === 'correct') {
    colorClasses = "bg-[var(--success)] border-[var(--success)] text-white shadow-md";
  } else if (state === 'incorrect') {
    colorClasses = "bg-[var(--error)] border-[var(--error)] text-white shadow-md";
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${colorClasses} ${disabled ? 'cursor-default transform-none opacity-90' : ''}`}
      {...props}
    >
      {text}
    </button>
  );
}