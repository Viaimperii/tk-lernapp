# JSON-Vorlage für LVL-Vertiefungen

`ab_lvl` ergänzt die fachliche `stufe`. Die Karte wird erst verwendet, wenn das
ganze Thema mindestens dieses LVL erreicht hat. LVL-Vertiefungen liegen immer
auf der höchsten Stufe des zugehörigen Themas.

## Zahleneingabe

```json
{
  "id": "lvl_finanzwirtschaft_beispiel_1",
  "fach": "Finanzwirtschaft",
  "thema_id": "beispiel",
  "thema": "Beispiel",
  "stufe": 3,
  "ab_lvl": 1,
  "typ": "zahlen_eingabe",
  "frage": "Berechne die Kennzahl.",
  "antwort_daten": {
    "richtiger_wert": 25,
    "toleranz": 0.1,
    "einheit": "%",
    "rundung": "Auf 1 Dezimalstelle"
  }
}
```

Die Eingabe akzeptiert Dezimalpunkt, Dezimalkomma und Schweizer
Tausendertrennzeichen.

## Lückentext mit Auswahl

```json
{
  "id": "scm_ressourcenplanung_lueckentext_1",
  "fach": "SCM",
  "thema_id": "ressourcenplanung",
  "thema": "Ressourcenplanung",
  "stufe": 3,
  "typ": "lueckentext_auswahl",
  "frage": "Ergänze die Definition: Ressourcenplanung umfasst [1] und [2] Einheiten.",
  "antwort_daten": {
    "luecken_mc": [
      {
        "position": 1,
        "optionen": ["materielle", "zufällige", "abgeschlossene"],
        "richtig_index": 0
      },
      {
        "position": 2,
        "optionen": ["private", "immaterielle", "unmessbare"],
        "richtig_index": 1
      }
    ]
  }
}
```

Jede Lücke wird separat beantwortet. Dadurch bleibt die Aufgabe auch ohne
Freitext- oder KI-Auswertung eindeutig prüfbar.

## Buchungssatz-Builder

```json
{
  "id": "lvl_finanzwirtschaft_buchung_1",
  "fach": "Finanzwirtschaft",
  "thema_id": "aufgaben_der_finanzbuchhaltung",
  "thema": "Aufgaben der Finanzbuchhaltung",
  "stufe": 3,
  "ab_lvl": 1,
  "typ": "buchungssatz_builder",
  "frage": "Wie lautet der Buchungssatz?",
  "antwort_daten": {
    "konten": [
      { "id": "raumaufwand", "label": "Raumaufwand" },
      { "id": "kreditoren", "label": "Kreditoren" },
      { "id": "bank", "label": "Bank" }
    ],
    "richtig": {
      "soll": "raumaufwand",
      "haben": "kreditoren",
      "betrag": 2500
    },
    "toleranz": 0
  }
}
```

`betrag` kann entfallen, wenn nur Soll und Haben geprüft werden sollen.

## Fallentscheidung mit Begründung

```json
{
  "id": "lvl_scm_fall_1",
  "fach": "SCM",
  "thema_id": "beschaffung_lieferanten",
  "thema": "Beschaffung / Lieferanten",
  "stufe": 3,
  "ab_lvl": 1,
  "typ": "fallentscheidung",
  "frage": "Welche Massnahme ist fachlich richtig?",
  "antwort_daten": {
    "entscheidungen": [
      "Massnahme A",
      "Massnahme B",
      "Massnahme C"
    ],
    "begruendungen": [
      "Begründung A",
      "Begründung B",
      "Begründung C"
    ],
    "richtig": {
      "entscheidung": 1,
      "begruendung": 0
    }
  }
}
```

Die Aufgabe gilt nur als richtig, wenn Entscheidung und Begründung gemeinsam
stimmen.
