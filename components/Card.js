export function Card({ className = "", children }) {
  return (
    <div className={`rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 ${className}`}>{children}</div>
  );
}
export function CardContent({ className = "", children }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
