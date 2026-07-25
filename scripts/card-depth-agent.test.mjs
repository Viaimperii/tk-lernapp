import assert from 'node:assert/strict'
import test from 'node:test'
import { familyFingerprint, materializeFamily, selectTopicBundle } from './card-depth-agent.mjs'

const sourceCards = [
  {
    id: 'scm_1',
    fach: 'SCM',
    thema_id: 'lieferanten',
    thema: 'Beschaffung / Lieferanten',
    stufe: 3,
    typ: 'single_choice',
    frage: 'Was gehört zur Lieferantenbeurteilung?',
    antwort_daten: { optionen: ['Gesamtkosten und Risiko', 'Nur Farbe'], richtig_index: 0 },
    lernziel: 'Lieferanten nach Kosten und Risiko beurteilen.'
  },
  {
    id: 'scm_2',
    fach: 'SCM',
    thema_id: 'lieferanten',
    thema: 'Beschaffung / Lieferanten',
    stufe: 3,
    typ: 'multiple_choice',
    frage: 'Welche Kriterien sind relevant?',
    antwort_daten: { optionen: ['Qualität', 'Termin', 'Zufall'], richtige_indices: [0, 1] }
  },
  {
    id: 'fin_1',
    fach: 'Finanzwirtschaft',
    thema_id: 'kosten',
    thema: 'Kostenrechnung',
    stufe: 3,
    typ: 'single_choice',
    frage: 'Was sind relevante Kosten?',
    antwort_daten: { optionen: ['Gesamtkosten', 'Nur Listenpreis'], richtig_index: 0 },
    lernziel: 'Gesamtkosten beurteilen.'
  },
  {
    id: 'fin_2',
    fach: 'Finanzwirtschaft',
    thema_id: 'kosten',
    thema: 'Kostenrechnung',
    stufe: 3,
    typ: 'multiple_choice',
    frage: 'Welche Kosten wirken auf den Entscheid?',
    antwort_daten: { optionen: ['Preis', 'Folgekosten', 'Logo'], richtige_indices: [0, 1] }
  }
]

test('Tiefenloop wählt ein Primärthema und fachlich ähnliche Kandidaten', () => {
  const selection = selectTopicBundle(sourceCards, [], {
    cycle: 1,
    topic_cursor: 0,
    reviewed_topics: []
  })

  assert.equal(selection.primary.key, 'Finanzwirtschaft::kosten')
  assert.equal(selection.primary.nextDepth, 1)
  assert.equal(selection.candidates[0].key, 'SCM::lieferanten')
})

test('Kartenfamilie erweitert zwei Themen und übernimmt Identität deterministisch', () => {
  const selection = selectTopicBundle(sourceCards, [], {
    cycle: 1,
    topic_cursor: 0,
    reviewed_topics: []
  })
  const rawFamily = {
    bridge: 'Gesamtkosten verbinden Beschaffungs- und Finanzentscheid.',
    template: null,
    cards: [
      {
        target_topic_key: 'Finanzwirtschaft::kosten',
        typ: 'fallentscheidung',
        lernziel: 'Gesamtkosten in einem Entscheid beurteilen.',
        frage: 'Variante A ist im Einkauf günstiger, verursacht aber höhere Folgekosten. Welche Beurteilung ist fachlich richtig?',
        aufgaben_hinweis: 'Wähle Entscheidung und Begründung.',
        antwort_daten: {
          entscheidungen: ['A sofort wählen', 'Gesamtkosten vergleichen', 'Keine Variante prüfen'],
          begruendungen: ['Nur Preis zählt', 'Preis und Folgekosten wirken gemeinsam', 'Kosten sind irrelevant'],
          richtig: { entscheidung: 1, begruendung: 1 }
        },
        erklaerung: 'Der Entscheid berücksichtigt Preis und Folgekosten.',
        merksatz: 'Nicht nur kaufen, sondern Wirkung rechnen.',
        quellenkarten: ['fin_1', 'fin_2'],
        fachliche_belege: [{ claim: 'Gesamtkosten umfassen Preis und Folgekosten.', source_card_id: 'fin_2' }],
        rechtsgrundlage: [],
        template_id: null
      },
      {
        target_topic_key: 'SCM::lieferanten',
        typ: 'fallentscheidung',
        lernziel: 'Lieferantenrisiko und Gesamtkosten verbinden.',
        frage: 'Ein günstiger Lieferant ist unzuverlässig. Welche Beurteilung berücksichtigt den Beschaffungserfolg?',
        aufgaben_hinweis: 'Wähle Entscheidung und Begründung.',
        antwort_daten: {
          entscheidungen: ['Nur Preis wählen', 'Kosten und Risiko gewichten', 'Zufällig wählen'],
          begruendungen: ['Qualität zählt nie', 'Folgekosten und Termine beeinflussen den Entscheid', 'Logo entscheidet'],
          richtig: { entscheidung: 1, begruendung: 1 }
        },
        erklaerung: 'Kosten, Qualität und Terminrisiko werden gemeinsam beurteilt.',
        merksatz: 'Der tiefste Preis ist nicht immer die tiefste Belastung.',
        quellenkarten: ['scm_1', 'scm_2'],
        fachliche_belege: [{ claim: 'Termin und Qualität gehören zur Beurteilung.', source_card_id: 'scm_2' }],
        rechtsgrundlage: [],
        template_id: null
      }
    ]
  }

  const materialized = materializeFamily(rawFamily, selection, sourceCards, [], 7)
  assert.equal(materialized.cards.length, 2)
  assert.equal(materialized.cards[0].fach, 'Finanzwirtschaft')
  assert.equal(materialized.cards[1].fach, 'SCM')
  assert.equal(materialized.cards[0].ab_lvl, 1)
  assert.match(materialized.family.id, /^depth_0007_/)
  assert.equal(familyFingerprint(materialized).length, 64)
})

test('Nicht belegte Schweizer Rechtsgrundlagen werden verworfen', () => {
  const selection = selectTopicBundle(sourceCards, [], {
    cycle: 1,
    topic_cursor: 0,
    reviewed_topics: []
  })
  const proposal = {
    bridge: 'Kosten verbinden die Themen.',
    template: null,
    cards: [
      {
        target_topic_key: 'Finanzwirtschaft::kosten',
        typ: 'zahlen_eingabe',
        lernziel: 'Kosten berechnen.',
        frage: 'Wie hoch sind die Kosten bei CHF 10 plus CHF 5?',
        antwort_daten: { richtiger_wert: 15, toleranz: 0, einheit: 'CHF' },
        erklaerung: 'Die Summe beträgt CHF 15.',
        merksatz: 'Kosten addieren.',
        quellenkarten: ['fin_1'],
        fachliche_belege: [{ claim: 'Gesamtkosten sind relevant.', source_card_id: 'fin_1' }],
        rechtsgrundlage: [{ gesetz: 'OR', artikel: '999', absatz: '1' }]
      },
      {
        target_topic_key: 'SCM::lieferanten',
        typ: 'zahlen_eingabe',
        lernziel: 'Kosten berechnen.',
        frage: 'Wie hoch sind die Kosten bei CHF 10 plus CHF 5?',
        antwort_daten: { richtiger_wert: 15, toleranz: 0, einheit: 'CHF' },
        erklaerung: 'Die Summe beträgt CHF 15.',
        merksatz: 'Kosten addieren.',
        quellenkarten: ['scm_1'],
        fachliche_belege: [{ claim: 'Gesamtkosten sind relevant.', source_card_id: 'scm_1' }],
        rechtsgrundlage: []
      }
    ]
  }

  assert.throws(() => materializeFamily(proposal, selection, sourceCards, [], 1), /Rechtsgrundlage/)
})
