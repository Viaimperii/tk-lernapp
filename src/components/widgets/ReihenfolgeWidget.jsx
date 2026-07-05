export default function ReihenfolgeWidget({ antwortDaten, value, onChange }) {
  function move(pos, dir) {
    const target = pos + dir
    if (target < 0 || target >= value.length) return
    const next = [...value]
    ;[next[pos], next[target]] = [next[target], next[pos]]
    onChange(next)
  }

  return (
    <ol className="mt-5 flex flex-col gap-2">
      {value.map((elementIndex, pos) => (
        <li
          key={elementIndex}
          className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold">
            {pos + 1}
          </span>
          <span className="flex-1 text-base">{antwortDaten.elemente[elementIndex]}</span>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => move(pos, -1)}
              disabled={pos === 0}
              aria-label="Nach oben"
              className="rounded-md border border-slate-300 px-2 py-0.5 text-sm disabled:opacity-30"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => move(pos, 1)}
              disabled={pos === value.length - 1}
              aria-label="Nach unten"
              className="rounded-md border border-slate-300 px-2 py-0.5 text-sm disabled:opacity-30"
            >
              ▼
            </button>
          </div>
        </li>
      ))}
    </ol>
  )
}
