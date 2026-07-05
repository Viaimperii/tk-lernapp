export default function FormelLueckeWidget({ antwortDaten, value, onChange }) {
  const teile = antwortDaten.formel_text.split('___')

  function setLuecke(i, text) {
    const next = [...value]
    next[i] = text
    onChange(next)
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 text-lg leading-relaxed text-slate-900">
      {teile.map((teil, i) => (
        <span key={i} className="flex items-center gap-2">
          <span>{teil}</span>
          {i < teile.length - 1 && (
            <input
              type="text"
              value={value[i] ?? ''}
              onChange={(e) => setLuecke(i, e.target.value)}
              placeholder={`Lücke ${i + 1}`}
              className="w-36 rounded-lg border border-slate-300 px-2 py-1.5 text-base text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          )}
        </span>
      ))}
    </div>
  )
}
