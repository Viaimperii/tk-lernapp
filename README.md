# TK-Lernapp

Die TK-Lernapp ist eine mobile Karteikarten-App zur Vorbereitung auf die eidgenössische Berufsprüfung Technische Kaufleute. Sie verbindet prüfungsnahe Aufgaben mit Themenstufen, zeitversetzten Wiederholungen und unterschiedlichen interaktiven Lernformen.

## Leitprinzip: Jede Änderung muss auf dem bestehenden Stand aufbauen

Die App wird kumulativ weiterentwickelt. Eine neue Änderung darf eine bereits gelöste Anforderung nicht stillschweigend rückgängig machen. Deshalb gilt:

1. Bestehendes Verhalten zuerst erfassen und als Ausgangslage behandeln.
2. Änderungen möglichst in der dauerhaften Quelle umsetzen, nicht nur in erzeugten Dateien.
3. Für jeden behobenen wiederkehrenden Fehler eine automatische Prüfung ergänzen.
4. Alle bisherigen Prüfungen weiterhin ausführen.
5. Fachinhalte nur entfernen, wenn das Thema danach nachweislich vollständig lernbar bleibt.
6. Eine Änderung erst abschliessen, wenn Generator, Audit, Tests und Produktions-Build erfolgreich sind.

Dieses Vorgehen sorgt dafür, dass Qualitätsregeln mit jeder Version wachsen und spätere Arbeiten frühere Verbesserungen nicht überschreiben.

## Verbindliche Quellen

- `scripts/update-learning-content.mjs` ist die dauerhafte Quelle für systematische Inhaltskorrekturen, Fachverschiebungen und neu erzeugte Lernkarten.
- `scripts/audit-content.mjs` enthält die regressionssicheren Qualitätsregeln für den gesamten Kartenbestand.
- `src/data/pruefungs_app_final_lerntauglich/lernkarten_pruefungen_final_lerntauglich_Alle_Faecher.json` ist der zusammengeführte, von der App geladene Kartenbestand.
- Die einzelnen Fach-JSON-Dateien werden aus demselben Bestand erzeugt und dürfen nicht unabhängig davon auseinanderlaufen.
- `CHANGELOG_lernformen.md` dokumentiert fachliche, didaktische und technische Änderungen.

Erzeugte JSON-Dateien werden nicht isoliert von Hand korrigiert. Sonst würde die nächste Ausführung des Generators die Änderung wieder überschreiben.

## Vorgehen für zukünftige Änderungen

### 1. Ausgangslage prüfen

- Arbeitsbaum und letzten Commit kontrollieren.
- Betroffene Themen vollständig ansehen, einschliesslich aller Stufen und Aufgabenvarianten.
- Prüfen, ob dieselbe Fehlerklasse noch in anderen Fächern vorkommt.
- Bestehende Tests und Regeln lesen, bevor vorhandene Logik verändert wird.

### 2. Auswirkung festlegen

Vor der Umsetzung kurz festhalten:

- Welche Karten, Themen, Fächer oder UI-Komponenten sind betroffen?
- Welche früheren Anforderungen müssen unverändert bleiben?
- Ist eine Datenmigration oder Änderung am Kartenschema nötig?
- Welche automatische Prüfung verhindert denselben Fehler zukünftig?

### 3. In der richtigen Ebene ändern

- Einzelner fachlicher Sonderfall: explizite Korrektur im Inhaltsgenerator.
- Wiederkehrender Inhaltsfehler: allgemeine Transformationsregel plus Audit-Regel.
- Neue Lernform: Kartenschema, Auswertung, UI und Tests gemeinsam erweitern.
- Fachverschiebung: Karte und gegebenenfalls Einführung gemeinsam verschieben; danach sicherstellen, dass Ursprungs- und Zielthema lernbar bleiben.
- Textkorrektur: vollständige Frage, vollständige Antwortmöglichkeiten und Lösung gemeinsam prüfen.

### 4. Vollständig validieren

```powershell
node scripts/update-learning-content.mjs
npm run audit:content
npm run review:cards
npm run lint
npm run test
npm run build
```

`review:cards` löst jede Karte anhand ihrer hinterlegten Lösung, prüft Aufbau,
Schwierigkeit und Lerneffekt und gleicht Prüfungskarten mit dem lokal
extrahierten offiziellen Prüfungskorpus ab. Die vollständigen Einzelresultate
werden unter `reports/` als Markdown und JSON gespeichert.

Zusätzlich ist bei UI-Änderungen eine visuelle Prüfung auf einem schmalen mobilen Viewport erforderlich.

### 5. Dokumentieren und versionieren

- Änderung im Changelog ergänzen.
- Nur die beabsichtigten Dateien stagen.
- `git diff --check` ausführen.
- Einen kleinen, verständlichen Commit erstellen.
- Erst nach erfolgreichen Prüfungen pushen.

## Versionsmodell

Die App folgt der semantischen Versionierung `MAJOR.MINOR.PATCH`.

- `MAJOR`: inkompatible Änderung am Kartenschema, Lernfortschritt oder gespeicherten Zustand.
- `MINOR`: neue Lernform, neues Thema, neue Stufe oder grössere rückwärtskompatible Funktion.
- `PATCH`: Inhaltskorrektur, Fachverschiebung, Qualitätsregel, Fehlerbehebung oder kleine UI-Verbesserung.

Bei einer Änderung am gespeicherten Lernfortschritt muss eine Migration vorhanden sein. Bestehende Level, Fälligkeiten und abgeschlossene Themen dürfen nicht ohne ausdrücklich dokumentierten Grund verloren gehen.

## Inhaltsregeln

### Fachzuordnung

- Finanzwirtschaft: Rechnungswesen, Kalkulation, Budget, Liquidität, Finanzierung und Kennzahlen.
- Marketing und Verkauf: Markt, Kundschaft, Angebot, Verkauf, CRM und Kommunikation mit dem Markt.
- Personalmanagement: Personalgewinnung, Führung, Arbeitsrecht, Sozialversicherung und Vorsorge.
- Recht/VWL: Rechtsgrundlagen sowie volkswirtschaftliche Zusammenhänge.
- SCM: Beschaffung, Produktion, Lager, Qualität, Infrastruktur und Logistik.
- Unternehmensführung: Strategie, Organisation, Projekte, Technologie, Wissen, Ethik und Umwelt.
- Problemlösung/Entscheidung: Methoden, Planung, Analyse und Entscheidungsverfahren.

Prüfungsquelle oder ursprüngliche Überschrift allein bestimmen nicht das Fach. Entscheidend ist der tatsächlich gelernte Inhalt.

### Fragen und Antworten

- Fragen prüfen Wissen oder Anwendung, nicht die Form einer Musterlösung.
- Verboten sind Metafragen wie „Welche Punkte passen zur Musterlösung dieser Prüfungsaufgabe?“.
- Jede Antwortmöglichkeit muss vollständig und ohne abgeschnittenen Satz verständlich sein.
- Die richtige Antwort darf nicht systematisch an derselben Position stehen.
- Länge und Detailgrad dürfen die richtige Antwort nicht offensichtlich verraten.
- Distraktoren müssen fachlich plausible Fehlannahmen abbilden.
- Mehrfachauswahlen müssen mindestens eine falsche Aussage enthalten.
- Stufen müssen einen erkennbaren Lernfortschritt von Verständnis zu Anwendung und Beurteilung erzeugen.

### LVL-Vertiefungen

- `stufe` steuert den Lernweg beim erstmaligen Lösen eines Themas.
- `ab_lvl` schaltet eine zusätzliche Aufgabe erst nach dem erfolgreichen Themenabschluss frei.
- Auf der höchsten Themenstufe wird immer die anspruchsvollste für das aktuelle LVL freigeschaltete Kartengruppe verwendet.
- Karten ohne `ab_lvl` bleiben die Grundlage für LVL 0.
- Ein Fehler in einer LVL-Vertiefung senkt weiterhin nur die Aufgabenstufe und niemals das erreichte LVL.
- Unterstützte aktive Vertiefungen sind `zahlen_eingabe`, `buchungssatz_builder` und `fallentscheidung`.
- Neue LVL-Karten müssen auf der höchsten Stufe ihres Themas liegen und lokal eindeutig auswertbar sein.

Beispiele für die neuen JSON-Strukturen stehen in
`src/data/pruefungs_app_final_lerntauglich/JSON_Vorlage_LVL_Vertiefungen.md`.

### Themenintegrität

- Eine Karte enthält nur Inhalte ihres ausgewiesenen Themas.
- Nach Verschiebungen oder Löschungen besitzt jedes verbleibende Thema mindestens eine Einführung und eine lösbare Aufgabe.
- Doppelte Themen werden konsolidiert, wenn sie dasselbe Lernziel behandeln.
- Rechtsangaben werden in der Lösung mit korrektem Gesetz, Artikel und Absatz angezeigt, nicht als unbeabsichtigter Hinweis in der Frage.

## Definition of Done

Eine Änderung ist abgeschlossen, wenn:

- sie in der dauerhaften Quelle umgesetzt ist;
- eine passende Regressionsprüfung existiert;
- alle betroffenen Themen und Fachzuordnungen kontrolliert wurden;
- keine Metafragen, Satzabbrüche oder Antwortpositionsmuster neu entstanden sind;
- Inhaltsaudit, Linter, Tests und Build erfolgreich sind;
- Changelog und gegebenenfalls Versionsnummer aktualisiert sind;
- der Git-Diff nur beabsichtigte Änderungen enthält.

## Lokale Entwicklung

```powershell
npm install
npm run dev
```

Die Produktionsversion wird mit `npm run build` erzeugt.
