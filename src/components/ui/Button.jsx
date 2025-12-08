export default function Button({ text, onClick, disabled, className = "", type = "button", style = {} }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={`
        inline-block px-6 py-3 text-base font-bold text-center text-white
        bg-[var(--primary)] border-2 border-transparent rounded-lg cursor-pointer
        transition-all duration-150 ease-in-out transform
        hover:-translate-y-0.5 hover:brightness-110
        focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2
        disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
        ${className}
      `}
    >
      {text}
    </button>
  );
}