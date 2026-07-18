import dataset from './pruefungs_app_final_lerntauglich/lernkarten_pruefungen_final_lerntauglich_Alle_Faecher.json'

export const allowedTypes = [
  'single_choice',
  'multiple_choice',
  'formel_luecke_mc',
  'formel_builder',
  'reihenfolge',
  'zuordnung'
]

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

  if (card?.typ === 'formel_luecke_mc') {
    if (!isArray(data.luecken_mc)) errors.push('formel_luecke_mc.luecken_mc fehlt')
    if (isArray(data.luecken_mc)) {
      data.luecken_mc.forEach((gap, index) => {
        if (!isArray(gap.optionen)) errors.push(`formel_luecke_mc.luecken_mc[${index}].optionen fehlt`)
        if (!isNumber(gap.richtig_index)) errors.push(`formel_luecke_mc.luecken_mc[${index}].richtig_index fehlt`)
        if (isArray(gap.optionen) && isNumber(gap.richtig_index) && !isValidIndex(gap.richtig_index, gap.optionen)) {
          errors.push(`formel_luecke_mc.luecken_mc[${index}].richtig_index außerhalb der optionen`)
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

  return errors
}

const checkedCards = (dataset.karten ?? []).map((card) => {
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

export const contentMeta = dataset.meta ?? {}
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
