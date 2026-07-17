import assert from 'node:assert/strict'
import test from 'node:test'
import {
  LEVEL_DELAYS,
  applyTopicAnswer,
  checkAnswer,
  defaultProgress,
  getLevelDueAt,
  pickTopicCard
} from './cardEngine.js'

const topic = {
  id: 'Finanzwirtschaft::test',
  stages: [1, 2, 3],
  minStage: 1,
  maxStage: 3,
  cards: [
    { id: 's1-a', stufe: 1 },
    { id: 's2-a', stufe: 2 },
    { id: 's3-a', stufe: 3 },
    { id: 's3-b', stufe: 3 },
    { id: 's3-c', stufe: 3 },
    { id: 's3-d', stufe: 3 }
  ]
}

function progress(overrides = {}) {
  return { ...defaultProgress, ...overrides, attemptsByStage: overrides.attemptsByStage ?? {} }
}

test('erste vollständige Themenlösung steigt auf LVL 1 und startet drei Tage Wartezeit', () => {
  const now = Date.UTC(2026, 6, 16, 8)
  const update = applyTopicAnswer(topic, progress({ stage: 3 }), topic.cards[2], null, true, now)

  assert.equal(update.progress.lvl, 1)
  assert.equal(update.outcome.promoted, true)
  assert.equal(Date.parse(update.progress.nextReview) - now, LEVEL_DELAYS[1])
})

test('falsche Antwort senkt nur die Aufgabenstufe und niemals das LVL', () => {
  const current = progress({
    stage: 3,
    solvedOnce: true,
    lvl: 3,
    zeitpunkt_letzter_aufstieg: '2026-06-01T08:00:00.000Z'
  })
  const update = applyTopicAnswer(topic, current, topic.cards[2], null, false, Date.UTC(2026, 6, 16, 8))

  assert.equal(update.progress.stage, 2)
  assert.equal(update.progress.lvl, 3)
  assert.equal(update.outcome.promoted, false)
})

test('freiwillige richtige Übung vor Fälligkeit erhöht das LVL nicht', () => {
  const now = Date.UTC(2026, 6, 16, 8)
  const current = progress({
    stage: 3,
    solvedOnce: true,
    lvl: 1,
    zeitpunkt_letzter_aufstieg: new Date(now).toISOString()
  })
  const update = applyTopicAnswer(topic, current, topic.cards[2], null, true, now + 60_000)

  assert.equal(update.progress.lvl, 1)
  assert.equal(update.outcome.promoted, false)
})

test('fällige richtige Wiederholung steigt genau ein LVL', () => {
  const promotedAt = Date.UTC(2026, 6, 1, 8)
  const now = promotedAt + LEVEL_DELAYS[1]
  const current = progress({
    stage: 3,
    solvedOnce: true,
    lvl: 1,
    zeitpunkt_letzter_aufstieg: new Date(promotedAt).toISOString()
  })
  const update = applyTopicAnswer(topic, current, topic.cards[2], null, true, now)

  assert.equal(update.progress.lvl, 2)
  assert.equal(update.outcome.promoted, true)
  assert.equal(getLevelDueAt(update.progress).getTime() - now, LEVEL_DELAYS[2])
})

test('fällige LVL-5-Wiederholung schließt das Thema ab', () => {
  const promotedAt = Date.UTC(2026, 5, 1, 8)
  const current = progress({
    stage: 3,
    solvedOnce: true,
    lvl: 5,
    zeitpunkt_letzter_aufstieg: new Date(promotedAt).toISOString()
  })
  const update = applyTopicAnswer(topic, current, topic.cards[2], null, true, promotedAt + LEVEL_DELAYS[5])

  assert.equal(update.progress.lvl, 5)
  assert.ok(update.progress.completedAt)
  assert.equal(update.outcome.completed, true)
})

test('pro Stufe rotieren höchstens drei Aufgabenvarianten', () => {
  const selected = [0, 1, 2, 3].map((attempts) => pickTopicCard(topic, progress({ stage: 3, attemptsByStage: { 3: attempts } })).id)
  assert.deepEqual(selected, ['s3-a', 's3-b', 's3-c', 's3-a'])
})

test('Themen überspringen eine entfernte Zwischenstufe', () => {
  const compactTopic = {
    ...topic,
    stages: [1, 3],
    cards: topic.cards.filter((card) => card.stufe !== 2)
  }
  const up = applyTopicAnswer(compactTopic, progress({ stage: 1 }), compactTopic.cards[0], null, true)
  const down = applyTopicAnswer(compactTopic, progress({ stage: 3, lvl: 1, solvedOnce: true }), compactTopic.cards[1], null, false)

  assert.equal(up.progress.stage, 3)
  assert.equal(down.progress.stage, 1)
  assert.equal(down.progress.lvl, 1)
})

test('formel_builder prüft die aktiv zusammengesetzte Reihenfolge', () => {
  const card = {
    typ: 'formel_builder',
    antwort_daten: {
      richtige_reihenfolge: ['uv', 'geteilt', 'kfk', 'mal', 'hundert']
    }
  }
  assert.equal(checkAnswer(card, { sequence: ['uv', 'geteilt', 'kfk', 'mal', 'hundert'], result: '' }), true)
  assert.equal(checkAnswer(card, { sequence: ['kfk', 'geteilt', 'uv', 'mal', 'hundert'], result: '' }), false)
})
