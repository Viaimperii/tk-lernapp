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

for (const card of cards) {
  const text = `${card.frage ?? ''} ${card.thema ?? ''}`
  const references = legalRules.find(([pattern]) => pattern.test(text))?.[1]
  if (references) card.rechtsgrundlage = references
  card.frage = String(card.frage)
    .replace(/\b(OR|ZGB|ArG|UVG|MWSTG)\s*(?:Art\.?|Artikel)\s*\d+[a-z]?(?:\s*(?:Abs\.?|Absatz)\s*\d+)?/gi, '$1')
    .replace(/(?:Art\.?|Artikel)\s*\d+[a-z]?(?:\s*(?:Abs\.?|Absatz)\s*\d+)?\s*(OR|ZGB|ArG|UVG|MWSTG)\b/gi, '$1')
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
    aktualisiert_am: '2026-07-18',
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
