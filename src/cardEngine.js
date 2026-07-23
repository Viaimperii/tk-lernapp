const HOUR_MS = 60 * 60 * 1000

export const LEVEL_DELAYS = {
  1: 4 * HOUR_MS,
  2: 6 * HOUR_MS,
  3: 8 * HOUR_MS,
  4: 12 * HOUR_MS,
  5: 24 * HOUR_MS
}

export const MAX_VARIANTS_PER_STAGE = 3

export const defaultProgress = {
  stage: 1,
  correct: 0,
  wrong: 0,
  solvedOnce: false,
  lvl: 0,
  zeitpunkt_letzter_aufstieg: null,
  completedAt: null,
  richtig_in_folge: 0,
  falsch_in_folge: 0,
  lastAnswer: null,
  lastCardId: null,
  lastCorrect: null,
  lastTimestamp: null,
  nextReview: null,
  attemptsByStage: {}
}

export function getTopicProgress(progress, id, topic) {
  const stored = progress[id] ?? {}
  const migratedLevel = stored.lvl ?? (stored.solvedOnce ? 1 : 0)
  const promotedAt = stored.zeitpunkt_letzter_aufstieg
    ?? (migratedLevel > 0 ? stored.lastTimestamp ?? '1970-01-01T00:00:00.000Z' : null)
  const nextReview = stored.lvl == null && migratedLevel > 0 && promotedAt
    ? getLevelDueAt({ lvl: migratedLevel, zeitpunkt_letzter_aufstieg: promotedAt })?.toISOString()
    : stored.nextReview ?? null
  const merged = {
    ...defaultProgress,
    ...stored,
    lvl: migratedLevel,
    solvedOnce: stored.solvedOnce || migratedLevel > 0,
    zeitpunkt_letzter_aufstieg: promotedAt,
    nextReview
  }

  if (topic) merged.stage = normalizeStage(topic, merged.stage)
  return merged
}

export function normalizeStage(topic, stage) {
  if (topic.stages.includes(stage)) return stage
  return topic.minStage
}

export function getNextTopicStage(topic, currentStage) {
  return topic.stages.find((stage) => stage > currentStage) ?? currentStage
}

export function getPreviousTopicStage(topic, currentStage) {
  return [...topic.stages].reverse().find((stage) => stage < currentStage) ?? currentStage
}

export function pickTopicCard(topic, topicProgress) {
  const stage = normalizeStage(topic, topicProgress.stage)
  const unlockedCards = topic.cards
    .filter((card) => (card.stufe ?? 1) === stage)
    .filter((card) => (card.ab_lvl ?? 0) <= (topicProgress.lvl ?? 0))
  const highestUnlockedLevel = Math.max(0, ...unlockedCards.map((card) => card.ab_lvl ?? 0))
  const stageCards = unlockedCards
    .filter((card) => (card.ab_lvl ?? 0) === highestUnlockedLevel)
    .slice(0, MAX_VARIANTS_PER_STAGE)
  const attempts = topicProgress.attemptsByStage?.[stage] ?? 0
  return stageCards[attempts % stageCards.length] ?? topic.cards[0]
}

export function initialAnswer(card) {
  if (!card) return null
  if (card.typ === 'multiple_choice' || card.typ === 'reihenfolge') return []
  if (card.typ === 'formel_luecke_mc' || card.typ === 'zuordnung') return {}
  if (card.typ === 'formel_builder') return { sequence: [], result: '' }
  if (card.typ === 'zahlen_eingabe') return ''
  if (card.typ === 'buchungssatz_builder') return { soll: '', haben: '', betrag: '' }
  if (card.typ === 'fallentscheidung') return { entscheidung: null, begruendung: null }
  return null
}

export function hasAnswer(card, answer) {
  if (card.typ === 'single_choice') return Number.isInteger(answer)
  if (card.typ === 'multiple_choice') return Array.isArray(answer) && answer.length > 0
  if (card.typ === 'formel_luecke_mc') return Object.keys(answer ?? {}).length === card.antwort_daten.luecken_mc.length
  if (card.typ === 'reihenfolge') return Array.isArray(answer) && answer.length === card.antwort_daten.items.length
  if (card.typ === 'zuordnung') return Object.keys(answer ?? {}).length === card.antwort_daten.links.length
  if (card.typ === 'formel_builder') {
    const formulaComplete = answer?.sequence?.length === card.antwort_daten.richtige_reihenfolge.length
    const resultComplete = card.antwort_daten.ergebnis == null
      || card.antwort_daten.ergebnis.automatisch
      || String(answer?.result ?? '').trim() !== ''
    return formulaComplete && resultComplete
  }
  if (card.typ === 'zahlen_eingabe') return Number.isFinite(normalizeNumber(answer))
  if (card.typ === 'buchungssatz_builder') {
    const amountRequired = card.antwort_daten.richtig?.betrag != null
    return Boolean(answer?.soll && answer?.haben)
      && (!amountRequired || Number.isFinite(normalizeNumber(answer?.betrag)))
  }
  if (card.typ === 'fallentscheidung') {
    return Number.isInteger(answer?.entscheidung) && Number.isInteger(answer?.begruendung)
  }
  return false
}

function normalizeNumber(value) {
  if (typeof value === 'number') return value
  const normalized = String(value ?? '').trim().replace(/'/g, '').replace(',', '.')
  return normalized === '' ? Number.NaN : Number(normalized)
}

export function checkAnswer(card, answer) {
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
  if (card.typ === 'formel_builder') {
    const formulaCorrect = answer.sequence.join('|') === data.richtige_reihenfolge.join('|')
    if (!formulaCorrect) return false
    if (data.ergebnis == null || data.ergebnis.automatisch) return true
    const submitted = normalizeNumber(answer.result)
    const expected = normalizeNumber(data.ergebnis.richtiger_wert)
    return Number.isFinite(submitted)
      && Math.abs(submitted - expected) <= (data.ergebnis.toleranz ?? 0)
  }
  if (card.typ === 'zahlen_eingabe') {
    const submitted = normalizeNumber(answer)
    const expected = normalizeNumber(data.richtiger_wert)
    return Number.isFinite(submitted)
      && Math.abs(submitted - expected) <= (data.toleranz ?? 0)
  }
  if (card.typ === 'buchungssatz_builder') {
    const accountsCorrect = answer.soll === data.richtig.soll && answer.haben === data.richtig.haben
    if (!accountsCorrect) return false
    if (data.richtig.betrag == null) return true
    const submitted = normalizeNumber(answer.betrag)
    return Number.isFinite(submitted)
      && Math.abs(submitted - data.richtig.betrag) <= (data.toleranz ?? 0)
  }
  if (card.typ === 'fallentscheidung') {
    return answer.entscheidung === data.richtig.entscheidung
      && answer.begruendung === data.richtig.begruendung
  }
  if (card.typ === 'reihenfolge') {
    return answer.join(',') === data.richtige_reihenfolge.join(',')
  }
  if (card.typ === 'zuordnung') {
    return data.richtige_paare.every(([left, right]) => answer[left] === right)
  }
  return false
}

export function serializeAnswer(answer) {
  try {
    return JSON.parse(JSON.stringify(answer))
  } catch {
    return null
  }
}

export function getLevelDueAt(topicProgress) {
  if (!topicProgress?.lvl || topicProgress.completedAt || !topicProgress.zeitpunkt_letzter_aufstieg) return null
  const promotedAt = Date.parse(topicProgress.zeitpunkt_letzter_aufstieg)
  if (!Number.isFinite(promotedAt)) return null
  return new Date(promotedAt + LEVEL_DELAYS[topicProgress.lvl])
}

export function isLevelDue(topicProgress, now = Date.now()) {
  const dueAt = getLevelDueAt(topicProgress)
  return Boolean(dueAt && dueAt.getTime() <= now)
}

export function applyTopicAnswer(topic, current, card, answer, isCorrect, nowValue = Date.now()) {
  const now = new Date(nowValue).toISOString()
  const currentStage = normalizeStage(topic, current.stage)
  const finalStage = currentStage >= topic.maxStage
  const wasDue = isLevelDue(current, nowValue)
  const firstMastery = isCorrect && finalStage && current.lvl === 0
  const reviewMastery = isCorrect && finalStage && current.lvl > 0 && wasDue
  const nextAttempts = {
    ...current.attemptsByStage,
    [currentStage]: (current.attemptsByStage?.[currentStage] ?? 0) + 1
  }

  let nextLevel = current.lvl
  let completedAt = current.completedAt
  let promotedAt = current.zeitpunkt_letzter_aufstieg

  if (firstMastery) {
    nextLevel = 1
    promotedAt = now
  } else if (reviewMastery && current.lvl < 5) {
    nextLevel = current.lvl + 1
    promotedAt = now
  } else if (reviewMastery && current.lvl === 5) {
    completedAt = now
  }

  const promoted = nextLevel > current.lvl
  const completed = !current.completedAt && Boolean(completedAt)
  const nextReview = promoted
    ? new Date(nowValue + LEVEL_DELAYS[nextLevel]).toISOString()
    : current.nextReview

  return {
    progress: {
      ...current,
      stage: isCorrect
        ? getNextTopicStage(topic, currentStage)
        : getPreviousTopicStage(topic, currentStage),
      correct: current.correct + (isCorrect ? 1 : 0),
      wrong: current.wrong + (isCorrect ? 0 : 1),
      richtig_in_folge: isCorrect ? (current.richtig_in_folge ?? 0) + 1 : 0,
      falsch_in_folge: isCorrect ? 0 : (current.falsch_in_folge ?? 0) + 1,
      solvedOnce: current.solvedOnce || firstMastery,
      lvl: nextLevel,
      zeitpunkt_letzter_aufstieg: promotedAt,
      completedAt,
      lastAnswer: answer,
      lastCardId: card.id,
      lastCorrect: isCorrect,
      lastTimestamp: now,
      nextReview,
      attemptsByStage: nextAttempts
    },
    outcome: {
      previousStage: currentStage,
      nextStage: isCorrect ? getNextTopicStage(topic, currentStage) : getPreviousTopicStage(topic, currentStage),
      previousLevel: current.lvl,
      nextLevel,
      promoted,
      completed,
      wasDue,
      firstMastery
    }
  }
}
