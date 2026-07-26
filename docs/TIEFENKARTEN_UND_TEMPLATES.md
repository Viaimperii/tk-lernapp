# Tiefenkarten und visuelle Templates

## Ziel

Tiefenkarten werden nach der ersten vollständigen Themenlösung über `ab_lvl`
freigeschaltet. Sie wiederholen nicht bloss dieselbe Frage, sondern verlangen
Transfer, Beurteilung, Berechnung oder das Verknüpfen mehrerer fachlicher
Schritte. Eine Agentenfamilie erweitert immer zwei verschiedene, sinnvoll
verwandte Themen mit je zwei unterschiedlichen Tiefenkarten.

## Autoritative Dateien

- `src/data/depth-agent-cards.json`: geprüfte Familien und Karten
- `src/data/learning-visual-templates.json`: datenbasierte Darstellungen
- `reports/depth-agent-loop-state.json`: Cursor, Zyklen und Prüfverlauf

Die Dateien werden zur Laufzeit zusätzlich zum bestehenden Gesamtdatensatz
geladen. Der Agent verändert deshalb keine manuell gepflegten oder importierten
Prüfungskarten.

## Pflichtfelder einer Tiefenkarte

```json
{
  "id": "depth_0001_thema_a_thema_b_1",
  "familie_id": "depth_0001_thema_a_thema_b",
  "fach": "SCM",
  "thema_id": "beschaffung_lieferanten",
  "thema": "Beschaffung / Lieferanten",
  "stufe": 3,
  "ab_lvl": 1,
  "typ": "fallentscheidung",
  "lernziel": "Kosten, Qualität und Versorgungsrisiko gemeinsam beurteilen.",
  "frage": "Vollständige, ohne Beilage lösbare Ausgangslage und Frage",
  "antwort_daten": {},
  "erklaerung": "Kurze fachliche Begründung",
  "quellenkarten": ["vorhandene_karten_id"],
  "fachliche_belege": [
    {
      "claim": "Die konkrete fachliche Aussage der neuen Karte.",
      "source_card_id": "vorhandene_karten_id"
    }
  ],
  "verwandte_themen": [
    {
      "fach": "Finanzwirtschaft",
      "thema_id": "kostenrechnung",
      "begruendung": "Die fachliche Brücke zur zweiten Karte der Familie."
    }
  ],
  "ch_kontext": "Schweizer Prüfung Technische Kaufleute",
  "ch_fachlich_geprueft": true
}
```

`stufe` entspricht der höchsten vorhandenen Kartenstufe des Zielthemas.
`ab_lvl` wird schrittweise von 1 bis 5 erhöht. Jede Familie besitzt genau vier
Karten und deckt genau zwei Themen mit je zwei Karten ab. Die beiden Karten
desselben Themas prüfen unterschiedliche transferorientierte Blickwinkel.

## Visuelle Lernwerkbank

Der Typ `visuelle_zuordnung` lässt Lernbausteine in fachliche Bereiche legen:

```json
{
  "typ": "visuelle_zuordnung",
  "antwort_daten": {
    "template_id": "prozessband",
    "elemente": [
      {
        "id": "bedarf",
        "label": "Bedarf klären",
        "detail": "Menge, Qualität und Termin bestimmen"
      }
    ],
    "bereiche": [
      {
        "id": "vorbereitung",
        "label": "Vorbereitung",
        "hinweis": "Vor der Lieferantenauswahl"
      }
    ],
    "richtige_zuordnung": {
      "bedarf": "vorbereitung"
    }
  }
}
```

Erlaubt sind 3–8 eindeutige Bausteine und 2–4 Bereiche. Eine
Entscheidungsmatrix benötigt genau vier Bereiche.

## Neues Template

Ein Template ist ausschliesslich Darstellungskonfiguration:

```json
{
  "id": "risiko_landkarte",
  "name": "Risiko-Landkarte",
  "layout": "matrix",
  "instruction": "Ordne jeden Hinweis nach Eintritt und Auswirkung ein.",
  "lernprinzip": "Die Lage im Raster verbindet zwei Beurteilungskriterien.",
  "accent": "#7c3aed",
  "surface": "#ede9fe"
}
```

Zulässige Layouts sind `zonen`, `prozessband` und `matrix`. Farben müssen
vollständige Hex-Werte sein. Ein neues Template wird nur akzeptiert, wenn ein
bestehendes Template den fachlichen Lernvorteil nicht abbilden kann.

## Freigabekette

1. Quellenkarten und verwandte Themen auswählen.
2. Kartenfamilie erzeugen.
3. Unabhängige CH-Fachprüfung durchführen.
4. Strukturelles Audit und vollständigen Kartenreview ausführen.
5. Unit-Tests, Lint und Produktions-Build ausführen.
6. Nur den bestandenen Batch auf den Agenten-Branch committen.
7. Änderungen vor dem Merge im Pull Request kontrollieren.
