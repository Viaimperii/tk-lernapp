// Lädt alle Fach-JSON-Dateien in diesem Ordner statisch zur Build-Zeit.
// Der Dateiname (ohne .json) dient als stabile Fach-ID für Routing & Persistenz.
const modules = import.meta.glob('./*.json', { eager: true })

function slugToLabel(slug) {
  return slug.charAt(0).toUpperCase() + slug.slice(1)
}

export const faecher = Object.entries(modules)
  .map(([path, mod]) => {
    const id = path.replace('./', '').replace('.json', '')
    const karten = mod.default ?? mod
    const name = karten[0]?.fach ?? slugToLabel(id)
    return { id, name, karten }
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'de'))

export function getFach(fachId) {
  return faecher.find((f) => f.id === fachId)
}

export function getKarte(fachId, karteId) {
  return getFach(fachId)?.karten.find((k) => k.id === karteId)
}
