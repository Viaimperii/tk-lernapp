import { useState } from 'react'

export default function ZuordnungWidget({ antwortDaten, value, onChange, theme }) {
  const [selectedLinks, setSelectedLinks] = useState(null)
  const gepaarteLinks = new Set(value.map(([l]) => l))

  function tapLinks(i) {
    if (gepaarteLinks.has(i)) return
    setSelectedLinks(i)
  }

  function tapRechts(j) {
    if (selectedLinks === null) return
    onChange([...value, [selectedLinks, j]])
    setSelectedLinks(null)
  }

  function entfernePaar(links) {
    onChange(value.filter(([l]) => l !== links))
  }

  return (
    <div className="mt-5 flex flex-col gap-4">
      {value.length > 0 && (
        <ul className="flex flex-col gap-2">
          {value.map(([l, r]) => (
            <li key={l}>
              <button
                type="button"
                onClick={() => entfernePaar(l)}
                className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium text-white ${theme.button}`}
              >
                {antwortDaten.linke_spalte[l]} → {antwortDaten.rechte_spalte[r]} ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          {antwortDaten.linke_spalte.map(
            (text, i) =>
              !gepaarteLinks.has(i) && (
                <button
                  key={i}
                  type="button"
                  onClick={() => tapLinks(i)}
                  className={`rounded-xl border px-3 py-3 text-sm transition ${
                    selectedLinks === i
                      ? `${theme.button} border-transparent text-white`
                      : 'border-slate-300 bg-white text-slate-900 active:bg-slate-50'
                  }`}
                >
                  {text}
                </button>
              ),
          )}
        </div>
        <div className="flex flex-col gap-2">
          {antwortDaten.rechte_spalte.map((text, j) => (
            <button
              key={j}
              type="button"
              onClick={() => tapRechts(j)}
              disabled={selectedLinks === null}
              className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 disabled:opacity-40"
            >
              {text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
