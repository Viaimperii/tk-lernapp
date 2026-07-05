const STORAGE_PREFIX = 'tk-lernapp:progress:'

export const START_STUFE = 1
export const MAX_STUFE = 3

function defaultProgress() {
  return { stufe: START_STUFE, fehler: 0, gemeistert: false }
}

export function getProgress(karteId) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + karteId)
    if (!raw) return defaultProgress()
    const parsed = JSON.parse(raw)
    return { ...defaultProgress(), ...parsed }
  } catch {
    return defaultProgress()
  }
}

export function saveProgress(karteId, progress) {
  localStorage.setItem(STORAGE_PREFIX + karteId, JSON.stringify(progress))
  return progress
}

export function getFachProgress(karten) {
  const total = karten.length
  const gemeistert = karten.filter((k) => getProgress(k.id).gemeistert).length
  return { total, gemeistert }
}
