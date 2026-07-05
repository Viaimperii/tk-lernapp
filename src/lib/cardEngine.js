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

/** Vergleicht Nutzereingabe mit der Musterlösung: numerisch (mit Toleranz) oder als Text. */
export function checkAnswer(userInput, loesung) {
  const userNum = toNumber(userInput)
  const loesungNum = toNumber(loesung)

  if (userNum !== null && loesungNum !== null) {
    return Math.abs(userNum - loesungNum) < 0.01
  }

  return normalize(userInput) === normalize(loesung)
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

/** Entscheidet, ob das Eingabefeld für eine Zahl- oder Text-Antwort ausgelegt sein soll. */
export function isNumericLoesung(loesung) {
  return toNumber(loesung) !== null
}
