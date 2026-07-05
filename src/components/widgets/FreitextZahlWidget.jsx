export default function FreitextZahlWidget({ antwortDaten, value, onChange }) {
  return (
    <div className="mt-5 flex items-center gap-3">
      <input
        autoFocus
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Zahl eingeben"
        className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-base text-slate-900 focus:border-indigo-500 focus:outline-none"
      />
      {antwortDaten.einheit && (
        <span className="shrink-0 text-base font-medium text-slate-500">{antwortDaten.einheit}</span>
      )}
    </div>
  )
}
