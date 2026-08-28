# Bedienungsanleitung

## Anwesenheits-Dashboard (Version 1.36 vom 28.08.2026)

Die App erfasst für jeden Werktag, ob du im **Büro** oder im **Homeoffice** gearbeitet hast. Urlaub, Krankheit und andere Sonderformen sind zwar keine Arbeit, sollen aber ebenfalls erfasst werden, damit jeder Werktag dokumentiert ist. Daraus werden eine Übersicht über alle Monate, die Anzahl der Büropflichttage sowie das Verhältnis Büro/Homeoffice berechnet.

---

## 1. Starten der App

Die App läuft im Browser. Zum Starten genügt es, die Datei `index.html` im Browser zu öffnen (z. B. per Doppelklick auf die Datei). Es ist kein Webserver erforderlich.

Die Daten werden im Browser gespeichert (localStorage). Solange du denselben Browser und Computer verwendest, bleiben alle Einträge erhalten.

### 1.1 Installation als App (Smartphone/Tablet)

Die App ist eine **Progressive Web App (PWA)** und lässt sich auf dem Smartphone wie eine normale App installieren:

1. Die App-Adresse im Browser (Chrome, Brave, Samsung Internet o. Ä.) öffnen.
2. Im Browser-Menü **„App installieren"** bzw. **„Zum Startbildschirm hinzufügen"** wählen.
3. Die App erscheint anschließend mit eigenem Icon auf dem Startbildschirm und startet vollflächig ohne Adressleiste – wie eine native App.

Eigenschaften des App-Modus:

- **Offline-Fähig:** Nach dem ersten Laden werden App-Seiten, Stylesheets, Skripte und diese Bedienungsanleitung (HTML/PDF) im Gerätespeicher vorgehalten. Die App startet und funktioniert damit auch ohne Internetverbindung; Einträge werden weiterhin lokal gesichert.
- **Automatische Updates:** Bei bestehender Internetverbindung lädt die App immer den aktuellen Stand; Änderungen erscheinen spätestens mit dem nächsten Öffnen.
- **Daten bleiben gerätebezogen:** Der Speicher gilt pro Gerät und Browser – unabhängig davon, ob die App installiert oder nur als Webseite geöffnet ist. Ein Datenaustausch zwischen Geräten erfolgt über Backup exportieren/importieren (Kapitel 8).

---

## 2. Aufbau der Oberfläche

Das Fenster ist in vier Bereiche gegliedert:

- **Kopfzeile:** Überschrift mit Jahr und Auswahl des Zeitraumbeginns (Startmonat und Startjahr).
- **KPI-Karten:** Büroquote, Homeofficequote, Büropflicht (aktueller Monat) und Urlaubsstand – jeweils mit Zahlenwert, prozentualem **Fortschrittsring** und **Ampel-Farben** (grün/gelb/rot) sowie informativem Tooltip beim Überfahren.
- **Mitte:** Der aktuelle Monat als große **Hero-Karte** (mit Badge „Läuft gerade") sowie alle weiteren Monate des Zeitraums als kompakte Mini-Karten in einer Jahresübersicht.
- **Fußzeile:** Zwei Karten – **„Einstellungen"** (Urlaubskontingent, Bundesland-Auswahl mit Checkbox „24./31.12. frei") und **„Daten"** (Übersicht drucken / PDF, Backup exportieren mit Hinweis „Zuletzt exportiert:", Backup importieren) – sowie darunter links der Link zur Bedienungsanleitung und rechts die Versionsangabe mit Copyright („© 2026").

Die Darstellung passt sich der Fensterbreite an: Jahresübersicht in 3 Spalten am Desktop, 2 Spalten auf Tablets, 1 Spalte auf Smartphones. Auf Touch-Geräten gelten die Bedienhinweise aus Kapitel 4.4.

---

## 3. Zeitraum wählen

Der Anzeigezeitraum umfasst immer ein ganzes Jahr (12 Monate). Er beginnt mit dem gewählten Startmonat und endet automatisch 12 Monate später (Start + 12 Monate – 1 Tag). Ein eigenes Enddatum gibt es nicht.

- **Startmonat wählen:** Über die beiden Auswahlfelder `[Monat] [Jahr]` in der Kopfzeile legst du den Startmonat des Jahreszeitraums fest. Die Auswahl wirkt **sofort** – ein zusätzlicher „Übernehmen“-Klick ist nicht nötig. Beispiel: Startmonat `September` und Jahr `2026` ergibt den Zeitraum **September 2026 – August 2027**.
- **Vor- und zurückblättern:** Mit den Pfeilen **‹** und **›** neben den Auswahlfeldern verschiebst du den Zeitraum um jeweils einen Monat. Dasselbe geht per Tastatur mit den **Pfeiltasten links/rechts**.
- **Heute:** Der Button **Heute** setzt den Zeitraum direkt auf den aktuellen Monat zurück.
- **Jahresauswahl:** Die Liste reicht von mehreren Jahren in der Vergangenheit bis einschließlich **2030**. Liegen Einträge in späteren Jahren vor, wird die Auswahl automatisch erweitert.
- Die Auswahl wird gespeichert und beim nächsten Öffnen wiederhergestellt.

---

## 4. Die Monatsansicht

Die Mitte der Seite besteht aus zwei Bereichen:

### 4.1 Hero-Karte (aktueller Monat)

Der Monat mit dem heutigen Datum wird als große Karte mit grünem Badge **„● Läuft gerade"** dargestellt. Sie enthält:

- **Monatsname und Jahr**, z. B. `August 2026`.
- **Werktage:** Anzahl der Arbeitstage (Montag bis Freitag) im Monat.
- **Bürotage (Soll):** erfasste Bürotage im Verhältnis zu den Pflichttagen, z. B. `1 / 12`, mit **Fortschrittsbalken** und farbigem **Prozent-Badge**.
- Den Wochenkalender (Mo – Di – Mi – Do – Fr) mit größeren Tageszellen.

### 4.2 Jahresübersicht

Alle übrigen Monate des gewählten Zeitraums erscheinen darunter als kompakte Mini-Karten (in 3 Spalten). Jede Karte zeigt:

- **Monatsname** und rechts die Werte `Bürotage/Pflichttage` (z. B. `3/12`) mit farbigem **Prozent-Badge**. Erstreckt sich der Zeitraum über zwei Kalenderjahre, wird hinter dem Monatsnamen das jeweilige Jahr angezeigt, z. B. `September 2026` und `August 2027`.
- Einen schmalen **Fortschrittsbalken** für den Anteil der erfüllten Büropflichttage.
- Den Wochenkalender in kleinerer Darstellung.

Liegt der aktuelle Monat außerhalb des gewählten Zeitraums, wird die Hero-Karte ausgeblendet und alle Monate erscheinen als Mini-Karten.

### 4.3 Tageszellen

- Jeder Werktag ist ein Feld; Wochenenden werden nicht dargestellt. Leere Felder am Anfang der ersten Woche füllen den Kalender aus.
- **Erfasste Tage** haben die Farbe ihrer Art und ein **Icon** oben links (z. B. 🏢 Bürotag, 🏖️ Urlaub). Die Icons machen die Arten auch ohne Farbe unterscheidbar (z. B. bei Rot-Grün-Sehschwäche).
- **Unerfasste Tage in der Vergangenheit** bleiben weiß.
- **Unerfasste Tage in der Zukunft** werden gestrichelt umrandet dargestellt („noch offen").
- Als **„gebucht" markierte Tage** zeigen zusätzlich einen **grünen Haken** unten rechts.
- **Schnellauswahl per Rechtsklick:** Ein Rechtsklick auf einen Tag öffnet an der Mausposition ein Menü mit dem Datum, **Eintrag bearbeiten**, **Mehrfachauswahl…**, einer Trennlinie und allen Arten. Bei einem vorhandenen Eintrag gibt es zusätzlich den **Löschen**-Eintrag; ist der Tag als **Bürotag** eingetragen, erscheint außerdem der **gebucht**-Umschalter. Ein Klick auf eine Art setzt den Tag sofort, ein Klick auf **gebucht** markiert den Tag (✓), **Eintrag bearbeiten** öffnet den vollständigen Dialog, **Mehrfachauswahl…** startet die Mehrfachauswahl (siehe Kapitel 5) und **Löschen** entfernt den Eintrag direkt. Das Menü schließt sich per ESC, bei einem Klick daneben oder bei einem Rechtsklick in die Legende. Auf Touch-Geräten (Smartphone/Tablet) funktioniert die Schnellauswahl über einen **langen Druck** auf den Tag – siehe Kapitel 4.4.
- **Tooltip beim Überfahren:** Ein Hovertipp auf einen Tag zeigt sofort einen kleinen Infokasten mit Datum, der Art (z. B. `- Bürotag -`) und den Hinweisen **Linksklick: Eintrag bearbeiten** / **Rechtsklick: Schnellauswahl**. Bei automatisch erkannten Feiertagen (s. u.) zeigt der Tooltip zusätzlich den Feiertagsnamen (z. B. `- Weihnachten -`), arbeitsfreie Sondertage (24./31.12.) zeigen `- Arbeitsfrei -`. Das rote **?-Badge** auf leeren Tagen zeigt beim Überfahren den Hinweis „Diesem Tag sollte eine Anwesenheitsart zugeordnet werden." Auch die Legenden-Einträge sowie die Buttons und das Label „Zeitraum Start-Monat" zeigen solche Tooltips.
- **Automatische Feiertage:** Gesetzliche Feiertage des gewählten Bundeslandes (alle 16 Bundesländer wählbar) und optional arbeitsfreie Sondertage (24./31.12., per Checkbox aktivierbar) werden automatisch erkannt und im Kalender angezeigt (🎉 Icon, violette Farbe), ohne dass du sie manuell erfassen musst. Ein manueller Eintrag hat dabei immer Vorrang – setzt du z. B. an einem Feiertag „Homeoffice", wird dieser Eintrag angezeigt statt des Feiertags. Beim Wechsel des Bundeslandes werden vorhandene Feiertags-Einträge automatisch an die neue Liste angepasst. Die automatischen Feiertage werden nicht in den Browser-Daten gespeichert.
- **Leere Tage:** Werktage ohne Eintrag zeigen ein rotes **?-Badge** oben rechts in der Tageszelle. Der Tooltip weist darauf hin, dass diesem Tag eine Anwesenheitsart zugeordnet werden sollte. Das ?-Badge erscheint nur in Monaten mit mindestens einem erfüllten Solltag.
- Die **Legende** unterhalb der Jahresübersicht erklärt Farben, Icons und Zähler (siehe Kapitel 6).

### 4.4 Bedienung auf Touch-Geräten (Smartphone/Tablet)

Die App passt sich schmalen Displays an: Auf Smartphones werden KPI-Karten und Jahresübersicht einspaltig dargestellt, alle Dialoge passen sich der Bildschirmbreite an. Die Bedienung ist vollständig ohne Maus möglich:

- **Tippen auf einen Tag:** öffnet den Dialog `Eintrag hinzufügen` bzw. `Eintrag bearbeiten` – wie der Linksklick mit der Maus.
- **Langer Druck auf einen Tag** (ca. eine halbe Sekunde, ohne den Finger zu bewegen): öffnet das **Schnellauswahl-Menü** an der Fingerposition (gleiche Funktionen wie per Rechtsklick: Art setzen, **Eintrag bearbeiten**, **Mehrfachauswahl…**, **gebucht**, **Löschen**). Wird der Finger vor Ablauf bewegt oder abgehoben, wird der Vorgang abgebrochen.
- **Langer Druck auf einen Legenden-Eintrag:** öffnet das **Export-Menü** dieser Art (wie Rechtsklick auf die Legende).
- **Tooltips entfallen:** Die Hover-Infos für Tage, Legende und Buttons gibt es auf Touch-Geräten nicht; stattdessen dient der lange Druck direkt als Zugang zu allen Funktionen.
- Damit der lange Druck zuverlässig funktioniert, ist die Textauswahl auf Kalenderfeldern und Legendeneinträgen deaktiviert.

---

## 5. Einträge anlegen, bearbeiten und löschen

**Tag anklicken:** Ein Klick auf einen Werktag öffnet den Dialog `Eintrag hinzufügen` bzw. `Eintrag bearbeiten`.

**Schnellbelegung per Rechtsklick:** Ein Rechtsklick auf einen Werktag öffnet das Schnellauswahl-Menü (siehe Kapitel 4.3) an der Mausposition, mit dem du die Art mit einem Klick setzen oder den Eintrag direkt löschen kannst. Auf Touch-Geräten genügt ein langer Druck auf den Tag (Kapitel 4.4).

**Mehrfachauswahl:** Mehrere nicht zusammenhängende Tage lassen sich markieren und in einem Rutsch ändern:

- Am Desktop einen Tag mit gedrückter **Shift-**, **Strg-**- oder **Cmd-Taste** anklicken – das startet die Mehrfachauswahl und markiert den Tag mit blauem Ring. Solange die Auswahl aktiv ist, genügt ein einfacher Klick, um weitere Tage hinzuzufügen oder wieder abzuwählen (statt des Dialogs).
- Auf Touch-Geräten: im Schnellauswahl-Menü (langer Druck auf einen Tag) **Mehrfachauswahl…** wählen – der angetippte Tag ist bereits markiert, jeder weitere Tipp wählt eine Zelle an oder ab.
- Unten erscheint eine **Auswahl-Leiste** mit Zähler („x Tage ausgewählt"), den Buttons **Arbeitsplatz und/oder Parkplatz gebucht** und **Bürotag** sowie daneben allen weiteren Arten (Homeoffice, Dienstreise, …) zum gemeinsamen Zuweisen sowie den Buttons **Löschen** und **Abbrechen**. Das Zuweisen einer Art beendet die Auswahl mit dem Hinweis „x Tage gesetzt ✓" und schließt die Leiste.
- **Arbeitsplatz und/oder Parkplatz gebucht** in der Auswahl-Leiste setzt die markierten Tage in einem einzigen Klick zugleich als **Bürotag** und als **gebucht** (grüner Haken) und schließt die Leiste – es ist kein zweiter Klick auf „Bürotag" nötig, da nur Bürotage gebucht sein können. Sind die Tage bereits alle gebucht, wird der Haken durch erneuten Klick wieder entfernt (die Art bleibt dabei Bürotag). Das Zuweisen beendet die Auswahl mit dem Hinweis „x Tage als Bürotag gesetzt & gebucht ✓".
- **Löschen** entfernt die Einträge aller markierten Tage; vorher erscheint ein Bestätigungsdialog. **Abbrechen** bzw. **ESC** verwirft die Auswahl – ist der Bestätigungsdialog offen, schließt das erste ESC nur diesen und das zweite ESC die Auswahl.
- Die Auswahl darf Monate überspannen: Während der Mehrfachauswahl kann mit den Pfeilen bzw. Pfeiltasten geblättert werden, die Markierung bleibt über Monatswechsel hinweg erhalten.
- Regeln: Wochenenden sind nicht wählbar (sie werden nicht dargestellt). Werden Nicht-Bürotage zugewiesen, verlieren diese Tage vorhandene gebucht-Haken; bei Bürotagen bleiben bestehende Haken unverändert. Weitere Arten (ab »Homeoffice«) werden in der Auswahl-Leiste unterhalb von Bürotag angezeigt. Die Tooltips ruhen während der Mehrfachauswahl. Ohne aktive Auswahl bleibt alles wie bisher – ein normaler Klick öffnet weiterhin den Dialog.

Im Dialog kannst du:

- **Startdatum** und **Enddatum** festlegen (das Enddatum ist mit dem Startdatum vorbelegt).
  - Ist das **Enddatum größer als das Startdatum**, wird beim Speichern der **gesamte Bereich** von Start- bis Enddatum mit der gewählten Art belegt – praktisch für Urlaub, Krankheit oder Dienstreisen über mehrere Tage.
  - Änderst du das Startdatum nachträglich, wird das Enddatum automatisch angepasst, falls es vor dem Startdatum läge.
- **Art** aus der Liste wählen (siehe Farben unten).
- **Arbeitsplatz und/oder Parkplatz gebucht** anhaken, um den Tag als „gebucht" zu markieren (z. B. bereits reservierter Urlaub). Das Feld **Arbeitsplatz und/oder Parkplatz gebucht** wird nur angezeigt, wenn als Art **Bürotag** gewählt ist; bei anderen Arten verschwindet es und eine bereits gesetzte Markierung wird entfernt. Bei belegten Tagen erscheint ein grüner **Haken** unten rechts.
- über **OK** speichern,
- über **Löschen** den Eintrag entfernen (nur bei vorhandenen Einträgen). Bei einem Bereich (Enddatum > Startdatum) wird der **gesamte Bereich** gelöscht; vor dem Löschen erscheint ein Bestätigungsdialog.
- über **Abbrechen** den Dialog schließen, ohne etwas zu ändern.

Hinweise:

- Für ein Datum kann immer nur **ein** Eintrag existieren. Verschiebst du einen Eintrag auf ein Datum, das bereits belegt ist, erscheint eine Warnung.
- **Manuelle Einträge haben Vorrang vor automatischen Feiertagen.** Setzt du z. B. an einem automatisch erkannten Feiertag „Bürotag", wird dieser angezeigt und der Feiertag ausgeblendet. Den automatisch erkannten Feiertag erhältst du zurück, indem du den manuellen Eintrag löschst.
- Ein weißes Feld bedeutet: für diesen Tag wurde noch nichts erfasst.
- Ein gestrichelt umrandetes Feld bedeutet: dieser zukünftige Tag ist noch nicht erfasst.
- **ESC** schließt den Dialog (und auch den Lösch-Bestätigungsdialog) ohne zu speichern. Ein Klick auf das leere Fenster neben dem Dialog schließt ihn ebenfalls.

---

## 6. Farben und Bedeutung

| Farbe     | Art         | Bedeutung                                        |
|-----------|-------------|--------------------------------------------------|
| Blau      | Bürotag     | Vor Ort im Büro gearbeitet                       |
| Grün      | Homeoffice  | Im Homeoffice gearbeitet                         |
| Ocker     | Freizeittag | Freizeittag                                      |
| Grau      | Dienstreise | Dienstreise                                      |
| Violett   | Feiertag    | Feiertag (automatisch erkannt, s. Kap. 4.3)      |
| Rot       | Krankheit   | Krank (Krankschreibung)                          |
| Terrakotta| Urlaub      | Urlaub (siehe Zähler in der Legende)             |

Die **Legende** unterhalb der Jahresübersicht zeigt für jede Art den Farbklecks, das **Icon** und die Anzahl im gewählten Zeitraum, z. B. `Bürotag (10)`. Zwei Arten sind Sonderfälle: Beim **Urlaub** steht statt der Zeitraumzahl der Jahresstand (genommen/geplant/ungeplant, siehe unten), beim **Krankheitstag** die Zahl im gewählten Zeitraum **plus die Jahreszahl**, z. B. `Krankheitstage 2 · Jahr 9` – so bleibt sichtbar, wie viele Krankheitstage im laufenden Kalenderjahr insgesamt angefallen sind. Die Icons (🏢 🏠 🏃 ✈️ 🎉 🤒 🏖️) ergänzen die Farben, damit die Arten auch bei Farbsehschwäche eindeutig sind.

Die Legendeneinträge sind **klickbar und fungieren als Filter**:

- Ein Klick auf eine Art (z. B. `Krankheit`) blendet alle anderen Tage aus – nur noch diese Art wird im Kalender hervorgehoben (dunkler Rahmen, Rest stark abgeblendet).
- Der aktive Filter ist grün umrandet; die übrigen Einträge sind abgeblendet.
- Ein erneuter Klick auf die aktive Art hebt den Filter wieder auf (alle Tage werden normal angezeigt).
- Per Tooltip (Maus darüberhalten) wird die Funktion des jeweiligen Eintrags angezeigt.

**Tage exportieren:** Ein Rechtsklick auf einen Eintrag in der Legende öffnet ein Kontextmenü (auf Touch-Geräten: langer Druck auf den Eintrag). Damit kannst du die Tagesliste dieser Art (z. B. alle Bürotage) als **TXT-, CSV- oder JSON-Datei** exportieren. Die Menüeinträge beginnen mit **Export →** und enden mit einem Ellipse-Zeichen `…` (es folgt ein Dialog). Beim Bürotag-Eintrag gibt es zusätzlich **Export → gebucht-Tage…**. Beim Urlaub-Eintrag stehen drei Varianten zur Wahl:

- **Export → Genommene Urlaubstage…:** alle Urlaubstage im gewählten Zeitraum, die vor heute liegen.
- **Export → Geplante Urlaubstage…:** alle Urlaubstage im gewählten Zeitraum, die nach heute liegen.
- **Export → Alle eingetragenen Urlaubstage…:** sämtliche Urlaubstage im gewählten Zeitraum (genommen und geplant).

Im Export-Dialog wählst du:

- **Zeitraum:** aktueller Monat, aktuelles Quartal, aktuelles Jahr oder ein frei wählbarer Zeitraum (Start-/Enddatum). Bei **Urlaub, Feiertag, Krankheit und Freizeittag** ist „Aktuelles Jahr“ voreingestellt, sonst „Aktueller Monat“.
- **Datumsformat:** `TT.MM.JJJJ` (lesbar) oder `JJJJ-MM-TT` (ISO, sortierbar). Gilt für das TXT-Format; in CSV und JSON wird immer das ISO-Format verwendet.
- **Dateiformat:** `TXT` (Kopfzeile + eine Datumszeile je Eintrag), `CSV` (spaltentrennwerte Textdatei) oder `JSON` (strukturierte Daten für die Weiterverarbeitung).

Die **TXT-Datei** enthält eine Kopfzeile mit der Kategorie und danach ein Datum pro Zeile, z. B.:

```
Bürotage
01.09.2026
04.09.2026
08.09.2026
```

Bei den Urlaub-Listen steht in der Kopfzeile zusätzlich die Gesamtzahl der Tage, z. B. `Alle eingetragenen Urlaubstage (20 Tage)`. Bei der „gebucht“-Liste steht zusätzlich die Art hinter dem Datum, z. B. `01.10.2026 · Urlaub`.

Die **CSV-Datei** enthält eine Header-Zeile und danach einen Eintrag pro Zeile. Bei den Tageslisten (`Bürotage`, `Homeoffice-Tage` u. ä.) nur die Spalte `Datum`, bei der „gebucht“-Liste die Spalten `Datum,Art`:

```csv
Datum,Art
2026-09-01,Bürotag
2026-09-04,Mittag
```

Die **JSON-Datei** ist ein strukturiertes Array mit Datums-Objekten, z. B. `[{"date":"2026-09-01"}]` bzw. bei „gebucht“ `[{"date":"2026-09-01","label":"Bürotag"}]`. Das Datum steht dabei immer im ISO-Format.

Für Urlaub wird zusätzlich angezeigt:

```
Urlaub (genommen x / geplant y / ungeplant z)
```

- *genommen:* Urlaubstage in diesem Jahr, die in der Vergangenheit liegen.
- *geplant:* Urlaubstage in diesem Jahr, die in der Zukunft liegen.
- *ungeplant:* verbleibende Tage bis zum eingestellten Jahreskontingent.

**Urlaubskontingent einstellen:** Das Jahreskontingent ist frei einstellbar und auf **30 Tage** voreingestellt. Unten links im Feld `Urlaubskontingent` die gewünschte Anzahl eingeben und mit **OK** bestätigen. Vor der Übernahme erscheint ein **Bestätigungsdialog** („Kontingent von x auf y Tage ändern?"); erst ein Klick auf **Ändern** übernimmt den neuen Wert, **Abbrechen** verwirft ihn. Die Einstellung wird gespeichert und beim nächsten Öffnen wiederhergestellt.

### 6.1 Bundesland und Feiertage

Im Footer-Bereich befindet sich ein Dropdown **Bundesland** mit allen 16 deutschen Bundesländern. Die Auswahl bestimmt, welche gesetzlichen Feiertage automatisch erkannt werden:

- **9 bundeseinheitliche Feiertage** (Neujahr, Karfreitag, Ostermontag, Tag der Arbeit, Christi Himmelfahrt, Pfingstmontag, Tag der Deutschen Einheit, 1. und 2. Weihnachtstag) gelten in allen Bundesländern.
- **Zusätzliche Feiertage** je nach Bundesland: Reformationstag (31.10.), Allerheiligen (1.11.), Fronleichnam, Buß- und Bettag.
- **24./31.12. frei:** Per Checkbox aktivierbar – Heiligabend und Silvester werden als arbeitsfreie Sondertage geführt (keine gesetzlichen Feiertage, aber betrieblich arbeitsfrei). Die Checkbox ist unabhängig vom Bundesland.

**Beim Wechsel des Bundeslandes** werden vorhandene Feiertags-Einträge automatisch an die neue Liste angepasst: Tage, die im neuen BL ein Feiertag sind, werden überschrieben; ehemalige Feiertage, die im neuen BL nicht mehr gelten, werden entfernt. Eine kurze Meldung zeigt die Anzahl der angepassten Einträge.

Die Einstellung wird gespeichert und beim nächsten Öffnen wiederhergestellt.

### 6.2 Gespeichert-Toast

Nach jeder Änderung erscheint unten in der Mitte kurz der Hinweis **„Gespeichert ✓"** und verschwindet nach 1,5 Sekunden. So ist sofort erkennbar, dass die Änderung in den Browser-Daten gespeichert wurde.

Bei inhaltlichen Änderungen an Tagen (Setzen, Löschen, Zuweisen – auch über die Mehrfachauswahl oder einen Backup-Import) bleibt die Meldung **8 Sekunden** stehen und enthält zusätzlich den Link **„Rückgängig"**, mit dem sich die Änderung direkt zurücknehmen lässt (siehe Kapitel 6.3).

### 6.3 Rückgängig und Wiederholen (Undo/Redo)

Änderungen an Tageseinträgen lassen sich rückgängig machen und erneut anwenden:

- **Rückgängig:** Klick auf den **„Rückgängig"-Link** im Toast (8 Sekunden verfügbar) oder die Tastenkombination **Strg+Z** (**Cmd+Z** am Mac).
- **Wiederholen:** Nach einem „Rückgängig" bietet der Toast den Link **„Wiederholen"** an; per Tastatur geht es mit **Strg+Shift+Z** bzw. **Cmd+Shift+Z** oder **Strg+Y**/**Cmd+Y**. Über Toast-Link oder Tastenkürzel lässt sich so beliebig hin- und herschalten.
- **Umfang:** Bis zu **30 Änderungsschritte** sind zurückholbar. Rückgängig machbar sind: Einzeltage setzen/löschen (Dialog und Schnellauswahl-Menü inkl. gebucht-Umschalter), Bereichs- und Verschiebe-Aktionen aus dem Dialog, gemeinsames Zuweisen/Löschen über die Mehrfachauswahl sowie der komplette Backup-Import (Voll-Restore des vorherigen Datenstands, siehe Kapitel 8.2).
- **Nicht betroffen:** Zeitraum/Startmonat, Urlaubskontingent und Bundesland-/Feiertags-Einstellungen lassen sich nicht über Undo/Redo ändern – sie sind aber direkt über die Bedienelemente in der Fußzeile revertierbar.
- **Regeln:** Jede neue Änderung verwirft die Redo-Historie (es kann nur in eine Richtung fortgesetzt werden). Liegt der Fokus in einem Eingabefeld, bleiben Strg+Z/Cmd+Z für die native Text-Rückgängig-Funktion des Feldes reserviert.

### 6.4 Übersicht drucken / PDF (Nachweis)

Der Button **„Übersicht drucken / PDF"** in der Fußzeile erzeugt ein aufbereitetes, seitenformatiertes Dokument (A4) für Abrechnungs- oder Nachweiszwecke – z. B. gegenüber dem Arbeitgeber:

1. Klick auf den Button öffnet einen Dialog zur Wahl des **Berichtszeitraums**: Über die **Zeitraum-Auswahl** (Chip-Buttons) lassen sich schnell vordefinierte Zeiträume wählen – **Aktuelles Jahr**, **Aktueller Monat** (Voreinstellung), **Monat** (mit Dropdown für Monat und Jahr, voreingestellt das aktuelle Jahr) oder **Quartal** (mit Dropdown für Quartal und Jahr, voreingestellt das aktuelle Jahr). So lassen sich z. B. schnell „September 2028" oder „Q4 2028" drucken. Die Start- und Enddatum-Felder werden dabei automatisch befüllt, bleiben aber manuell nachjustierbar. Ungültige oder umgekehrte Datumsangaben werden mit Hinweis abgelehnt; **Abbrechen**, **ESC** oder ein Klick neben den Dialog schließen ihn ohne Aktion.
2. Nach **„Übersicht erstellen"** öffnet sich das Dokument in einem neuen Tab:
   - Am Desktop erscheint direkt der **Druckdialog** des Browsers – dort „Als PDF speichern" wählen ergibt eine PDF-Datei.
   - Auf Touch-Geräten zeigt das Dokument einen kurzen Hinweis; der Druck/PDF-Export erfolgt über das Browser-Menü (**Teilen → Drucken** bzw. **Drucken → Als PDF speichern**).
3. **Inhalt des Dokuments:**
   - Kopfzeile mit Titel „Anwesenheitsübersicht", gewähltem Zeitraum, Bundesland und Erstellungsdatum.
   - **Zusammenfassung:** Tagesanzahl je Art im Berichtszeitraum; beim Urlaub zusätzlich genommen/geplant und das Kontingent, bei Krankheit zusätzlich die Jahreszahl.
   - **Monatsdetails:** je Monat eine Tabelle mit Datum, ausgeschriebenem Wochentag (z. B. „Montag") und Anwesenheitsart (mit Farbpunkt und Feiertagsnamen). Die Spalte *Arbeitsplatz und/oder Parkplatz gebucht* erscheint nur, wenn sie sinnvoll ist (bei *Alle* oder wenn Bürotag Teil der gewählten Art-Filterung ist); gebuchte Bürotage sind mit einem grün hervorgehobenen Haken (✓) markiert, Haken stehen ausschließlich auf Bürotagen. Wochenenden und arbeitsfreie Sondertage (24./31.12.) entfallen wie in der App; noch nicht erfasste Tage sind als *– nicht erfasst -* gekennzeichnet. Die Spaltenbreiten sind fest, sodass die Tabellen aller Monate exakt untereinander ausgerichtet sind.

Das Druckdokument wird vollständig offline im Browser erzeugt (keine externen Schriften oder Bibliotheken) und enthält ausschließlich die lokal gespeicherten Daten.

---

## 7. Quotenberechnung

### 7.1 Büropflichttage pro Monat

Die erforderlichen Bürotage ergeben sich aus den Werktagen abzüglich der **neutralen Tage**, aufgerundet auf 60 %:

```
Büropflichttage = (Werktage – Neutrale Tage) × 0,6  (abgerundet)
```

**Neutrale Tage** sind Tage, an denen weder Büro noch Homeoffice erfasst wird: Urlaub, Krankheit, Freizeittag, Feiertag und Dienstreise. Homeoffice- und Bürotage zählen also nicht als neutral.

Beispiel bei 22 Werktagen und keinen neutralen Tagen: `22 × 0,6 = 13,2` → **13 Pflichttage**. Bei 21 Werktagen: `21 × 0,6 = 12,6` → **12 Pflichttage**.

Die Darstellung in der Jahresübersicht zeigt den Ist- und Sollwert, z. B. `13/13` (Bürotage/Pflichttage).

### 7.2 Verhältnis Büro/Homeoffice (KPI-Karten)

Unter der Kopfzeile zeigen vier **KPI-Karten** mit Fortschrittsring (in Prozent) die wichtigsten Kennzahlen auf einen Blick. Jede Karte zeigt einen **Ampel-Indikator**: Die Farbe des Rings und des Prozentwerts signalisiert den Status auf einen Blick.

- **Büropflicht (aktueller Monat):** erfasste Bürotage im Verhältnis zu den Pflichttagen des aktuellen Monats. Der Ring zeigt den Prozentwert direkt (Ziel: 100 %).
- **Büroquote:** Anteil der Bürotage an allen Büro- und Homeoffice-Tagen. Der Ring skaliert auf 60 % als Zielwert (60 % = voller Kreis). Überschreitet die Quote den Zielwert, pulsiert der Ring als visuelles Signal.
- **Homeofficequote:** Anteil der Homeoffice-Tage. Der Ring skaliert auf 40 % als Zielwert (40 % = voller Kreis). Überschreitet die Quote den Zielwert, pulsiert der Ring.
- **Urlaub (Jahr):** genommene Urlaubstage im Verhältnis zum Urlaubskontingent. Die Ampelfarben sind invertiert: Grün = wenig verbraucht, Rot = alles aufgebraucht (100 %).

**Ampel-Farben:**

| Karte | Grün | Gelb | Rot |
|-------|------|------|-----|
| Büropflicht | ≥100 % | ≥80 % | <80 % |
| Büroquote | ≥60 % | ≥45 % | <45 % |
| Homeoffice-Quote | ≥40 % | ≥30 % | <30 % |
| Urlaub | <60 % verbraucht | 60–99 % verbraucht | 100 % verbraucht |

Regeln:

- **Berechnung nur aus vollständigen Monaten:** Ein Monat gilt als vollständig, wenn **alle** Werktage erfasst sind. Teilweise erfasste Monate werden nicht mitgezählt.
- Die Prozentwerte werden ganzzahlig gerundet.
- Sind keine vollständigen Monate vorhanden, zeigen Büro- und Homeofficequote **„–"**.

Beispiel: 23 Bürotage und 16 Homeoffice-Tage aus vollständigen Monaten → Basis 39 → **59 % Büro / 41 % Homeoffice**.

**Prozent-Badges:** In der Hero-Karte und den Mini-Karten wird der Prozentwert als farbiges Badge (Hintergrundfarbe, weiße Schrift, schwarzer Rahmen) dargestellt, um ihn visuell hervorzuheben. Die Prozentzahlen in den Rings der KPI-Karten werden immer in dunkelgrauer Schrift (`--text`) dargestellt, unabhängig von der Ring-Farbe.

**Tooltips:** Beim Überfahren einer KPI-Karte mit der Maus erscheint ein informativer Tooltip mit Details zur Berechnung.

**Ringskalierung:** Die Büroquote (60 % = voller Kreis) und Homeoffice-Quote (40 % = voller Kreis) verwenden eine relative Skalierung. Werte über dem Zielwert lassen den Ring pulsen (helle Farbanimation).

---

## 8. Backup: Export und Import

In der Fußzeile links befinden sich zwei Buttons. Ein automatisches Backup gibt es nicht – Export und Import erfolgen ausschließlich über die Buttons.

### 8.1 Backup exportieren

Klick auf **Backup exportieren** öffnet einen Dialog zur Wahl des **Dateiformats**:

- **JSON:** strukturierte Sicherung aller Daten (voller Wiederherstellungsumfang).
- **CSV:** spaltentrennwerte Tabelle (z. B. für eine Weiterverarbeitung in Tabellenkalkulationen).

Nach der Auswahl lädt der Download in den Download-Ordner des Browsers. Unterhalb der Buttons wird das Datum und die Uhrzeit des letzten Exports angezeigt (z. B. `Zuletzt exportiert: 20.08.2026, 14:32`). Die Farbe des Hinweises ändert sich automatisch:

- **Grau:** Export weniger als 7 Tage alt
- **Orange:** Export 7–30 Tage alt
- **Rot:** Export älter als 30 Tage (Erinnerung an regelmäßige Datensicherung)

```
jjjj-mm-tt-hh-mm-ss-homeoffice_data.json
jjjj-mm-tt-hh-mm-ss-homeoffice_data.csv
```

**JSON:** Die Datei enthält alle Tages-Einträge, die „gebucht"-Markierungen sowie den aktuell eingestellten Zeitraum. Beispiel:

```json
{
  "days": {
    "2026-09-01": "BUEROTAG",
    "2026-09-02": "HOMEOFFICE"
  },
  "period": {
    "start": "2026-09-01",
    "end": "2027-08-31"
  },
  "gebucht": {
    "2026-09-01": true
  }
}
```

**CSV:** Die Datei enthält je erfasstem Tag eine Zeile im Format `Datum,Art,Gebucht` (Gebucht-Wert `true`/`false`). Beispiel:

```csv
Datum,Art,Gebucht
2026-09-01,BUEROTAG,true
2026-09-02,HOMEOFFICE,false
```

### 8.2 Backup importieren

Klick auf **Backup importieren** öffnet den Dateidialog. Es werden ausschließlich JSON-Dateien im Format des Exports unterstützt. Der Import übernimmt den Startmonat des Zeitraums; das Ende wird wieder auf den vollen 12-Monats-Zeitraum gesetzt.

Der Import **überschreibt** alle aktuellen Einträge. Nach erfolgreichem Import wird die Anzahl der übernommenen Einträge angezeigt. Ungültige Dateien werden mit einer Fehlermeldung abgelehnt. Der importierte Datenstand lässt sich unmittelbar danach über **Rückgängig** zurücknehmen (Kapitel 6.3).

> **Tipp:** Erstelle regelmäßig einen Export, um bei Verlust der Browserdaten (z. B. nach dem Leeren des Caches) deine Daten wiederherstellen zu können.

---

## 9. Versionsinfo

Unten in der Fußzeile wird rechts die aktuelle Version mit Copyright angezeigt, z. B. `Version 1.36 vom 28.08.2026 · © 2026`. Links steht der Link zur Bedienungsanleitung (HTML/PDF).

---

## 10. Häufige Fragen

**Warum zeigt die Quote „–"?**
Weil noch kein vollständiger Monat (alle Werktage erfasst) im gewählten Zeitraum liegt.

**Warum gibt es kein Enddatum?**
Der Zeitraum umfasst immer genau 12 Monate ab dem gewählten Startmonat (Start + 12 Monate – 1 Tag). Ein eigenes Enddatum ist deshalb nicht erforderlich.

**Wo werden meine Daten gespeichert?**
Im Browser (localStorage). Andere Browser, Computer oder das Löschen der Browserdaten löschen auch die Einträge – deshalb regelmäßig exportieren.

**Kann ich ein Datum zweimal erfassen?**
Nein, pro Datum ist nur ein Eintrag möglich. Ein Klick auf einen erfassten Tag öffnet den Dialog zum Bearbeiten.

**Wie belege ich mehrere verstreute Tage gleichzeitig?**
Über die Mehrfachauswahl (Kapitel 5): am Desktop mit Shift-Klick starten bzw. am Smartphone „Mehrfachauswahl…" im Schnellauswahl-Menü – dann in der unteren Leiste eine Art zuweisen oder löschen.

**Wie mache ich eine Änderung rückgängig?**
Innerhalb von 8 Sekunden über den „Rückgängig"-Link im Toast, jederzeit über **Strg+Z** (**Cmd+Z** am Mac); mit **Strg+Shift+Z**/**Strg+Y** wird die Änderung wieder angewendet (Kapitel 6.3). Bis zu 30 Schritte sind möglich.

**Wie erstelle ich einen Nachweis für meinen Arbeitgeber?**
Über **„Übersicht drucken / PDF"** in der Fußzeile (Kapitel 6.4): Zeitraum per Klick auf eine der Optionen wählen (Voreinstellung: aktueller Monat) oder Start-/Enddatum frei eintragen, dann im Druckdialog „Als PDF speichern" wählen. Das Dokument enthält Zusammenfassung und taggenaue Monatstabellen.

**Funktioniert die App auch ohne Internet?**
Ja, wenn sie als App installiert wurde (Kapitel 1.1). Nach dem ersten Laden läuft sie vollständig offline; neue Versionen werden automatisch geladen, sobald wieder eine Internetverbindung besteht.
