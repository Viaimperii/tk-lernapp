# Codex Prompt – App auf lerntaugliches finales Kartenschema bringen

Setze die Lernkarten-App auf das finale lerntaugliche Schema um.

## Importdatei
Nutze als Referenz:
`lernkarten_pruefungen_final_lerntauglich_Alle_Faecher.json`

## Gültige Kartentypen
- `single_choice`
- `multiple_choice`
- `formel_luecke_mc`
- `formel_builder`
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

`stufe` darf je nach Prüfungsfrequenz und fachlicher Tiefe zwischen 1 und 5 liegen.
Ein Thema verwendet nur die Stufen, für die Karten vorhanden sind; die App leitet daraus
seine variable Stufenfolge ab. Pro Stufe werden höchstens drei Aufgabenvarianten rotiert.

## Anzeige vor der Antwort
Zeige beim Öffnen jedes Themas zuerst eine eigene Einführungskarte mit Titel und
`begriff_erklaerung.kurz`. Erst danach folgt die erste Aufgabe.

Auf der Aufgabenkarte zeige:
1. Fach
2. Thema
3. Stufe
4. Lernziel
5. optional `aufgaben_hinweis` beziehungsweise eine ausdrücklich aufgabenspezifische Kurzerklärung
6. Frage
7. Antwortoptionen je nach Kartentyp

## Anzeige nach der Antwort
Nach dem Prüfen zeige:
- richtig/falsch
- bei falscher Antwort: korrekte Antwort(en), Rechenweg, Begründung und Merksatz
- bei richtiger Antwort auf der letzten Stufe: die Abschlusserklärung
- falls vorhanden: `rechtsgrundlage` mit Gesetz, Artikel und Absatz

Bei einer richtigen Antwort werden weder „Lösungsvorschlag“, „Kurz erklärt“ noch die
bereits gewählte korrekte Lösung wiederholt.

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

### formel_builder
Zeige Bilanzfelder und weitere Bausteine aus `antwort_daten.bausteine` als antippbare Elemente.
Prüfe die erstellte ID-Folge exakt gegen `antwort_daten.richtige_reihenfolge`.
Falls `antwort_daten.ergebnis` vorhanden ist, prüfe zusätzlich den Zahlenwert innerhalb der angegebenen Toleranz.
`antwort_daten.bilanz` ordnet Bausteine optional den Spalten Aktiven und Passiven zu.

### reihenfolge
Gewählte Reihenfolge als Indexliste gegen `richtige_reihenfolge` prüfen.

### zuordnung
Gewählte Paare gegen `richtige_paare` prüfen.

## Review-System
Speichere den Fortschritt pro Thema lokal:
- `lvl`
- `zeitpunkt_letzter_aufstieg`
- aktuelle Themenstufe
- `gesamt_richtig`
- `gesamt_falsch`
- `richtig_in_folge`
- `falsch_in_folge`
- `letzte_wiederholung`
- `naechste_wiederholung`

Intervalle: LVL 1 nach 4 Stunden, LVL 2 nach 6 Stunden, LVL 3 nach 8 Stunden,
LVL 4 nach 12 Stunden und LVL 5 nach 24 Stunden.
Ein Fehler senkt nur die Aufgabenstufe innerhalb des Themas, niemals das LVL.
Ein LVL-Aufstieg zählt nur bei einer fälligen Wiederholung auf der höchsten Themenstufe.

## Lernmodi
Baue Filter ein:
- Heute fällig
- Fehlertraining
- Fach auswählen
- Thema auswählen
- vorhandene Themenstufe auswählen
- Nur Formeln
- Nur Prüfungsfragen Stufe 3
- Gemischte Session

## Robustheit
- Ungültige Karten überspringen und verständliche Fehlermeldung loggen.
- Optionalfelder sicher lesen (`?.` verwenden).
- Alte JSON-Formate nicht mehr direkt laden; falls doch, mit Hinweis ablehnen oder über Converter importieren.
