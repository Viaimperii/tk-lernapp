import { MAX_STUFE, START_STUFE } from './progress.js'

export const FOCUS_THRESHOLD = 8

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/’/g, '')
    .replace(/\s+/g, ' ')
}

function toNumber(value) {
  const cleaned = String(value ?? '')
    .trim()
    .replace(/'/g, '')
    .replace(/’/g, '')
    .replace(/\s/g, '')
    .replace(/[%]/g, '')
    .replace(',', '.')
  if (cleaned === '') return null
  const n = Number(cleaned)
  return Number.isNaN(n) ? null : n
}

function arraysGleich(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i])
}

function lueckenVergleich(nutzerLuecken, luecken) {
  return (
    Array.isArray(nutzerLuecken) &&
    nutzerLuecken.length === luecken.length &&
    luecken.every((soll, i) => normalize(nutzerLuecken[i]) === normalize(soll))
  )
}

function paareVergleich(nutzerPaare, richtigePaare) {
  if (!Array.isArray(nutzerPaare) || nutzerPaare.length !== richtigePaare.length) return false
  const key = ([links, rechts]) => `${links}-${rechts}`
  const soll = new Set(richtigePaare.map(key))
  return nutzerPaare.every((paar) => soll.has(key(paar)))
}

/** Zentrale Auswertung: prüft eine Nutzerantwort je nach Fragetyp. */
export function pruefeAntwort(typ, antwortDaten, nutzerEingabe) {
  switch (typ) {
    case 'single_choice':
      return nutzerEingabe === antwortDaten.richtig_index

    case 'multiple_choice':
      return arraysGleich(
        [...(nutzerEingabe ?? [])].sort((a, b) => a - b),
        [...antwortDaten.richtig_indices].sort((a, b) => a - b),
      )

    case 'formel_luecke':
      return lueckenVergleich(nutzerEingabe, antwortDaten.luecken)

    case 'freitext_zahl': {
      const wert = toNumber(nutzerEingabe)
      return wert !== null && Math.abs(wert - antwortDaten.richtiger_wert) <= antwortDaten.toleranz
    }

    case 'reihenfolge':
      return arraysGleich(nutzerEingabe, antwortDaten.richtige_reihenfolge)

    case 'zuordnung':
      return paareVergleich(nutzerEingabe, antwortDaten.richtige_paare)

    default:
      return false
  }
}

/** Leerer Startwert für die Nutzereingabe, passend zum Fragetyp. */
export function initialAntwort(typ, antwortDaten) {
  switch (typ) {
    case 'single_choice':
      return null
    case 'multiple_choice':
      return []
    case 'formel_luecke':
      return antwortDaten.luecken.map(() => '')
    case 'freitext_zahl':
      return ''
    case 'reihenfolge':
      return [...antwortDaten.elemente.keys()].reverse()
    case 'zuordnung':
      return []
    default:
      return null
  }
}

/** Ob die aktuelle Eingabe vollständig genug ist, um "Prüfen" zu erlauben. */
export function istAntwortVollstaendig(typ, antwortDaten, wert) {
  switch (typ) {
    case 'single_choice':
      return wert !== null && wert !== undefined
    case 'multiple_choice':
      return Array.isArray(wert) && wert.length > 0
    case 'formel_luecke':
      return Array.isArray(wert) && wert.every((w) => String(w ?? '').trim().length > 0)
    case 'freitext_zahl':
      return String(wert ?? '').trim().length > 0
    case 'reihenfolge':
      return Array.isArray(wert) && wert.length === antwortDaten.elemente.length
    case 'zuordnung':
      return Array.isArray(wert) && wert.length === antwortDaten.linke_spalte.length
    default:
      return false
  }
}

/** Menschlich lesbare Darstellung der Nutzerantwort fürs Feedback. */
export function formatNutzerAntwort(typ, antwortDaten, wert) {
  switch (typ) {
    case 'single_choice':
      return wert === null || wert === undefined ? '–' : antwortDaten.optionen[wert]
    case 'multiple_choice':
      return (wert ?? []).map((i) => antwortDaten.optionen[i]).join(', ') || '–'
    case 'formel_luecke':
      return (wert ?? []).join(' / ') || '–'
    case 'freitext_zahl':
      return wert ? `${wert}${antwortDaten.einheit ? ' ' + antwortDaten.einheit : ''}` : '–'
    case 'reihenfolge':
      return (wert ?? []).map((i) => antwortDaten.elemente[i]).join(' → ')
    case 'zuordnung':
      return (
        (wert ?? [])
          .map(([l, r]) => `${antwortDaten.linke_spalte[l]} → ${antwortDaten.rechte_spalte[r]}`)
          .join(', ') || '–'
      )
    default:
      return String(wert ?? '')
  }
}

/** Menschlich lesbare Darstellung der Musterlösung fürs Feedback. */
export function formatRichtigeAntwort(typ, antwortDaten) {
  switch (typ) {
    case 'single_choice':
      return antwortDaten.optionen[antwortDaten.richtig_index]
    case 'multiple_choice':
      return antwortDaten.richtig_indices.map((i) => antwortDaten.optionen[i]).join(', ')
    case 'formel_luecke':
      return antwortDaten.luecken.join(' / ')
    case 'freitext_zahl':
      return `${antwortDaten.richtiger_wert}${antwortDaten.einheit ? ' ' + antwortDaten.einheit : ''}`
    case 'reihenfolge':
      return antwortDaten.richtige_reihenfolge.map((i) => antwortDaten.elemente[i]).join(' → ')
    case 'zuordnung':
      return antwortDaten.richtige_paare
        .map(([l, r]) => `${antwortDaten.linke_spalte[l]} → ${antwortDaten.rechte_spalte[r]}`)
        .join(', ')
    default:
      return ''
  }
}

export function stufeKey(stufe) {
  return `stufe_${stufe}`
}

export function getAufgabe(karte, stufe) {
  return karte.aufgaben[stufeKey(stufe)]
}

/** Stufen-State-Machine: berechnet den neuen Fortschritt nach einer Antwort. */
export function applyAnswer(progress, isCorrect) {
  if (isCorrect) {
    if (progress.stufe >= MAX_STUFE) {
      return { ...progress, stufe: MAX_STUFE, gemeistert: true }
    }
    return { ...progress, stufe: progress.stufe + 1, gemeistert: false }
  }

  return {
    ...progress,
    stufe: Math.max(START_STUFE, progress.stufe - 1),
    fehler: progress.fehler + 1,
    gemeistert: false,
  }
}

export function isFocusVersion(progress) {
  return progress.fehler >= FOCUS_THRESHOLD
}
