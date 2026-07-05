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
  Scale,
  Shuffle,
  Trophy,
  X
} from 'lucide-react'
import { cards, contentMeta, invalidCards, schemaVersion } from './data'

const PROGRESS_KEY = 'tk-lernapp-topic-progress-v1'
const DISABLED_KEY = 'tk-lernapp-disabled-topics-v3'
const REVIEW_DAYS = {
  1: 1,
  2: 2,
  3: 5,
  4: 10,
  5: 20,
  6: 40
}

const subjects = [
  { id: 'Finanzwirtschaft', label: 'Finanzwirtschaft', color: '#2f80ed', icon: CircleDollarSign },
  { id: 'SCM', label: 'SCM', color: '#0f9f6e', icon: Factory },
  { id: 'Personalmanagement', label: 'Personal', color: '#d97706', icon: Handshake },
  { id: 'Marketing_Verkauf', label: 'Marketing & Verkauf', color: '#e11d48', icon: Layers3 },
  { id: 'Unternehmensfuehrung', label: 'Unternehmensführung', color: '#7c3aed', icon: ClipboardList },
  { id: 'Recht_VWL', label: 'Recht & VWL', color: '#0891b2', icon: Scale },
  { id: 'Problemloesung_Entscheidung', label: 'Problemlösung', color: '#4f46e5', icon: Shuffle },
  { id: 'Integrierte_Fallstudie', label: 'Integrierte Fallstudie', color: '#475569', icon: BookOpen }
]

const subjectById = Object.fromEntries(subjects.map((subject) => [subject.id, subject]))
const topics = buildTopics(cards)

const defaultProgress = {
  stage: 1,
  correct: 0,
  wrong: 0,
  solvedOnce: false,
  box: 1,
  richtig_in_folge: 0,
  falsch_in_folge: 0,
  lastAnswer: null,
  lastCardId: null,
  lastCorrect: null,
  lastTimestamp: null,
  nextReview: null,
  attemptsByStage: {}
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

function isLocked(topicProgress) {
  return Boolean(topicProgress.solvedOnce && topicProgress.nextReview && Date.parse(topicProgress.nextReview) > Date.now())
}

function formatRemaining(target) {
  const ms = Math.max(0, target - Date.now())
  const hours = Math.floor(ms / 3_600_000)
  const minutes = Math.ceil((ms % 3_600_000) / 60_000)
  if (hours <= 0) return `${minutes} Min.`
  return `${hours} Std. ${minutes} Min.`
}

function addDaysIso(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

function stageLabel(stage) {
  if (stage === 1) return 'Grundlage'
  if (stage === 2) return 'Anwendung / Fehlerfalle'
  return 'Prüfungsnah'
}

function App() {
  const [view, setView] = useState({ name: 'home' })
  const [progress, setProgress] = useState(() => readStorage(PROGRESS_KEY, {}))
  const [disabled, setDisabled] = useState(() => readStorage(DISABLED_KEY, {}))

  const activeTopics = useMemo(() => topics.filter((topic) => !disabled[topic.id]), [disabled])
  const selectedSubject = view.subjectId ? subjectById[view.subjectId] : null
  const selectedTopic = view.topicId ? topics.find((topic) => topic.id === view.topicId) : null

  function persistProgress(next) {
    setProgress(next)
    writeStorage(PROGRESS_KEY, next)
  }

  function persistDisabled(next) {
    setDisabled(next)
    writeStorage(DISABLED_KEY, next)
  }

  function updateTopicProgress(topic, card, answer, isCorrect) {
    const current = getProgress(progress, topic.id)
    const currentStage = normalizeStage(topic, current.stage)
    const nextBox = isCorrect ? Math.min((current.box ?? 1) + 1, 6) : 1
    const nextReview = addDaysIso(REVIEW_DAYS[nextBox])
    const now = new Date().toISOString()
    const nextAttempts = {
      ...current.attemptsByStage,
      [currentStage]: (current.attemptsByStage?.[currentStage] ?? 0) + 1
    }
    const reachedFinalStage = currentStage >= topic.maxStage
    const nextStage = isCorrect ? getNextTopicStage(topic, currentStage) : currentStage
    const nextProgress = {
      ...current,
      stage: nextStage,
      correct: current.correct + (isCorrect ? 1 : 0),
      wrong: current.wrong + (isCorrect ? 0 : 1),
      box: nextBox,
      richtig_in_folge: isCorrect ? (current.richtig_in_folge ?? 0) + 1 : 0,
      falsch_in_folge: isCorrect ? 0 : (current.falsch_in_folge ?? 0) + 1,
      solvedOnce: current.solvedOnce || (isCorrect && reachedFinalStage),
      lastAnswer: answer,
      lastCardId: card.id,
      lastCorrect: isCorrect,
      lastTimestamp: now,
      nextReview: nextReview,
      attemptsByStage: nextAttempts
    }

    persistProgress({ ...progress, [topic.id]: nextProgress })
  }

  function toggleTopic(topicId) {
    const next = { ...disabled, [topicId]: !disabled[topicId] }
    if (!next[topicId]) delete next[topicId]
    persistDisabled(next)
  }

  function startShuffle(subjectId) {
    const topicIds = shuffle(
      topicsForSubject(subjectId)
        .filter((topic) => !disabled[topic.id] && !isLocked(getProgress(progress, topic.id)))
        .map((topic) => topic.id)
    )
    if (topicIds.length === 0) return
    setView({ name: 'shuffle', subjectId, topicIds })
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        {view.name === 'home' && (
          <HomeScreen
            activeTopics={activeTopics}
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
            onBack={() => setView({ name: 'home' })}
            onToggle={toggleTopic}
            onStartShuffle={() => startShuffle(selectedSubject.id)}
            onOpenTopic={(topicId) => setView({ name: 'topic', subjectId: selectedSubject.id, topicId })}
          />
        )}
        {view.name === 'topic' && selectedSubject && selectedTopic && (
          <TopicScreen
            topic={selectedTopic}
            progress={getProgress(progress, selectedTopic.id)}
            onBack={() => setView({ name: 'subject', subjectId: selectedSubject.id })}
            onAnswered={(card, answer, isCorrect) => updateTopicProgress(selectedTopic, card, answer, isCorrect)}
          />
        )}
        {view.name === 'shuffle' && selectedSubject && (
          <ShuffleScreen
            subject={selectedSubject}
            topicIds={view.topicIds}
            progress={progress}
            onBack={() => setView({ name: 'subject', subjectId: selectedSubject.id })}
            onAnswered={(topic, card, answer, isCorrect) => updateTopicProgress(topic, card, answer, isCorrect)}
          />
        )}
      </div>
    </main>
  )
}

function HomeScreen({ activeTopics, disabled, progress, onOpenSubject }) {
  return (
    <section className="flex flex-1 flex-col px-4 pb-6 pt-5">
      <header className="mb-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-slate-950 text-white">
            <BookOpen size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black leading-tight tracking-normal">TK-Lernapp</h1>
            <p className="text-sm font-medium text-slate-600">Themenweise von Stufe 1 bis 3.</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700">Aktive Themen</span>
            <span className="font-black">{activeTopics.length} / {topics.length}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-slate-950" style={{ width: `${(activeTopics.length / topics.length) * 100}%` }} />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            {contentMeta.anzahl_karten ?? cards.length} Karten in {topics.length} Themen geladen · Schema {schemaVersion}
            {invalidCards.length ? `, ${invalidCards.length} übersprungen` : ''}
          </p>
        </div>
      </header>

      <div className="space-y-3">
        {subjects.map((subject) => {
          const subjectTopics = topicsForSubject(subject.id).filter((topic) => !disabled[topic.id])
          const mastered = subjectTopics.filter((topic) => getProgress(progress, topic.id).solvedOnce).length
          const Icon = subject.icon
          const total = subjectTopics.length
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
                  {mastered} von {total} Themen einmal gelöst
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

function SubjectScreen({ subject, progress, disabled, onBack, onToggle, onStartShuffle, onOpenTopic }) {
  const subjectTopics = topicsForSubject(subject.id)
  const activeSubjectTopics = subjectTopics.filter((topic) => !disabled[topic.id])
  const availableTopics = activeSubjectTopics.filter((topic) => !isLocked(getProgress(progress, topic.id)))
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
          <p className="text-sm font-semibold text-slate-600">Grundlage → Anwendung → prüfungsnah</p>
        </div>
      </header>

      <button
        className="mb-4 flex min-h-[56px] w-full items-center justify-between rounded-lg bg-slate-950 px-4 text-left text-white shadow-sm disabled:bg-slate-300"
        disabled={availableTopics.length === 0}
        onClick={onStartShuffle}
      >
        <span>
          <span className="block text-base font-black">Themenrunde starten</span>
          <span className="block text-xs font-bold text-slate-300">{availableTopics.length} aktive Themen gemischt</span>
        </span>
        <Shuffle size={22} />
      </button>

      <div className="space-y-3">
        {subjectTopics.map((topic) => {
          const topicProgress = getProgress(progress, topic.id)
          const currentStage = normalizeStage(topic, topicProgress.stage)
          const locked = isLocked(topicProgress)
          const off = Boolean(disabled[topic.id])
          const focus = topicProgress.wrong >= 3 && topicProgress.wrong > topicProgress.correct

          return (
            <article
              key={topic.id}
              className={[
                'rounded-lg border bg-white p-3 shadow-sm',
                focus ? 'border-amber-400 bg-amber-50' : 'border-slate-200',
                off ? 'opacity-60' : ''
              ].join(' ')}
            >
              <div className="flex gap-3">
                <button className="min-h-[64px] min-w-0 flex-1 text-left" disabled={off} onClick={() => onOpenTopic(topic.id)}>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StageBadge stage={currentStage} />
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">Box {topicProgress.box ?? 1}</span>
                    {topicProgress.solvedOnce && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-800">
                        <Trophy size={12} /> Schon gelöst
                      </span>
                    )}
                    {locked && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-1 text-xs font-black text-white">
                        <Lock size={12} /> fällig in {formatRemaining(Date.parse(topicProgress.nextReview))}
                      </span>
                    )}
                    {focus && <span className="rounded-full bg-amber-200 px-2 py-1 text-xs font-black text-amber-950">Fokus</span>}
                  </div>
                  <h2 className="text-base font-black leading-snug">{topic.titel}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {topicProgress.correct} richtig · {topicProgress.wrong} falsch · {topic.cards.length} Karten
                  </p>
                </button>
                <button
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
                  title={off ? 'Thema einschalten' : 'Thema ausschalten'}
                  onClick={() => onToggle(topic.id)}
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

function ShuffleScreen({ subject, topicIds, progress, onBack, onAnswered }) {
  const [index, setIndex] = useState(0)
  const topic = topics.find((item) => item.id === topicIds[index])
  const topicProgress = topic ? getProgress(progress, topic.id) : defaultProgress
  const card = topic ? pickTopicCard(topic, topicProgress) : null
  const [answer, setAnswer] = useState(() => initialAnswer(card))
  const [result, setResult] = useState(null)
  const isLastTopic = index >= topicIds.length - 1

  if (!topic || !card) {
    return (
      <section className="flex flex-1 flex-col px-4 pb-6 pt-4">
        <HeaderButton onBack={onBack} />
        <div className="rounded-lg border border-slate-200 bg-white p-5 text-center shadow-lift">
          <h1 className="text-xl font-black">Runde leer</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">In diesem Fach gibt es keine aktiven Themen.</p>
        </div>
      </section>
    )
  }

  function goNext() {
    if (isLastTopic) {
      onBack()
      return
    }

    const nextTopic = topics.find((item) => item.id === topicIds[index + 1])
    const nextProgress = nextTopic ? getProgress(progress, nextTopic.id) : defaultProgress
    const nextCard = nextTopic ? pickTopicCard(nextTopic, nextProgress) : null
    setIndex(index + 1)
    setAnswer(initialAnswer(nextCard))
    setResult(null)
  }

  return (
    <LearningCard
      eyebrow={`${subject.label} · ${index + 1} / ${topicIds.length}`}
      topic={topic}
      card={card}
      progress={topicProgress}
      result={result}
      answer={answer}
      setAnswer={setAnswer}
      onBack={onBack}
      onCheck={() => {
        const correct = checkAnswer(card, answer)
        const storedAnswer = serializeAnswer(answer)
        setResult({ correct, answer: storedAnswer })
        onAnswered(topic, card, storedAnswer, correct)
      }}
      nextLabel={isLastTopic ? 'Runde beenden' : 'Nächstes Thema'}
      onNext={goNext}
    />
  )
}

function TopicScreen({ topic, progress, onBack, onAnswered }) {
  const card = pickTopicCard(topic, progress)
  const [answer, setAnswer] = useState(initialAnswer(card))
  const [result, setResult] = useState(null)

  if (isLocked(progress) && !result) {
    return (
      <section className="flex flex-1 flex-col px-4 pb-6 pt-4">
        <HeaderButton onBack={onBack} />
        <div className="mt-16 rounded-lg border border-emerald-200 bg-white p-5 text-center shadow-lift">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-lg bg-emerald-100 text-emerald-800">
            <Lock size={28} />
          </div>
          <h1 className="text-xl font-black">Thema pausiert</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Dieses Thema wurde auf der höchsten Stufe korrekt gelöst und ist noch {formatRemaining(Date.parse(progress.nextReview))} gesperrt.
          </p>
          <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-800">
            <Trophy size={14} /> Schon einmal richtig gelöst
          </p>
        </div>
      </section>
    )
  }

  return (
    <LearningCard
      eyebrow="Thema"
      topic={topic}
      card={card}
      progress={progress}
      result={result}
      answer={answer}
      setAnswer={setAnswer}
      onBack={onBack}
      onCheck={() => {
        const correct = checkAnswer(card, answer)
        const storedAnswer = serializeAnswer(answer)
        setResult({ correct, answer: storedAnswer })
        onAnswered(card, storedAnswer, correct)
      }}
      nextLabel="Weiter"
      onNext={() => {
        setAnswer(initialAnswer(pickTopicCard(topic, getProgress(readStorage(PROGRESS_KEY, {}), topic.id))))
        setResult(null)
      }}
    />
  )
}

function LearningCard({ eyebrow, topic, card, progress, result, answer, setAnswer, onBack, onCheck, nextLabel, onNext }) {
  const currentStage = normalizeStage(topic, progress.stage)

  return (
    <section className="flex flex-1 flex-col px-4 pb-4 pt-4">
      <HeaderButton onBack={onBack} />
      <article className="flex flex-1 flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-lift">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-950 px-2 py-1 text-xs font-black text-white">{eyebrow}</span>
          <StageBadge stage={currentStage} />
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">{stageLabel(currentStage)}</span>
          <TypeBadge type={card.typ} />
          {progress.solvedOnce && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-800">
              <Trophy size={12} /> Schon gelöst
            </span>
          )}
        </div>

        <h1 className="text-xl font-black leading-tight">{topic.titel}</h1>
        {card.untertitel && <p className="mt-2 text-sm font-bold text-slate-500">{card.untertitel}</p>}
        <InfoBlock title="Kurz erklärt" text={card.begriff_erklaerung?.kurz} compact />
        <p className="mt-4 text-lg font-bold leading-snug text-slate-800">{card.frage}</p>

        <div className="mt-5">
          <AnswerInput card={card} value={answer} onChange={setAnswer} disabled={Boolean(result)} />
        </div>

        {result && <FeedbackPanel result={result} card={card} finalStage={currentStage >= topic.maxStage} />}

        <div className="safe-bottom mt-auto pt-5">
          {!result ? (
            <button
              className="min-h-[52px] w-full rounded-lg bg-slate-950 px-4 text-base font-black text-white shadow-sm disabled:bg-slate-300"
              disabled={!hasAnswer(card, answer)}
              onClick={onCheck}
            >
              Prüfen
            </button>
          ) : (
            <button
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-base font-black text-white shadow-sm"
              onClick={onNext}
            >
              <ChevronRight size={20} /> {nextLabel}
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
          <h2 className="mb-2 text-sm font-black">Lücke {gap.position}</h2>
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
        <h2 className="mb-2 text-sm font-black">Gewählte Reihenfolge</h2>
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

function FeedbackPanel({ result, card, finalStage }) {
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
        <h2 className="font-black">{result.correct ? 'Richtig beantwortet' : 'Falsch beantwortet'}</h2>
      </div>
      {result.correct && finalStage && (
        <p className="mb-3 flex items-center gap-2 rounded-lg bg-white p-2 text-sm font-black text-emerald-800">
          <Trophy size={17} /> Höchste Stufe korrekt gelöst: Thema ist nach Wiederholungsbox terminiert.
        </p>
      )}
      {result.correct && !finalStage && (
        <p className="mb-3 rounded-lg bg-white p-2 text-sm font-black text-emerald-800">
          Richtig. Dieses Thema ist jetzt für die nächste Stufe freigeschaltet.
        </p>
      )}
      {!result.correct && (
        <p className="mb-3 rounded-lg bg-white p-2 text-sm font-black text-rose-800">
          Die Stufe bleibt gleich. Schau dir Erklärung und korrekte Lösung an.
        </p>
      )}
      <InfoBlock title="Lösungsvorschlag" text={card.loesungsvorschlag?.kurz} />
      {card.loesungsvorschlag?.rechenweg && <InfoBlock title="Rechenweg" text={card.loesungsvorschlag.rechenweg} />}
      {card.loesungsvorschlag?.warum && <InfoBlock title="Warum" text={card.loesungsvorschlag.warum} />}
      <InfoBlock title="Kurz erklärt" text={card.begriff_erklaerung?.kurz} />
      <InfoBlock title="Prüfungsrelevant" text={card.begriff_erklaerung?.pruefungsrelevant} />
      {card.fehlerfallen?.length > 0 && (
        <div className="mt-3 rounded-lg bg-white p-3">
          <h3 className="text-sm font-black">Fehlerfallen</h3>
          <ul className="mt-2 space-y-1">
            {card.fehlerfallen.map((item) => (
              <li key={item} className="text-sm font-bold text-slate-700">- {item}</li>
            ))}
          </ul>
        </div>
      )}
      <CorrectAnswerPanel card={card} />
      {card.typ === 'formel_luecke_mc' && card.antwort_daten.formel && (
        <div className="mt-3 rounded-lg bg-white p-3">
          <h3 className="text-sm font-black">Vollständige Formel</h3>
          <p className="mt-1 text-base font-black text-slate-800">{card.antwort_daten.formel}</p>
        </div>
      )}
    </section>
  )
}

function InfoBlock({ title, text, compact = false }) {
  if (!text) return null

  return (
    <div className={compact ? 'mt-3 rounded-lg bg-slate-50 p-3' : 'mt-3 rounded-lg bg-white p-3'}>
      <h3 className="text-sm font-black">{title}</h3>
      <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-700">{text}</p>
    </div>
  )
}

function CorrectAnswerPanel({ card }) {
  const data = card.antwort_daten

  if (card.typ === 'single_choice') {
    return <SolutionBox items={[data.optionen[data.richtig_index]]} />
  }

  if (card.typ === 'multiple_choice') {
    return <SolutionBox items={data.richtige_indices.map((index) => data.optionen[index])} />
  }

  if (card.typ === 'formel_luecke_mc') {
    return <SolutionBox items={data.luecken_mc.map((gap) => `Lücke ${gap.position}: ${gap.richtig ?? gap.optionen[gap.richtig_index]}`)} />
  }

  if (card.typ === 'reihenfolge') {
    return <SolutionBox items={data.richtige_reihenfolge.map((index, position) => `${position + 1}. ${data.items[index]}`)} />
  }

  if (card.typ === 'zuordnung') {
    return <SolutionBox items={data.richtige_paare.map(([left, right]) => `${data.links[left]} → ${data.rechts[right]}`)} />
  }

  return null
}

function SolutionBox({ items }) {
  return (
    <div className="mt-3 rounded-lg bg-white p-3">
      <h3 className="text-sm font-black">Korrekte Lösung</h3>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item} className="text-sm font-bold text-slate-700">- {item}</li>
        ))}
      </ul>
    </div>
  )
}

function buildTopics(sourceCards) {
  const grouped = new Map()
  sourceCards.forEach((card) => {
    const id = card.quelle_id || card.id
    if (!grouped.has(id)) {
      grouped.set(id, {
        id,
        fach: card.fach,
        titel: card.titel,
        cards: [],
        stages: []
      })
    }
    grouped.get(id).cards.push(card)
  })

  return [...grouped.values()]
    .map((topic) => {
      const sortedCards = topic.cards.sort((a, b) => (a.stufe ?? 1) - (b.stufe ?? 1) || a.id.localeCompare(b.id))
      const stages = [...new Set(sortedCards.map((card) => card.stufe ?? 1))].sort((a, b) => a - b)
      return {
        ...topic,
        titel: sortedCards[0]?.titel ?? topic.titel,
        cards: sortedCards,
        stages,
        minStage: stages[0] ?? 1,
        maxStage: stages.at(-1) ?? 1
      }
    })
    .sort((a, b) => a.titel.localeCompare(b.titel, 'de-CH'))
}

function topicsForSubject(subjectId) {
  return topics.filter((topic) => topic.fach === subjectId)
}

function normalizeStage(topic, stage) {
  if (topic.stages.includes(stage)) return stage
  return topic.minStage
}

function getNextTopicStage(topic, currentStage) {
  const nextStage = topic.stages.find((stage) => stage > currentStage)
  return nextStage ?? currentStage
}

function pickTopicCard(topic, topicProgress) {
  const stage = normalizeStage(topic, topicProgress.stage)
  const stageCards = topic.cards.filter((card) => (card.stufe ?? 1) === stage)
  const attempts = topicProgress.attemptsByStage?.[stage] ?? 0
  return stageCards[attempts % stageCards.length] ?? topic.cards[0]
}

function initialAnswer(card) {
  if (!card) return null
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

function shuffle(items) {
  return [...items]
    .map((item) => ({ item, sort: crypto.getRandomValues(new Uint32Array(1))[0] }))
    .sort((a, b) => a.sort - b.sort)
    .map((entry) => entry.item)
}

export default App
