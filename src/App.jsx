import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Factory,
  Handshake,
  Layers3,
  Lock,
  RefreshCcw,
  Scale,
  Shuffle,
  Trophy,
  X
} from 'lucide-react'
import { cards, contentMeta, invalidCards } from './data'

const PROGRESS_KEY = 'tk-lernapp-progress-v2-no-freetext'
const DISABLED_KEY = 'tk-lernapp-disabled-topics-v2-no-freetext'
const ROUND_KEY = 'tk-lernapp-shuffle-rounds-v1'
const REVIEW_MS = 12 * 60 * 60 * 1000

const subjects = [
  { id: 'Finanzwirtschaft', label: 'Finanzwirtschaft', color: '#2f80ed', icon: CircleDollarSign },
  { id: 'SCM', label: 'SCM', color: '#0f9f6e', icon: Factory },
  { id: 'Personalmanagement', label: 'Personal', color: '#d97706', icon: Handshake },
  { id: 'Marketing_Verkauf', label: 'Marketing & Verkauf', color: '#e11d48', icon: Layers3 },
  { id: 'Unternehmensfuehrung', label: 'Unternehmensfuehrung', color: '#7c3aed', icon: ClipboardList },
  { id: 'Recht_VWL', label: 'Recht & VWL', color: '#0891b2', icon: Scale },
  { id: 'Problemloesung_Entscheidung', label: 'Problemloesung', color: '#4f46e5', icon: Shuffle }
]

const subjectById = Object.fromEntries(subjects.map((subject) => [subject.id, subject]))

const defaultProgress = {
  correct: 0,
  wrong: 0,
  lastAnswer: null,
  lastTimestamp: null,
  nextReview: null,
  mastered: false
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function getProgress(progress, id) {
  return { ...defaultProgress, ...(progress[id] ?? {}) }
}

function isLocked(cardProgress) {
  return Boolean(cardProgress.nextReview && cardProgress.nextReview > Date.now())
}

function formatRemaining(target) {
  const ms = Math.max(0, target - Date.now())
  const hours = Math.floor(ms / 3_600_000)
  const minutes = Math.ceil((ms % 3_600_000) / 60_000)
  if (hours <= 0) return `${minutes} Min.`
  return `${hours} Std. ${minutes} Min.`
}

function App() {
  const [view, setView] = useState({ name: 'home' })
  const [progress, setProgress] = useState(() => readStorage(PROGRESS_KEY, {}))
  const [disabled, setDisabled] = useState(() => readStorage(DISABLED_KEY, {}))
  const [roundStages, setRoundStages] = useState(() => readStorage(ROUND_KEY, {}))

  const activeCards = useMemo(() => cards.filter((card) => !disabled[card.id]), [disabled])
  const selectedSubject = view.subjectId ? subjectById[view.subjectId] : null
  const selectedCard = view.cardId ? cards.find((card) => card.id === view.cardId) : null

  function persistProgress(next) {
    setProgress(next)
    writeStorage(PROGRESS_KEY, next)
  }

  function persistDisabled(next) {
    setDisabled(next)
    writeStorage(DISABLED_KEY, next)
  }

  function persistRoundStages(next) {
    setRoundStages(next)
    writeStorage(ROUND_KEY, next)
  }

  function updateCardProgress(cardId, answer, isCorrect) {
    const current = getProgress(progress, cardId)
    const nextProgress = {
      ...current,
      correct: current.correct + (isCorrect ? 1 : 0),
      wrong: current.wrong + (isCorrect ? 0 : 1),
      mastered: isCorrect ? true : current.mastered,
      lastAnswer: answer,
      lastTimestamp: Date.now(),
      nextReview: isCorrect ? Date.now() + REVIEW_MS : null
    }
    persistProgress({ ...progress, [cardId]: nextProgress })
  }

  function toggleCard(cardId) {
    const next = { ...disabled, [cardId]: !disabled[cardId] }
    if (!next[cardId]) delete next[cardId]
    persistDisabled(next)
  }

  function startShuffle(subjectId, forcedStage) {
    const subjectCards = cardsForSubject(subjectId).filter((card) => !disabled[card.id])
    const stage = forcedStage ?? getRoundStage(subjectId, subjectCards, roundStages)
    const stageCards = subjectCards.filter((card) => (card.stufe ?? 1) === stage)
    const fallbackStage = stageCards.length ? stage : getFirstStage(subjectCards)
    const cardIds = shuffle(subjectCards.filter((card) => (card.stufe ?? 1) === fallbackStage).map((card) => card.id))

    if (cardIds.length === 0) return
    setView({ name: 'shuffle', subjectId, stage: fallbackStage, cardIds })
  }

  function startNextShuffleRound(subjectId, currentStage) {
    const subjectCards = cardsForSubject(subjectId).filter((card) => !disabled[card.id])
    const nextStage = getNextStage(subjectCards, currentStage)
    const nextRoundStages = { ...roundStages, [subjectId]: nextStage }
    persistRoundStages(nextRoundStages)
    startShuffle(subjectId, nextStage)
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        {view.name === 'home' && (
          <HomeScreen
            activeCards={activeCards}
            disabled={disabled}
            progress={progress}
            onOpenSubject={(subjectId) => setView({ name: 'subject', subjectId })}
          />
        )}
        {view.name === 'subject' && selectedSubject && (
          <SubjectScreen
            subject={selectedSubject}
            progress={progress}
            disabled={disabled}
            roundStage={getRoundStage(selectedSubject.id, cardsForSubject(selectedSubject.id).filter((card) => !disabled[card.id]), roundStages)}
            onBack={() => setView({ name: 'home' })}
            onToggle={toggleCard}
            onStartShuffle={() => startShuffle(selectedSubject.id)}
            onOpenCard={(cardId) => setView({ name: 'card', subjectId: selectedSubject.id, cardId })}
          />
        )}
        {view.name === 'card' && selectedSubject && selectedCard && (
          <CardScreen
            card={selectedCard}
            progress={getProgress(progress, selectedCard.id)}
            onBack={() => setView({ name: 'subject', subjectId: selectedSubject.id })}
            onAnswered={(answer, isCorrect) => updateCardProgress(selectedCard.id, answer, isCorrect)}
          />
        )}
        {view.name === 'shuffle' && selectedSubject && (
          <ShuffleScreen
            subject={selectedSubject}
            stage={view.stage}
            cardIds={view.cardIds}
            onBack={() => setView({ name: 'subject', subjectId: selectedSubject.id })}
            onAnswered={(cardId, answer, isCorrect) => updateCardProgress(cardId, answer, isCorrect)}
            onNextRound={() => startNextShuffleRound(selectedSubject.id, view.stage)}
          />
        )}
      </div>
    </main>
  )
}

function HomeScreen({ activeCards, disabled, progress, onOpenSubject }) {
  return (
    <section className="flex flex-1 flex-col px-4 pb-6 pt-5">
      <header className="mb-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-slate-950 text-white">
            <BookOpen size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black leading-tight tracking-normal">TK-Lernapp</h1>
            <p className="text-sm font-medium text-slate-600">Klickkarten ohne Freitext.</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700">Aktive Karten</span>
            <span className="font-black">{activeCards.length} / {cards.length}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-slate-950" style={{ width: `${(activeCards.length / cards.length) * 100}%` }} />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            {contentMeta.anzahl_karten ?? cards.length} Referenzkarten geladen
            {invalidCards.length ? `, ${invalidCards.length} uebersprungen` : ''}
          </p>
        </div>
      </header>

      <div className="space-y-3">
        {subjects.map((subject) => {
          const subjectCards = cardsForSubject(subject.id).filter((card) => !disabled[card.id])
          const mastered = subjectCards.filter((card) => getProgress(progress, card.id).mastered).length
          const Icon = subject.icon
          const total = subjectCards.length
          const percent = total ? (mastered / total) * 100 : 0

          return (
            <button
              key={subject.id}
              className="flex min-h-[74px] w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition active:scale-[0.99]"
              onClick={() => onOpenSubject(subject.id)}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-white" style={{ background: subject.color }}>
                <Icon size={23} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-black">{subject.label}</span>
                <span className="mt-1 block h-2 overflow-hidden rounded-full bg-slate-100">
                  <span className="block h-full rounded-full" style={{ width: `${percent}%`, background: subject.color }} />
                </span>
                <span className="mt-1 block text-xs font-semibold text-slate-500">
                  {mastered} von {total} gemeistert
                </span>
              </span>
              <ChevronRight className="shrink-0 text-slate-400" size={22} />
            </button>
          )
        })}
      </div>
    </section>
  )
}

function SubjectScreen({ subject, progress, disabled, roundStage, onBack, onToggle, onStartShuffle, onOpenCard }) {
  const subjectCards = cardsForSubject(subject.id)
  const activeSubjectCards = subjectCards.filter((card) => !disabled[card.id])
  const roundCards = activeSubjectCards.filter((card) => (card.stufe ?? 1) === roundStage)
  const Icon = subject.icon

  return (
    <section className="flex flex-1 flex-col px-4 pb-6 pt-4">
      <HeaderButton onBack={onBack} />
      <header className="mb-4 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-lg text-white" style={{ background: subject.color }}>
          <Icon size={26} />
        </span>
        <div>
          <h1 className="text-xl font-black leading-tight">{subject.label}</h1>
          <p className="text-sm font-semibold text-slate-600">Karten einzeln ein- oder ausschalten</p>
        </div>
      </header>

      <button
        className="mb-4 flex min-h-[56px] w-full items-center justify-between rounded-lg bg-slate-950 px-4 text-left text-white shadow-sm disabled:bg-slate-300"
        disabled={roundCards.length === 0}
        onClick={onStartShuffle}
      >
        <span>
          <span className="block text-base font-black">Shuffle-Runde starten</span>
          <span className="block text-xs font-bold text-slate-300">Stufe {roundStage} · {roundCards.length} Karten gemischt</span>
        </span>
        <Shuffle size={22} />
      </button>

      <div className="space-y-3">
        {subjectCards.map((card) => {
          const cardProgress = getProgress(progress, card.id)
          const locked = isLocked(cardProgress)
          const off = Boolean(disabled[card.id])
          const focus = cardProgress.wrong >= 3 && cardProgress.wrong > cardProgress.correct

          return (
            <article
              key={card.id}
              className={[
                'rounded-lg border bg-white p-3 shadow-sm',
                focus ? 'border-amber-400 bg-amber-50' : 'border-slate-200',
                off ? 'opacity-60' : ''
              ].join(' ')}
            >
              <div className="flex gap-3">
                <button className="min-h-[64px] min-w-0 flex-1 text-left" disabled={off} onClick={() => onOpenCard(card.id)}>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StageBadge stage={card.stufe} />
                    <TypeBadge type={card.typ} />
                    {locked && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-800">
                        <Lock size={12} /> {formatRemaining(cardProgress.nextReview)}
                      </span>
                    )}
                    {focus && <span className="rounded-full bg-amber-200 px-2 py-1 text-xs font-black text-amber-950">Fokus</span>}
                  </div>
                  <h2 className="text-base font-black leading-snug">{card.titel}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {cardProgress.correct} richtig · {cardProgress.wrong} falsch
                  </p>
                </button>
                <button
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
                  title={off ? 'Karte einschalten' : 'Karte ausschalten'}
                  onClick={() => onToggle(card.id)}
                >
                  {off ? <X size={20} /> : <Check size={20} />}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function ShuffleScreen({ subject, stage, cardIds, onBack, onAnswered, onNextRound }) {
  const [index, setIndex] = useState(0)
  const currentCard = cards.find((card) => card.id === cardIds[index])
  const [answer, setAnswer] = useState(() => initialAnswer(currentCard))
  const [result, setResult] = useState(null)
  const isLastCard = index >= cardIds.length - 1

  if (!currentCard) {
    return (
      <section className="flex flex-1 flex-col px-4 pb-6 pt-4">
        <HeaderButton onBack={onBack} />
        <div className="rounded-lg border border-slate-200 bg-white p-5 text-center shadow-lift">
          <h1 className="text-xl font-black">Runde leer</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">In dieser Stufe gibt es keine aktiven Karten.</p>
        </div>
      </section>
    )
  }

  function goNext() {
    if (isLastCard) {
      onNextRound()
      return
    }

    const nextCard = cards.find((card) => card.id === cardIds[index + 1])
    setIndex(index + 1)
    setAnswer(initialAnswer(nextCard))
    setResult(null)
  }

  return (
    <section className="flex flex-1 flex-col px-4 pb-4 pt-4">
      <HeaderButton onBack={onBack} />
      <article className="flex flex-1 flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-lift">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-950 px-2 py-1 text-xs font-black text-white">Shuffle</span>
          <StageBadge stage={stage} />
          <TypeBadge type={currentCard.typ} />
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">
            {index + 1} / {cardIds.length}
          </span>
        </div>

        <h1 className="text-xl font-black leading-tight">{subject.label}</h1>
        <p className="mt-2 text-sm font-black text-slate-500">{currentCard.titel}</p>
        <p className="mt-4 text-lg font-bold leading-snug text-slate-800">{currentCard.frage}</p>

        <div className="mt-5">
          <AnswerInput card={currentCard} value={answer} onChange={setAnswer} disabled={Boolean(result)} />
        </div>

        {result && <FeedbackPanel result={result} card={currentCard} />}

        <div className="safe-bottom mt-auto pt-5">
          {!result ? (
            <button
              className="min-h-[52px] w-full rounded-lg bg-slate-950 px-4 text-base font-black text-white shadow-sm disabled:bg-slate-300"
              disabled={!hasAnswer(currentCard, answer)}
              onClick={() => {
                const correct = checkAnswer(currentCard, answer)
                const storedAnswer = serializeAnswer(answer)
                setResult({ correct, answer: storedAnswer })
                onAnswered(currentCard.id, storedAnswer, correct)
              }}
            >
              Pruefen
            </button>
          ) : (
            <button
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-base font-black text-white shadow-sm"
              onClick={goNext}
            >
              <ChevronRight size={20} /> {isLastCard ? 'Naechste Runde' : 'Naechste Karte'}
            </button>
          )}
        </div>
      </article>
    </section>
  )
}

function CardScreen({ card, progress, onBack, onAnswered }) {
  const [answer, setAnswer] = useState(initialAnswer(card))
  const [result, setResult] = useState(null)
  const locked = isLocked(progress)

  function resetForNext() {
    setAnswer(initialAnswer(card))
    setResult(null)
  }

  if (locked && !result) {
    return (
      <section className="flex flex-1 flex-col px-4 pb-6 pt-4">
        <HeaderButton onBack={onBack} />
        <div className="mt-16 rounded-lg border border-emerald-200 bg-white p-5 text-center shadow-lift">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-lg bg-emerald-100 text-emerald-800">
            <Lock size={28} />
          </div>
          <h1 className="text-xl font-black">Wiederholung pausiert</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Diese Karte wurde korrekt geloest und ist noch {formatRemaining(progress.nextReview)} pausiert.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="flex flex-1 flex-col px-4 pb-4 pt-4">
      <HeaderButton onBack={onBack} />
      <article className="flex flex-1 flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-lift">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StageBadge stage={card.stufe} />
          <TypeBadge type={card.typ} />
        </div>

        <h1 className="text-xl font-black leading-tight">{card.titel}</h1>
        <p className="mt-4 text-lg font-bold leading-snug text-slate-800">{card.frage}</p>

        <div className="mt-5">
          <AnswerInput card={card} value={answer} onChange={setAnswer} disabled={Boolean(result)} />
        </div>

        {result && <FeedbackPanel result={result} card={card} />}

        <div className="safe-bottom mt-auto pt-5">
          {!result ? (
            <button
              className="min-h-[52px] w-full rounded-lg bg-slate-950 px-4 text-base font-black text-white shadow-sm disabled:bg-slate-300"
              disabled={!hasAnswer(card, answer)}
              onClick={() => {
                const correct = checkAnswer(card, answer)
                const storedAnswer = serializeAnswer(answer)
                setResult({ correct, answer: storedAnswer })
                onAnswered(storedAnswer, correct)
              }}
            >
              Pruefen
            </button>
          ) : (
            <button
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-base font-black text-white shadow-sm"
              onClick={resetForNext}
            >
              <RefreshCcw size={20} /> Weiter
            </button>
          )}
        </div>
      </article>
    </section>
  )
}

function HeaderButton({ onBack }) {
  return (
    <button className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-white text-slate-800 shadow-sm" onClick={onBack}>
      <ArrowLeft size={22} />
    </button>
  )
}

function StageBadge({ stage }) {
  return <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">Stufe {stage ?? 1}</span>
}

function TypeBadge({ type }) {
  const labels = {
    single_choice: 'Einfachauswahl',
    multiple_choice: 'Mehrfachauswahl',
    formel_luecke_mc: 'Formelwahl',
    reihenfolge: 'Reihenfolge',
    zuordnung: 'Zuordnung'
  }
  return <span className="rounded-full bg-slate-950 px-2 py-1 text-xs font-black text-white">{labels[type] ?? type}</span>
}

function AnswerInput({ card, value, onChange, disabled }) {
  if (card.typ === 'single_choice') {
    return <ChoiceInput data={card.antwort_daten} value={value} onChange={onChange} disabled={disabled} multiple={false} />
  }
  if (card.typ === 'multiple_choice') {
    return <ChoiceInput data={card.antwort_daten} value={value} onChange={onChange} disabled={disabled} multiple />
  }
  if (card.typ === 'formel_luecke_mc') {
    return <FormulaMcInput data={card.antwort_daten} value={value} onChange={onChange} disabled={disabled} />
  }
  if (card.typ === 'reihenfolge') {
    return <OrderInput data={card.antwort_daten} value={value} onChange={onChange} disabled={disabled} />
  }
  if (card.typ === 'zuordnung') {
    return <MatchInput data={card.antwort_daten} value={value} onChange={onChange} disabled={disabled} />
  }
  return <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800">Dieser Kartentyp wird nicht geladen.</p>
}

function ChoiceInput({ data, value, onChange, disabled, multiple }) {
  const selected = multiple ? value : [value]
  return (
    <div className="space-y-2">
      {data.optionen.map((option, index) => {
        const isSelected = selected.includes(index)
        return (
          <button
            key={`${option}-${index}`}
            className={[
              'min-h-[48px] w-full rounded-lg border px-3 py-3 text-left text-base font-bold transition',
              isSelected ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-800'
            ].join(' ')}
            disabled={disabled}
            onClick={() => {
              if (!multiple) onChange(index)
              if (multiple) onChange(isSelected ? value.filter((item) => item !== index) : [...value, index])
            }}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

function FormulaMcInput({ data, value, onChange, disabled }) {
  return (
    <div className="space-y-3">
      {data.luecken_mc.map((gap, gapIndex) => (
        <section key={`${gap.position}-${gapIndex}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h2 className="mb-2 text-sm font-black">Luecke {gap.position}</h2>
          <div className="grid gap-2">
            {gap.optionen.map((option, optionIndex) => {
              const isSelected = value[gapIndex] === optionIndex
              return (
                <button
                  key={`${option}-${optionIndex}`}
                  className={[
                    'min-h-[44px] rounded-lg border px-3 py-2 text-left text-sm font-bold',
                    isSelected ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-800'
                  ].join(' ')}
                  disabled={disabled}
                  onClick={() => onChange({ ...value, [gapIndex]: optionIndex })}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

function OrderInput({ data, value, onChange, disabled }) {
  const selected = value
  const remaining = data.items.map((_, index) => index).filter((index) => !selected.includes(index))

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <h2 className="mb-2 text-sm font-black">Gewaehlte Reihenfolge</h2>
        <div className="space-y-2">
          {selected.length === 0 && <p className="text-sm font-semibold text-slate-500">Tippe die Elemente unten in der richtigen Reihenfolge an.</p>}
          {selected.map((itemIndex, position) => (
            <button
              key={`${itemIndex}-${position}`}
              className="flex min-h-[44px] w-full items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-left"
              disabled={disabled}
              onClick={() => onChange(selected.filter((_, index) => index !== position))}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm font-black">{position + 1}</span>
              <span className="font-bold">{data.items[itemIndex]}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="grid gap-2">
        {remaining.map((itemIndex) => (
          <button
            key={itemIndex}
            className="min-h-[46px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-bold"
            disabled={disabled}
            onClick={() => onChange([...selected, itemIndex])}
          >
            {data.items[itemIndex]}
          </button>
        ))}
      </section>
    </div>
  )
}

function MatchInput({ data, value, onChange, disabled }) {
  return (
    <div className="space-y-2">
      {data.links.map((left, index) => (
        <label key={`${left}-${index}`} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3">
          <span className="text-sm font-black">{left}</span>
          <select
            className="min-h-[44px] rounded-lg border border-slate-200 bg-slate-50 px-3 text-base font-bold outline-none"
            value={value[index] ?? ''}
            disabled={disabled}
            onChange={(event) => onChange({ ...value, [index]: Number(event.target.value) })}
          >
            <option value="" disabled>Zuordnen</option>
            {data.rechts.map((right, rightIndex) => (
              <option key={`${right}-${rightIndex}`} value={rightIndex}>{right}</option>
            ))}
          </select>
        </label>
      ))}
    </div>
  )
}

function FeedbackPanel({ result, card }) {
  return (
    <section className={[
      'mt-5 rounded-lg border p-3',
      result.correct ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'
    ].join(' ')}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className={[
          'grid h-8 w-8 place-items-center rounded-lg text-white',
          result.correct ? 'bg-emerald-600' : 'bg-rose-600'
        ].join(' ')}
        >
          {result.correct ? <Check size={18} /> : <X size={18} />}
        </span>
        <h2 className="font-black">{result.correct ? 'Richtig' : 'Nochmals ueben'}</h2>
      </div>
      {result.correct && (
        <p className="mb-3 flex items-center gap-2 rounded-lg bg-white p-2 text-sm font-black text-emerald-800">
          <Trophy size={17} /> Korrekt geloest: Wiederholung pausiert 12 Stunden.
        </p>
      )}
      <p className="text-sm font-semibold leading-relaxed text-slate-800">{card.erklaerung}</p>
      {card.typ === 'formel_luecke_mc' && card.antwort_daten.formel && (
        <div className="mt-3 rounded-lg bg-white p-3">
          <h3 className="text-sm font-black">Vollstaendige Formel</h3>
          <p className="mt-1 text-base font-black text-slate-800">{card.antwort_daten.formel}</p>
        </div>
      )}
    </section>
  )
}

function cardsForSubject(subjectId) {
  return cards.filter((card) => card.fach === subjectId || (card.fach === 'IFS' && card.bezugsfach === subjectId))
}

function initialAnswer(card) {
  if (card.typ === 'multiple_choice' || card.typ === 'reihenfolge') return []
  if (card.typ === 'formel_luecke_mc' || card.typ === 'zuordnung') return {}
  return null
}

function hasAnswer(card, answer) {
  if (card.typ === 'single_choice') return Number.isInteger(answer)
  if (card.typ === 'multiple_choice') return Array.isArray(answer) && answer.length > 0
  if (card.typ === 'formel_luecke_mc') return Object.keys(answer ?? {}).length === card.antwort_daten.luecken_mc.length
  if (card.typ === 'reihenfolge') return Array.isArray(answer) && answer.length === card.antwort_daten.items.length
  if (card.typ === 'zuordnung') return Object.keys(answer ?? {}).length === card.antwort_daten.links.length
  return false
}

function checkAnswer(card, answer) {
  const data = card.antwort_daten
  if (card.typ === 'single_choice') return answer === data.richtig_index
  if (card.typ === 'multiple_choice') {
    const selected = [...answer].sort((a, b) => a - b).join(',')
    const correct = [...data.richtige_indices].sort((a, b) => a - b).join(',')
    return selected === correct
  }
  if (card.typ === 'formel_luecke_mc') {
    return data.luecken_mc.every((gap, index) => answer[index] === gap.richtig_index)
  }
  if (card.typ === 'reihenfolge') {
    return answer.join(',') === data.richtige_reihenfolge.join(',')
  }
  if (card.typ === 'zuordnung') {
    return data.richtige_paare.every(([left, right]) => answer[left] === right)
  }
  return false
}

function serializeAnswer(answer) {
  try {
    return JSON.parse(JSON.stringify(answer))
  } catch {
    return null
  }
}

function getStages(subjectCards) {
  return [...new Set(subjectCards.map((card) => card.stufe ?? 1))].sort((a, b) => a - b)
}

function getFirstStage(subjectCards) {
  return getStages(subjectCards)[0] ?? 1
}

function getRoundStage(subjectId, subjectCards, roundStages) {
  const stages = getStages(subjectCards)
  if (stages.includes(roundStages[subjectId])) return roundStages[subjectId]
  return stages[0] ?? 1
}

function getNextStage(subjectCards, currentStage) {
  const stages = getStages(subjectCards)
  const nextStage = stages.find((stage) => stage > currentStage)
  return nextStage ?? stages[0] ?? 1
}

function shuffle(items) {
  return [...items]
    .map((item) => ({ item, sort: crypto.getRandomValues(new Uint32Array(1))[0] }))
    .sort((a, b) => a.sort - b.sort)
    .map((entry) => entry.item)
}

export default App
