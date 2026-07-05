export default function SingleChoiceWidget({ antwortDaten, value, onChange, theme }) {
  return (
    <div className="mt-5 flex flex-col gap-3">
      {antwortDaten.optionen.map((option, i) => {
        const selected = value === i
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={`rounded-xl border px-4 py-3.5 text-left text-base transition ${
              selected
                ? `${theme.button} border-transparent text-white`
                : 'border-slate-300 bg-white text-slate-900 active:bg-slate-50'
            }`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
