# JSON-Vorlage: Zuordnungsaufgabe

Die App zeigt links Aussagen **A–D** und rechts auswählbare Lösungen **1–4**. Für jede linke Aussage wird genau eine rechte Lösung ausgewählt.

```json
{
  "id": "fach_thema_zuordnung_stufe3",
  "fach": "SCM",
  "thema_id": "eindeutige_themen_id",
  "thema": "Eindeutiger Thementitel",
  "quelle": "Eigene Lernaufgabe",
  "stufe": 3,
  "typ": "zuordnung",
  "lernziel": "Begriffe und Beschreibungen korrekt verbinden.",
  "begriff_erklaerung": {
    "kurz": "Kurze fachliche Einführung zum Thema."
  },
  "frage": "Ordne jeder Aussage die passende Beschreibung zu.",
  "antwort_daten": {
    "links": ["Aussage A", "Aussage B", "Aussage C", "Aussage D"],
    "rechts": ["Lösung 1", "Lösung 2", "Lösung 3", "Lösung 4"],
    "richtige_paare": [[0, 2], [1, 0], [2, 3], [3, 1]],
    "mehrfachverwendung": false
  },
  "loesungsvorschlag": {
    "kurz": "A–3, B–1, C–4, D–2"
  },
  "fehlerfallen": [],
  "merksatz": "Ein kurzer Merksatz.",
  "review": {},
  "tags": ["zuordnung"]
}
```

`richtige_paare` verwendet nullbasierte Indizes: `[0, 2]` bedeutet **A → 3**. Wenn eine rechte Lösung mehrfach verwendet werden darf, muss `mehrfachverwendung` auf `true` stehen.
