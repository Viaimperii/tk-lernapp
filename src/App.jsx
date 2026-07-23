import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  ArrowLeft,
  BookOpen,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDollarSign,
  Cloud,
  ClipboardList,
  Factory,
  Handshake,
  Layers3,
  Plane,
  RotateCcw,
  Scale,
  Shuffle,
  Sparkles,
  Trophy,
  Undo2,
  X
} from 'lucide-react'
import { cards, contentMeta, invalidCards, schemaVersion } from './data'
import {
  applyTopicAnswer,
  checkAnswer,
  defaultProgress,
  getLevelDueAt,
  getTopicProgress,
  hasAnswer,
  initialAnswer,
  isLevelDue,
  normalizeStage,
  pickTopicCard,
  serializeAnswer
} from './cardEngine'

const PROGRESS_KEY = 'tk-lernapp-topic-progress-v1'
const DISABLED_KEY = 'tk-lernapp-disabled-topics-v3'

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
  return getTopicProgress(progress, id, topics.find((topic) => topic.id === id))
}

function formatRemaining(target) {
  const ms = Math.max(0, target - Date.now())
  const hours = Math.floor(ms / 3_600_000)
  const minutes = Math.ceil((ms % 3_600_000) / 60_000)
  if (hours <= 0) return `${minutes} Min.`
  return `${hours} Std. ${minutes} Min.`
}

function stageLabel(stage, topic) {
  if (topic.minStage === topic.maxStage) return 'Kompakt'
  if (stage === topic.minStage) return 'Grundlage'
  if (stage === topic.maxStage) return 'Prüfungsnah'
  const position = topic.stages.indexOf(stage)
  return position > 0 ? `Vertiefung ${position}` : 'Vertiefung'
}

function App() {
  const [view, setView] = useState({ name: 'home' })
  const [progress, setProgress] = useState(() => readStorage(PROGRESS_KEY, {}))
  const [disabled, setDisabled] = useState(() => readStorage(DISABLED_KEY, {}))

  useEffect(() => {
    window.history.replaceState({ name: 'home' }, '')

    function handlePopState(event) {
      setView(event.state ?? { name: 'home' })
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigate(next) {
    window.history.pushState(next, '')
    setView(next)
  }

  function replaceView(next) {
    window.history.replaceState(next, '')
    setView(next)
  }

  function goBack() {
    window.history.back()
  }

  const activeTopics = useMemo(
    () => topics.filter((topic) => !disabled[topic.id] && getProgress(progress, topic.id).lvl === 0),
    [disabled, progress]
  )
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
    const update = applyTopicAnswer(topic, current, card, answer, isCorrect)
    persistProgress({ ...progress, [topic.id]: update.progress })
    return update.outcome
  }

  function toggleTopic(topicId) {
    const next = { ...disabled, [topicId]: !disabled[topicId] }
    if (!next[topicId]) delete next[topicId]
    persistDisabled(next)
  }

  function startShuffle(subjectId) {
    const topicIds = shuffle(
      topicsForSubject(subjectId)
        .filter((topic) => !disabled[topic.id] && getProgress(progress, topic.id).lvl === 0)
        .map((topic) => topic.id)
    )
    if (topicIds.length === 0) return
    navigate({ name: 'shuffle', subjectId, topicIds })
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        {view.name === 'home' && (
          <HomeScreen
            activeTopics={activeTopics}
            disabled={disabled}
            progress={progress}
            onOpenSubject={(subjectId) => navigate({ name: 'subject', subjectId })}
            onOpenLevels={() => navigate({ name: 'levels' })}
          />
        )}
        {view.name === 'levels' && (
          <LevelJourneyScreen
            progress={progress}
            disabled={disabled}
            onBack={goBack}
            onOpenLevel={(level) => navigate({ name: 'level', level })}
          />
        )}
        {view.name === 'level' && (
          <LevelDetailScreen
            level={view.level}
            progress={progress}
            disabled={disabled}
            onBack={goBack}
            onOpenTopic={(topic) => navigate({ name: 'topic', subjectId: topic.fach, topicId: topic.id, returnTo: 'level', level: view.level })}
          />
        )}
        {view.name === 'subject' && selectedSubject && (
          <SubjectScreen
            subject={selectedSubject}
            celebrationTopicId={view.celebrationTopicId}
            celebrationLevel={view.celebrationLevel}
            progress={progress}
            disabled={disabled}
            onBack={goBack}
            onToggle={toggleTopic}
            onStartShuffle={() => startShuffle(selectedSubject.id)}
            onOpenTopic={(topicId) => navigate({ name: 'topic', subjectId: selectedSubject.id, topicId })}
          />
        )}
        {view.name === 'topic' && selectedSubject && selectedTopic && (
          <TopicScreen
            topic={selectedTopic}
            progress={getProgress(progress, selectedTopic.id)}
            onBack={goBack}
            onAnswered={(card, answer, isCorrect) => updateTopicProgress(selectedTopic, card, answer, isCorrect)}
            onFinish={(outcome) => {
              if (view.returnTo === 'level') {
                replaceView({ name: 'level', level: view.level })
                return
              }
              replaceView({
                name: 'subject',
                subjectId: selectedTopic.fach,
                celebrationTopicId: outcome.promoted || outcome.completed ? selectedTopic.id : null,
                celebrationLevel: outcome.nextLevel
              })
            }}
          />
        )}
        {view.name === 'shuffle' && selectedSubject && (
          <ShuffleScreen
            subject={selectedSubject}
            topicIds={view.topicIds}
            progress={progress}
            onBack={goBack}
            onAnswered={(topic, card, answer, isCorrect) => updateTopicProgress(topic, card, answer, isCorrect)}
          />
        )}
      </div>
    </main>
  )
}

function HomeScreen({ activeTopics, disabled, progress, onOpenSubject, onOpenLevels }) {
  const dueCount = topics.filter((topic) => !disabled[topic.id] && isLevelDue(getProgress(progress, topic.id))).length
  const skyCount = topics.filter((topic) => !disabled[topic.id] && getProgress(progress, topic.id).lvl > 0).length

  return (
    <section className="flex flex-1 flex-col px-4 pb-6 pt-5">
      <header className="mb-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-slate-950 text-white">
            <BookOpen size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black leading-tight tracking-normal">TK-Lernapp</h1>
            <p className="text-sm font-medium text-slate-600">Vom ersten Verständnis bis zur sicheren Wiederholung.</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700">Normaler Lernbestand</span>
            <span className="font-black">{activeTopics.length} Themen</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-slate-950" style={{ width: `${((topics.length - activeTopics.length) / topics.length) * 100}%` }} />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            {contentMeta.anzahl_karten ?? cards.length} Karten in {topics.length} Themen geladen · Schema {schemaVersion}
            {invalidCards.length ? `, ${invalidCards.length} übersprungen` : ''}
          </p>
        </div>
      </header>

      <button
        className="level-sky-cta mb-4 flex min-h-[92px] w-full items-center gap-3 overflow-hidden rounded-xl px-4 text-left text-white shadow-lift"
        onClick={onOpenLevels}
      >
        <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/15">
          <Cloud className="absolute bottom-1 text-white/50" size={35} />
          <Plane className="relative -translate-y-1 rotate-[-18deg]" size={25} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-black">LVL-Himmel</span>
          <span className="mt-1 block text-xs font-bold text-sky-100">
            {dueCount
              ? `${dueCount} ${dueCount === 1 ? 'Wiederholung' : 'Wiederholungen'} fällig`
              : `${skyCount} ${skyCount === 1 ? 'Thema' : 'Themen'} im Aufstieg`}
          </span>
        </span>
        <ChevronRight size={24} />
      </button>

      <div className="space-y-3">
        {subjects.map((subject) => {
          const allSubjectTopics = topicsForSubject(subject.id).filter((topic) => !disabled[topic.id])
          const subjectTopics = allSubjectTopics.filter((topic) => getProgress(progress, topic.id).lvl === 0)
          const mastered = allSubjectTopics.length - subjectTopics.length
          const Icon = subject.icon
          const total = allSubjectTopics.length
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
                  {subjectTopics.length} offen · {mastered} im LVL-System
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

function levelTopics(level, progress, disabled) {
  return topics.filter((topic) => {
    if (disabled[topic.id]) return false
    const topicProgress = getProgress(progress, topic.id)
    if (level === 'archive') return Boolean(topicProgress.completedAt)
    return topicProgress.lvl === level && !topicProgress.completedAt
  })
}

function estimateSubjectGrade(subjectId, progress, disabled) {
  const subjectTopics = topicsForSubject(subjectId).filter((topic) => !disabled[topic.id])
  if (!subjectTopics.length) return '–'
  const levelWeights = { 1: 0.35, 2: 0.5, 3: 0.65, 4: 0.8, 5: 0.92 }
  const score = subjectTopics.reduce((sum, topic) => {
    const topicProgress = getProgress(progress, topic.id)
    if (topicProgress.completedAt) return sum + 1
    if (topicProgress.lvl > 0) return sum + levelWeights[topicProgress.lvl]
    const stageIndex = Math.max(0, topic.stages.indexOf(normalizeStage(topic, topicProgress.stage)))
    return sum + (topic.stages.length > 1 ? (stageIndex / (topic.stages.length - 1)) * 0.24 : 0.12)
  }, 0) / subjectTopics.length
  return (1 + score * 5).toFixed(1)
}

function LevelJourneyScreen({ progress, disabled, onBack, onOpenLevel }) {
  const levels = [5, 4, 3, 2, 1]
  const completed = levelTopics('archive', progress, disabled).length

  return (
    <section className="level-sky-screen flex flex-1 flex-col px-4 pb-8 pt-4">
      <HeaderButton onBack={onBack} />
      <header className="mb-5">
        <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-black text-sky-900">
          <Plane size={14} /> Deine Wiederholungsroute
        </span>
        <h1 className="text-3xl font-black leading-none tracking-tight text-slate-950">Aufstieg in den<br />LVL-Himmel</h1>
        <p className="mt-3 max-w-sm text-sm font-semibold leading-relaxed text-slate-700">
          Ein ganzes Thema steigt erst nach der fälligen Wiederholung. Fehler verändern nur die Aufgabenstufe – niemals das LVL.
        </p>
      </header>

      <div className="level-flight-path relative space-y-4 pb-2">
        {levels.map((level) => {
          const items = levelTopics(level, progress, disabled)
          const due = items.filter((topic) => isLevelDue(getProgress(progress, topic.id))).length
          const activeSubjects = subjects.filter((subject) => items.some((topic) => topic.fach === subject.id))
          return (
            <button
              key={level}
              className="level-route-card relative z-10 w-full rounded-2xl border border-white/80 bg-white/85 p-4 text-left shadow-sm backdrop-blur"
              onClick={() => onOpenLevel(level)}
            >
              <span className="absolute -left-1 top-5 grid h-10 w-10 -translate-x-1/2 place-items-center rounded-full border-4 border-sky-100 bg-slate-950 text-sm font-black text-white">
                {level}
              </span>
              <span className="flex items-start justify-between gap-3 pl-5">
                <span>
                  <span className="block text-lg font-black">LVL {level}</span>
                  <span className="mt-1 block text-xs font-bold text-slate-500">
                    {items.length ? `${items.length} ${items.length === 1 ? 'Thema' : 'Themen'} auf dieser Höhe` : 'Noch keine Themen hier'}
                  </span>
                </span>
                {due > 0 ? (
                  <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-800">{due} fällig</span>
                ) : (
                  <Cloud className="text-sky-300" size={28} />
                )}
              </span>
              {activeSubjects.length > 0 && (
                <span className="mt-3 grid grid-cols-2 gap-2 pl-5">
                  {activeSubjects.map((subject) => {
                    const Icon = subject.icon
                    return (
                      <span key={subject.id} className="flex min-h-[38px] items-center gap-2 rounded-lg bg-slate-50 px-2 text-xs font-black text-slate-700">
                        <Icon size={15} style={{ color: subject.color }} />
                        <span className="min-w-0 flex-1 truncate">{subject.label}</span>
                        <span>{estimateSubjectGrade(subject.id, progress, disabled)}</span>
                      </span>
                    )
                  })}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <button
        className="mt-4 flex min-h-[58px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-left shadow-sm"
        onClick={() => onOpenLevel('archive')}
      >
        <Archive size={22} />
        <span className="flex-1">
          <span className="block font-black">Archiv / abgeschlossen</span>
          <span className="block text-xs font-bold text-slate-500">{completed} {completed === 1 ? 'Thema' : 'Themen'} · jederzeit freiwillig übbar</span>
        </span>
        <ChevronRight size={21} className="text-slate-400" />
      </button>
    </section>
  )
}

function LevelDetailScreen({ level, progress, disabled, onBack, onOpenTopic }) {
  const [subjectId, setSubjectId] = useState(subjects[0].id)
  const items = levelTopics(level, progress, disabled)
  const visibleTopics = items.filter((topic) => topic.fach === subjectId)
  const selectedSubject = subjectById[subjectId]

  return (
    <section className={`level-world level-world-${level} flex flex-1 flex-col px-4 pb-8 pt-4`}>
      <HeaderButton onBack={onBack} />
      <header className="mb-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-900">
          {level === 'archive' ? <Archive size={14} /> : <><Sparkles size={14} /> LVL {level}</>}
        </span>
        <h1 className="mt-2 text-2xl font-black">{level === 'archive' ? 'Gemeisterte Themen' : `Themen auf LVL ${level}`}</h1>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          Freies Üben ist immer möglich. Ein Aufstieg zählt nur, wenn die Wartezeit abgelaufen ist.
        </p>
      </header>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {subjects.map((subject) => {
          const Icon = subject.icon
          const count = items.filter((topic) => topic.fach === subject.id).length
          const active = subject.id === subjectId
          return (
            <button
              key={subject.id}
              className={[
                'flex min-h-[46px] shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-black',
                active ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700'
              ].join(' ')}
              onClick={() => setSubjectId(subject.id)}
            >
              <Icon size={17} /> {subject.label} <span className={active ? 'text-white/70' : 'text-slate-400'}>{count}</span>
            </button>
          )
        })}
      </div>

      <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
        <span className="text-sm font-black">{selectedSubject.label}</span>
        <span className="rounded-full px-2.5 py-1 text-xs font-black text-white" style={{ background: selectedSubject.color }}>
          Lernstand {estimateSubjectGrade(subjectId, progress, disabled)}
        </span>
      </div>

      <div className="space-y-3">
        {visibleTopics.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
            <Cloud className="mx-auto text-sky-300" size={34} />
            <p className="mt-2 text-sm font-bold text-slate-600">In diesem Fach ist auf dieser Ebene noch kein Thema.</p>
          </div>
        )}
        {visibleTopics.map((topic) => {
          const topicProgress = getProgress(progress, topic.id)
          const dueAt = getLevelDueAt(topicProgress)
          const due = isLevelDue(topicProgress)
          return (
            <button
              key={topic.id}
              className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm"
              onClick={() => onOpenTopic(topic)}
            >
              <span className="mb-2 flex flex-wrap items-center gap-2">
                <StageBadge stage={topicProgress.stage} />
                {level !== 'archive' && (due ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-xs font-black text-rose-800">
                    <CalendarClock size={13} /> Wiederholung fällig
                  </span>
                ) : dueAt ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-1 text-xs font-black text-sky-800">
                    <CalendarClock size={13} /> in {formatRemaining(dueAt.getTime())}
                  </span>
                ) : null)}
              </span>
              <span className="block text-base font-black leading-snug">{topic.titel}</span>
              <span className="mt-1 block text-xs font-bold text-slate-500">
                {topicProgress.correct} richtig · {topicProgress.wrong} falsch · bis zu 3 Varianten je Stufe
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function SubjectScreen({ subject, progress, disabled, celebrationTopicId, celebrationLevel, onBack, onToggle, onStartShuffle, onOpenTopic }) {
  const subjectTopics = topicsForSubject(subject.id).filter((topic) => (
    getProgress(progress, topic.id).lvl === 0 || topic.id === celebrationTopicId
  ))
  const activeSubjectTopics = subjectTopics.filter((topic) => !disabled[topic.id])
  const availableTopics = activeSubjectTopics
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
          const off = Boolean(disabled[topic.id])
          const focus = topicProgress.wrong >= 8

          return (
            <article
              key={topic.id}
              className={[
                'rounded-lg border bg-white p-3 shadow-sm',
                focus ? 'border-amber-400 bg-amber-50' : 'border-slate-200',
                off ? 'opacity-60' : '',
                topic.id === celebrationTopicId ? `topic-ascend topic-ascend-${celebrationLevel ?? 1}` : ''
              ].join(' ')}
            >
              <div className="flex gap-3">
                <button className="min-h-[64px] min-w-0 flex-1 text-left" disabled={off} onClick={() => onOpenTopic(topic.id)}>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StageBadge stage={currentStage} />
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
  const [card, setCard] = useState(() => (topic ? pickTopicCard(topic, getProgress(progress, topic.id)) : null))
  const [answer, setAnswer] = useState(() => initialAnswer(card))
  const [result, setResult] = useState(null)
  const [showIntro, setShowIntro] = useState(true)
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

    const nextIndex = index + 1
    const nextTopic = topics.find((item) => item.id === topicIds[nextIndex])
    const nextProgress = nextTopic ? getProgress(progress, nextTopic.id) : defaultProgress
    const nextCard = nextTopic ? pickTopicCard(nextTopic, nextProgress) : null
    setIndex(nextIndex)
    setCard(nextCard)
    setAnswer(initialAnswer(nextCard))
    setResult(null)
    setShowIntro(true)
  }

  if (showIntro) {
    return <TopicIntroCard topic={topic} progress={getProgress(progress, topic.id)} onBack={onBack} onStart={() => setShowIntro(false)} />
  }

  return (
    <LearningCard
      eyebrow={`${subject.label} · ${index + 1} / ${topicIds.length}`}
      topic={topic}
      card={card}
      progress={getProgress(progress, topic.id)}
      result={result}
      answer={answer}
      setAnswer={setAnswer}
      onBack={onBack}
      onCheck={() => {
        const correct = checkAnswer(card, answer)
        const storedAnswer = serializeAnswer(answer)
        const outcome = onAnswered(topic, card, storedAnswer, correct)
        setResult({ correct, answer: storedAnswer, ...outcome })
      }}
      nextLabel={isLastTopic ? 'Runde beenden' : 'Nächstes Thema'}
      onNext={goNext}
    />
  )
}

function TopicScreen({ topic, progress, onBack, onAnswered, onFinish }) {
  const [card, setCard] = useState(() => pickTopicCard(topic, progress))
  const [answer, setAnswer] = useState(() => initialAnswer(card))
  const [result, setResult] = useState(null)

  const [showIntro, setShowIntro] = useState(true)

  if (showIntro) {
    return <TopicIntroCard topic={topic} progress={progress} onBack={onBack} onStart={() => setShowIntro(false)} />
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
        const outcome = onAnswered(card, storedAnswer, correct)
        setResult({ correct, answer: storedAnswer, ...outcome })
      }}
      nextLabel="Weiter"
      onNext={() => {
        if (result?.correct && (result.previousStage >= topic.maxStage || result.promoted || result.completed)) {
          onFinish(result)
          return
        }
        const nextCard = pickTopicCard(topic, progress)
        setCard(nextCard)
        setAnswer(initialAnswer(nextCard))
        setResult(null)
      }}
    />
  )
}

function LearningCard({ eyebrow, topic, card, progress, result, answer, setAnswer, onBack, onCheck, nextLabel, onNext }) {
  const currentStage = card.stufe ?? topic.minStage

  return (
    <section className="flex flex-1 flex-col px-4 pb-4 pt-4">
      <HeaderButton onBack={onBack} />
      <article className="flex flex-1 flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-lift">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-950 px-2 py-1 text-xs font-black text-white">{eyebrow}</span>
          <StageBadge stage={currentStage} />
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">{stageLabel(currentStage, topic)}</span>
          <TypeBadge type={card.typ} />
          {card.ab_lvl > 0 && (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-black text-amber-900">
              Ab LVL {card.ab_lvl}
            </span>
          )}
          {card.jahr && <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">Prüfung {card.jahr}</span>}
          {progress.solvedOnce && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-800">
              <Trophy size={12} /> Schon gelöst
            </span>
          )}
          {progress.lvl > 0 && !progress.completedAt && (
            <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-black text-sky-900">LVL {progress.lvl}</span>
          )}
        </div>

        <h1 className="text-xl font-black leading-tight">{topic.titel}</h1>
        {card.untertitel && <p className="mt-2 text-sm font-bold text-slate-500">{card.untertitel}</p>}
        <InfoBlock title="Kurz erklärt" text={taskExplanation(card)} compact />
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
    <button aria-label="Zurück" className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-white text-slate-800 shadow-sm" onClick={onBack}>
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
    lueckentext_auswahl: 'Lückentext',
    formel_builder: 'Formel bauen',
    zahlen_eingabe: 'Selbst berechnen',
    buchungssatz_builder: 'Buchungssatz',
    fallentscheidung: 'Fall entscheiden',
    reihenfolge: 'Reihenfolge',
    zuordnung: 'Zuordnung'
  }
  return <span className="rounded-full bg-slate-950 px-2 py-1 text-xs font-black text-white">{labels[type] ?? type}</span>
}

function taskExplanation(card) {
  if (card.aufgaben_hinweis) return card.aufgaben_hinweis
  const text = card.begriff_erklaerung?.kurz ?? ''
  return /Prüfungsaufgabe|Verständnisprüfung|Massnahmen geprüft|Maßnahmen geprüft/i.test(text) ? text : ''
}

function AnswerInput({ card, value, onChange, disabled }) {
  if (card.typ === 'single_choice') {
    return <ChoiceInput data={card.antwort_daten} value={value} onChange={onChange} disabled={disabled} multiple={false} />
  }
  if (card.typ === 'multiple_choice') {
    return <ChoiceInput data={card.antwort_daten} value={value} onChange={onChange} disabled={disabled} multiple />
  }
  if (card.typ === 'formel_luecke_mc' || card.typ === 'lueckentext_auswahl') {
    return <FormulaMcInput data={card.antwort_daten} value={value} onChange={onChange} disabled={disabled} />
  }
  if (card.typ === 'formel_builder') {
    return <FormulaBuilderInput data={card.antwort_daten} value={value} onChange={onChange} disabled={disabled} />
  }
  if (card.typ === 'zahlen_eingabe') {
    return <NumberInput data={card.antwort_daten} value={value} onChange={onChange} disabled={disabled} />
  }
  if (card.typ === 'buchungssatz_builder') {
    return <BookingEntryInput data={card.antwort_daten} value={value} onChange={onChange} disabled={disabled} />
  }
  if (card.typ === 'fallentscheidung') {
    return <CaseDecisionInput data={card.antwort_daten} value={value} onChange={onChange} disabled={disabled} />
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

function NumberInput({ data, value, onChange, disabled }) {
  return (
    <label className="block overflow-hidden rounded-xl border-2 border-slate-900 bg-white shadow-sm">
      <span className="flex items-center justify-between border-b-2 border-slate-900 bg-slate-50 px-3 py-2">
        <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-600">Dein Resultat</span>
        {data.rundung && <span className="text-xs font-bold text-slate-500">{data.rundung}</span>}
      </span>
      <span className="flex items-center gap-3 p-3">
        <input
          aria-label="Berechnetes Resultat"
          className="min-h-[54px] min-w-0 flex-1 border-0 bg-transparent px-1 text-3xl font-black tabular-nums text-slate-950 outline-none placeholder:text-slate-300"
          inputMode="decimal"
          placeholder="0,00"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="rounded-lg bg-slate-950 px-3 py-2 text-base font-black text-white">{data.einheit ?? ''}</span>
      </span>
    </label>
  )
}

function BookingEntryInput({ data, value, onChange, disabled }) {
  const accountOptions = data.konten ?? []
  const selectClass = 'min-h-[50px] w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-black text-slate-900 outline-none focus:border-sky-600'

  return (
    <section className="overflow-hidden rounded-xl border-2 border-slate-900 bg-white shadow-sm">
      <div className="border-b-2 border-slate-900 bg-slate-950 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
        Buchungsjournal
      </div>
      <div className="grid gap-3 p-3 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">Soll</span>
          <select className={selectClass} value={value.soll} disabled={disabled} onChange={(event) => onChange({ ...value, soll: event.target.value })}>
            <option value="">Konto wählen</option>
            {accountOptions.map((account) => <option key={account.id} value={account.id}>{account.label}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">Haben</span>
          <select className={selectClass} value={value.haben} disabled={disabled} onChange={(event) => onChange({ ...value, haben: event.target.value })}>
            <option value="">Konto wählen</option>
            {accountOptions.map((account) => <option key={account.id} value={account.id}>{account.label}</option>)}
          </select>
        </label>
      </div>
      {data.richtig?.betrag != null && (
        <label className="flex items-center gap-3 border-t border-slate-200 bg-slate-50 p-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">Betrag</span>
          <input
            aria-label="Buchungsbetrag"
            className="min-h-[48px] min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-right text-xl font-black tabular-nums outline-none focus:border-sky-600"
            inputMode="decimal"
            placeholder="0,00"
            value={value.betrag}
            disabled={disabled}
            onChange={(event) => onChange({ ...value, betrag: event.target.value })}
          />
          <span className="font-black">CHF</span>
        </label>
      )}
    </section>
  )
}

function CaseDecisionInput({ data, value, onChange, disabled }) {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <h2 className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">1 · Entscheidung</h2>
        <div className="space-y-2">
          {data.entscheidungen.map((item, index) => (
            <button
              key={`${item}-${index}`}
              className={[
                'min-h-[48px] w-full rounded-lg border px-3 py-3 text-left text-sm font-bold transition',
                value.entscheidung === index ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-800'
              ].join(' ')}
              disabled={disabled}
              onClick={() => onChange({ ...value, entscheidung: index })}
            >
              {item}
            </button>
          ))}
        </div>
      </section>
      <section className={['rounded-xl border p-3 transition', Number.isInteger(value.entscheidung) ? 'border-sky-200 bg-sky-50' : 'border-slate-200 bg-slate-50 opacity-60'].join(' ')}>
        <h2 className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">2 · Begründung</h2>
        {!Number.isInteger(value.entscheidung) && <p className="text-sm font-bold text-slate-500">Wähle zuerst eine Entscheidung.</p>}
        {Number.isInteger(value.entscheidung) && (
          <div className="space-y-2">
            {data.begruendungen.map((item, index) => (
              <button
                key={`${item}-${index}`}
                className={[
                  'min-h-[48px] w-full rounded-lg border px-3 py-3 text-left text-sm font-bold transition',
                  value.begruendung === index ? 'border-sky-800 bg-sky-800 text-white' : 'border-sky-200 bg-white text-slate-800'
                ].join(' ')}
                disabled={disabled}
                onClick={() => onChange({ ...value, begruendung: index })}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </section>
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

function FormulaBuilderInput({ data, value, onChange, disabled }) {
  const itemsById = Object.fromEntries(data.bausteine.map((item) => [item.id, item]))
  const balanceIds = new Set([
    ...(data.bilanz?.aktiven ?? []),
    ...(data.bilanz?.passiven ?? []),
    ...(data.bilanz?.erfolgsrechnung ?? [])
  ])
  const tools = data.bausteine.filter((item) => !balanceIds.has(item.id))

  function append(id) {
    if (disabled || value.sequence.length >= data.richtige_reihenfolge.length) return
    onChange({ ...value, sequence: [...value.sequence, id] })
  }

  function BalanceColumn({ title, ids }) {
    return (
      <section className="min-w-0 flex-1 p-2.5">
        <h3 className="border-b border-slate-300 pb-2 text-center text-xs font-black uppercase tracking-[0.12em] text-slate-500">{title}</h3>
        <div className="mt-2 space-y-2">
          {ids.map((id) => (
            <button
              key={id}
              className="min-h-[46px] w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-left text-sm font-black text-slate-800 shadow-sm transition active:scale-[0.98] disabled:opacity-60"
              disabled={disabled}
              onClick={() => append(id)}
            >
              {itemsById[id]?.label ?? id}
            </button>
          ))}
        </div>
        <p className="mt-3 border-t-2 border-slate-900 pt-1 text-right text-[11px] font-black uppercase tracking-widest text-slate-500">Total</p>
      </section>
    )
  }

  return (
    <div className="space-y-3">
      <section className="formula-workbench rounded-2xl border border-sky-200 bg-sky-50/70 p-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-black text-sky-950">Deine Formel</h2>
          <span className="text-xs font-bold text-sky-700">{value.sequence.length}/{data.richtige_reihenfolge.length} Bausteine</span>
        </div>
        <div className="flex min-h-[58px] flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-sky-300 bg-white p-2">
          {value.sequence.length === 0 && <span className="px-1 text-sm font-bold text-slate-400">Bilanzfelder und Zeichen antippen</span>}
          {value.sequence.map((id, index) => (
            <span key={`${id}-${index}`} className="rounded-lg bg-slate-950 px-2.5 py-2 text-sm font-black text-white">
              {itemsById[id]?.label ?? id}
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <button
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border border-sky-200 bg-white text-sm font-black text-sky-900 disabled:opacity-40"
            disabled={disabled || value.sequence.length === 0}
            onClick={() => onChange({ ...value, sequence: value.sequence.slice(0, -1) })}
          >
            <Undo2 size={16} /> Letzten zurück
          </button>
          <button
            className="grid h-11 w-11 place-items-center rounded-lg border border-sky-200 bg-white text-sky-900 disabled:opacity-40"
            aria-label="Formel leeren"
            disabled={disabled || value.sequence.length === 0}
            onClick={() => onChange({ ...value, sequence: [] })}
          >
            <RotateCcw size={17} />
          </button>
        </div>
      </section>

      {data.bilanz && (
        <section className="overflow-hidden rounded-2xl border-2 border-slate-900 bg-slate-50">
          <div className="border-b-2 border-slate-900 bg-white px-3 py-2 text-center text-sm font-black">Jahresabschluss</div>
          {(data.bilanz.aktiven?.length > 0 || data.bilanz.passiven?.length > 0) && (
            <div className="flex divide-x-2 divide-slate-900">
              <BalanceColumn title="Aktiven" ids={data.bilanz.aktiven ?? []} />
              <BalanceColumn title="Passiven" ids={data.bilanz.passiven ?? []} />
            </div>
          )}
          {data.bilanz.erfolgsrechnung?.length > 0 && (
            <div className="border-t-2 border-slate-900 bg-white p-2.5">
              <h3 className="border-b border-slate-300 pb-2 text-center text-xs font-black uppercase tracking-[0.12em] text-slate-500">Erfolgsrechnung</h3>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {data.bilanz.erfolgsrechnung.map((id) => (
                  <button
                    key={id}
                    className="min-h-[46px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-left text-sm font-black text-slate-800 shadow-sm disabled:opacity-60"
                    disabled={disabled}
                    onClick={() => append(id)}
                  >
                    {itemsById[id]?.label ?? id}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section>
        <h3 className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">Weitere Bausteine &amp; Rechenzeichen</h3>
        <div className="grid grid-cols-3 gap-2">
          {tools.map((item) => (
            <button
              key={item.id}
              className="min-h-[48px] rounded-xl border border-slate-200 bg-white px-2 text-base font-black text-slate-900 shadow-sm disabled:opacity-60"
              disabled={disabled}
              onClick={() => append(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {data.ergebnis && !data.ergebnis.automatisch && (
        <label className="block rounded-xl border border-slate-200 bg-white p-3">
          <span className="text-sm font-black">Ergebnis</span>
          <span className="mt-2 flex items-center gap-2">
            <input
              className="min-h-[48px] min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-lg font-black outline-none focus:border-sky-600"
              inputMode="decimal"
              value={value.result}
              disabled={disabled}
              onChange={(event) => onChange({ ...value, result: event.target.value })}
            />
            <span className="font-black text-slate-600">{data.ergebnis.einheit}</span>
          </span>
        </label>
      )}
    </div>
  )
}

function TopicIntroCard({ topic, progress, onBack, onStart }) {
  const introCard = topic.cards.find((card) => card.stufe === topic.minStage) ?? topic.cards[0]
  const intro = introCard?.themen_einfuehrung
    ?? introCard?.begriff_erklaerung?.kurz
    ?? `In diesem Thema lernst du die wichtigsten Grundlagen zu ${topic.titel}.`

  return (
    <section className="topic-intro-screen flex flex-1 flex-col px-4 pb-4 pt-4">
      <HeaderButton onBack={onBack} />
      <article className="topic-intro-card flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-lift">
        <div className="topic-intro-orbit" aria-hidden="true"><BookOpen size={30} /></div>
        <div className="relative mt-auto">
          <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">Bevor du startest</span>
          <h1 className="mt-4 text-3xl font-black leading-[1.05] tracking-tight">{topic.titel}</h1>
          <p className="mt-4 text-base font-semibold leading-relaxed text-slate-700">{intro}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <StageBadge stage={normalizeStage(topic, progress.stage)} />
            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-black text-sky-900">{topic.stages.length} Lernstufen</span>
          </div>
        </div>
        <button className="safe-bottom relative mt-8 min-h-[54px] w-full rounded-xl bg-slate-950 px-4 text-base font-black text-white shadow-sm" onClick={onStart}>
          Erste Aufgabe starten
        </button>
      </article>
    </section>
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
  const reusedTargets = new Set(data.richtige_paare.map(([, right]) => right)).size < data.richtige_paare.length
  const allowReuse = data.mehrfachverwendung ?? reusedTargets
  const usedTargets = new Set(Object.values(value))

  return (
    <div className="space-y-2">
      {data.links.map((left, index) => (
        <label key={`${left}-${index}`} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3">
          <span className="flex items-start gap-2 text-sm font-black">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-slate-950 text-xs text-white">{String.fromCharCode(65 + index)}</span>
            <span>{left.replace(/^[A-Z]:\s*/, '')}</span>
          </span>
          <select
            className="min-h-[44px] rounded-lg border border-slate-200 bg-slate-50 px-3 text-base font-bold outline-none"
            value={value[index] ?? ''}
            disabled={disabled}
            onChange={(event) => onChange({ ...value, [index]: Number(event.target.value) })}
          >
            <option value="" disabled>Zuordnen</option>
            {data.rechts.map((right, rightIndex) => {
              const unavailable = !allowReuse && usedTargets.has(rightIndex) && value[index] !== rightIndex
              return <option key={`${right}-${rightIndex}`} value={rightIndex} disabled={unavailable}>{rightIndex + 1}. {right}</option>
            })}
          </select>
        </label>
      ))}
      <p className="px-1 text-xs font-semibold text-slate-500">
        {allowReuse ? 'Eine Zahl darf mehrfach verwendet werden.' : 'Jede Zahl kann nur einmal zugeordnet werden.'}
      </p>
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
      {result.promoted && (
        <p className="mb-3 flex items-center gap-2 rounded-lg bg-white p-2 text-sm font-black text-emerald-800">
          <Plane size={17} /> Ganzes Thema geschafft: Aufstieg auf LVL {result.nextLevel}. Die neue Wartezeit läuft jetzt.
        </p>
      )}
      {result.completed && (
        <p className="mb-3 flex items-center gap-2 rounded-lg bg-white p-2 text-sm font-black text-emerald-800">
          <Trophy size={17} /> Letzte Wiederholung geschafft: Das Thema ist jetzt im Archiv.
        </p>
      )}
      {result.correct && !result.promoted && !result.completed && !finalStage && (
        <p className="mb-3 rounded-lg bg-white p-2 text-sm font-black text-emerald-800">
          Richtig. Dieses Thema ist jetzt für die nächste Stufe freigeschaltet.
        </p>
      )}
      {result.correct && !result.promoted && !result.completed && finalStage && (
        <p className="mb-3 rounded-lg bg-white p-2 text-sm font-black text-sky-800">
          Freiwillig richtig geübt. Das LVL bleibt gleich, bis die Wartezeit abgelaufen ist.
        </p>
      )}
      {!result.correct && (
        <p className="mb-3 rounded-lg bg-white p-2 text-sm font-black text-rose-800">
          {result.nextStage < result.previousStage
            ? `Zurück auf Stufe ${result.nextStage}. Dein LVL bleibt unverändert.`
            : 'Du bleibst auf dieser Stufe. Dein LVL bleibt unverändert.'}
        </p>
      )}
      {result.correct && finalStage && (
        <InfoBlock
          title="Zum Abschluss"
          text={card.abschlusserklaerung ?? card.erklaerung ?? card.loesungsvorschlag?.warum ?? card.merksatz}
        />
      )}
      {!result.correct && card.loesungsvorschlag?.rechenweg && <InfoBlock title="Rechenweg" text={card.loesungsvorschlag.rechenweg} />}
      {!result.correct && card.loesungsvorschlag?.warum && <InfoBlock title="Warum diese Lösung stimmt" text={card.loesungsvorschlag.warum} />}
      {!result.correct && <InfoBlock title="Erklärung" text={card.erklaerung} />}
      {!result.correct && <InfoBlock title="Merksatz" text={card.merksatz} />}
      {!result.correct && card.fehlerfallen?.length > 0 && (
        <div className="mt-3 rounded-lg bg-white p-3">
          <h3 className="text-sm font-black">Fehlerfallen</h3>
          <ul className="mt-2 space-y-1">
            {card.fehlerfallen.map((item) => (
              <li key={item} className="text-sm font-bold text-slate-700">- {item}</li>
            ))}
          </ul>
        </div>
      )}
      {!result.correct && <CorrectAnswerPanel card={card} />}
      <LegalReference reference={card.rechtsgrundlage} />
      {card.typ === 'formel_builder' && card.antwort_daten.ergebnis?.automatisch && result.correct && (
        <div className="mt-3 rounded-lg bg-white p-3">
          <h3 className="text-sm font-black">Automatisch berechnetes Resultat</h3>
          <p className="mt-1 text-xl font-black text-slate-900">
            {card.antwort_daten.ergebnis.richtiger_wert} {card.antwort_daten.ergebnis.einheit ?? ''}
          </p>
          {card.antwort_daten.ergebnis.rechenbasis && <p className="mt-1 text-xs font-semibold text-slate-500">{card.antwort_daten.ergebnis.rechenbasis}</p>}
        </div>
      )}
      {!result.correct && card.typ === 'formel_luecke_mc' && card.antwort_daten.formel && (
        <div className="mt-3 rounded-lg bg-white p-3">
          <h3 className="text-sm font-black">Vollständige Formel</h3>
          <p className="mt-1 text-base font-black text-slate-800">{card.antwort_daten.formel}</p>
        </div>
      )}
      {!result.correct && card.typ === 'formel_builder' && card.antwort_daten.formel && (
        <div className="mt-3 rounded-lg bg-white p-3">
          <h3 className="text-sm font-black">Vollständige Formel</h3>
          <p className="mt-1 text-base font-black text-slate-800">{card.antwort_daten.formel}</p>
        </div>
      )}
    </section>
  )
}

function LegalReference({ reference }) {
  if (!reference) return null
  const items = Array.isArray(reference) ? reference : [reference]

  return (
    <div className="mt-3 rounded-lg border border-cyan-200 bg-cyan-50 p-3">
      <h3 className="text-sm font-black text-cyan-950">Rechtsgrundlage</h3>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={typeof item === 'string' ? item : `${item.gesetz}-${item.artikel}`} className="text-sm font-bold text-cyan-950">
            {typeof item === 'string' ? item : `${item.gesetz} Art. ${item.artikel}${item.absatz ? ` Abs. ${item.absatz}` : ''}${item.hinweis ? ` – ${item.hinweis}` : ''}`}
          </li>
        ))}
      </ul>
    </div>
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

  if (card.typ === 'formel_luecke_mc' || card.typ === 'lueckentext_auswahl') {
    return <SolutionBox items={data.luecken_mc.map((gap) => `Lücke ${gap.position}: ${gap.richtig ?? gap.optionen[gap.richtig_index]}`)} />
  }

  if (card.typ === 'formel_builder') {
    const labels = Object.fromEntries(data.bausteine.map((item) => [item.id, item.label]))
    const formula = data.richtige_reihenfolge.map((id) => labels[id] ?? id).join(' ')
    const items = [formula]
    if (data.ergebnis) items.push(`${data.ergebnis.richtiger_wert} ${data.ergebnis.einheit ?? ''}`.trim())
    return <SolutionBox items={items} />
  }

  if (card.typ === 'zahlen_eingabe') {
    return <SolutionBox items={[`${data.richtiger_wert} ${data.einheit ?? ''}`.trim()]} />
  }

  if (card.typ === 'buchungssatz_builder') {
    const labels = Object.fromEntries(data.konten.map((account) => [account.id, account.label]))
    const entry = `${labels[data.richtig.soll]} an ${labels[data.richtig.haben]}`
    return <SolutionBox items={[data.richtig.betrag == null ? entry : `${entry}, CHF ${data.richtig.betrag}`]} />
  }

  if (card.typ === 'fallentscheidung') {
    return <SolutionBox items={[
      data.entscheidungen[data.richtig.entscheidung],
      data.begruendungen[data.richtig.begruendung]
    ]} />
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
    const topicKey = card.quelle_id || card.id
    const id = `${card.fach}::${topicKey}`
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

function shuffle(items) {
  return [...items]
    .map((item) => ({ item, sort: crypto.getRandomValues(new Uint32Array(1))[0] }))
    .sort((a, b) => a.sort - b.sort)
    .map((entry) => entry.item)
}

export default App
