/* global console, process */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataFile = path.join(root, 'src', 'data', 'pruefungs_app_final_lerntauglich', 'lernkarten_pruefungen_final_lerntauglich_Alle_Faecher.json')
const dataset = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
const cards = dataset.karten ?? []

const errors = []
const topicWarnings = []
const groups = new Map()
const ids = new Set()
const stageOneAnswerPositions = new Map()
const metaQuestionPattern = /Welche .*?(?:Punkte|Aussagen).*?(?:Musterlösung|Lösungsvorschlag|Lösungshinweis|Prüfungsaufgabe)/i
const weakTopicQuestionPattern = /Welches Thema wird hier primär geprüft\?/i
const genericTopicDescriptionPattern = /Welche Aussage beschreibt das Thema .* fachlich am besten\?/i
const genericExplanationPattern = /Antwort gemäss offiziellem|Aus den offiziellen Lösungshinweisen verdichtet|Automatisch aus der Prüfungsüberschrift/i
const incompleteAnswerPattern = /\b(?:und|oder|der|die|das|den|dem|des|ein|eine|einer|einem|einen|zu|zur|zum|von|vom|für|mit|bei|im|in|auf|an|als|um)\s*$|[,:;–-]\s*$/i
const placeholderPattern = /[._…]{4,}/
const externalTaskReferencePattern = /\b(?:in|aus|von|gemäss|bei)\s+Aufgabe\s+\d+(?:\.\d+)?/i
const missingFragmentPattern = /\bfehlende\s+(?:Beschriftung|Beschriftungen|Angabe|Angaben|Wert|Werte|Zahl|Zahlen|Position|Positionen)\b/i
const visualReferencePattern = /\b(?:gemäss|anhand)\b.{0,60}\b(?:Abbildung|Grafik|Tabelle|Beilage|Anhang)\b/i
const embeddedVisualTypes = new Set(['formel_builder'])
const subjectBoilerplates = [
  ['Personalmanagement', /Personalmanagement verbindet/i],
  ['Finanzwirtschaft', /Finanzwirtschaft verbindet/i],
  ['Marketing_Verkauf', /Marketing und Verkauf verbindet/i],
  ['SCM', /Supply Chain Management verbindet/i],
  ['Unternehmensfuehrung', /Unternehmensführung verbindet/i],
  ['Problemloesung_Entscheidung', /Problemlösung und Entscheidung verlangt/i]
]
const coherentUmbrellaTopics = new Set([
  'Finanzwirtschaft::mehrwertsteuer',
  'Marketing_Verkauf::strategie_analyseinstrumente',
  'Personalmanagement::3_saeulen_prinzip',
  'Personalmanagement::rechtliche_grundlagen',
  'Problemloesung_Entscheidung::organisation_prozesse',
  'SCM::organisation_prozesse'
])

for (const card of cards) {
  if (ids.has(card.id)) errors.push(`Doppelte ID: ${card.id}`)
  ids.add(card.id)

  const key = `${card.fach}::${card.thema_id}`
  if (!groups.has(key)) groups.set(key, [])
  groups.get(key).push(card)

  if (card.ab_lvl != null && (!Number.isInteger(card.ab_lvl) || card.ab_lvl < 1 || card.ab_lvl > 5)) {
    errors.push(`${card.id}: ab_lvl muss zwischen 1 und 5 liegen`)
  }

  if (metaQuestionPattern.test(card.frage ?? '')) {
    errors.push(`${card.id}: unzulässige Musterlösungs-Metafrage`)
  }
  if (weakTopicQuestionPattern.test(card.frage ?? '')) {
    errors.push(`${card.id}: unzulässige reine Themen-Erkennungsfrage`)
  }
  if (genericTopicDescriptionPattern.test(card.frage ?? '')) {
    errors.push(`${card.id}: unzulässige allgemeine Themenbeschreibung statt Fachaufgabe`)
  }
  if (genericExplanationPattern.test(card.erklaerung ?? '')) {
    errors.push(`${card.id}: Lösung besitzt keine fachliche Erklärung`)
  }
  const searchableText = JSON.stringify(card)
  if (placeholderPattern.test(card.frage ?? '') && !['formel_luecke_mc', 'lueckentext_auswahl'].includes(card.typ)) {
    errors.push(`${card.id}: unstrukturierter Platzhalter ohne auswählbare Lücken`)
  }
  if (externalTaskReferencePattern.test(card.frage ?? '')) {
    errors.push(`${card.id}: verweist auf eine andere, nicht eingebettete Aufgabe`)
  }
  if (missingFragmentPattern.test(card.frage ?? '')) {
    errors.push(`${card.id}: verlangt mutmasslich einen fehlenden Aufgabenbestandteil`)
  }
  if (visualReferencePattern.test(card.frage ?? '') && !card.darstellung && !embeddedVisualTypes.has(card.typ)) {
    errors.push(`${card.id}: verweist auf eine nicht eingebettete Darstellung`)
  }
  for (const [subject, pattern] of subjectBoilerplates) {
    if (subject !== card.fach && pattern.test(searchableText)) {
      errors.push(`${card.id}: Erklärung enthält Standardtext des falschen Fachs ${subject}`)
    }
  }
  if (card.thema_id === 'break_even_deckungsbeitrag' && card.fach !== 'Finanzwirtschaft') {
    errors.push(`${card.id}: Break-even / Deckungsbeitrag liegt im falschen Fach ${card.fach}`)
  }
  if (card.fach === 'Marketing_Verkauf' && ['lager_lagerkennzahlen', 'liquiditaet_mittelfluss'].includes(card.thema_id)) {
    errors.push(`${card.id}: Lager- oder Liquiditätsthema liegt weiterhin in Marketing / Verkauf`)
  }
  if (card.fach === 'Personalmanagement' && ['rechnung_rechnungspruefung', 'organisation_prozesse'].includes(card.thema_id)) {
    errors.push(`${card.id}: Personalthema besitzt weiterhin eine fachfremde Sammelzuordnung`)
  }

  if (card.typ === 'single_choice') {
    const { optionen = [], richtig_index: correctIndex } = card.antwort_daten ?? {}
    if (!optionen[correctIndex]) errors.push(`${card.id}: ungültiger Single-Choice-Lösungsindex`)
    if (optionen.length > 1 && optionen[correctIndex]) {
      const correctLength = String(optionen[correctIndex]).length
      const longestIncorrect = Math.max(...optionen.map((option, index) => index === correctIndex ? 0 : String(option).length))
      if (correctLength >= longestIncorrect) {
        errors.push(`${card.id}: richtige Single-Choice-Antwort ist die längste Option`)
      }
    }
    if (card.stufe === 1 && optionen.length > 1 && optionen[correctIndex]) {
      const distributionKey = String(optionen.length)
      const positions = stageOneAnswerPositions.get(distributionKey) ?? Array(optionen.length).fill(0)
      positions[correctIndex] += 1
      stageOneAnswerPositions.set(distributionKey, positions)
    }
  }

  if (card.typ === 'multiple_choice') {
    const { optionen = [], richtige_indices: correct = [] } = card.antwort_daten ?? {}
    if (optionen.length > 1 && correct.length === optionen.length) {
      errors.push(`${card.id}: Mehrfachauswahl besitzt keine falsche Aussage`)
    }
    optionen.forEach((option, index) => {
      if (incompleteAnswerPattern.test(String(option).trim())) {
        errors.push(`${card.id}: Antwort ${index + 1} endet mutmasslich mitten im Satz`)
      }
    })
  }

  if (card.typ === 'formel_luecke_mc' || card.typ === 'lueckentext_auswahl') {
    const gaps = card.antwort_daten?.luecken_mc ?? []
    if (!gaps.length) errors.push(`${card.id}: Lückenaufgabe besitzt keine Lücken`)
    gaps.forEach((gap, index) => {
      if (!gap.optionen?.[gap.richtig_index]) errors.push(`${card.id}: Lücke ${index + 1} besitzt keine gültige Lösung`)
      if ((gap.optionen ?? []).length < 2) errors.push(`${card.id}: Lücke ${index + 1} besitzt zu wenige Auswahlmöglichkeiten`)
    })
  }

  if (card.typ === 'zuordnung') {
    const { links = [], rechts = [], richtige_paare: pairs = [] } = card.antwort_daten ?? {}
    if (pairs.length !== links.length) errors.push(`${card.id}: Nicht jede linke Aussage ist zugeordnet`)
    for (const [left, right] of pairs) {
      if (!links[left] || !rechts[right]) errors.push(`${card.id}: Ungültiges Zuordnungspaar ${left}/${right}`)
    }
    if (new Set(pairs.map(([, right]) => right)).size < pairs.length && !card.antwort_daten?.mehrfachverwendung) {
      errors.push(`${card.id}: notwendige Mehrfachverwendung ist nicht freigegeben`)
    }
  }

  if (card.typ === 'zahlen_eingabe') {
    const { richtiger_wert: expected, toleranz = 0 } = card.antwort_daten ?? {}
    if (!Number.isFinite(expected)) errors.push(`${card.id}: Zahlenaufgabe ohne gültiges Resultat`)
    if (!Number.isFinite(toleranz) || toleranz < 0) errors.push(`${card.id}: Zahlenaufgabe mit ungültiger Toleranz`)
  }

  if (card.typ === 'buchungssatz_builder') {
    const { konten = [], richtig = {} } = card.antwort_daten ?? {}
    const accountIds = new Set(konten.map((account) => account.id))
    if (konten.length < 3) errors.push(`${card.id}: Buchungssatz besitzt zu wenige Konten`)
    if (!accountIds.has(richtig.soll) || !accountIds.has(richtig.haben)) {
      errors.push(`${card.id}: Buchungssatz besitzt ungültige Soll-/Habenkonten`)
    }
    if (richtig.soll === richtig.haben) errors.push(`${card.id}: Soll- und Habenkonto sind identisch`)
  }

  if (card.typ === 'fallentscheidung') {
    const { entscheidungen = [], begruendungen = [], richtig = {} } = card.antwort_daten ?? {}
    if (!entscheidungen[richtig.entscheidung]) errors.push(`${card.id}: Fallentscheidung besitzt keine gültige Massnahme`)
    if (!begruendungen[richtig.begruendung]) errors.push(`${card.id}: Fallentscheidung besitzt keine gültige Begründung`)
    if (entscheidungen.length < 3 || begruendungen.length < 3) {
      errors.push(`${card.id}: Fallentscheidung benötigt jeweils mindestens drei Optionen`)
    }
  }
}

for (const [optionCount, positions] of stageOneAnswerPositions) {
  const usedPositions = positions.filter((count) => count > 0)
  if (usedPositions.length !== Number(optionCount) || Math.max(...positions) - Math.min(...positions) > 1) {
    errors.push(`Stufe-1-Single-Choice mit ${optionCount} Optionen: unausgewogene Lösungspositionen ${positions.join('/')}`)
  }
}

const pensionCards = cards.filter((card) => card.fach === 'Personalmanagement' && card.thema_id === '3_saeulen_prinzip')
const pensionStages = new Set(pensionCards.map((card) => card.stufe))
if (![1, 2, 3, 4].every((stage) => pensionStages.has(stage))) {
  errors.push('Personalmanagement::3_saeulen_prinzip: anspruchsvolle Lernfolge Stufe 1–4 fehlt')
}

for (const [key, topicCards] of groups) {
  const stages = new Set(topicCards.map((card) => card.stufe))
  if (!stages.has(1)) errors.push(`${key}: keine Einführungsstufe`)
  if (![...stages].some((stage) => stage > 1)) errors.push(`${key}: keine weiterführende, lösbare Lernstufe`)
  if (topicCards.some((card) => `${card.fach}::${card.thema_id}` !== key)) errors.push(`${key}: gemischte Themenzuordnung`)
  const maxStage = Math.max(...topicCards.map((card) => card.stufe ?? 1))
  for (const card of topicCards.filter((candidate) => candidate.ab_lvl != null)) {
    if (card.stufe !== maxStage) errors.push(`${card.id}: LVL-Vertiefung liegt nicht auf der höchsten Themenstufe`)
  }

  const titleWords = significantWords(topicCards[0]?.thema)
  const unrelated = topicCards
    .filter((card) => card.stufe >= 3)
    .map((card) => ({ card, lead: String(card.frage).split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? '' }))
    .filter(({ lead }) => {
      const leadWords = significantWords(lead)
      return leadWords.length > 0 && titleWords.length > 0 && !leadWords.some((word) => titleWords.includes(word))
    })
  if (!coherentUmbrellaTopics.has(key) && unrelated.length >= 3 && unrelated.length === topicCards.filter((card) => card.stufe >= 3).length) {
    topicWarnings.push({
      topic: key,
      cards: unrelated.slice(0, 20).map(({ card, lead }) => ({ id: card.id, heading: lead }))
    })
  }
}

const subjectFiles = {
  Finanzwirtschaft: 'lernkarten_pruefungen_final_lerntauglich_Finanzwirtschaft.json',
  Integrierte_Fallstudie: 'lernkarten_pruefungen_final_lerntauglich_Integrierte_Fallstudie.json',
  Marketing_Verkauf: 'lernkarten_pruefungen_final_lerntauglich_Marketing_Verkauf.json',
  Personalmanagement: 'lernkarten_pruefungen_final_lerntauglich_Personalmanagement.json',
  Problemloesung_Entscheidung: 'lernkarten_pruefungen_final_lerntauglich_Problemloesung_Entscheidung.json',
  Recht_VWL: 'lernkarten_pruefungen_final_lerntauglich_Recht_VWL.json',
  SCM: 'lernkarten_pruefungen_final_lerntauglich_SCM.json',
  Unternehmensfuehrung: 'lernkarten_pruefungen_final_lerntauglich_Unternehmensfuehrung.json'
}
for (const [subject, filename] of Object.entries(subjectFiles)) {
  const subjectPath = path.join(path.dirname(dataFile), filename)
  const subjectCards = JSON.parse(fs.readFileSync(subjectPath, 'utf8')).karten ?? []
  const aggregateCards = cards.filter((card) => card.fach === subject)
  if (JSON.stringify(subjectCards) !== JSON.stringify(aggregateCards)) {
    errors.push(`${subject}: Fachdatei stimmt nicht mit dem Gesamtbestand überein`)
  }
}

function significantWords(value) {
  const stopWords = new Set(['allgemein', 'aufgabe', 'aufgaben', 'frage', 'grundlagen', 'thema', 'welche', 'welcher', 'werden'])
  return String(value ?? '')
    .toLocaleLowerCase('de-CH')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length >= 5 && !stopWords.has(word))
}

const summary = {
  cards: cards.length,
  topics: groups.size,
  subjects: [...new Set(cards.map((card) => card.fach))].length,
  matchingCards: cards.filter((card) => card.typ === 'zuordnung').length,
  levelChallenges: cards.filter((card) => card.ab_lvl != null).length,
  legalReferences: cards.filter((card) => card.rechtsgrundlage).length,
  topicWarnings,
  errors
}

console.log(JSON.stringify(summary, null, 2))
if (errors.length) process.exitCode = 1
