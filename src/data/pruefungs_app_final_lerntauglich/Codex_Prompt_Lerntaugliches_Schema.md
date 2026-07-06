# Codex Prompt – App auf lerntaugliches finales Kartenschema bringen

Setze die Lernkarten-App auf das finale lerntaugliche Schema um.

## Importdatei
Nutze als Referenz:
`lernkarten_pruefungen_final_lerntauglich_Alle_Faecher.json`

## Gültige Kartentypen
- `single_choice`
- `multiple_choice`
- `formel_luecke_mc`
- `reihenfolge`
- `zuordnung`

Es gibt keine Freitextkarten.

## Pflichtfelder pro Karte
Jede Karte hat mindestens:
- `id`
- `fach`
- `thema_id`
- `thema`
- `quelle`
- `stufe`
- `typ`
- `lernziel`
- `begriff_erklaerung`
- `frage`
- `antwort_daten`
- `loesungsvorschlag`
- `fehlerfallen`
- `merksatz`
- `review`
- `tags`

## Anzeige vor der Antwort
Zeige:
1. Fach
2. Thema
3. Stufe
4. Lernziel
5. Begriffserklärung `begriff_erklaerung.kurz`
6. Frage
7. Antwortoptionen je nach Kartentyp

## Anzeige nach der Antwort
Nach dem Prüfen zeige:
- richtig/falsch
- korrekte Antwort(en)
- `loesungsvorschlag.kurz`
- `loesungsvorschlag.rechenweg`
- `loesungsvorschlag.warum`
- `fehlerfallen`
- `merksatz`

## Antwortprüfung
### single_choice
Prüfe Auswahl gegen `antwort_daten.richtig_index`.

### multiple_choice
Prüfe exakt gegen `antwort_daten.richtige_indices`.
Nur korrekt, wenn alle richtigen und keine falschen Optionen gewählt wurden.

### formel_luecke_mc
Für jede Lücke `luecken_mc` eine Auswahl anzeigen.
Karte ist korrekt, wenn alle Lücken den jeweiligen `richtig_index` treffen.
Nachher vollständige Formel aus `antwort_daten.formel` anzeigen.

### reihenfolge
Gewählte Reihenfolge als Indexliste gegen `richtige_reihenfolge` prüfen.

### zuordnung
Gewählte Paare gegen `richtige_paare` prüfen.

## Review-System
Speichere pro Karte lokal oder in der Datenbank:
- `box`
- `gesamt_richtig`
- `gesamt_falsch`
- `richtig_in_folge`
- `falsch_in_folge`
- `letzte_wiederholung`
- `naechste_wiederholung`

Vorschlag Intervall:
- Box 1: 1 Tag
- Box 2: 2 Tage
- Box 3: 5 Tage
- Box 4: 10 Tage
- Box 5: 20 Tage
- Box 6: 40 Tage

Bei richtiger Antwort: Box + 1 bis max. 6.
Bei falscher Antwort: Box zurück auf 1.

## Lernmodi
Baue Filter ein:
- Heute fällig
- Fehlertraining
- Fach auswählen
- Thema auswählen
- Stufe 1/2/3 auswählen
- Nur Formeln
- Nur Prüfungsfragen Stufe 3
- Gemischte Session

## Robustheit
- Ungültige Karten überspringen und verständliche Fehlermeldung loggen.
- Optionalfelder sicher lesen (`?.` verwenden).
- Alte JSON-Formate nicht mehr direkt laden; falls doch, mit Hinweis ablehnen oder über Converter importieren.
