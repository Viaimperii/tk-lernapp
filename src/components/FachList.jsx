import { Link } from 'react-router-dom'
import { faecher } from '../data/index.js'
import { getFachProgress } from '../lib/progress.js'
import ProgressBar from './ProgressBar.jsx'

export default function FachList() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">TK-Lernapp</h1>
        <p className="mt-1 text-slate-500">Wähle ein Fach zum Üben</p>
      </header>

      <ul className="flex flex-1 flex-col gap-3 px-5 pb-8">
        {faecher.map((fach) => {
          const { gemeistert, total } = getFachProgress(fach.karten)
          return (
            <li key={fach.id}>
              <Link
                to={`/fach/${fach.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm active:scale-[0.98] active:bg-slate-50 transition"
              >
                <h2 className="text-lg font-semibold text-slate-900">{fach.name}</h2>
                <p className="mb-3 text-sm text-slate-500">{fach.karten.length} Karten</p>
                <ProgressBar gemeistert={gemeistert} total={total} />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
