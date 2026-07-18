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
const coherentUmbrellaTopics = new Set([
  'Finanzwirtschaft::mehrwertsteuer',
  'Marketing_Verkauf::strategie_analyseinstrumente',
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

  if (card.typ === 'zuordnung') {
    const { links = [], rechts = [], richtige_paare: pairs = [] } = card.antwort_daten ?? {}
    if (pairs.length !== links.length) errors.push(`${card.id}: Nicht jede linke Aussage ist zugeordnet`)
    for (const [left, right] of pairs) {
      if (!links[left] || !rechts[right]) errors.push(`${card.id}: Ungültiges Zuordnungspaar ${left}/${right}`)
    }
  }
}

for (const [key, topicCards] of groups) {
  const stages = new Set(topicCards.map((card) => card.stufe))
  if (!stages.has(1)) errors.push(`${key}: keine Einführungsstufe`)
  if (topicCards.some((card) => `${card.fach}::${card.thema_id}` !== key)) errors.push(`${key}: gemischte Themenzuordnung`)

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
  legalReferences: cards.filter((card) => card.rechtsgrundlage).length,
  topicWarnings,
  errors
}

console.log(JSON.stringify(summary, null, 2))
if (errors.length) process.exitCode = 1
