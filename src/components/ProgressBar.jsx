export default function ProgressBar({ gemeistert, total }) {
  const pct = total > 0 ? Math.round((gemeistert / total) * 100) : 0

  return (
    <div className="w-full">
      <div className="h-2.5 w-full rounded-full bg-slate-200">
        <div
          className="h-2.5 rounded-full bg-indigo-600 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-sm text-slate-500">
        {gemeistert} / {total} gemeistert
      </p>
    </div>
  )
}
