import { Link, Navigate, useParams } from 'react-router-dom'
import { getFach } from '../data/index.js'
import { getProgress, getFachProgress } from '../lib/progress.js'
import { isFocusVersion } from '../lib/cardEngine.js'
import ProgressBar from './ProgressBar.jsx'
import StufeBadge from './StufeBadge.jsx'

export default function KartenList() {
  const { fachId } = useParams()
  const fach = getFach(fachId)

  if (!fach) return <Navigate to="/" replace />

  const { gemeistert, total } = getFachProgress(fach.karten)

  return (
    <div className="flex flex-1 flex-col">
      <header className="px-5 pt-8 pb-4">
        <Link to="/" className="text-sm font-medium text-indigo-600">
          ← Fächer
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{fach.name}</h1>
        <div className="mt-3">
          <ProgressBar gemeistert={gemeistert} total={total} />
        </div>
      </header>

      <ul className="flex flex-1 flex-col gap-3 px-5 pb-8">
        {fach.karten.map((karte) => {
          const progress = getProgress(karte.id)
          const focus = isFocusVersion(progress)
          return (
            <li key={karte.id}>
              <Link
                to={`/fach/${fach.id}/karte/${karte.id}`}
                className={`flex items-center justify-between gap-3 rounded-2xl border p-5 shadow-sm active:scale-[0.98] transition ${
                  focus
                    ? 'border-amber-300 bg-amber-50 active:bg-amber-100'
                    : 'border-slate-200 bg-white active:bg-slate-50'
                }`}
              >
                <span className="text-base font-medium text-slate-900">{karte.titel}</span>
                <StufeBadge progress={progress} />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
