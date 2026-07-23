/* global console, process */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = path.join(root, 'src', 'data', 'pruefungs_app_final_lerntauglich', 'lernkarten_pruefungen_final_lerntauglich_Alle_Faecher.json')
const sourceRoot = path.join(root, 'tmp', 'source-review', 'text')
const reportDir = path.join(root, 'reports')
const jsonReportPath = path.join(reportDir, 'kartenqualitaet_2026-07-23.json')
const markdownReportPath = path.join(reportDir, 'kartenqualitaet_2026-07-23.md')
const cards = JSON.parse(fs.readFileSync(dataPath, 'utf8')).karten ?? []

const normalize = (value) => String(value ?? '')
  .toLocaleLowerCase('de-CH')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/×/g, ' mal ')
  .replace(/÷|\//g, ' geteilt ')
  .replace(/−|-/g, ' minus ')
  .replace(/\+/g, ' plus ')
  .replace(/[^a-z0-9%]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const words = (value) => normalize(value)
  .split(' ')
  .filter((word) => word.length >= 4 && !['welche', 'welcher', 'einer', 'einem', 'einen', 'dieser', 'diese', 'dieses', 'sowie', 'werden', 'wird'].includes(word))

function walkFiles(directory, suffix) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    return entry.isDirectory() ? walkFiles(fullPath, suffix) : (entry.name.endsWith(suffix) ? [fullPath] : [])
  })
}

const sourceFiles = walkFiles(sourceRoot, '.txt')
const sourceCorpus = new Map()
for (const file of sourceFiles) {
  const relative = path.relative(sourceRoot, file).replaceAll('\\', '/')
  const year = relative.match(/(?:^|\/)(202[2-5])(?:\/|$)/)?.[1]
  if (!year) continue
  const kind = /Lösung|Loesung/i.test(relative) ? 'solution' : 'task'
  const key = `${year}:${kind}`
  sourceCorpus.set(key, `${sourceCorpus.get(key) ?? ''} ${normalize(fs.readFileSync(file, 'utf8'))}`)
}

function coverage(needle, haystack) {
  const tokens = [...new Set(words(needle))]
  if (!tokens.length || !haystack) return null
  return tokens.filter((token) => haystack.includes(token)).length / tokens.length
}

function expectedAnswer(card) {
  const data = card.antwort_daten ?? {}
  if (card.typ === 'single_choice') return { indices: [data.richtig_index], values: [data.optionen?.[data.richtig_index]].filter(Boolean) }
  if (card.typ === 'multiple_choice') return { indices: data.richtige_indices ?? [], values: (data.richtige_indices ?? []).map((index) => data.optionen?.[index]).filter(Boolean) }
  if (card.typ === 'reihenfolge') return {
    indices: data.richtige_reihenfolge ?? [],
    values: (data.richtige_reihenfolge ?? []).map((index) => data.items?.[index]).filter(Boolean)
  }
  if (card.typ === 'zuordnung') return {
    indices: data.richtige_paare ?? [],
    values: (data.richtige_paare ?? []).map(([left, right]) => `${data.links?.[left]} → ${data.rechts?.[right]}`)
  }
  if (card.typ === 'formel_luecke_mc') return {
    indices: (data.luecken_mc ?? []).map((gap) => gap.richtig_index),
    values: (data.luecken_mc ?? []).map((gap) => gap.richtig ?? gap.optionen?.[gap.richtig_index]).filter(Boolean)
  }
  if (card.typ === 'formel_builder') return {
    indices: data.richtige_reihenfolge ?? [],
    values: [data.formel, data.ergebnis?.richtiger_wert === undefined ? null : `${data.ergebnis.richtiger_wert} ${data.ergebnis.einheit ?? ''}`].filter(Boolean)
  }
  if (card.typ === 'zahlen_eingabe') return {
    indices: [],
    values: [`${data.richtiger_wert} ${data.einheit ?? ''}`.trim()]
  }
  if (card.typ === 'buchungssatz_builder') {
    const labels = Object.fromEntries((data.konten ?? []).map((account) => [account.id, account.label]))
    return {
      indices: [],
      values: [`${labels[data.richtig?.soll]} an ${labels[data.richtig?.haben]}${data.richtig?.betrag == null ? '' : `, CHF ${data.richtig.betrag}`}`]
    }
  }
  if (card.typ === 'fallentscheidung') return {
    indices: [data.richtig?.entscheidung, data.richtig?.begruendung],
    values: [
      data.entscheidungen?.[data.richtig?.entscheidung],
      data.begruendungen?.[data.richtig?.begruendung]
    ].filter(Boolean)
  }
  return { indices: [], values: [] }
}

function structuralReview(card) {
  const data = card.antwort_daten ?? {}
  const errors = []
  const warnings = []

  if (!String(card.frage ?? '').trim()) errors.push('Frage fehlt')
  if (!card.typ) errors.push('Aufgabentyp fehlt')

  if (['single_choice', 'multiple_choice'].includes(card.typ)) {
    const options = data.optionen ?? []
    if (options.length < 2) errors.push('Zu wenige Antwortmöglichkeiten')
    if (new Set(options.map(normalize)).size !== options.length) errors.push('Doppelte Antwortmöglichkeiten')
    if (options.some((option) => !String(option).trim())) errors.push('Leere Antwortmöglichkeit')
    if (card.typ === 'single_choice' && !options[data.richtig_index]) errors.push('Ungültiger Lösungsindex')
    if (card.typ === 'multiple_choice') {
      const correct = data.richtige_indices ?? []
      if (!correct.length || correct.some((index) => !options[index])) errors.push('Ungültige Mehrfachauswahllösung')
      if (new Set(correct).size !== correct.length) errors.push('Doppelte Lösungsindices')
      if (correct.length === options.length) warnings.push('Alle Optionen sind richtig')
    }
  }

  if (card.typ === 'reihenfolge') {
    const items = data.items ?? []
    const order = data.richtige_reihenfolge ?? []
    if (items.length < 2 || order.length !== items.length) errors.push('Unvollständige Reihenfolge')
    if (new Set(order).size !== items.length || order.some((index) => !items[index])) errors.push('Reihenfolge ist keine gültige Permutation')
  }

  if (card.typ === 'zuordnung') {
    const left = data.links ?? []
    const right = data.rechts ?? []
    const pairs = data.richtige_paare ?? []
    if (!left.length || !right.length || pairs.length !== left.length) errors.push('Unvollständige Zuordnung')
    if (pairs.some(([leftIndex, rightIndex]) => !left[leftIndex] || !right[rightIndex])) errors.push('Ungültiges Zuordnungspaar')
    if (!data.mehrfachverwendung && new Set(pairs.map(([, rightIndex]) => rightIndex)).size !== pairs.length) errors.push('Unzulässige Mehrfachverwendung')
  }

  if (card.typ === 'formel_luecke_mc') {
    for (const [index, gap] of (data.luecken_mc ?? []).entries()) {
      if (!gap.optionen?.[gap.richtig_index]) errors.push(`Formellücke ${index + 1}: ungültiger Lösungsindex`)
      if (gap.richtig && gap.optionen?.[gap.richtig_index] !== gap.richtig) errors.push(`Formellücke ${index + 1}: Text und Lösungsindex widersprechen sich`)
    }
  }

  if (card.typ === 'formel_builder') {
    const blockIds = new Set((data.bausteine ?? []).map((block) => block.id))
    if ((data.richtige_reihenfolge ?? []).some((id) => !blockIds.has(id))) errors.push('Formel verwendet unbekannten Baustein')
    const calculated = calculateFormulaBuilder(data)
    if (calculated !== null && Number.isFinite(data.ergebnis?.richtiger_wert) && Math.abs(calculated - data.ergebnis.richtiger_wert) > (data.ergebnis.toleranz ?? 0.1) + 0.01) {
      errors.push(`Berechnetes Ergebnis ${calculated} widerspricht ${data.ergebnis.richtiger_wert}`)
    }
  }

  if (card.typ === 'zahlen_eingabe') {
    if (!Number.isFinite(data.richtiger_wert)) errors.push('Zahlenaufgabe ohne gültiges Resultat')
    if (!Number.isFinite(data.toleranz ?? 0) || (data.toleranz ?? 0) < 0) errors.push('Ungültige Zahlentoleranz')
  }

  if (card.typ === 'buchungssatz_builder') {
    const accountIds = new Set((data.konten ?? []).map((account) => account.id))
    if (!accountIds.has(data.richtig?.soll) || !accountIds.has(data.richtig?.haben)) errors.push('Ungültiger Buchungssatz')
    if (data.richtig?.betrag != null && !Number.isFinite(data.richtig.betrag)) errors.push('Ungültiger Buchungsbetrag')
  }

  if (card.typ === 'fallentscheidung') {
    if (!data.entscheidungen?.[data.richtig?.entscheidung]) errors.push('Ungültige Fallentscheidung')
    if (!data.begruendungen?.[data.richtig?.begruendung]) errors.push('Ungültige Fallbegründung')
  }

  return { errors, warnings }
}

function calculateFormulaBuilder(data) {
  const values = new Map()
  for (const block of data.bausteine ?? []) {
    const amount = String(block.label ?? '').match(/CHF\s+([0-9']+)/)?.[1]
    if (amount) values.set(block.id, Number(amount.replaceAll("'", '')))
  }
  let result = null
  let operation = null
  for (const id of data.richtige_reihenfolge ?? []) {
    if (id === 'plus') operation = '+'
    else if (id === 'minus') operation = '-'
    else if (id === 'geteilt') operation = '/'
    else if (id === 'mal_hundert') result *= 100
    else if (values.has(id)) {
      const value = values.get(id)
      if (result === null) result = value
      else if (operation === '+') result += value
      else if (operation === '-') result -= value
      else if (operation === '/') result /= value
      operation = null
    }
  }
  return result === null ? null : Math.round(result * 100) / 100
}

function sourceReview(card, expected) {
  const year = String(card.quelle?.jahr ?? card.jahr ?? '')
  if (!/^202[2-5]$/.test(year)) return { status: 'nicht_erforderlich', questionCoverage: null, answerCoverage: null }
  const taskCorpus = sourceCorpus.get(`${year}:task`) ?? ''
  const solutionCorpus = sourceCorpus.get(`${year}:solution`) ?? ''
  const questionCoverage = coverage(card.frage, taskCorpus)
  const answerCoverages = expected.values.map((value) => coverage(value, solutionCorpus)).filter((value) => value !== null)
  const answerCoverage = answerCoverages.length ? answerCoverages.reduce((sum, value) => sum + value, 0) / answerCoverages.length : null
  const status = questionCoverage >= 0.55 && answerCoverage >= 0.55
    ? 'quellenbestaetigt'
    : (questionCoverage >= 0.35 || answerCoverage >= 0.35 ? 'teilweise_bestaetigt' : 'nicht_maschinell_bestaetigt')
  return { status, questionCoverage, answerCoverage }
}

function difficultyReview(card) {
  let score = Number(card.stufe ?? 1)
  if (['multiple_choice', 'reihenfolge', 'zuordnung'].includes(card.typ)) score += 0.5
  if (['formel_luecke_mc', 'formel_builder'].includes(card.typ)) score += 1
  if (['zahlen_eingabe', 'buchungssatz_builder', 'fallentscheidung'].includes(card.typ)) score += 1
  if (String(card.frage).length > 350) score += 0.5
  if ((card.antwort_daten?.optionen?.length ?? 0) >= 5) score += 0.25
  score = Math.max(1, Math.min(5, Math.round(score * 2) / 2))
  const label = score <= 1.5 ? 'leicht' : score <= 2.5 ? 'mittel' : score <= 3.5 ? 'anspruchsvoll' : 'schwer'
  return { score, label }
}

function learningReview(card, duplicateQuestionCount) {
  let score = 3
  const reasons = []
  const question = String(card.frage ?? '')
  const explanation = String(card.erklaerung ?? card.abschlusserklaerung ?? '')

  if (['reihenfolge', 'zuordnung', 'formel_luecke_mc', 'formel_builder', 'zahlen_eingabe', 'buchungssatz_builder', 'fallentscheidung'].includes(card.typ)) {
    score += 1
    reasons.push('aktive Anwendung statt reiner Wiedererkennung')
  }
  if (question.length > 180 && /Ausgangslage|Situation|Fall|berechnet|Ordne|Reihenfolge/i.test(question)) {
    score += 0.5
    reasons.push('konkreter Anwendungs- oder Fallkontext')
  }
  if (explanation.length >= 70 && !/Antwort gemäss offiziellem|Automatisch aus der Prüfungsüberschrift/i.test(explanation)) {
    score += 0.5
    reasons.push('erklärende Rückmeldung vorhanden')
  }
  if (/Welches Thema wird hier primär geprüft|Automatisch aus der Prüfungsüberschrift|Welche Aussage beschreibt das Thema .* fachlich am besten/i.test(question)) {
    score -= 1.5
    reasons.push('Frage prüft überwiegend Benennung oder Wiedererkennung')
  }
  if (/Antwort gemäss offiziellem|Aus den offiziellen Lösungshinweisen verdichtet/i.test(explanation)) {
    score -= 1
    reasons.push('Rückmeldung begründet die Lösung nicht fachlich')
  }
  if (duplicateQuestionCount > 1) {
    score -= 0.5
    reasons.push('nahezu identische Frage kommt im selben Thema mehrfach vor')
  }
  if (card.typ === 'single_choice') {
    const options = card.antwort_daten?.optionen ?? []
    const correctIndex = card.antwort_daten?.richtig_index
    const correctLength = String(options[correctIndex] ?? '').length
    const otherLengths = options.map((option, index) => index === correctIndex ? 0 : String(option).length)
    if (correctLength >= Math.max(...otherLengths, 0)) {
      score -= 0.5
      reasons.push('Länge der richtigen Antwort kann einen Hinweis geben')
    }
  }
  score = Math.max(1, Math.min(5, Math.round(score * 2) / 2))
  return { score, label: score >= 4 ? 'hoch' : score >= 3 ? 'ausreichend' : 'zu gering', reasons }
}

const duplicateQuestions = new Map()
for (const card of cards) {
  const key = `${card.fach}::${card.thema_id}::${normalize(card.frage)}`
  duplicateQuestions.set(key, (duplicateQuestions.get(key) ?? 0) + 1)
}

const results = cards.map((card) => {
  const expected = expectedAnswer(card)
  const structure = structuralReview(card)
  const source = sourceReview(card, expected)
  const difficulty = difficultyReview(card)
  const duplicateKey = `${card.fach}::${card.thema_id}::${normalize(card.frage)}`
  const learningEffect = learningReview(card, duplicateQuestions.get(duplicateKey) ?? 1)
  let correctnessScore = structure.errors.length ? 1 : 5
  if (!structure.errors.length && source.status === 'nicht_maschinell_bestaetigt') correctnessScore = 3.5
  else if (!structure.errors.length && source.status === 'teilweise_bestaetigt') correctnessScore = 4
  const verdict = structure.errors.length
    ? 'fehlerhaft'
    : (learningEffect.score < 3 || structure.warnings.length ? 'ueberarbeiten' : 'bestanden')
  return {
    id: card.id,
    fach: card.fach,
    thema_id: card.thema_id,
    thema: card.thema,
    stufe: card.stufe,
    typ: card.typ,
    frage: card.frage,
    selbstloesung: expected,
    korrektheit: {
      score: correctnessScore,
      status: structure.errors.length ? 'fehlerhaft' : 'strukturell_korrekt',
      fehler: structure.errors,
      hinweise: structure.warnings,
      quelle: source
    },
    schwierigkeit: difficulty,
    lerneffekt: learningEffect,
    urteil: verdict
  }
})

const verdicts = Object.fromEntries(['bestanden', 'ueberarbeiten', 'fehlerhaft'].map((verdict) => [verdict, results.filter((result) => result.urteil === verdict).length]))
const bySubject = Object.fromEntries([...new Set(results.map((result) => result.fach))].map((subject) => {
  const subjectResults = results.filter((result) => result.fach === subject)
  return [subject, {
    karten: subjectResults.length,
    bestanden: subjectResults.filter((result) => result.urteil === 'bestanden').length,
    ueberarbeiten: subjectResults.filter((result) => result.urteil === 'ueberarbeiten').length,
    fehlerhaft: subjectResults.filter((result) => result.urteil === 'fehlerhaft').length
  }]
}))

const report = {
  meta: {
    erstellt_am: '2026-07-23',
    methode: 'Jede Karte wurde aus den hinterlegten Lösungsdaten einmal beantwortet, strukturell validiert, gegen den extrahierten offiziellen Prüfungskorpus 2022–2025 abgeglichen und nach Schwierigkeit sowie Lerneffekt bewertet.',
    einschraenkung: 'Eine fehlende maschinelle Quellenbestätigung ist kein Beweis für eine falsche Lösung; Layout, Scanqualität und Paraphrasen können den Textabgleich verhindern.',
    karten: results.length,
    quellen_pdfs: sourceFiles.length,
    pruefungsjahr_2021: 'Archiv leer'
  },
  zusammenfassung: { urteile: verdicts, nach_fach: bySubject },
  karten: results
}

fs.mkdirSync(reportDir, { recursive: true })
fs.writeFileSync(jsonReportPath, `${JSON.stringify(report, null, 2)}\n`)

const markdown = [
  '# Qualitätsprüfung aller Lernkarten',
  '',
  `Stand: ${report.meta.erstellt_am}`,
  '',
  report.meta.methode,
  '',
  `Geprüft: **${results.length} Karten** · Bestanden: **${verdicts.bestanden}** · Überarbeiten: **${verdicts.ueberarbeiten}** · Fehlerhaft: **${verdicts.fehlerhaft}**`,
  '',
  '## Zusammenfassung nach Fach',
  '',
  '| Fach | Karten | Bestanden | Überarbeiten | Fehlerhaft |',
  '|---|---:|---:|---:|---:|',
  ...Object.entries(bySubject).map(([subject, values]) => `| ${subject} | ${values.karten} | ${values.bestanden} | ${values.ueberarbeiten} | ${values.fehlerhaft} |`),
  '',
  '## Einzelprüfung',
  '',
  '| ID | Fach / Thema | Stufe / Typ | Selbst gelöst | Korrektheit | Schwierigkeit | Lerneffekt | Urteil |',
  '|---|---|---|---|---|---|---|---|',
  ...results.map((result) => {
    const answer = result.selbstloesung.values.join('; ').replaceAll('|', '\\|').replace(/\s+/g, ' ')
    return `| \`${result.id}\` | ${result.fach} / ${result.thema} | ${result.stufe} / ${result.typ} | ${answer.slice(0, 180)} | ${result.korrektheit.score}/5 | ${result.schwierigkeit.label} (${result.schwierigkeit.score}/5) | ${result.lerneffekt.label} (${result.lerneffekt.score}/5) | ${result.urteil} |`
  }),
  '',
  'Die vollständigen Fehler, Begründungen, Quellenabgleiche und ungekürzten Selbstlösungen stehen in der JSON-Datei gleichen Namens.',
  ''
].join('\n')
fs.writeFileSync(markdownReportPath, markdown)

console.log(JSON.stringify({
  report: path.relative(root, jsonReportPath),
  markdown: path.relative(root, markdownReportPath),
  cards: results.length,
  verdicts,
  sourceFiles: sourceFiles.length
}, null, 2))

if (results.some((result) => result.urteil === 'fehlerhaft')) process.exitCode = 1
