import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { getFach, getKarte } from '../data/index.js'
import { getProgress, saveProgress } from '../lib/progress.js'
import { applyAnswer, checkAnswer, getAufgabe, isFocusVersion, isNumericLoesung } from '../lib/cardEngine.js'

export default function KartenView() {
  const { fachId, karteId } = useParams()
  const navigate = useNavigate()
  const fach = getFach(fachId)
  const karte = getKarte(fachId, karteId)

  const [progress] = useState(() => (karte ? getProgress(karte.id) : null))
  const [phase, setPhase] = useState('frage') // 'frage' | 'ergebnis' | 'infokarte'
  const [input, setInput] = useState('')
  const [isCorrect, setIsCorrect] = useState(null)

  if (!fach || !karte || !progress) return <Navigate to="/" replace />

  const focus = isFocusVersion(progress)
  const aufgabe = getAufgabe(karte, progress.stufe)
  const canSubmit = input.trim().length > 0

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    const correct = checkAnswer(input, aufgabe.loesung)
    const next = applyAnswer(progress, correct)
    saveProgress(karte.id, next)
    setIsCorrect(correct)
    setPhase('ergebnis')
  }

  const theme = focus
    ? {
        page: 'bg-amber-50',
        card: 'border-amber-300 bg-white',
        accent: 'text-amber-700',
        button: 'bg-amber-600 active:bg-amber-700',
        chip: 'bg-amber-200 text-amber-900',
      }
    : {
        page: 'bg-slate-50',
        card: 'border-slate-200 bg-white',
        accent: 'text-indigo-600',
        button: 'bg-indigo-600 active:bg-indigo-700',
        chip: 'bg-indigo-100 text-indigo-700',
      }

  return (
    <div className={`flex flex-1 flex-col ${theme.page}`}>
      <header className="px-5 pt-8 pb-4">
        <Link to={`/fach/${fachId}`} className={`text-sm font-medium ${theme.accent}`}>
          ← {fach.name}
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900">{karte.titel}</h1>
        </div>
        <div className="mt-2 flex gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.chip}`}>
            Stufe {progress.stufe} / 3
          </span>
          {focus && (
            <span className="rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white">
              Fokus-Modus
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pb-32">
        {phase === 'frage' && (
          <form id="antwort-form" onSubmit={handleSubmit} className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
            <p className="text-lg leading-relaxed text-slate-900">{aufgabe.frage}</p>
            <input
              autoFocus
              type="text"
              inputMode={isNumericLoesung(aufgabe.loesung) ? 'decimal' : 'text'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Deine Antwort"
              className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-3.5 text-base text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </form>
        )}

        {phase === 'ergebnis' && (
          <div className="flex flex-col gap-4">
            <div
              className={`rounded-2xl p-5 text-white shadow-sm ${
                isCorrect ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            >
              <p className="text-lg font-bold">{isCorrect ? 'Richtig!' : 'Leider falsch.'}</p>
              <p className="mt-1 text-sm opacity-90">
                Deine Antwort: {input} · Lösung: {aufgabe.loesung}
              </p>
            </div>
            <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Lösungsweg</h2>
              <p className="mt-2 leading-relaxed text-slate-900">{aufgabe.loesungsweg}</p>
            </div>
          </div>
        )}

        {phase === 'infokarte' && (
          <div className={`flex flex-col gap-4 rounded-2xl border p-5 shadow-sm ${theme.card}`}>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Kernaussage</h2>
              <p className="mt-2 leading-relaxed text-slate-900">{karte.infokarte.kernaussage}</p>
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Faustregeln</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-900">
                {karte.infokarte.faustregeln.map((regel, i) => (
                  <li key={i}>{regel}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Häufige Fehler</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-900">
                {karte.infokarte.haeufige_fehler.map((fehler, i) => (
                  <li key={i}>{fehler}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>

      <div
        className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-5 pt-3 backdrop-blur"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        {phase === 'frage' && (
          <button
            type="submit"
            form="antwort-form"
            disabled={!canSubmit}
            className={`w-full rounded-2xl py-4 text-base font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:bg-slate-300 ${theme.button}`}
          >
            Prüfen
          </button>
        )}
        {phase === 'ergebnis' && (
          <button
            type="button"
            onClick={() => setPhase('infokarte')}
            className={`w-full rounded-2xl py-4 text-base font-semibold text-white shadow-sm transition ${theme.button}`}
          >
            Weiter zur Infokarte
          </button>
        )}
        {phase === 'infokarte' && (
          <button
            type="button"
            onClick={() => navigate(`/fach/${fachId}`)}
            className={`w-full rounded-2xl py-4 text-base font-semibold text-white shadow-sm transition ${theme.button}`}
          >
            Fertig
          </button>
        )}
      </div>
    </div>
  )
}
