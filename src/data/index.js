import dataset from './pruefungs_app_final_lerntauglich/lernkarten_pruefungen_final_lerntauglich_Alle_Faecher.json'
import depthDataset from './depth-agent-cards.json'
import visualTemplateDataset from './learning-visual-templates.json'

export const allowedTypes = [
  'single_choice',
  'multiple_choice',
  'formel_luecke_mc',
  'lueckentext_auswahl',
  'formel_builder',
  'zahlen_eingabe',
  'buchungssatz_builder',
  'fallentscheidung',
  'visuelle_zuordnung',
  'reihenfolge',
  'zuordnung'
]

const colorPattern = /^#[0-9a-f]{6}$/i
const allowedVisualLayouts = new Set(['zonen', 'prozessband', 'matrix'])

export const visualTemplates = (visualTemplateDataset.templates ?? []).filter((template) => (
  template?.id
  && template?.name
  && allowedVisualLayouts.has(template.layout)
  && colorPattern.test(template.accent ?? '')
  && colorPattern.test(template.surface ?? '')
))
const visualTemplateIds = new Set(visualTemplates.map((template) => template.id))
const visualTemplateById = new Map(visualTemplates.map((template) => [template.id, template]))

function isArray(value) {
  return Array.isArray(value) && value.length > 0
}

function isNumber(value) {
  return Number.isInteger(value)
}

function isValidIndex(index, items) {
  return isNumber(index) && Array.isArray(items) && index >= 0 && index < items.length
}

// Pflichtfelder: id, fach, typ, frage, antwort_daten, stufe.
// Alles andere (thema, thema_id, lernziel, begriff_erklaerung, loesungsvorschlag,
// fehlerfallen, merksatz, erklaerung, tags, quelle, jahr, ...) ist optional und
// wird nur angezeigt, wenn vorhanden.
function validateCard(card) {
  const errors = []

  if (!card?.id) errors.push('id fehlt')
  if (!card?.fach) errors.push('fach fehlt')
  if (!Number.isInteger(card?.stufe) || card.stufe < 1 || card.stufe > 5) errors.push('stufe ist ungültig (erlaubt: 1-5)')
  if (!card?.typ) errors.push('typ fehlt')
  if (!card?.frage) errors.push('frage fehlt')
  if (!card?.antwort_daten) errors.push('antwort_daten fehlt')
  if (card?.typ && !allowedTypes.includes(card.typ)) errors.push(`ungültiger typ (nicht mehr unterstützt): ${card.typ}`)

  const data = card?.antwort_daten ?? {}

  if (card?.typ === 'single_choice') {
    if (!isArray(data.optionen)) errors.push('single_choice.optionen fehlt')
    if (!isNumber(data.richtig_index)) errors.push('single_choice.richtig_index fehlt')
    if (isArray(data.optionen) && isNumber(data.richtig_index) && !isValidIndex(data.richtig_index, data.optionen)) {
      errors.push('single_choice.richtig_index außerhalb der optionen')
    }
  }

  if (card?.typ === 'multiple_choice') {
    if (!isArray(data.optionen)) errors.push('multiple_choice.optionen fehlt')
    if (!isArray(data.richtige_indices)) errors.push('multiple_choice.richtige_indices fehlt')
    if (isArray(data.optionen) && isArray(data.richtige_indices)) {
      data.richtige_indices.forEach((index) => {
        if (!isValidIndex(index, data.optionen)) errors.push(`multiple_choice.richtige_indices ungültig: ${index}`)
      })
    }
  }

  if (card?.typ === 'formel_luecke_mc' || card?.typ === 'lueckentext_auswahl') {
    const type = card.typ
    if (!isArray(data.luecken_mc)) errors.push(`${type}.luecken_mc fehlt`)
    if (isArray(data.luecken_mc)) {
      data.luecken_mc.forEach((gap, index) => {
        if (!isArray(gap.optionen)) errors.push(`${type}.luecken_mc[${index}].optionen fehlt`)
        if (!isNumber(gap.richtig_index)) errors.push(`${type}.luecken_mc[${index}].richtig_index fehlt`)
        if (isArray(gap.optionen) && isNumber(gap.richtig_index) && !isValidIndex(gap.richtig_index, gap.optionen)) {
          errors.push(`${type}.luecken_mc[${index}].richtig_index außerhalb der optionen`)
        }
      })
    }
  }

  if (card?.typ === 'formel_builder') {
    if (!isArray(data.bausteine)) errors.push('formel_builder.bausteine fehlt')
    if (!isArray(data.richtige_reihenfolge)) errors.push('formel_builder.richtige_reihenfolge fehlt')
    if (isArray(data.bausteine)) {
      const ids = new Set()
      data.bausteine.forEach((item, index) => {
        if (!item?.id || !item?.label) errors.push(`formel_builder.bausteine[${index}] ist ungültig`)
        if (item?.id && ids.has(item.id)) errors.push(`formel_builder.bausteine ID doppelt: ${item.id}`)
        if (item?.id) ids.add(item.id)
      })
      if (isArray(data.richtige_reihenfolge)) {
        data.richtige_reihenfolge.forEach((id) => {
          if (!ids.has(id)) errors.push(`formel_builder.richtige_reihenfolge unbekannt: ${id}`)
        })
      }
      const balanceIds = [
        ...(data.bilanz?.aktiven ?? []),
        ...(data.bilanz?.passiven ?? []),
        ...(data.bilanz?.erfolgsrechnung ?? [])
      ]
      balanceIds.forEach((id) => {
        if (!ids.has(id)) errors.push(`formel_builder.bilanz unbekannt: ${id}`)
      })
    }
    if (data.ergebnis != null && typeof data.ergebnis.richtiger_wert !== 'number') {
      errors.push('formel_builder.ergebnis.richtiger_wert fehlt')
    }
  }

  if (card?.typ === 'zahlen_eingabe') {
    if (typeof data.richtiger_wert !== 'number') errors.push('zahlen_eingabe.richtiger_wert fehlt')
    if (data.toleranz != null && typeof data.toleranz !== 'number') errors.push('zahlen_eingabe.toleranz ist ungültig')
  }

  if (card?.typ === 'buchungssatz_builder') {
    if (!isArray(data.konten)) errors.push('buchungssatz_builder.konten fehlt')
    const accountIds = new Set((data.konten ?? []).map((account) => account.id))
    if (!data.richtig?.soll || !accountIds.has(data.richtig.soll)) errors.push('buchungssatz_builder.richtig.soll ist ungültig')
    if (!data.richtig?.haben || !accountIds.has(data.richtig.haben)) errors.push('buchungssatz_builder.richtig.haben ist ungültig')
    if (data.richtig?.betrag != null && typeof data.richtig.betrag !== 'number') errors.push('buchungssatz_builder.richtig.betrag ist ungültig')
  }

  if (card?.typ === 'fallentscheidung') {
    if (!isArray(data.entscheidungen)) errors.push('fallentscheidung.entscheidungen fehlt')
    if (!isArray(data.begruendungen)) errors.push('fallentscheidung.begruendungen fehlt')
    if (!isValidIndex(data.richtig?.entscheidung, data.entscheidungen)) errors.push('fallentscheidung.richtig.entscheidung ist ungültig')
    if (!isValidIndex(data.richtig?.begruendung, data.begruendungen)) errors.push('fallentscheidung.richtig.begruendung ist ungültig')
  }

  if (card?.typ === 'visuelle_zuordnung') {
    if (!visualTemplateIds.has(data.template_id)) errors.push('visuelle_zuordnung.template_id ist unbekannt')
    if (!isArray(data.elemente)) errors.push('visuelle_zuordnung.elemente fehlt')
    if (!isArray(data.bereiche)) errors.push('visuelle_zuordnung.bereiche fehlt')
    if (!data.richtige_zuordnung || typeof data.richtige_zuordnung !== 'object') {
      errors.push('visuelle_zuordnung.richtige_zuordnung fehlt')
    }
    const elementIds = new Set((data.elemente ?? []).map((item) => item.id))
    const areaIds = new Set((data.bereiche ?? []).map((item) => item.id))
    if (elementIds.size !== (data.elemente ?? []).length) errors.push('visuelle_zuordnung.elemente enthält doppelte IDs')
    if (areaIds.size !== (data.bereiche ?? []).length) errors.push('visuelle_zuordnung.bereiche enthält doppelte IDs')
    for (const item of data.elemente ?? []) {
      if (!item?.id || !item?.label) errors.push('visuelle_zuordnung.element ist unvollständig')
      if (!areaIds.has(data.richtige_zuordnung?.[item.id])) {
        errors.push(`visuelle_zuordnung ohne gültiges Ziel: ${item?.id ?? 'unbekannt'}`)
      }
    }
    if (visualTemplateById.get(data.template_id)?.layout === 'matrix' && (data.bereiche?.length ?? 0) !== 4) {
      errors.push('entscheidungsmatrix benötigt genau vier Bereiche')
    }
  }

  if (card?.typ === 'reihenfolge') {
    if (!isArray(data.items)) errors.push('reihenfolge.items fehlt')
    if (!isArray(data.richtige_reihenfolge)) errors.push('reihenfolge.richtige_reihenfolge fehlt')
    if (isArray(data.items) && isArray(data.richtige_reihenfolge)) {
      if (data.items.length !== data.richtige_reihenfolge.length) errors.push('reihenfolge.richtige_reihenfolge hat falsche länge')
      data.richtige_reihenfolge.forEach((index) => {
        if (!isValidIndex(index, data.items)) errors.push(`reihenfolge.richtige_reihenfolge ungültig: ${index}`)
      })
    }
  }

  if (card?.typ === 'zuordnung') {
    if (!isArray(data.links)) errors.push('zuordnung.links fehlt')
    if (!isArray(data.rechts)) errors.push('zuordnung.rechts fehlt')
    if (!isArray(data.richtige_paare)) errors.push('zuordnung.richtige_paare fehlt')
    if (isArray(data.links) && isArray(data.rechts) && isArray(data.richtige_paare)) {
      data.richtige_paare.forEach((pair, index) => {
        if (!Array.isArray(pair) || pair.length !== 2) {
          errors.push(`zuordnung.richtige_paare[${index}] ist kein paar`)
          return
        }
        if (!isValidIndex(pair[0], data.links)) errors.push(`zuordnung.richtige_paare[${index}] links ungültig`)
        if (!isValidIndex(pair[1], data.rechts)) errors.push(`zuordnung.richtige_paare[${index}] rechts ungültig`)
      })
    }
  }

  if (card?.familie_id) {
    if (!Number.isInteger(card.ab_lvl) || card.ab_lvl < 1 || card.ab_lvl > 5) {
      errors.push('Tiefenkarte benötigt ab_lvl zwischen 1 und 5')
    }
    if (!isArray(card.quellenkarten)) errors.push('Tiefenkarte benötigt quellenkarten')
    if (!isArray(card.verwandte_themen)) errors.push('Tiefenkarte benötigt verwandte_themen')
    if (card.ch_fachlich_geprueft !== true) errors.push('Tiefenkarte ist nicht CH-fachlich geprüft')
  }

  return errors
}

const sourceCards = [...(dataset.karten ?? []), ...(depthDataset.cards ?? [])]
const checkedCards = sourceCards.map((card) => {
  const errors = validateCard(card)
  return {
    card: {
      ...card,
      titel: card.thema || card.lernziel || card.frage,
      untertitel: card.lernziel && card.lernziel !== card.thema ? card.lernziel : '',
      quelle_id: card.thema_id || card.id,
      frequenz: card.stufe >= 3 ? 'rot' : card.stufe === 2 ? 'gelb' : 'gruen'
    },
    errors
  }
})

export const cards = checkedCards.filter((entry) => entry.errors.length === 0).map((entry) => entry.card)

export const invalidCards = checkedCards
  .filter((entry) => entry.errors.length > 0)
  .map((entry) => ({
    id: entry.card?.id ?? 'unbekannt',
    errors: entry.errors
  }))

export const contentMeta = {
  ...(dataset.meta ?? {}),
  anzahl_tiefenkarten: depthDataset.cards?.length ?? 0,
  anzahl_karten: sourceCards.length
}
export const schemaVersion = dataset.meta?.schema_version ?? dataset.schema_version ?? '2.0-final-learning'

invalidCards.forEach(({ id, errors }) => {
  console.warn(`[tk-lernapp] Karte "${id}" übersprungen: ${errors.join(', ')}`)
})

function countBy(items, getKey) {
  return items.reduce((acc, item) => {
    const key = getKey(item) ?? 'unbekannt'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
}

console.info('[tk-lernapp] Lernkarten geladen', {
  quelle: 'lernkarten_pruefungen_final_lerntauglich_Alle_Faecher.json',
  schemaVersion,
  geladen: checkedCards.length,
  gueltig: cards.length,
  uebersprungen: invalidCards.length,
  kartentypen: countBy(cards, (card) => card.typ),
  stufen: countBy(cards, (card) => card.stufe),
  faecher: countBy(cards, (card) => card.fach)
})
