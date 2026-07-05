import dataset from './lernkarten_pruefungen_final_Alle_Faecher.json'

export const allowedTypes = [
  'single_choice',
  'multiple_choice',
  'formel_luecke_mc',
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

function validateCard(card) {
  const errors = []

  if (!card?.id) errors.push('id fehlt')
  if (!card?.fach) errors.push('fach fehlt')
  if (!card?.thema_id) errors.push('thema_id fehlt')
  if (!card?.thema) errors.push('thema fehlt')
  if (!card?.quelle || typeof card.quelle !== 'object') errors.push('quelle fehlt')
  if (![1, 2, 3].includes(card?.stufe)) errors.push('stufe ist ungültig')
  if (!card?.typ) errors.push('typ fehlt')
  if (!card?.lernziel) errors.push('lernziel fehlt')
  if (!card?.begriff_erklaerung?.kurz) errors.push('begriff_erklaerung.kurz fehlt')
  if (!card?.begriff_erklaerung?.pruefungsrelevant) errors.push('begriff_erklaerung.pruefungsrelevant fehlt')
  if (!card?.frage) errors.push('frage fehlt')
  if (!card?.antwort_daten) errors.push('antwort_daten fehlt')
  if (!card?.loesungsvorschlag?.kurz) errors.push('loesungsvorschlag.kurz fehlt')
  if (!Array.isArray(card?.fehlerfallen)) errors.push('fehlerfallen fehlt')
  if (!card?.review || typeof card.review !== 'object') errors.push('review fehlt')
  if (!Array.isArray(card?.tags)) errors.push('tags fehlt')
  if (card?.typ && !allowedTypes.includes(card.typ)) errors.push(`ungültiger typ: ${card.typ}`)

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
      quelle_id: card.thema_id,
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
