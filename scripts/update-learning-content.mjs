/* global console */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = path.join(root, 'src', 'data', 'pruefungs_app_final_lerntauglich')
const aggregateName = 'lernkarten_pruefungen_final_lerntauglich_Alle_Faecher.json'
const aggregatePath = path.join(dataDir, aggregateName)
const dataset = JSON.parse(fs.readFileSync(aggregatePath, 'utf8'))
let cards = dataset.karten ?? []

const topic = (card, fach, themaId, thema) => Object.assign(card, { fach, thema_id: themaId, thema })
const byId = new Map(cards.map((card) => [card.id, card]))

function hashString(value) {
  let hash = 2166136261
  for (const character of String(value)) {
    hash ^= character.codePointAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

// Klare Fehlzuordnungen aus dem vollständigen Themenaudit.
for (const id of [
  'pr2022_finanzwirtschaft_1_5_choice_stufe3',
  'pr2024_finanzwirtschaft_1_2_choice_stufe3',
  'pr2024_finanzwirtschaft_1_8_choice_stufe3'
]) topic(byId.get(id), 'SCM', 'beschaffung_lieferanten', 'Beschaffung / Lieferanten')

topic(byId.get('pr2023_finanzwirtschaft_1_4_choice_stufe3'), 'Finanzwirtschaft', 'erstellung_eines_teilbudgets', 'Erstellung eines Teilbudgets')
topic(byId.get('pr2024_finanzwirtschaft_1_16_thema_stufe3'), 'Finanzwirtschaft', 'bilanzanalyse', 'Bilanzanalyse')

for (const id of [
  'pr2024_marketing_verkauf_1_3_choice_stufe3',
  'pr2025_marketing_verkauf_1_14_choice_stufe3',
  'pr2025_marketing_verkauf_1_16_reihenfolge_stufe3'
]) topic(byId.get(id), 'Marketing_Verkauf', 'auftragsabwicklung', 'Auftragsabwicklung')

const orderIntro = byId.get('marketing_verkauf_beschaffung_lieferanten_stufe1_begriff')
  ?? byId.get('marketing_verkauf_auftragsabwicklung_stufe1_begriff')
  ?? {
    fach: 'Marketing_Verkauf',
    quelle: { typ: 'eigene_lernkarte' },
    stufe: 1,
    typ: 'single_choice',
    loesungsvorschlag: {},
    fehlerfallen: [],
    merksatz: 'Erst prüfen, dann erfüllen, dokumentieren und abrechnen.',
    review: {},
    tags: ['auftragsabwicklung', 'stufe_1']
  }
if (!cards.includes(orderIntro)) cards.push(orderIntro)
topic(orderIntro, 'Marketing_Verkauf', 'auftragsabwicklung', 'Auftragsabwicklung')
Object.assign(orderIntro, {
  id: 'marketing_verkauf_auftragsabwicklung_stufe1_begriff',
  lernziel: 'Den Ablauf vom Auftragseingang bis zum Versand grundlegend verstehen.',
  frage: 'Welcher Schritt steht am Anfang einer üblichen Auftragsabwicklung?',
  antwort_daten: {
    optionen: ['Bestellung erfassen und prüfen', 'Ware versenden', 'Rechnung mahnen', 'Reklamation abschliessen'],
    richtig_index: 0
  },
  begriff_erklaerung: {
    kurz: 'Die Auftragsabwicklung führt eine Kundenbestellung kontrolliert von der Erfassung über Rüsten, Kommissionieren und Verpacken bis zu Versand und Fakturierung.',
    pruefungsrelevant: 'Geprüft werden Dokumente, Reihenfolge, Vollständigkeit und kundenorientierte Kommunikation.'
  },
  erklaerung: 'Zuerst muss der Auftrag erfasst und auf Vollständigkeit, Lieferbarkeit sowie Konditionen geprüft werden.'
})

topic(byId.get('pr2024_personalmanagement_2_3_thema_stufe3'), 'Personalmanagement', 'fuehrung_personal', 'Führung / Personal')
topic(byId.get('pr2025_personalmanagement_1_1_choice_stufe3'), 'Personalmanagement', 'kommunikationsgrundsaetze', 'Kommunikationsgrundsätze')
topic(byId.get('personalmanagement_beschaffung_lieferanten_stufe1_begriff'), 'Personalmanagement', 'personalbeschaffung', 'Personalbeschaffung')

for (const id of ['pr2022_recht_vwl_1_14_choice_stufe3', 'pr2022_recht_vwl_3_2_thema_stufe3']) {
  topic(byId.get(id), 'Recht_VWL', 'vwl_grundlagen', 'VWL-Grundlagen')
}
for (const id of ['pr2024_recht_vwl_2_2_thema_stufe3', 'pr2025_recht_vwl_2_1_thema_stufe3']) {
  topic(byId.get(id), 'Recht_VWL', 'rechtliche_grundlagen', 'Rechtliche Grundlagen')
}

const ufMoves = {
  pr2022_unternehmensfuehrung_1_16_zuordnung_stufe3: ['strategie_analyseinstrumente', 'Strategie / Analyseinstrumente'],
  pr2022_unternehmensfuehrung_1_17_zuordnung_stufe3: ['oekobilanz', 'Ökobilanz'],
  pr2023_unternehmensfuehrung_1_16_zuordnung_stufe3: ['organisation_prozesse', 'Organisation / Prozesse'],
  pr2023_unternehmensfuehrung_1_17_zuordnung_stufe3: ['unternehmensethik', 'Unternehmensethik'],
  pr2024_unternehmensfuehrung_1_16_zuordnung_stufe3: ['businessplan', 'Businessplan'],
  pr2024_unternehmensfuehrung_1_17_zuordnung_stufe3: ['umwelt', 'Umwelt'],
  pr2025_unternehmensfuehrung_1_16_zuordnung_stufe3: ['organisation_prozesse', 'Organisation / Prozesse'],
  pr2025_unternehmensfuehrung_1_17_zuordnung_stufe3: ['strategie_analyseinstrumente', 'Strategie / Analyseinstrumente']
}
for (const [id, [themaId, thema]] of Object.entries(ufMoves)) topic(byId.get(id), 'Unternehmensfuehrung', themaId, thema)

function moveMatching(fach, fromTopic, pattern, toTopic, title) {
  for (const card of cards) {
    if (card.fach !== fach || card.thema_id !== fromTopic || !pattern.test(card.frage ?? '')) continue
    topic(card, fach, toTopic, title)
  }
}

// Zweiter Audit-Pass: fachlich unterschiedliche Prüfungsfragen aus zu groben Sammelthemen lösen.
moveMatching('Finanzwirtschaft', 'fuehrung_personal', /Jahresabschluss/i, 'jahresabschluss', 'Jahresabschluss')
moveMatching('Finanzwirtschaft', 'fuehrung_personal', /Budgetvarianten/i, 'budgetierung', 'Budgetierung')
moveMatching('Finanzwirtschaft', 'fuehrung_personal', /Teilbudgets/i, 'erstellung_eines_teilbudgets', 'Erstellung eines Teilbudgets')
moveMatching('Finanzwirtschaft', 'marketing_verkauf', /Wesentlichkeit.*Jahresabschluss/i, 'jahresabschluss', 'Jahresabschluss')
moveMatching('Finanzwirtschaft', 'marketing_verkauf', /Zuschlagskalkulation/i, 'zuschlagskalkulation', 'Zuschlagskalkulation')
moveMatching('Finanzwirtschaft', 'marketing_verkauf', /Verbesserungsmassnahmen/i, 'soll_ist_vergleich', 'Soll-Ist-Vergleich')
moveMatching('Finanzwirtschaft', 'rechtliche_grundlagen', /Kostenarten/i, 'betriebsbuchhaltung', 'Betriebsbuchhaltung')
moveMatching('Finanzwirtschaft', 'rechtliche_grundlagen', /Teilplänen/i, 'budgetierung', 'Budgetierung')
moveMatching('Finanzwirtschaft', 'rechtliche_grundlagen', /Bilanzanalyse/i, 'bilanzanalyse', 'Bilanzanalyse')
moveMatching('Finanzwirtschaft', 'rechtliche_grundlagen', /Geschäftsfälle/i, 'aufgaben_der_finanzbuchhaltung', 'Aufgaben der Finanzbuchhaltung')

moveMatching('Marketing_Verkauf', 'fuehrung_personal', /Gesprächsführung|Fragetechnik/i, 'fragetechnik', 'Fragetechnik')
moveMatching('Marketing_Verkauf', 'fuehrung_personal', /Lieferservice/i, 'marketing_verkauf', 'Marketing / Verkauf')
moveMatching('Marketing_Verkauf', 'fuehrung_personal', /Akquise|Telefonakquise/i, 'crm', 'Kundenbeziehungsmanagement (CRM)')
moveMatching('Marketing_Verkauf', 'fuehrung_personal', /Produktentwicklung|Markenführung|Preiskalkulation/i, 'marketing_verkauf', 'Marketing / Verkauf')

moveMatching('Personalmanagement', 'break_even_deckungsbeitrag', /Feedback/i, 'kommunikationsgrundsaetze', 'Kommunikationsgrundsätze')
moveMatching('Personalmanagement', 'break_even_deckungsbeitrag', /Arbeitsaufträge/i, 'fuehrung_personal', 'Führung / Personal')
moveMatching('Personalmanagement', 'rechtliche_grundlagen', /Motivation/i, 'motivationstheorie', 'Motivationstheorie')
moveMatching('Personalmanagement', 'rechtliche_grundlagen', /Berufliche Netzwerke|Künstliche Intelligenz/i, 'informationen_im_berufsfeld_aktuell_halten', 'Informationen im Berufsfeld aktuell halten')
moveMatching('Personalmanagement', 'rechtliche_grundlagen', /Adressatengerechte Kommunikation|schwierigen Situationen/i, 'kommunikationsgrundsaetze', 'Kommunikationsgrundsätze')

moveMatching('Recht_VWL', 'break_even_deckungsbeitrag', /Vertragsrecht|Schuldbetreibungs|Konkurs|Geistiges Eigentum/i, 'rechtliche_grundlagen', 'Rechtliche Grundlagen')
moveMatching('Recht_VWL', 'fuehrung_personal', /Gesellschafts-|Obligationenrecht|Stellvertretung/i, 'rechtliche_grundlagen', 'Rechtliche Grundlagen')
moveMatching('Recht_VWL', 'fuehrung_personal', /Marktversagen/i, 'vwl_grundlagen', 'VWL-Grundlagen')
moveMatching('Recht_VWL', 'fuehrung_personal', /Verteilung|Gerechtigkeit/i, 'verteilung', 'Verteilung')
moveMatching('Recht_VWL', 'fuehrung_personal', /Internationale Wirtschaftskonflikte/i, 'globalisierung', 'Globalisierung')
moveMatching('Recht_VWL', 'marketing_verkauf', /Elastizität|Angebot und Nachfrage/i, 'vwl_grundlagen', 'VWL-Grundlagen')
moveMatching('Recht_VWL', 'marketing_verkauf', /Produkthaftpflicht/i, 'rechtliche_grundlagen', 'Rechtliche Grundlagen')
moveMatching('Recht_VWL', 'rechnung_rechnungspruefung', /Obligationenrecht|Schuldbetreibungs/i, 'rechtliche_grundlagen', 'Rechtliche Grundlagen')
moveMatching('Recht_VWL', 'rechnung_rechnungspruefung', /Mikroökonomische/i, 'vwl_grundlagen', 'VWL-Grundlagen')
moveMatching('Recht_VWL', 'ziele_smart', /Subventionierung|Staatsverschuldung/i, 'fiskalpolitik', 'Fiskalpolitik')
moveMatching('Recht_VWL', 'ziele_smart', /Zielkonflikte/i, 'vwl_grundlagen', 'VWL-Grundlagen')

moveMatching('SCM', 'fuehrung_personal', /Entsorgung/i, 'entsorgungslogistik', 'Entsorgungslogistik')
moveMatching('SCM', 'fuehrung_personal', /Offertwesen/i, 'bestandteile_einer_offerte', 'Bestandteile einer Offerte')
moveMatching('SCM', 'fuehrung_personal', /Normenkonformität/i, 'qualitaet_und_normen', 'Qualität und Normen')
moveMatching('SCM', 'fuehrung_personal', /Lieferverzug/i, 'beschaffung_lieferanten', 'Beschaffung / Lieferanten')
moveMatching('SCM', 'marketing_verkauf', /Infrastruktur beurteilen/i, 'infrastruktur', 'Infrastruktur')
moveMatching('SCM', 'marketing_verkauf', /IT-Fachstelle/i, 'it_infrastruktur', 'IT-Infrastruktur')
moveMatching('SCM', 'marketing_verkauf', /Verpackung/i, 'distribution', 'Distribution')
moveMatching('SCM', 'marketing_verkauf', /Ökologischer Fussabdruck/i, 'oekologische_normen_umsetzen', 'Ökologische Normen umsetzen')
moveMatching('SCM', 'marketing_verkauf', /Produktionsplanung|Produktion|Ressourcenplanung|Kapazitätsplanung/i, 'organisation_prozesse', 'Organisation / Prozesse')
moveMatching('SCM', 'rechnung_rechnungspruefung', /Mängel bei Lieferungen/i, 'warenannahme', 'Warenannahme')
moveMatching('SCM', 'rechnung_rechnungspruefung', /Währungsrisiko/i, 'offertenevaluation', 'Offertenevaluation')
moveMatching('SCM', 'rechnung_rechnungspruefung', /Nachkalkulation/i, 'nachkalkulation', 'Nachkalkulation')
moveMatching('SCM', 'ziele_smart', /Nachhaltigkeit/i, 'oekologische_normen_umsetzen', 'Ökologische Normen umsetzen')
moveMatching('SCM', 'ziele_smart', /Distributionslogistik/i, 'distribution', 'Distribution')
moveMatching('SCM', 'ziele_smart', /Produktkalkulation/i, 'nachkalkulation', 'Nachkalkulation')

moveMatching('Unternehmensfuehrung', 'fuehrung_personal', /Unternehmens- und Umweltanalyse|Unternehmensanalyse|Risk Management|Strategie/i, 'strategie_analyseinstrumente', 'Strategie / Analyseinstrumente')
moveMatching('Unternehmensfuehrung', 'fuehrung_personal', /Aufbauorganisation|Prozesse gestalten/i, 'organisation_prozesse', 'Organisation / Prozesse')
moveMatching('Unternehmensfuehrung', 'fuehrung_personal', /Nachhaltigkeit|^Umwelt$/i, 'umwelt', 'Umwelt')
moveMatching('Unternehmensfuehrung', 'fuehrung_personal', /Technologiemanagement/i, 'technologiemanagement', 'Technologiemanagement')
moveMatching('Unternehmensfuehrung', 'fuehrung_personal', /Projektmanagement|Projektmitarbeitenden|Projektcontrolling/i, 'in_projekten_in_unterschiedlichen_rollen_mitarbeiten', 'In Projekten in unterschiedlichen Rollen mitarbeiten')
moveMatching('Unternehmensfuehrung', 'fuehrung_personal', /Businessplan/i, 'businessplan', 'Businessplan')
moveMatching('Unternehmensfuehrung', 'rechtliche_grundlagen', /Archivierung/i, 'wissensmanagement', 'Wissensmanagement')
moveMatching('Unternehmensfuehrung', 'rechtliche_grundlagen', /Businessplan/i, 'businessplan', 'Businessplan')
moveMatching('Unternehmensfuehrung', 'rechtliche_grundlagen', /Umwelt|Personenwagen/i, 'umwelt', 'Umwelt')
moveMatching('Unternehmensfuehrung', 'rechtliche_grundlagen', /Technologiemanagement/i, 'technologiemanagement', 'Technologiemanagement')
moveMatching('Unternehmensfuehrung', 'rechtliche_grundlagen', /Betriebswirtschaftliche Probleme/i, 'strategie_analyseinstrumente', 'Strategie / Analyseinstrumente')

// Fachgrenzen nach Lerninhalt statt nach fehlerhafter Importüberschrift korrigieren.
for (const card of cards) {
  if (card.fach === 'Unternehmensfuehrung' && card.thema_id === 'break_even_deckungsbeitrag' && /Aufbauorganisation/i.test(card.frage ?? '')) {
    topic(card, 'Unternehmensfuehrung', 'organisation_prozesse', 'Organisation / Prozesse')
    continue
  }
  if (card.thema_id === 'break_even_deckungsbeitrag' && ['Marketing_Verkauf', 'Personalmanagement', 'Recht_VWL', 'Unternehmensfuehrung'].includes(card.fach)) {
    topic(card, 'Finanzwirtschaft', 'break_even_deckungsbeitrag', 'Break-even / Deckungsbeitrag')
    continue
  }
  if (card.fach === 'Marketing_Verkauf' && card.thema_id === 'lager_lagerkennzahlen') {
    if (/Verpackung/i.test(card.frage ?? '')) topic(card, 'Marketing_Verkauf', 'verpackung', 'Verpackung')
    else topic(card, 'SCM', 'lager_lagerkennzahlen', 'Lager / Lagerkennzahlen')
    continue
  }
  if (card.fach === 'Marketing_Verkauf' && card.thema_id === 'liquiditaet_mittelfluss') {
    if (/Offerten|Zahlungskonditionen/i.test(card.frage ?? '')) topic(card, 'Marketing_Verkauf', 'offerterstellung', 'Offerterstellung')
    else topic(card, 'Finanzwirtschaft', 'liquiditaet_mittelfluss', 'Liquidität / Mittelfluss')
    continue
  }
  if (card.fach === 'Finanzwirtschaft' && card.thema_id === 'lager_lagerkennzahlen') {
    if (/Einzel- und Gemeinkosten/i.test(card.frage ?? '')) topic(card, 'Finanzwirtschaft', 'betriebsbuchhaltung', 'Betriebsbuchhaltung')
    else topic(card, 'SCM', 'lager_lagerkennzahlen', 'Lager / Lagerkennzahlen')
    continue
  }
  if (card.fach === 'Personalmanagement' && card.thema_id === 'organisation_prozesse') {
    topic(card, 'Personalmanagement', 'personalbeschaffung', 'Personalbeschaffung')
    continue
  }
  if (card.fach === 'Personalmanagement' && card.thema_id === 'rechnung_rechnungspruefung') {
    topic(card, 'Personalmanagement', 'lohnabrechnung', 'Lohnabrechnung')
  }
}

const crossSubjectIntroMoves = {
  finanzwirtschaft_fuehrung_personal_stufe1_begriff: ['Finanzwirtschaft', 'grundlagen_controlling', 'Grundlagen Controlling'],
  finanzwirtschaft_marketing_verkauf_stufe1_begriff: ['Finanzwirtschaft', 'kalkulation', 'Kalkulation'],
  finanzwirtschaft_rechtliche_grundlagen_stufe1_begriff: ['Recht_VWL', 'rechtliche_grundlagen', 'Rechtliche Grundlagen'],
  marketing_verkauf_fuehrung_personal_stufe1_begriff: ['Personalmanagement', 'fuehrung_personal', 'Führung / Personal'],
  recht_vwl_fuehrung_personal_stufe1_begriff: ['Recht_VWL', 'rechtliche_grundlagen', 'Rechtliche Grundlagen'],
  recht_vwl_marketing_verkauf_stufe1_begriff: ['Recht_VWL', 'rechtliche_grundlagen', 'Rechtliche Grundlagen'],
  recht_vwl_rechnung_rechnungspruefung_stufe1_begriff: ['Recht_VWL', 'rechtliche_grundlagen', 'Rechtliche Grundlagen'],
  recht_vwl_ziele_smart_stufe1_begriff: ['Recht_VWL', 'rechtliche_grundlagen', 'Rechtliche Grundlagen'],
  scm_fuehrung_personal_stufe1_begriff: ['Personalmanagement', 'fuehrung_personal', 'Führung / Personal'],
  scm_marketing_verkauf_stufe1_begriff: ['SCM', 'organisation_prozesse', 'Organisation / Prozesse'],
  scm_rechnung_rechnungspruefung_stufe1_begriff: ['SCM', 'beschaffung_lieferanten', 'Beschaffung / Lieferanten'],
  scm_ziele_smart_stufe1_begriff: ['SCM', 'organisation_prozesse', 'Organisation / Prozesse'],
  unternehmensfuehrung_liquiditaet_mittelfluss_stufe1_begriff: ['Finanzwirtschaft', 'liquiditaet_mittelfluss', 'Liquidität / Mittelfluss'],
  unternehmensfuehrung_rechtliche_grundlagen_stufe1_begriff: ['Recht_VWL', 'rechtliche_grundlagen', 'Rechtliche Grundlagen']
}
for (const [id, [subject, topicId, title]] of Object.entries(crossSubjectIntroMoves)) {
  topic(byId.get(id), subject, topicId, title)
}

// Punktzahl-Sammelkarten der Fallstudie enthalten ohne Ausgangslage keine lösbare Lernfrage.
cards = cards.filter((card) => !(
  card.fach === 'Integrierte_Fallstudie'
  && (/^\d+_punkte$/.test(card.thema_id) || card.thema_id === '2024')
))
cards = cards.filter((card) => !(
  card.fach === 'Integrierte_Fallstudie' && card.thema_id === 'rechtliche_grundlagen'
))

// Verwaiste, fachlich falsche Einführungen entfernen. Die korrekten Zielthemen besitzen eigene Einführungen.
const obsoleteIntros = new Set([
  'finanzwirtschaft_beschaffung_lieferanten_stufe1_begriff',
  'recht_vwl_beschaffung_lieferanten_stufe1_begriff'
])
cards = cards.filter((card) => !obsoleteIntros.has(card.id))

// Unbrauchbare Budget-Musterlösung durch eine vollständige, lösbare Plausibilitätsaufgabe ersetzen.
const budgetCard = byId.get('pr2024_finanzwirtschaft_2_1_loesungspunkte_stufe3')
Object.assign(budgetCard, {
  typ: 'single_choice',
  lernziel: 'Ein Umsatzbudget anhand von Mengen- und Preisänderungen plausibilisieren.',
  frage: "Der Vorjahresumsatz beträgt CHF 1'200'000. Für das Budgetjahr werden 8 % weniger Absatzmenge und 3 % höhere Verkaufspreise erwartet. Welcher budgetierte Umsatz ist rechnerisch plausibel?",
  antwort_daten: {
    optionen: ["CHF 1'137'120", "CHF 1'140'000", "CHF 1'260'000", "CHF 1'104'000"],
    richtig_index: 0
  },
  aufgaben_hinweis: 'Mengen- und Preiseffekt müssen nacheinander auf den Vorjahresumsatz angewendet werden.',
  erklaerung: "CHF 1'200'000 × 0.92 × 1.03 = CHF 1'137'120.",
  loesungsvorschlag: {
    kurz: "CHF 1'137'120",
    rechenweg: "CHF 1'200'000 × 92 % × 103 % = CHF 1'137'120",
    warum: 'Ein Rückgang der Menge und ein Anstieg des Preises wirken multiplikativ, nicht durch simples Verrechnen der Prozentpunkte.'
  },
  fehlerfallen: ['Prozentänderungen nur addieren oder subtrahieren.', 'Den Preiseffekt auf die ursprüngliche statt auf die reduzierte Menge anwenden.'],
  merksatz: 'Menge mal Preis ergibt Umsatz – beide Veränderungen wirken nacheinander.'
})

// Die ursprüngliche Bilanz-Zuordnung war fälschlich als Einfachauswahl importiert.
const balanceMatch = byId.get('pr2024_finanzwirtschaft_1_16_thema_stufe3')
Object.assign(balanceMatch, {
  typ: 'zuordnung',
  lernziel: 'Konten den vier Hauptgruppen der Bilanz zuordnen.',
  frage: 'Ordne jeder Bilanzgruppe das passende Konto zu.',
  antwort_daten: {
    links: ['Umlaufvermögen', 'Anlagevermögen', 'Fremdkapital', 'Eigenkapital'],
    rechts: ['Jahresgewinn', 'Vorauszahlung an Lieferanten', 'Bankverbindlichkeit', 'Maschinen'],
    richtige_paare: [[0, 1], [1, 3], [2, 2], [3, 0]],
    mehrfachverwendung: false
  },
  aufgaben_hinweis: 'Aktiven zeigen die Mittelverwendung, Passiven die Finanzierung.',
  erklaerung: 'Vorauszahlungen sind kurzfristige Vermögenswerte, Maschinen Anlagevermögen, Bankverbindlichkeiten Fremdkapital und der Jahresgewinn erhöht das Eigenkapital.',
  loesungsvorschlag: { kurz: 'A–2, B–4, C–3, D–1', warum: 'Jedes Konto gehört nach wirtschaftlichem Inhalt in genau eine Hauptgruppe.' },
  fehlerfallen: [],
  merksatz: 'Aktiven: Wo steckt das Geld? Passiven: Woher kommt es?'
})

function baseCard({ id, title, stage, type, intro, question, answer, explanation, hint }) {
  return {
    id,
    fach: 'Finanzwirtschaft',
    thema_id: id.replace(/_stufe\d+$/, '').replace(/^formel_/, ''),
    thema: title,
    quelle: { typ: 'formelliste', dokument: '09_Formelliste_TK2026.md' },
    stufe: stage,
    typ: type,
    lernziel: `${title} auswählen, aus Jahresabschlusspositionen aufbauen und interpretieren.`,
    begriff_erklaerung: { kurz: intro, pruefungsrelevant: 'In der Prüfung müssen die richtigen Positionen aus Bilanz oder Erfolgsrechnung ausgewählt und das Resultat fachlich interpretiert werden.' },
    frage: question,
    antwort_daten: answer,
    ...(hint ? { aufgaben_hinweis: hint } : {}),
    erklaerung: explanation,
    abschlusserklaerung: explanation,
    loesungsvorschlag: { kurz: explanation, warum: explanation },
    fehlerfallen: [],
    merksatz: explanation,
    review: {},
    tags: ['formel', 'jahresabschluss', `stufe_${stage}`]
  }
}

const common = [
  { id: 'fluessige_mittel', label: "Flüssige Mittel · CHF 120'000" },
  { id: 'forderungen', label: "Forderungen · CHF 180'000" },
  { id: 'vorrat', label: "Vorräte · CHF 300'000" },
  { id: 'umlaufvermoegen', label: "Umlaufvermögen · CHF 600'000" },
  { id: 'maschinen', label: "Maschinen · CHF 420'000" },
  { id: 'anlagevermoegen', label: "Anlagevermögen · CHF 700'000" },
  { id: 'gesamtkapital', label: "Bilanzsumme / Gesamtkapital · CHF 1'300'000" },
  { id: 'verbindlichkeiten', label: "Verbindlichkeiten · CHF 160'000" },
  { id: 'kurzfristiges_fk', label: "Kurzfristiges FK · CHF 300'000" },
  { id: 'langfristiges_fk', label: "Langfristiges FK · CHF 400'000" },
  { id: 'fremdkapital', label: "Fremdkapital · CHF 700'000" },
  { id: 'eigenkapital', label: "Eigenkapital · CHF 600'000" },
  { id: 'aktienkapital', label: "Aktienkapital · CHF 400'000" },
  { id: 'reserven', label: "Reserven · CHF 110'000" },
  { id: 'reingewinn', label: "Reingewinn · CHF 90'000" },
  { id: 'ebit', label: "EBIT · CHF 150'000" },
  { id: 'fk_zinsen', label: "Fremdkapitalzinsen · CHF 20'000" },
  { id: 'nettoerloes', label: "Nettoerlös · CHF 1'800'000" },
  { id: 'personalaufwand', label: "Personalaufwand · CHF 420'000" },
  { id: 'ist_umsatz', label: "Ist-Umsatz · CHF 1'800'000" },
  { id: 'bep_umsatz', label: "BEP-Umsatz · CHF 1'350'000" },
  { id: 'geteilt', label: '÷' },
  { id: 'plus', label: '+' },
  { id: 'minus', label: '−' },
  { id: 'mal_hundert', label: '× 100' }
]

const formulas = [
  { id: 'liquiditaetsgrad_1', title: 'Liquiditätsgrad I', formula: 'Flüssige Mittel ÷ kurzfristiges Fremdkapital × 100', sequence: ['fluessige_mittel', 'geteilt', 'kurzfristiges_fk', 'mal_hundert'], result: 40, meaning: 'Er zeigt, welcher Anteil der kurzfristigen Schulden sofort mit flüssigen Mitteln bezahlt werden könnte.', benchmark: 'Als grober Richtbereich gelten oft 20–30 %. Ein deutlich höherer Wert kann Sicherheit bedeuten, aber auch unproduktiv gebundene Liquidität.', interpretation: '40 % liegen über dem üblichen Richtbereich: Die sofortige Zahlungsfähigkeit ist komfortabel, gleichzeitig sollte überschüssige Liquidität geprüft werden.' },
  { id: 'liquiditaetsgrad_2', title: 'Liquiditätsgrad II', formula: '(Flüssige Mittel + Forderungen) ÷ kurzfristiges Fremdkapital × 100', sequence: ['fluessige_mittel', 'plus', 'forderungen', 'geteilt', 'kurzfristiges_fk', 'mal_hundert'], result: 100, meaning: 'Er zeigt, ob kurzfristige Schulden ohne Verkauf der Vorräte durch flüssige Mittel und Forderungen gedeckt sind.', benchmark: 'Mindestens 100 % gelten häufig als Zielwert, weil dann das kurzfristige Fremdkapital ohne Vorratsverkauf gedeckt ist.', interpretation: '100 % entsprechen dem häufig genannten Mindestziel: Das kurzfristige Fremdkapital ist ohne Verkauf der Vorräte genau gedeckt.' },
  { id: 'liquiditaetsgrad_3', title: 'Liquiditätsgrad III', formula: 'Umlaufvermögen ÷ kurzfristiges Fremdkapital × 100', sequence: ['umlaufvermoegen', 'geteilt', 'kurzfristiges_fk', 'mal_hundert'], result: 200, meaning: 'Er vergleicht das gesamte Umlaufvermögen einschließlich Vorräten mit dem kurzfristigen Fremdkapital.', benchmark: 'Als grober Richtbereich werden oft 150–200 % verwendet; zu hohe Werte können auf hohe Vorräte oder ineffiziente Mittelbindung hinweisen.', interpretation: '200 % liegen am oberen Rand des üblichen Richtbereichs: Die kurzfristige Deckung ist stark, die Zusammensetzung des Umlaufvermögens bleibt zu prüfen.' },
  { id: 'eigenfinanzierungsgrad', title: 'Eigenfinanzierungsgrad', formula: 'Eigenkapital ÷ Gesamtkapital × 100', sequence: ['eigenkapital', 'geteilt', 'gesamtkapital', 'mal_hundert'], result: 46.2, meaning: 'Er zeigt, welcher Anteil des gesamten Unternehmenskapitals von den Eigentümern finanziert ist.', benchmark: '30–50 % gelten häufig als solider Orientierungsbereich; Branchenrisiko und Geschäftsmodell müssen mitbeurteilt werden.', interpretation: '46.2 % liegen im häufig genannten soliden Bereich: Das Unternehmen verfügt über eine gute Eigenkapitalbasis.' },
  { id: 'fremdfinanzierungsgrad', title: 'Fremdfinanzierungsgrad', formula: 'Fremdkapital ÷ Gesamtkapital × 100', sequence: ['fremdkapital', 'geteilt', 'gesamtkapital', 'mal_hundert'], result: 53.8, meaning: 'Er zeigt, welcher Anteil des Gesamtkapitals von externen Fremdkapitalgebern stammt.', benchmark: 'Eigen- und Fremdfinanzierungsgrad ergeben zusammen 100 %. Ein höherer Fremdanteil erhöht meist Zins- und Rückzahlungsabhängigkeit.', interpretation: '53.8 % des Kapitals stammen von Fremdkapitalgebern. Zusammen mit 46.2 % Eigenkapital ist die Finanzierung relativ ausgewogen.' },
  { id: 'verschuldungsgrad', title: 'Verschuldungsgrad', formula: 'Fremdkapital ÷ Eigenkapital × 100', sequence: ['fremdkapital', 'geteilt', 'eigenkapital', 'mal_hundert'], result: 116.7, meaning: 'Er zeigt das Verhältnis von Fremdkapital zu Eigenkapital und damit die finanzielle Hebelwirkung und Abhängigkeit.', benchmark: 'Es gibt keinen universellen Idealwert. Ein steigender Wert bedeutet grundsätzlich mehr Fremdfinanzierung und damit meist mehr finanzielles Risiko.', interpretation: '116.7 % bedeuten: Auf CHF 100 Eigenkapital entfallen CHF 116.70 Fremdkapital. Das Fremdkapital ist etwas höher als das Eigenkapital.' },
  { id: 'anlagedeckungsgrad_1', title: 'Anlagedeckungsgrad I', formula: 'Eigenkapital ÷ Anlagevermögen × 100', sequence: ['eigenkapital', 'geteilt', 'anlagevermoegen', 'mal_hundert'], result: 85.7, meaning: 'Er zeigt, wie viel des langfristig gebundenen Anlagevermögens allein durch Eigenkapital finanziert ist.', benchmark: 'Häufig werden 75–100 % als Orientierung verwendet. Je näher bei 100 %, desto stärker ist das Anlagevermögen durch Eigenkapital gedeckt.', interpretation: '85.7 % liegen im häufig verwendeten Orientierungsbereich: Ein großer Teil des Anlagevermögens ist durch Eigenkapital finanziert.' },
  { id: 'anlagedeckungsgrad_2', title: 'Anlagedeckungsgrad II', formula: '(Eigenkapital + langfristiges Fremdkapital) ÷ Anlagevermögen × 100', sequence: ['eigenkapital', 'plus', 'langfristiges_fk', 'geteilt', 'anlagevermoegen', 'mal_hundert'], result: 142.9, meaning: 'Er zeigt, ob langfristig gebundenes Anlagevermögen vollständig mit langfristigem Kapital finanziert ist.', benchmark: 'Mindestens 100 % erfüllen die goldene Bilanzregel; der langfristige Kapitalüberschuss finanziert dann zusätzlich einen Teil des Umlaufvermögens.', interpretation: '142.9 % liegen klar über 100 %: Die goldene Bilanzregel ist erfüllt und langfristiges Kapital deckt zusätzlich Umlaufvermögen.' },
  { id: 'roi', title: 'ROI (Gesamtkapitalrendite)', formula: '(Reingewinn + Fremdkapitalzinsen) ÷ Gesamtkapital × 100', sequence: ['reingewinn', 'plus', 'fk_zinsen', 'geteilt', 'gesamtkapital', 'mal_hundert'], result: 8.5, meaning: 'Der ROI zeigt, wie rentabel das gesamte eingesetzte Kapital arbeitet – unabhängig davon, ob es von Eigentümern oder Fremdkapitalgebern stammt.', benchmark: 'Über 8–10 % gelten oft als gute Orientierung. Entscheidend sind aber Branche, Risiko und Kapitalkosten. Fremdkapitalzinsen werden addiert, weil sie Ertrag der Fremdkapitalgeber sind.', interpretation: '8.5 % liegen im häufig genannten guten Orientierungsbereich. Das Gesamtkapital wird ordentlich verzinst, sollte aber mit Branche und Kapitalkosten verglichen werden.' },
  { id: 'roe', title: 'ROE (Eigenkapitalrendite)', formula: 'Reingewinn ÷ Eigenkapital × 100', sequence: ['reingewinn', 'geteilt', 'eigenkapital', 'mal_hundert'], result: 15, meaning: 'Der ROE zeigt, wie stark sich das von den Eigentümern eingesetzte Eigenkapital durch den Reingewinn verzinst.', benchmark: 'Der Zielwert ist branchen- und risikoabhängig. Ein ROE über dem ROI kann durch Fremdkapitaleinsatz entstehen, bringt aber zusätzliches Risiko.', interpretation: '15 % bedeuten eine gute Verzinsung des Eigenkapitals. Ob der Wert angemessen ist, hängt von Branche, Risiko und Fremdfinanzierung ab.' },
  { id: 'nettogewinnquote', title: 'Nettogewinnquote', formula: 'Reingewinn ÷ Nettoerlös × 100', sequence: ['reingewinn', 'geteilt', 'nettoerloes', 'mal_hundert'], result: 5, meaning: 'Sie zeigt, wie viel Reingewinn nach Zinsen und Steuern von CHF 100 Nettoerlös übrig bleibt.', benchmark: 'Es gibt keinen allgemeinen Idealwert. Aussagekräftig sind Branchen-, Budget- und Zeitvergleich; eine steigende Quote ist meist positiv.', interpretation: '5 % bedeuten: Von CHF 100 Nettoerlös bleiben CHF 5 Reingewinn. Die Qualität des Werts lässt sich erst im Branchen- und Zeitvergleich beurteilen.' },
  { id: 'ebit_marge', title: 'EBIT-Marge', formula: 'EBIT ÷ Nettoerlös × 100', sequence: ['ebit', 'geteilt', 'nettoerloes', 'mal_hundert'], result: 8.3, meaning: 'Sie zeigt die operative Ertragskraft vor Fremdkapitalzinsen und Steuern und trennt damit Betriebserfolg von Finanzierung und Steuerbelastung.', benchmark: 'Der Richtwert ist stark branchenabhängig. Eine steigende EBIT-Marge zeigt grundsätzlich eine verbesserte operative Profitabilität.', interpretation: '8.3 % operative Marge müssen mit Branche und Vorjahren verglichen werden. Der Wert zeigt noch nicht den Reingewinn nach Zinsen und Steuern.' },
  { id: 'kapitalumschlag', title: 'Kapitalumschlag', formula: 'Nettoerlös ÷ Gesamtkapital', sequence: ['nettoerloes', 'geteilt', 'gesamtkapital'], result: 1.38, unit: '×', meaning: 'Er zeigt, wie viel Nettoerlös mit jedem eingesetzten Franken Gesamtkapital erwirtschaftet wird.', benchmark: 'Ein Wert über 1 wird oft als kapitalintensitätsabhängige Orientierung verwendet. Ein höherer Umschlag ist meist effizienter, muss aber zur Branche passen.', interpretation: '1.38-mal bedeutet: Jeder eingesetzte Kapitalfranken erzeugt CHF 1.38 Nettoerlös. Für eine Qualitätsaussage braucht es den Branchenvergleich.' },
  { id: 'sicherheitsmarge', title: 'Sicherheitsmarge', formula: '(Ist-Umsatz − Break-even-Umsatz) ÷ Ist-Umsatz × 100', sequence: ['ist_umsatz', 'minus', 'bep_umsatz', 'geteilt', 'ist_umsatz', 'mal_hundert'], result: 25, meaning: 'Sie zeigt, um wie viel Prozent der aktuelle Umsatz sinken darf, bevor die Gewinnschwelle erreicht wird.', benchmark: 'Je höher die Sicherheitsmarge, desto robuster ist das Geschäft gegenüber Umsatzrückgängen. Ein sehr kleiner Wert weist auf ein hohes Verlustrisiko hin.', interpretation: '25 % bedeuten: Der Umsatz kann um ein Viertel sinken, bevor die Gewinnschwelle erreicht wird. Das bietet einen spürbaren, aber nicht unbegrenzten Puffer.' }
]

const formulaTopicIds = new Set(formulas.map(({ id }) => id))
cards = cards.filter((card) => !(card.fach === 'Finanzwirtschaft' && formulaTopicIds.has(card.thema_id)))

const balanceAssets = ['fluessige_mittel', 'forderungen', 'vorrat', 'umlaufvermoegen', 'maschinen', 'anlagevermoegen', 'gesamtkapital']
const balanceLiabilities = ['verbindlichkeiten', 'kurzfristiges_fk', 'langfristiges_fk', 'fremdkapital', 'aktienkapital', 'reserven', 'eigenkapital']
const incomeStatement = ['nettoerloes', 'personalaufwand', 'ebit', 'fk_zinsen', 'reingewinn', 'ist_umsatz', 'bep_umsatz']
const formulaChoices = [
  'Flüssige Mittel ÷ kurzfristiges Fremdkapital × 100',
  'Umlaufvermögen ÷ kurzfristiges Fremdkapital × 100',
  'Eigenkapital ÷ Gesamtkapital × 100',
  'Fremdkapital ÷ Eigenkapital × 100',
  'Reingewinn ÷ Eigenkapital × 100',
  '(Reingewinn + Fremdkapitalzinsen) ÷ Gesamtkapital × 100',
  'EBIT ÷ Nettoerlös × 100',
  'Nettoerlös ÷ Gesamtkapital'
]

for (const { id, title, formula, sequence, result, unit = '%', meaning, benchmark, interpretation } of formulas) {
  const profitNote = /roi|roe|nettogewinnquote|ebit_marge/.test(id)
    ? ' Reingewinn ist der Erfolg nach Zinsen und Steuern; EBIT ist der operative Erfolg vor Zinsen und Steuern.'
    : ''
  const intro = `${title} zeigt eine klar abgegrenzte finanzielle Beziehung. Entscheidend ist, welche Position oben und welche unten in die Formel gehört.${profitNote}`
  const distractors = [formula, ...formulaChoices.filter((choice) => choice !== formula)].slice(0, 4)
  const uniqueOptions = [...new Set(distractors)]
  const assets = balanceAssets
  const liabilities = balanceLiabilities
  const income = incomeStatement
  const needed = new Set([...assets, ...liabilities, ...income, ...sequence, 'geteilt', 'plus', 'minus', 'mal_hundert'])
  const blocks = common.filter((item) => needed.has(item.id))

  const stage1 = baseCard({ id: `formel_${id}_stufe1`, title, stage: 1, type: 'single_choice', intro, question: `Welche Formel berechnet ${title}?`, answer: { optionen: uniqueOptions, richtig_index: uniqueOptions.indexOf(formula) }, explanation: formula })
  stage1.thema_id = id

  const stage2 = baseCard({ id: `formel_${id}_stufe2`, title, stage: 2, type: 'multiple_choice', intro, question: `Welche Aussagen erklären die Aussagekraft und Beurteilung von ${title} richtig?`, answer: { optionen: [meaning, benchmark, 'Die Kennzahl zeigt den absoluten Reingewinn direkt in Franken.', 'Die Kennzahl kann ohne Branchen-, Zeit- oder Risikovergleich abschließend beurteilt werden.'], richtige_indices: [0, 1] }, explanation: `${meaning} ${benchmark}` })
  stage2.thema_id = id

  const stage3 = baseCard({ id: `formel_${id}_stufe3`, title, stage: 3, type: 'formel_builder', intro, question: `Wähle aus Bilanz und Erfolgsrechnung nur die benötigten Positionen und setze daraus ${title} zusammen.`, answer: { bausteine: blocks, richtige_reihenfolge: sequence, bilanz: { aktiven: assets, passiven: liabilities, erfolgsrechnung: income }, formel: formula, ergebnis: { automatisch: true, richtiger_wert: result, toleranz: 0.1, einheit: unit, rechenbasis: 'Die App berechnet das Resultat aus den angezeigten Werten.' } }, explanation: interpretation, hint: 'Nicht alle angezeigten Konten und Rechenzeichen gehören in die Formel. Das Resultat wird nach dem korrekten Aufbau automatisch berechnet.' })
  stage3.thema_id = id

  const stage4 = baseCard({ id: `formel_${id}_stufe4`, title, stage: 4, type: 'single_choice', intro, question: `Das berechnete Resultat beträgt ${result}${unit === '×' ? '-mal' : ' %'}. Wie ist dieses Ergebnis fachlich zu beurteilen?`, answer: { optionen: [interpretation, 'Der Wert ist automatisch optimal, weil jede positive Kennzahl gut ist.', 'Der Wert beweist unabhängig von Branche und Entwicklung eine schlechte Gesamtlage.', 'Aus dieser Kennzahl allein lässt sich der absolute Reingewinn direkt ablesen.'], richtig_index: 0 }, explanation: interpretation })
  stage4.thema_id = id
  cards.push(stage1, stage2, stage3, stage4)
}

// Das doppelte und zu einfache Vorsorgethema wird durch eine anspruchsvollere Lernfolge ersetzt.
cards = cards.filter((card) => !(
  card.fach === 'Personalmanagement'
  && ['3_saeulen_prinzip', 'schweizerisches_vorsorgesystem'].includes(card.thema_id)
))

const pensionIntro = 'Das Schweizer Vorsorgesystem verteilt die Absicherung bei Alter, Invalidität und Tod auf staatliche, berufliche und private Vorsorge. Die Säulen unterscheiden sich nach Zweck, Finanzierung und Verbindlichkeit.'
const pensionBase = {
  fach: 'Personalmanagement',
  thema_id: '3_saeulen_prinzip',
  thema: 'Schweizerisches 3-Säulen-System',
  quelle: { typ: 'fachlich_ueberarbeitete_lernkarte' },
  lernziel: 'Zweck, Finanzierung und Zusammenspiel der drei Säulen in anspruchsvollen Fällen unterscheiden.',
  begriff_erklaerung: {
    kurz: pensionIntro,
    pruefungsrelevant: 'In Prüfungsfällen müssen Vorsorgeinstrumente der richtigen Säule zugeordnet und Versorgungslücken sachgerecht beurteilt werden.'
  },
  fehlerfallen: [],
  review: {},
  tags: ['vorsorge', '3_saeulen', 'personalmanagement']
}
cards.push(
  {
    ...pensionBase,
    id: 'personalmanagement_3_saeulen_system_stufe1',
    stufe: 1,
    typ: 'single_choice',
    frage: 'Welche Beschreibung grenzt die drei Säulen fachlich korrekt voneinander ab?',
    antwort_daten: {
      optionen: [
        'Die AHV/IV sichert als 1. Säule die Existenz; die berufliche Vorsorge ergänzt als 2. Säule den bisherigen Lebensstandard; die private Vorsorge schliesst als 3. Säule individuelle Lücken.',
        'Die 1. Säule besteht aus freiwilligem Banksparen, während AHV und Pensionskasse gemeinsam zur 3. Säule gehören.',
        'Die berufliche Vorsorge ersetzt die AHV vollständig und ist deshalb für jede Person ohne Ausnahme die einzige obligatorische Säule.',
        'Die Säulen unterscheiden sich nur durch ihre Anbieter; Zweck, Finanzierung und gesetzliche Grundlage sind identisch.'
      ],
      richtig_index: 0
    },
    erklaerung: 'Die drei Säulen ergänzen einander: Existenzsicherung, Fortsetzung der gewohnten Lebenshaltung und individuelle Zusatzvorsorge.',
    merksatz: '1. Säule: Existenz sichern; 2. Säule: Lebensstandard ergänzen; 3. Säule: persönliche Lücken schliessen.'
  },
  {
    ...pensionBase,
    id: 'personalmanagement_3_saeulen_system_stufe2',
    stufe: 2,
    typ: 'multiple_choice',
    frage: 'Welche Aussagen zu Finanzierung und Ausgestaltung des 3-Säulen-Systems sind richtig?',
    antwort_daten: {
      optionen: [
        'Die AHV wird im Umlageverfahren finanziert: Laufende Einnahmen finanzieren grundsätzlich laufende Renten.',
        'Die berufliche Vorsorge arbeitet grundsätzlich im Kapitaldeckungsverfahren und baut persönliches Altersguthaben auf.',
        'Zur gebundenen Selbstvorsorge 3a gehören freiwillige Einzahlungen mit gesetzlichen Verfügungsbeschränkungen und möglichen Steuervergünstigungen.',
        'Die freie Vorsorge 3b ist für sämtliche Erwerbstätigen obligatorisch und darf ausschliesslich bei Pensionierung bezogen werden.',
        'Alle Leistungen der drei Säulen werden vollständig vom Staat finanziert.'
      ],
      richtige_indices: [0, 1, 2]
    },
    erklaerung: 'Die Finanzierungsverfahren und die Verfügbarkeit unterscheiden sich wesentlich. AHV, Pensionskasse sowie Säule 3a/3b dürfen nicht gleichgesetzt werden.',
    merksatz: 'Umlage bei der AHV, Kapitaldeckung bei der Pensionskasse, individuelle Vorsorge in der 3. Säule.'
  },
  {
    ...pensionBase,
    id: 'personalmanagement_3_saeulen_system_stufe3',
    stufe: 3,
    typ: 'zuordnung',
    frage: 'Ordne jedes konkrete Vorsorgeinstrument der passenden Säule zu.',
    antwort_daten: {
      links: ['AHV und IV', 'Pensionskasse nach BVG', 'Gebundene Vorsorge 3a', 'Freie Vorsorge 3b'],
      rechts: ['1. Säule – staatliche Vorsorge', '2. Säule – berufliche Vorsorge', '3. Säule – steuerlich gebundene private Vorsorge', '3. Säule – freie private Vorsorge'],
      richtige_paare: [[0, 0], [1, 1], [2, 2], [3, 3]],
      mehrfachverwendung: false
    },
    erklaerung: 'AHV/IV gehören zur staatlichen, die Pensionskasse zur beruflichen und 3a sowie 3b zur privaten Vorsorge.',
    merksatz: '3a ist gebunden, 3b ist frei – beide gehören zur privaten 3. Säule.'
  },
  {
    ...pensionBase,
    id: 'personalmanagement_3_saeulen_system_stufe4',
    stufe: 4,
    typ: 'single_choice',
    frage: 'Eine angestellte Person erwartet trotz AHV und Pensionskasse eine Vorsorgelücke und möchte freiwillig steuerbegünstigt sparen. Welche Beurteilung ist richtig?',
    antwort_daten: {
      optionen: [
        'Eine Einzahlung in die Säule 3a kann die individuelle Vorsorgelücke ergänzen; Verfügbarkeit und Abzugsmöglichkeiten richten sich nach den gesetzlichen Bedingungen.',
        'Zusätzliche Einzahlungen gehören zwingend zur 1. Säule, weil jede private Vorsorge Bestandteil der AHV ist.',
        'Die Person muss in die freie Säule 3b einzahlen, da nur diese gesetzlich gebunden und steuerlich privilegiert ist.',
        'Eine Vorsorgelücke kann nicht privat ergänzt werden, sobald bereits Beiträge an AHV und Pensionskasse geleistet werden.'
      ],
      richtig_index: 0
    },
    erklaerung: 'Die Säule 3a dient der freiwilligen, gebundenen Selbstvorsorge. Sie ergänzt AHV und berufliche Vorsorge, ersetzt sie aber nicht.',
    merksatz: 'Erst Leistungen aus Säule 1 und 2 beurteilen, dann eine persönliche Lücke gezielt mit Säule 3 ergänzen.'
  }
)

// Metafragen und reine Themen-Erkennungsfragen werden durch fachlich konkrete Fragen ersetzt.
const metaQuestionPattern = /Welche Punkte passen zur Musterlösung dieser Prüfungsaufgabe\?/i
const weakTopicQuestionPattern = /Welches Thema wird hier primär geprüft\?/i
const isImportedWeakCard = (card) => (
  metaQuestionPattern.test(card.frage ?? '')
  || (card.tags ?? []).includes('fachfrage_statt_metafrage')
  || weakTopicQuestionPattern.test(card.frage ?? '')
  || (card.tags ?? []).includes('fachfrage_statt_themenabfrage')
)
const candidatesByTopic = new Map()
for (const card of cards) {
  if (isImportedWeakCard(card)) continue
  if (!['single_choice', 'multiple_choice', 'zuordnung', 'reihenfolge', 'formel_luecke_mc', 'formel_builder'].includes(card.typ)) continue
  const key = `${card.fach}::${card.thema_id}`
  if (!candidatesByTopic.has(key)) candidatesByTopic.set(key, [])
  candidatesByTopic.get(key).push(card)
}

const unresolvedWeakCards = []
for (const card of cards) {
  if (!isImportedWeakCard(card)) continue
  const replacementTag = metaQuestionPattern.test(card.frage ?? '') || (card.tags ?? []).includes('fachfrage_statt_metafrage')
    ? 'fachfrage_statt_metafrage'
    : 'fachfrage_statt_themenabfrage'
  const key = `${card.fach}::${card.thema_id}`
  const candidates = (candidatesByTopic.get(key) ?? [])
    .filter((candidate) => candidate.id !== card.id)
    .sort((a, b) => (b.stufe ?? 1) - (a.stufe ?? 1) || a.id.localeCompare(b.id))
  const introSources = candidates.filter((candidate) => candidate.stufe === 1 && candidate.typ === 'single_choice')
  const introSource = introSources[hashString(card.id) % Math.max(introSources.length, 1)]
  const source = introSource ?? candidates[hashString(card.id) % Math.max(candidates.length, 1)]
  if (!source) {
    unresolvedWeakCards.push(card.id)
    continue
  }

  const sourceOptions = source.antwort_daten?.optionen
  const sourceCorrectIndex = source.antwort_daten?.richtig_index
  const correctStatement = sourceOptions?.[sourceCorrectIndex]
  const supportingCandidates = [
    source.erklaerung,
    source.abschlusserklaerung,
    source.merksatz,
    source.begriff_erklaerung?.kurz,
    source.begriff_erklaerung?.pruefungsrelevant
  ].filter((value) => value && value !== correctStatement)
  const supportingStatement = supportingCandidates[hashString(`${card.id}:support`) % Math.max(supportingCandidates.length, 1)]
  const incorrectStatements = sourceOptions?.filter((_, index) => index !== sourceCorrectIndex) ?? []

  if (source.typ === 'single_choice' && correctStatement && supportingStatement && incorrectStatements.length >= 2) {
    const incorrectShift = hashString(`${card.id}:incorrect`) % incorrectStatements.length
    const rotatedIncorrect = [...incorrectStatements.slice(incorrectShift), ...incorrectStatements.slice(0, incorrectShift)]
    const replacementOptions = [correctStatement, supportingStatement, ...rotatedIncorrect.slice(0, 2)]
    const shift = hashString(card.id) % replacementOptions.length
    const questionVariants = [
      `Welche zwei Aussagen erklären „${card.thema}“ fachlich richtig?`,
      `Welche beiden Aussagen beschreiben „${card.thema}“ fachlich korrekt?`,
      `Welche zwei Grundsätze zu „${card.thema}“ sind richtig?`,
      `Welche beiden Aussagen müssen bei „${card.thema}“ beachtet werden?`
    ]
    card.typ = 'multiple_choice'
    card.frage = questionVariants[hashString(`${card.id}:question`) % questionVariants.length]
    card.antwort_daten = {
      optionen: [...replacementOptions.slice(shift), ...replacementOptions.slice(0, shift)],
      richtige_indices: [((0 - shift) % 4 + 4) % 4, ((1 - shift) % 4 + 4) % 4].sort((a, b) => a - b)
    }
    card.aufgaben_hinweis = 'Beurteile jede Aussage einzeln nach ihrer fachlichen Richtigkeit.'
    card.erklaerung = `${correctStatement} ${supportingStatement}`
  } else {
    card.typ = source.typ
    card.frage = source.frage
    card.antwort_daten = JSON.parse(JSON.stringify(source.antwort_daten))
    card.aufgaben_hinweis = source.aufgaben_hinweis
    card.erklaerung = source.erklaerung
      ?? source.abschlusserklaerung
      ?? 'Die fachlich richtige Lösung ergibt sich aus den Grundsätzen dieses Themas.'
  }
  card.abschlusserklaerung = card.erklaerung
  card.loesungsvorschlag = { kurz: card.erklaerung, warum: card.erklaerung }
  card.fehlerfallen = []
  card.merksatz = source.merksatz ?? card.erklaerung
  card.lernziel = `Eine fachlich konkrete Aufgabe zu ${card.thema} lösen.`
  card.tags = [...new Set([...(card.tags ?? []), replacementTag])]
}
if (unresolvedWeakCards.length) {
  throw new Error(`Keine fachliche Ersatzfrage gefunden für: ${unresolvedWeakCards.join(', ')}`)
}

function setSingleChoice(id, {
  fach,
  themaId,
  thema,
  frage,
  richtig,
  falsch,
  erklaerung
}) {
  const card = byId.get(id)
  if (!card) throw new Error(`Karte für Qualitätskorrektur fehlt: ${id}`)
  if (fach && themaId && thema) topic(card, fach, themaId, thema)
  card.typ = 'single_choice'
  card.frage = frage
  card.antwort_daten = { optionen: [richtig, ...falsch], richtig_index: 0 }
  card.erklaerung = erklaerung
  card.abschlusserklaerung = erklaerung
  card.loesungsvorschlag = { kurz: erklaerung, warum: erklaerung }
  card.merksatz = erklaerung
  card.fehlerfallen = []
  card.tags = [...new Set([...(card.tags ?? []), 'vollpruefung_2026_07_23'])]
}

function setMultipleChoice(id, {
  fach,
  themaId,
  thema,
  frage,
  richtig,
  falsch,
  erklaerung
}) {
  const card = byId.get(id)
  if (!card) throw new Error(`Karte für Qualitätskorrektur fehlt: ${id}`)
  if (fach && themaId && thema) topic(card, fach, themaId, thema)
  card.typ = 'multiple_choice'
  card.frage = frage
  card.antwort_daten = {
    optionen: [...richtig, ...falsch],
    richtige_indices: richtig.map((_, index) => index)
  }
  card.aufgaben_hinweis = 'Beurteile jede Aussage einzeln nach ihrer fachlichen Richtigkeit.'
  card.erklaerung = erklaerung
  card.abschlusserklaerung = erklaerung
  card.loesungsvorschlag = { kurz: erklaerung, warum: erklaerung }
  card.merksatz = erklaerung
  card.fehlerfallen = []
  card.tags = [...new Set([...(card.tags ?? []), 'vollpruefung_2026_07_23'])]
}

// Abgeschnittene PDF-Überschriften und reine Themenabfragen werden zu
// konkreten, lösbaren Lernaufgaben mit einem eindeutigen Lernziel.
setSingleChoice('finanzwirtschaft_break_even_deckungsbeitrag_stufe1_begriff', {
  frage: 'Ein Betrieb möchte wissen, ab welcher Absatzmenge weder Gewinn noch Verlust entsteht. Welche Kennzahl wird gesucht?',
  richtig: 'Die Break-even-Menge.',
  falsch: ['Der Liquiditätsgrad 2.', 'Die durchschnittliche Lagerdauer.', 'Der Personalaufwand pro Stelle.'],
  erklaerung: 'Die Break-even-Menge bezeichnet die Absatzmenge, bei der der gesamte Deckungsbeitrag genau die Fixkosten deckt.'
})
setSingleChoice('marketing_verkauf_break_even_deckungsbeitrag_stufe1_begriff', {
  frage: 'Der Verkaufspreis bleibt gleich, die variablen Kosten pro Stück steigen. Was geschieht mit dem Deckungsbeitrag pro Stück?',
  richtig: 'Er sinkt, weil vom Verkaufspreis höhere variable Kosten abgezogen werden.',
  falsch: ['Er steigt im gleichen Umfang wie die variablen Kosten.', 'Er bleibt unverändert, weil nur Fixkosten den Deckungsbeitrag beeinflussen.', 'Er wird automatisch zum Reingewinn.'],
  erklaerung: 'Der Deckungsbeitrag pro Stück ist Verkaufspreis minus variable Stückkosten. Höhere variable Kosten senken ihn bei unverändertem Preis.'
})
setSingleChoice('recht_vwl_break_even_deckungsbeitrag_stufe1_formel_2', {
  frage: 'Ein Produkt wird für CHF 80 verkauft und verursacht CHF 50 variable Kosten pro Stück. Wie hoch ist sein Deckungsbeitrag pro Stück?',
  richtig: 'CHF 30.',
  falsch: ['CHF 130.', 'CHF 50.', '37,5 % ohne weitere Berechnung.'],
  erklaerung: 'CHF 80 Verkaufspreis minus CHF 50 variable Stückkosten ergibt CHF 30 Deckungsbeitrag pro Stück.'
})
setSingleChoice('unternehmensfuehrung_break_even_deckungsbeitrag_stufe1_formel_2', {
  frage: 'Weshalb ist der Deckungsbeitrag pro Stück noch nicht der Gewinn pro Stück?',
  richtig: 'Weil aus der Summe der Deckungsbeiträge zuerst die Fixkosten gedeckt werden müssen.',
  falsch: ['Weil der Deckungsbeitrag die variablen Kosten nie berücksichtigt.', 'Weil Gewinn ausschliesslich aus der Bilanzsumme berechnet wird.', 'Weil Fixkosten bei der Gewinnermittlung grundsätzlich keine Rolle spielen.'],
  erklaerung: 'Erst wenn die gesamten Deckungsbeiträge die Fixkosten übersteigen, entsteht ein Gewinn.'
})
setSingleChoice('marketing_verkauf_liquiditaet_mittelfluss_stufe1_begriff', {
  frage: 'Ein Unternehmen schreibt eine Maschine ab, ohne in diesem Moment Geld zu bezahlen. Wie ist dieser Vorgang einzuordnen?',
  richtig: 'Als Aufwand ohne unmittelbaren Geldabfluss.',
  falsch: ['Als Einzahlung ohne Ertrag.', 'Als Auszahlung ohne Aufwand.', 'Als Umsatz mit unmittelbarem Geldzufluss.'],
  erklaerung: 'Abschreibungen mindern den Erfolg, lösen im Buchungszeitpunkt aber keinen Geldabfluss aus. Erfolg und Mittelfluss sind deshalb zu unterscheiden.'
})
setSingleChoice('integrierte_fallstudie_liquiditaet_mittelfluss_stufe1_begriff', {
  frage: 'Eine Unternehmung erzielt Buchgewinn, kann aber eine heute fällige Lieferantenrechnung nicht bezahlen. Welche Aussage trifft zu?',
  richtig: 'Sie ist trotz Gewinn nicht ausreichend liquide.',
  falsch: ['Ein ausgewiesener Gewinn garantiert jederzeit genügend Zahlungsmittel.', 'Die offene Rechnung ist bereits bezahlt, weil sie als Aufwand verbucht wurde.', 'Liquidität und Gewinn bezeichnen immer denselben Wert.'],
  erklaerung: 'Gewinn misst den periodischen Erfolg, Liquidität die Zahlungsfähigkeit. Nicht zahlungswirksame Erträge oder gebundene Mittel können zu Gewinn bei fehlendem Geld führen.'
})
setSingleChoice('finanzwirtschaft_mehrwertsteuer_stufe1_begriff', {
  frage: 'Ein mehrwertsteuerpflichtiges Unternehmen stellt Kundinnen und Kunden MWST in Rechnung. Welche Aussage ist richtig?',
  richtig: 'Die vereinnahmte Umsatzsteuer wird mit der abzugsfähigen Vorsteuer verrechnet.',
  falsch: ['Die gesamte vereinnahmte MWST ist eigener Unternehmensertrag.', 'Vorsteuer darf nur von privaten Endverbrauchern abgezogen werden.', 'MWST verändert immer direkt den Reingewinn um den vollen Steuerbetrag.'],
  erklaerung: 'Geschuldet ist grundsätzlich die Differenz zwischen Umsatzsteuer und abzugsfähiger Vorsteuer; die MWST ist für das Unternehmen ein Durchlaufposten.'
})
setSingleChoice('finanzwirtschaft_mehrwertsteuer_stufe1_formel_1', {
  frage: 'Eine Rechnung weist Nettobetrag und MWST-Satz aus. Wie wird der Bruttobetrag berechnet?',
  richtig: 'Nettobetrag × (1 + MWST-Satz als Dezimalzahl).',
  falsch: ['Nettobetrag ÷ MWST-Satz.', 'Nettobetrag − MWST-Betrag.', 'Nettobetrag × MWST-Satz ohne Addition des Nettobetrags.'],
  erklaerung: 'Der Bruttobetrag besteht aus Nettobetrag plus MWST. Bei 8,1 % wird der Nettobetrag deshalb mit 1,081 multipliziert.'
})
setSingleChoice('marketing_verkauf_kosten_absatzmittler_stufe1_begriff', {
  frage: 'Ein Hersteller verkauft neu über einen Absatzmittler. Welche Auswirkung muss er in der Kalkulation besonders berücksichtigen?',
  richtig: 'Die Marge oder Provision des Absatzmittlers vermindert den beim Hersteller verbleibenden Erlös.',
  falsch: ['Absatzmittler verursachen grundsätzlich keine Vertriebskosten.', 'Der Listenpreis wird automatisch vollständig zum Reingewinn.', 'Die Produktionskosten entfallen, sobald ein Händler eingeschaltet wird.'],
  erklaerung: 'Absatzmittler übernehmen Vertriebsleistungen, verlangen dafür aber eine Marge oder Provision. Diese muss in Preis- und Deckungsbeitragsrechnung einfliessen.'
})
setSingleChoice('problemloesung_entscheidung_fuehrung_personal_stufe1_begriff', {
  frage: 'Mehrere Mitarbeitende melden gleichzeitig dringende Anliegen. Was ist der erste sinnvolle Schritt?',
  richtig: 'Die Anliegen nach Dringlichkeit, Wichtigkeit, Frist und möglichen Folgen priorisieren.',
  falsch: ['Alle Anliegen strikt in Eingangsreihenfolge bearbeiten.', 'Nur das kürzeste Anliegen sofort erledigen.', 'Sämtliche Entscheide bis zum Tagesende aufschieben.'],
  erklaerung: 'Eine belastbare Priorisierung berücksichtigt Fristen und Folgen. Erst danach werden Aufgaben erledigt, delegiert, terminiert oder verworfen.'
})
setSingleChoice('problemloesung_entscheidung_rechtliche_grundlagen_stufe1_begriff', {
  frage: 'Eine Handlungsoption wäre organisatorisch bequem, könnte aber gegen eine gesetzliche Pflicht verstossen. Wie ist vorzugehen?',
  richtig: 'Die Rechtsgrundlage und den Sachverhalt prüfen, bevor die Option bewertet oder umgesetzt wird.',
  falsch: ['Die bequemste Option umsetzen und erst bei einer Beschwerde prüfen.', 'Rechtliche Vorgaben ignorieren, wenn die Massnahme wirtschaftlich attraktiv ist.', 'Nur die persönliche Einschätzung der zuständigen Person dokumentieren.'],
  erklaerung: 'Rechtliche Muss-Kriterien begrenzen den Entscheidungsraum. Unzulässige Varianten dürfen nicht durch eine gute wirtschaftliche Bewertung legitimiert werden.'
})
setSingleChoice('problemloesung_entscheidung_ziele_smart_stufe1_begriff', {
  frage: 'Welches Ziel ist am ehesten SMART formuliert?',
  richtig: 'Das Verkaufsteam gewinnt bis 30. September zehn neue aktive Geschäftskunden.',
  falsch: ['Wir verbessern den Verkauf bald deutlich.', 'Alle Mitarbeitenden sollen motivierter sein.', 'Das Unternehmen wird irgendwann Marktführer.'],
  erklaerung: 'Das Ziel nennt ein klares Ergebnis, eine messbare Grösse, einen Verantwortungsbereich und einen Termin.'
})
setSingleChoice('recht_vwl_sozialpolitik_entwicklung_der_ahv_renten_stufe1_begriff', {
  frage: 'Weshalb belastet eine alternde Bevölkerung die Finanzierung der AHV im Umlageverfahren?',
  richtig: 'Weil tendenziell weniger Beitragszahlende mehr oder länger laufende Renten finanzieren müssen.',
  falsch: ['Weil jede AHV-Rente vollständig aus einem persönlichen Sparkonto stammt.', 'Weil ältere Personen grundsätzlich keine AHV-Rente beziehen dürfen.', 'Weil die AHV ausschliesslich durch Kapitalerträge finanziert wird.'],
  erklaerung: 'Im Umlageverfahren finanzieren laufende Beiträge grundsätzlich die laufenden Renten. Das Verhältnis von Beitragszahlenden zu Rentenbeziehenden ist deshalb zentral.'
})
setSingleChoice('scm_beschaffung_lieferanten_stufe1_begriff', {
  frage: 'Zwei Lieferanten unterscheiden sich bei Preis, Qualität, Liefertermin und Ausfallrisiko. Wie sollte die Auswahl erfolgen?',
  richtig: 'Mit gewichteten, nachvollziehbaren Kriterien und einer Beurteilung der Gesamtkosten und Risiken.',
  falsch: ['Ausschliesslich nach dem tiefsten Stückpreis.', 'Zufällig, sofern beide eine Offerte eingereicht haben.', 'Nur nach der räumlichen Distanz zum eigenen Betrieb.'],
  erklaerung: 'Eine Lieferantenwahl berücksichtigt neben dem Preis auch Qualität, Termin, Versorgungssicherheit, Konditionen und Folgekosten.'
})

// Aus abgeschnittenen Fallüberschriften entstehen prüfungsnahe Fallaufgaben.
setSingleChoice('integrierte_fallstudie_1_der_geschaeftsbericht_ist_gedruckt_und_wurde_an_alle_empfaenger_stufe1_begriff', {
  fach: 'Integrierte_Fallstudie',
  themaId: 'fehler_im_geschaeftsbericht',
  thema: 'Fehler im Geschäftsbericht',
  frage: 'Nach dem Versand des Geschäftsberichts wird ein wesentlicher Zahlenfehler entdeckt. Was ist zuerst zu tun?',
  richtig: 'Fehler und Auswirkung verifizieren, zuständige Stellen informieren und das Korrekturvorgehen festlegen.',
  falsch: ['Den Fehler stillschweigend in der nächsten Ausgabe ändern.', 'Alle Empfänger ohne geprüfte Fakten telefonisch alarmieren.', 'Die zugrunde liegenden Buchungen löschen, damit der Bericht wieder stimmt.'],
  erklaerung: 'Zuerst müssen Sachverhalt und Wesentlichkeit geklärt werden. Danach folgen abgestimmte Korrektur, transparente Information und saubere Dokumentation.'
})
setMultipleChoice('pr2025_integrierte_fallstudie_1_2_thema_stufe3', {
  fach: 'Integrierte_Fallstudie',
  themaId: 'fehler_im_geschaeftsbericht',
  thema: 'Fehler im Geschäftsbericht',
  frage: 'Welche Massnahmen sind nach einem bestätigten wesentlichen Fehler im bereits versandten Geschäftsbericht sachgerecht?',
  richtig: ['Korrektur und Auswirkungen nachvollziehbar dokumentieren.', 'Adressaten abgestimmt und transparent über die Berichtigung informieren.'],
  falsch: ['Den gedruckten Bericht ohne Hinweis unverändert als richtig behandeln.', 'Belege nachträglich anpassen, damit sie zur veröffentlichten Zahl passen.'],
  erklaerung: 'Eine Berichtigung braucht eine dokumentierte fachliche Grundlage und eine abgestimmte Information der betroffenen Adressaten. Belege dürfen nicht manipuliert werden.'
})
setSingleChoice('integrierte_fallstudie_2025_mit_seinen_abteilungsleitenden_und_rolf_stern_vom_stab_problemloesung_vor_a_stufe1_begriff', {
  fach: 'Integrierte_Fallstudie',
  themaId: 'entscheidungsprozess_im_fall',
  thema: 'Entscheidungsprozess im Fall',
  frage: 'Die Abteilungsleitenden schlagen unterschiedliche Lösungen vor. Was macht den anschliessenden Entscheid nachvollziehbar?',
  richtig: 'Gemeinsame Kriterien, transparente Gewichtungen und dokumentierte Bewertungen der Varianten.',
  falsch: ['Die spontane Wahl der ranghöchsten Person ohne Kriterien.', 'Eine Abstimmung, bevor das Problem beschrieben wurde.', 'Die ausschliessliche Betrachtung der billigsten Variante ohne Risiken.'],
  erklaerung: 'Ein nachvollziehbarer Entscheid trennt Problem, Kriterien, Gewichtung und Variantenbewertung und hält Annahmen sowie Risiken fest.'
})
setMultipleChoice('pr2025_integrierte_fallstudie_11_08_thema_stufe3', {
  fach: 'Integrierte_Fallstudie',
  themaId: 'entscheidungsprozess_im_fall',
  thema: 'Entscheidungsprozess im Fall',
  frage: 'Welche zwei Schritte erhöhen die Qualität einer Nutzwertanalyse im Führungsteam?',
  richtig: ['Kriterien vor der Bewertung definieren und begründet gewichten.', 'Bewertungen mit Fakten oder transparenten Annahmen begründen.'],
  falsch: ['Gewichtungen nachträglich an die gewünschte Variante anpassen.', 'Nur Kriterien aufnehmen, bei denen alle Varianten gleich abschneiden.'],
  erklaerung: 'Kriterien und Gewichtungen müssen vor der Bewertung nachvollziehbar feststehen. Transparente Begründungen machen das Resultat prüfbar.'
})
setSingleChoice('integrierte_fallstudie_3_die_abfallentsorgung_der_besucherinnen_und_besucher_bereitet_stufe1_begriff', {
  fach: 'Integrierte_Fallstudie',
  themaId: 'abfallentsorgung_besucherbetrieb',
  thema: 'Abfallentsorgung im Besucherbetrieb',
  frage: 'Bei einem Besucherbetrieb liegen Abfälle neben überfüllten Sammelstellen. Welche Massnahme ist zuerst fachlich sinnvoll?',
  richtig: 'Abfallmengen und Spitzenzeiten erfassen und darauf Behälter, Leerungsrhythmus und Beschilderung abstimmen.',
  falsch: ['Alle Sammelstellen entfernen, damit keine Überfüllung sichtbar ist.', 'Nur häufiger reinigen, ohne Ursache und Abfallmenge zu untersuchen.', 'Abfall vollständig den Besucherinnen und Besuchern privat mitgeben.'],
  erklaerung: 'Eine tragfähige Lösung verbindet Ursachenanalyse mit Kapazität, Leerungsprozess, verständlicher Trennung und verantwortlichen Stellen.'
})
setMultipleChoice('pr2025_integrierte_fallstudie_1_3_thema_stufe3_3', {
  fach: 'Integrierte_Fallstudie',
  themaId: 'abfallentsorgung_besucherbetrieb',
  thema: 'Abfallentsorgung im Besucherbetrieb',
  frage: 'Welche zwei Kennzahlen helfen zu prüfen, ob das neue Entsorgungskonzept wirkt?',
  richtig: ['Menge der Fehlwürfe je Abfallfraktion.', 'Anzahl Überfüllungen oder Zusatzleerungen pro Zeitraum.'],
  falsch: ['Farbe der Arbeitskleidung des Reinigungsteams.', 'Anzahl verkaufter Eintrittskarten ohne Bezug zur Abfallmenge.'],
  erklaerung: 'Fehlwürfe messen die Trennqualität, Überfüllungen die Kapazitäts- und Prozessqualität. Beide Kennzahlen zeigen konkrete Verbesserungen.'
})
setSingleChoice('integrierte_fallstudie_4_der_tierarzt_raet_dringend_alle_unseren_beherbergten_europaei_stufe1_begriff', {
  fach: 'Integrierte_Fallstudie',
  themaId: 'impfstoffbeschaffung_wildtiere',
  thema: 'Impfstoffbeschaffung für Wildtiere',
  frage: 'Ein Tierarzt empfiehlt dringend einen nur im Ausland verfügbaren Impfstoff. Was ist vor der Bestellung zuerst abzuklären?',
  richtig: 'Bedarf und Dosierung sowie Zulassung, Lieferzeit, Kühlkette und Bezugsrisiken.',
  falsch: ['Nur die Farbe der Verpackung.', 'Ausschliesslich der Listenpreis ohne Transport- und Ausfallrisiko.', 'Die Bestellung ohne Mengenberechnung und ohne tierärztliche Vorgaben.'],
  erklaerung: 'Bei kritischen Tierarzneimitteln müssen medizinischer Bedarf, rechtliche Zulässigkeit und sichere Beschaffung gemeinsam geprüft werden.'
})
setMultipleChoice('pr2025_integrierte_fallstudie_1_3_thema_stufe3_4', {
  fach: 'Integrierte_Fallstudie',
  themaId: 'impfstoffbeschaffung_wildtiere',
  thema: 'Impfstoffbeschaffung für Wildtiere',
  frage: 'Welche zwei Risiken sind bei der internationalen Beschaffung eines temperaturempfindlichen Impfstoffs besonders zu steuern?',
  richtig: ['Unterbruch der Kühlkette während Transport oder Lagerung.', 'Lieferverzug bei knappem Behandlungszeitfenster.'],
  falsch: ['Zu viele frei wählbare Schriftarten auf der Rechnung.', 'Eine längere interne Artikelnummer ohne Einfluss auf das Produkt.'],
  erklaerung: 'Temperaturabweichungen können die Wirksamkeit gefährden; Verzögerungen können die rechtzeitige Behandlung verhindern.'
})

for (const [id, values] of Object.entries({
  problemloesung_entscheidung_2024_um_12_05_uhr_stufe1_begriff: {
    frage: 'Um 12:05 Uhr trifft eine Meldung über lange Wartezeiten an der Flughafensicherheit ein. Wie wird sie im Postkorb richtig behandelt?',
    richtig: 'Relevanz für geplante Reisen und Zeitreserve prüfen; nur bei konkreter Betroffenheit eine Massnahme terminieren.',
    falsch: ['Unabhängig vom eigenen Kalender sofort alle Arbeiten abbrechen.', 'Die Meldung ungeprüft als höchste betriebliche Eskalation behandeln.', 'Die Information löschen, auch wenn heute eine Flugreise geplant ist.'],
    erklaerung: 'Eine reine Information wird erst durch konkrete Betroffenheit, Frist und Folgen zur Aufgabe.'
  },
  problemloesung_entscheidung_2025_um_06_44_uhr_stufe1_begriff: {
    frage: 'Um 06:44 Uhr wird gemeldet, dass die heutige Lohnzahlung gestoppt ist und vor 08:30 Uhr freigegeben werden muss. Wie ist zu priorisieren?',
    richtig: 'Sofort als dringend und wichtig bearbeiten oder an eine entscheidungsbefugte Person eskalieren.',
    falsch: ['Bis zum nächsten regulären Teamsitzungstermin warten.', 'Zuerst alle Aufgaben ohne Frist erledigen.', 'Nur ablegen, weil die Meldung vor Arbeitsbeginn einging.'],
    erklaerung: 'Nahe Frist und erhebliche Folgen für Mitarbeitende machen den Vorgang dringend und wichtig.'
  },
  problemloesung_entscheidung_2025_um_07_00_uhr_stufe1_begriff: {
    frage: 'Um 07:00 Uhr erinnert das System an die Freigabe der Zeiterfassung bis 14:00 Uhr. Eine gestoppte Lohnzahlung muss bis 08:30 Uhr gelöst werden. Was ist richtig?',
    richtig: 'Zuerst die Lohnzahlung sichern und die Zeiterfassung danach verbindlich vor 14:00 Uhr einplanen.',
    falsch: ['Die Zeiterfassung sofort erledigen und die Lohnzahlung bis morgen verschieben.', 'Beide Aufgaben ignorieren, weil es Systemmeldungen sind.', 'Nur die Aufgabe mit dem längeren Text bearbeiten.'],
    erklaerung: 'Beide Aufgaben sind wichtig, aber die Lohnzahlung hat die frühere Frist und gravierendere Folgen.'
  }
})) {
  setSingleChoice(id, {
    fach: 'Problemloesung_Entscheidung',
    themaId: 'postkorb_priorisierung',
    thema: 'Postkorb / Priorisierung',
    ...values
  })
}
setMultipleChoice('pr2024_problemloesung_entscheidung_20_08_thema_stufe3_3', {
  fach: 'Problemloesung_Entscheidung',
  themaId: 'postkorb_priorisierung',
  thema: 'Postkorb / Priorisierung',
  frage: 'Welche Kriterien entscheiden, ob eine eingehende Information im Postkorb sofortiges Handeln verlangt?',
  richtig: ['Konkrete Frist und Folgen einer Verzögerung.', 'Eigene Zuständigkeit oder notwendige Eskalation.'],
  falsch: ['Die Uhrzeit allein, ohne Inhalt und Betroffenheit.', 'Die Länge der Nachricht als einziges Kriterium.'],
  erklaerung: 'Priorität ergibt sich aus Wichtigkeit, Dringlichkeit, Folgen und Zuständigkeit – nicht aus Uhrzeit oder Textlänge allein.'
})
setMultipleChoice('pr2025_problemloesung_entscheidung_19_08_thema_stufe3', {
  fach: 'Problemloesung_Entscheidung',
  themaId: 'postkorb_priorisierung',
  thema: 'Postkorb / Priorisierung',
  frage: 'Welche zwei Handlungen sind bei einer blockierten Lohnzahlung mit naher Bankfrist angemessen?',
  richtig: ['Zahlungsstatus und Ursache sofort klären.', 'Bei fehlender eigener Kompetenz unverzüglich entscheidungsbefugt eskalieren.'],
  falsch: ['Den Vorgang bis nach Fristablauf ablegen.', 'Zuerst eine langfristige Prozessanalyse abschliessen, bevor akut gehandelt wird.'],
  erklaerung: 'Zuerst wird der akute Schaden verhindert; Ursachenanalyse und Prozessverbesserung folgen anschliessend.'
})
setMultipleChoice('pr2025_problemloesung_entscheidung_19_08_thema_stufe3_2', {
  fach: 'Problemloesung_Entscheidung',
  themaId: 'postkorb_priorisierung',
  thema: 'Postkorb / Priorisierung',
  frage: 'Welche zwei Schritte sichern die fristgerechte Zeiterfassungsfreigabe, wenn gleichzeitig dringendere Aufgaben bestehen?',
  richtig: ['Einen realistischen Bearbeitungszeitpunkt vor 14:00 Uhr reservieren.', 'Falls nötig rechtzeitig delegieren und die Erledigung kontrollieren.'],
  falsch: ['Die Frist ignorieren, solange eine dringendere Aufgabe existiert.', 'Ohne Prüfung alle anderen Aufgaben abbrechen.'],
  erklaerung: 'Eine wichtige, aber später fällige Aufgabe wird verbindlich terminiert oder delegiert und anschliessend kontrolliert.'
})

// Gleiche Formeln werden in unterschiedlichen Anwendungssituationen geprüft.
setSingleChoice('finanzwirtschaft_lager_lagerkennzahlen_stufe1_formel_1', {
  frage: 'Der Warenaufwand bleibt gleich, der durchschnittliche Lagerbestand sinkt. Was geschieht mit dem Lagerumschlag?',
  richtig: 'Er steigt.',
  falsch: ['Er sinkt.', 'Er bleibt zwingend gleich.', 'Er wird automatisch null.'],
  erklaerung: 'Lagerumschlag = Warenaufwand ÷ durchschnittlicher Lagerbestand. Bei kleinerem Nenner steigt die Kennzahl.'
})
setSingleChoice('marketing_verkauf_lager_lagerkennzahlen_stufe1_formel_1', {
  frage: 'Ein Lagerumschlag von 8 bedeutet vereinfacht, dass der durchschnittliche Lagerbestand im betrachteten Zeitraum wie oft umgesetzt wurde?',
  richtig: 'Achtmal.',
  falsch: ['Einmal.', 'Achtzigmal.', 'Gar nicht.'],
  erklaerung: 'Der Lagerumschlag zeigt, wie oft der durchschnittliche Bestand durch den Warenverbrauch beziehungsweise -aufwand umgesetzt wurde.'
})
setSingleChoice('finanzwirtschaft_lager_lagerkennzahlen_stufe1_formel_2', {
  frage: 'Der Lagerumschlag steigt bei gleicher Jahresbasis. Was geschieht mit der durchschnittlichen Lagerdauer?',
  richtig: 'Sie sinkt.',
  falsch: ['Sie steigt immer gleich stark.', 'Sie bleibt unverändert.', 'Sie entspricht danach dem Warenaufwand.'],
  erklaerung: 'Lagerdauer = 360 Tage ÷ Lagerumschlag. Ein höherer Umschlag verkürzt deshalb die durchschnittliche Lagerdauer.'
})
setSingleChoice('marketing_verkauf_lager_lagerkennzahlen_stufe1_formel_2', {
  frage: 'Ein Artikel hat einen Lagerumschlag von 6. Welche durchschnittliche Lagerdauer ergibt sich bei einer 360-Tage-Basis?',
  richtig: '60 Tage.',
  falsch: ['6 Tage.', '360 Tage.', '2 160 Tage.'],
  erklaerung: '360 Tage geteilt durch den Lagerumschlag 6 ergibt eine durchschnittliche Lagerdauer von 60 Tagen.'
})

// Mehrfachauswahlen brauchen mindestens eine plausible falsche Aussage; sonst
// kann die Aufgabe ohne fachliche Unterscheidung durch „alles auswählen“ gelöst werden.
const multipleChoiceDistractors = {
  pr2022_finanzwirtschaft_1_10_choice_stufe3: 'Die private Mobiltelefonnummer der zuständigen Sachbearbeitung.',
  pr2023_personalmanagement_1_12_choice_stufe3: 'Planen Sie in den nächsten zwei Jahren eine Schwangerschaft?',
  pr2024_personalmanagement_1_12_choice_stufe3: 'Nach der Einladung braucht es weder Lernziele noch eine Erfolgskontrolle.',
  pr2025_personalmanagement_1_10_choice_stufe3: 'Entscheid über die eigene Lohnerhöhung der Teamleiterin.',
  pr2022_recht_vwl_1_10_choice_stufe3: 'Eigentum an einem Grundstück.',
  pr2023_scm_1_10_choice_stufe3: 'Verpflichtung, bei jeder Bestellung ausschliesslich den billigsten Anbieter zu wählen.',
  pr2024_scm_1_11_choice_stufe3: 'Der Lieferant darf Verstösse verschweigen, solange noch keine Behörde davon erfahren hat.',
  pr2022_scm_1_7_choice_stufe3: 'Eine Inventur macht die laufende Lagerbuchführung vollständig überflüssig.',
  pr2022_scm_1_9_choice_stufe3: 'Eine sinkende Marktnachfrage erhöht automatisch die physische Tragfähigkeit der Lagerregale.',
  pr2023_scm_1_7_choice_stufe3: 'Die Fortschrittskontrolle wird erst nach Produktionsabschluss durchgeführt und benötigt keine Zielgrössen.',
  pr2024_scm_1_10_choice_stufe3: 'Werbeslogan.',
  pr2024_scm_1_9_choice_stufe3: 'Private Ferienplanung der Geschäftsleitung.',
  pr2024_scm_1_7_choice_stufe3: 'Zufällige Reihenfolge der Arbeitsgänge ohne Kapazitätsprüfung.',
  pr2023_unternehmensfuehrung_1_9_choice_stufe3: 'Private Freizeitpläne der Mitarbeitenden ohne Bezug zum Investitionsprojekt.',
  pr2025_unternehmensfuehrung_1_12_choice_stufe3: 'Farbe der Büroeinrichtung unabhängig vom KI-Einsatz.',
  pr2024_unternehmensfuehrung_1_9_choice_stufe3: '«R» – Rechtskräftig.'
}
for (const [id, distractor] of Object.entries(multipleChoiceDistractors)) {
  const card = byId.get(id)
  if (!card || card.typ !== 'multiple_choice') throw new Error(`Mehrfachauswahl für Distraktor fehlt: ${id}`)
  if (!card.antwort_daten.optionen.includes(distractor)) card.antwort_daten.optionen.push(distractor)
}

// Amtlich geprüfte Rechtsnachweise; Fragen selbst bleiben ohne Artikelnummern.
const legalRules = [
  [/Mängelrüge|Kaufsache|erhebliche Mängel/i, [{ gesetz: 'OR', artikel: '201', absatz: '1', hinweis: 'Prüfungs- und Rügepflicht' }, { gesetz: 'OR', artikel: '205', absatz: '1', hinweis: 'Wandelung oder Minderung' }]],
  [/Prokura/i, [{ gesetz: 'OR', artikel: '458', absatz: '1–2', hinweis: 'Erteilung und Handelsregister' }, { gesetz: 'OR', artikel: '459', absatz: '1–2', hinweis: 'Umfang der Vertretungsmacht' }]],
  [/Arbeitszeugnis|\bZeugnis\b/i, [{ gesetz: 'OR', artikel: '330a', absatz: '1–2', hinweis: 'Vollzeugnis oder Arbeitsbestätigung' }]],
  [/Kündigungsfrist|ordentliche[nr]? Kündigung|Beendigung Arbeitsverhältnis|Dienstjahr.*Monat/i, [{ gesetz: 'OR', artikel: '335c', absatz: '1', hinweis: 'Gesetzliche Kündigungsfristen' }]],
  [/\bFerien\b|Ferienanspruch/i, [{ gesetz: 'OR', artikel: '329a', absatz: '1', hinweis: 'Mindestdauer der Ferien' }]],
  [/Probezeit/i, [{ gesetz: 'OR', artikel: '335b', absatz: '1', hinweis: 'Kündigung während der Probezeit' }]],
  [/Entstehungsgründe einer Obligation|ungerechtfertigte Bereicherung/i, [{ gesetz: 'OR', artikel: '1', absatz: '1', hinweis: 'Vertrag' }, { gesetz: 'OR', artikel: '41', absatz: '1', hinweis: 'Unerlaubte Handlung' }, { gesetz: 'OR', artikel: '62', absatz: '1', hinweis: 'Ungerechtfertigte Bereicherung' }]]
]

function buildLearningExplanation(card) {
  const data = card.antwort_daten ?? {}
  const intro = String(card.begriff_erklaerung?.kurz ?? '').trim()
  let solution = ''
  if (card.typ === 'single_choice') solution = `Fachlich richtig ist: ${data.optionen?.[data.richtig_index] ?? ''}`
  else if (card.typ === 'multiple_choice') solution = `Fachlich richtig sind: ${(data.richtige_indices ?? []).map((index) => data.optionen?.[index]).filter(Boolean).join('; ')}`
  else if (card.typ === 'reihenfolge') solution = `Die richtige Reihenfolge lautet: ${(data.richtige_reihenfolge ?? []).map((index) => data.items?.[index]).filter(Boolean).join(' → ')}`
  else if (card.typ === 'zuordnung') solution = `Die korrekten Zuordnungen sind: ${(data.richtige_paare ?? []).map(([left, right]) => `${data.links?.[left]} → ${data.rechts?.[right]}`).join('; ')}`
  else if (card.typ === 'formel_luecke_mc') solution = `Die Formel wird ergänzt mit: ${(data.luecken_mc ?? []).map((gap) => gap.richtig ?? gap.optionen?.[gap.richtig_index]).filter(Boolean).join('; ')}`
  else if (card.typ === 'formel_builder') solution = `Die fachlich richtige Formel lautet: ${data.formel ?? ''}`
  const context = intro && !solution.includes(intro) ? ` ${intro}` : ''
  return `${solution}.${context}`.replace(/\.\./g, '.').trim()
}

for (const card of cards) {
  const text = `${card.frage ?? ''} ${card.thema ?? ''}`
  const references = legalRules.find(([pattern]) => pattern.test(text))?.[1]
  if (references) card.rechtsgrundlage = references
  if (card.typ === 'zuordnung') {
    const rightIndices = (card.antwort_daten?.richtige_paare ?? []).map(([, right]) => right)
    if (new Set(rightIndices).size < rightIndices.length) card.antwort_daten.mehrfachverwendung = true
  }
  if (/Antwort gemäss offiziellem|Aus den offiziellen Lösungshinweisen verdichtet|Automatisch aus der Prüfungsüberschrift/i.test(card.erklaerung ?? '')) {
    const explanation = buildLearningExplanation(card)
    card.erklaerung = explanation
    card.abschlusserklaerung = explanation
    card.loesungsvorschlag = { kurz: explanation, warum: explanation }
    card.merksatz = explanation
  }
  card.frage = String(card.frage)
    .replace(/\b(OR|ZGB|ArG|UVG|MWSTG)\s*(?:Art\.?|Artikel)\s*\d+[a-z]?(?:\s*(?:Abs\.?|Absatz)\s*\d+)?/gi, '$1')
    .replace(/(?:Art\.?|Artikel)\s*\d+[a-z]?(?:\s*(?:Abs\.?|Absatz)\s*\d+)?\s*(OR|ZGB|ArG|UVG|MWSTG)\b/gi, '$1')
}

// Antwortpositionen werden reproduzierbar verteilt; bei Stufe 1 darf die richtige Antwort
// nicht zusätzlich durch die längste Formulierung verraten werden.
const misconceptionTails = {
  Finanzwirtschaft: 'Dabei werden Zahlungszeitpunkt, Kostenstruktur und Kapitalbindung fälschlich als gleichbedeutend behandelt.',
  Marketing_Verkauf: 'Dabei werden Markt, Zielgruppe und Kundenbedürfnisse fälschlich als unveränderlich behandelt.',
  Personalmanagement: 'Dabei werden rechtliche Rahmenbedingungen, die individuelle Situation und betriebliche Folgen fälschlich gleichgesetzt.',
  Problemloesung_Entscheidung: 'Dabei wird die Methode fälschlich unabhängig von Ziel, Datenlage und möglichen Risiken gewählt.',
  Recht_VWL: 'Dabei werden gesetzliche Voraussetzungen, Fristen und der konkrete Sachverhalt fälschlich nicht unterschieden.',
  SCM: 'Dabei werden Bestände, Lieferzeit, Qualität und Gesamtkosten fälschlich unabhängig von der Beschaffungssituation gleichgesetzt.',
  Unternehmensfuehrung: 'Dabei werden Anspruchsgruppen, Ressourcen und langfristige Auswirkungen fälschlich als nicht entscheidungsrelevant behandelt.',
  Integrierte_Fallstudie: 'Dabei werden Ausgangslage, Wechselwirkungen und langfristige Folgen fälschlich nicht gemeinsam beurteilt.'
}
const answerPositionCounters = new Map()
for (const card of [...cards].sort((a, b) => a.id.localeCompare(b.id))) {
  if (card.typ !== 'single_choice' || !Array.isArray(card.antwort_daten?.optionen)) continue
  const data = card.antwort_daten
  const optionCount = data.optionen.length
  const counterKey = `${optionCount}:${card.stufe === 1 ? 'stufe1' : 'weitere'}`
  const counter = answerPositionCounters.get(counterKey) ?? 0
  const targetIndex = counter % optionCount
  answerPositionCounters.set(counterKey, counter + 1)

  const correct = data.optionen[data.richtig_index]
  const incorrect = data.optionen.filter((_, index) => index !== data.richtig_index)
  const reordered = [...incorrect]
  reordered.splice(targetIndex, 0, correct)
  data.optionen = reordered
  data.richtig_index = targetIndex

  if (optionCount < 2) continue
  const correctLength = String(data.optionen[targetIndex]).length
  const longestIncorrect = Math.max(...data.optionen.map((option, index) => index === targetIndex ? 0 : String(option).length))
  if (correctLength < longestIncorrect) continue
  const distractorIndex = (targetIndex + 1) % optionCount
  const tail = misconceptionTails[card.fach] ?? misconceptionTails.Integrierte_Fallstudie
  data.optionen[distractorIndex] = `${String(data.optionen[distractorIndex]).replace(/[.!?]\s*$/, '')}. ${tail}`
  if (String(data.optionen[distractorIndex]).length <= correctLength) {
    data.optionen[distractorIndex] += ' Diese pauschale Annahme gilt unabhängig vom konkreten Fall und führt deshalb zu einer falschen Beurteilung.'
  }
}

function counts(items, key) {
  return items.reduce((result, item) => {
    const value = String(item[key])
    result[value] = (result[value] ?? 0) + 1
    return result
  }, {})
}

function metaFor(items, originalMeta) {
  return {
    ...originalMeta,
    aktualisiert_am: '2026-07-23',
    anzahl_karten: items.length,
    anzahl_themen_gruppiert: new Set(items.map((card) => `${card.fach}::${card.thema_id}`)).size,
    kartentypen: counts(items, 'typ'),
    stufen: counts(items, 'stufe'),
    karten_pro_fach: counts(items, 'fach'),
    validierungsfehler: 0
  }
}

cards.sort((a, b) => a.fach.localeCompare(b.fach, 'de-CH') || a.thema.localeCompare(b.thema, 'de-CH') || a.stufe - b.stufe || a.id.localeCompare(b.id))
dataset.karten = cards
dataset.meta = metaFor(cards, dataset.meta)
fs.writeFileSync(aggregatePath, `${JSON.stringify(dataset, null, 2)}\n`)

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
  const filePath = path.join(dataDir, filename)
  const subjectDataset = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const subjectCards = cards.filter((card) => card.fach === subject)
  subjectDataset.karten = subjectCards
  subjectDataset.meta = metaFor(subjectCards, subjectDataset.meta)
  fs.writeFileSync(filePath, `${JSON.stringify(subjectDataset, null, 2)}\n`)
}

console.log(`Aktualisiert: ${cards.length} Karten in ${dataset.meta.anzahl_themen_gruppiert} Themen`)
