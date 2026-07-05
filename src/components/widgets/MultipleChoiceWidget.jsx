export default function MultipleChoiceWidget({ antwortDaten, value, onChange, theme }) {
  function toggle(i) {
    if (value.includes(i)) onChange(value.filter((v) => v !== i))
    else onChange([...value, i])
  }

  return (
    <div className="mt-5 flex flex-col gap-3">
      {antwortDaten.optionen.map((option, i) => {
        const selected = value.includes(i)
        return (
          <button
            key={i}
            type="button"
            onClick={() => toggle(i)}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-base transition ${
              selected
                ? `${theme.button} border-transparent text-white`
                : 'border-slate-300 bg-white text-slate-900 active:bg-slate-50'
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs ${
                selected ? 'border-white bg-white/20' : 'border-slate-400'
              }`}
            >
              {selected && '✓'}
            </span>
            {option}
          </button>
        )
      })}
    </div>
  )
}
