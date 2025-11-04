export function Badge({ children, className = "", style = {} }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}
