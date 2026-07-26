import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_CARD_AGENT_BATCH_SIZE,
  parseAgentResponse,
  selectBatch,
  validateImprovedCard
} from './card-improvement-agent.mjs'

test('Qualitätsagent prüft standardmässig 24 Karten pro Lauf', () => {
  assert.equal(DEFAULT_CARD_AGENT_BATCH_SIZE, 24)
  const cards = Array.from({ length: 30 }, (_, index) => ({
    id: `card-${index}`,
    fach: `Fach ${index % 3}`,
    stufe: 1,
    lerneffekt: { score: 2 },
    korrektheit: { score: 5 }
  }))
  const selection = selectBatch(cards, {
    reviewed_ids: [],
    subject_cursor: 0,
    cycle: 1
  })

  assert.equal(selection.cards.length, 24)
})

test('Batch-Auswahl verteilt Karten über die Fächer und respektiert die Obergrenze', () => {
  const cards = [
    { id: 'f1', fach: 'Finanzwirtschaft', stufe: 1, lerneffekt: { score: 2 }, korrektheit: { score: 5 } },
    { id: 'f2', fach: 'Finanzwirtschaft', stufe: 2, lerneffekt: { score: 3 }, korrektheit: { score: 5 } },
    { id: 's1', fach: 'SCM', stufe: 1, lerneffekt: { score: 2 }, korrektheit: { score: 5 } },
    { id: 'p1', fach: 'Personalmanagement', stufe: 1, lerneffekt: { score: 2 }, korrektheit: { score: 5 } }
  ]
  const result = selectBatch(cards, { reviewed_ids: [], subject_cursor: 0, cycle: 1 }, 3)

  assert.equal(result.cards.length, 3)
  assert.equal(new Set(result.cards.map((card) => card.fach)).size, 3)
})

test('Agentenantwort wird aus strukturiertem Responses-Output gelesen', () => {
  const response = {
    output: [{
      content: [{
        type: 'output_text',
        text: JSON.stringify({
          reviews: [{
            id: 'karte-1',
            changed: false,
            reason: 'Bereits gut.',
            quality_before: 4,
            quality_after: 4,
            patch_json: '{}'
          }]
        })
      }]
    }]
  }

  assert.equal(parseAgentResponse(response).reviews[0].id, 'karte-1')
})

test('Verbesserte Einfachauswahl benötigt genügend Optionen und einen gültigen Index', () => {
  assert.throws(() => validateImprovedCard({
    id: 'karte-1',
    typ: 'single_choice',
    frage: 'Test?',
    antwort_daten: { optionen: ['A', 'B'], richtig_index: 0 }
  }))

  assert.doesNotThrow(() => validateImprovedCard({
    id: 'karte-1',
    typ: 'single_choice',
    frage: 'Test?',
    antwort_daten: { optionen: ['A', 'B', 'C'], richtig_index: 1 }
  }))
})
