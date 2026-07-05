export default function StufeBadge({ progress }) {
  if (progress.gemeistert) {
    return (
      <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        Gemeistert
      </span>
    )
  }

  return (
    <span className="shrink-0 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
      Stufe {progress.stufe}
    </span>
  )
}
