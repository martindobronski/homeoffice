# Bedienungsanleitung

## Anwesenheits-Dashboard (Version 1.2)

Die App erfasst für jeden Werktag, ob du im **Büro** oder im **Homeoffice** gearbeitet hast. Urlaub, Krankheit und andere Sonderformen sind zwar keine Arbeit, sollen aber ebenfalls erfasst werden, damit jeder Werktag dokumentiert ist. Daraus werden eine Übersicht über alle Monate, die Anzahl der Büropflichttage sowie das Verhältnis Büro/Homeoffice berechnet.

---

## 1. Starten der App

Die App läuft im Browser. Zum Starten genügt es, die Datei `index.html` im Browser zu öffnen (z. B. per Doppelklick auf die Datei). Es ist kein Webserver erforderlich.

Die Daten werden im Browser gespeichert (localStorage). Solange du denselben Browser und Computer verwendest, bleiben alle Einträge erhalten.

---

## 2. Aufbau der Oberfläche

Das Fenster ist in vier Bereiche gegliedert:

- **Kopfzeile:** Überschrift mit Jahr und Auswahl des Zeitraumbeginns (Startmonat und Startjahr).
- **KPI-Karten:** Büroquote, Homeofficequote, Büropflicht (aktueller Monat) und Urlaubsstand – jeweils mit Zahlenwert und prozentualem **Fortschrittsring**.
- **Mitte:** Der aktuelle Monat als große **Hero-Karte** (mit Badge „Läuft gerade") sowie alle weiteren Monate des Zeitraums als kompakte Mini-Karten in einer Jahresübersicht.
- **Fußzeile:** Urlaubskontingent, Backup-Buttons, Legende mit Zählern, Versionsinfo.

Die Darstellung passt sich der Fensterbreite an (4 / 2 / 1 Spalten).

---

## 3. Zeitraum wählen

Der Anzeigezeitraum umfasst immer ein ganzes Jahr (12 Monate). Er beginnt mit dem gewählten Startmonat und endet automatisch 12 Monate später (Start + 12 Monate – 1 Tag). Ein eigenes Enddatum gibt es nicht.

- **Startmonat wählen:** Über die beiden Auswahlfelder `[Monat] [Jahr]` in der Kopfzeile + **Übernehmen** legst du den Startmonat des Jahreszeitraums fest. Beispiel: Startmonat `September` und Jahr `2026` ergibt den Zeitraum **September 2026 – August 2027**.
- **Jahresauswahl:** Die Liste reicht von mehreren Jahren in der Vergangenheit bis einschließlich **2030**. Liegen Einträge in späteren Jahren vor, wird die Auswahl automatisch erweitert.
- Die Auswahl wird gespeichert und beim nächsten Öffnen wiederhergestellt.

---

## 4. Die Monatsansicht

Die Mitte der Seite besteht aus zwei Bereichen:

### 4.1 Hero-Karte (aktueller Monat)

Der Monat mit dem heutigen Datum wird als große Karte mit grünem Badge **„● Läuft gerade"** dargestellt. Sie enthält:

- **Monatsname und Jahr**, z. B. `August 2026`.
- **Werktage:** Anzahl der Arbeitstage (Montag bis Freitag) im Monat.
- **Bürotage (Soll):** erfasste Bürotage im Verhältnis zu den Pflichttagen, z. B. `1 / 12`, mit **Fortschrittsbalken**.
- Den Wochenkalender (Mo – Di – Mi – Do – Fr) mit größeren Tageszellen.

### 4.2 Jahresübersicht

Alle übrigen Monate des gewählten Zeitraums erscheinen darunter als kompakte Mini-Karten (in 4 Spalten). Jede Karte zeigt:

- **Monatsname** und rechts die Werte `Bürotage/Pflichttage` (z. B. `3/12`). Erstreckt sich der Zeitraum über zwei Kalenderjahre, wird hinter dem Monatsnamen das jeweilige Jahr angezeigt, z. B. `September 2026` und `August 2027`.
- Einen schmalen **Fortschrittsbalken** für den Anteil der erfüllten Büropflichttage.
- Den Wochenkalender in kleinerer Darstellung.

Liegt der aktuelle Monat außerhalb des gewählten Zeitraums, wird die Hero-Karte ausgeblendet und alle Monate erscheinen als Mini-Karten.

### 4.3 Tageszellen

- Jeder Werktag ist ein Feld; Wochenenden werden nicht dargestellt. Leere Felder am Anfang der ersten Woche füllen den Kalender aus.
- **Erfasste Tage** haben die Farbe ihrer Art (siehe Kapitel 6). Bürotage tragen zusätzlich einen kleinen Punkt oben rechts.
- **Unerfasste Tage in der Vergangenheit** bleiben weiß.
- **Unerfasste Tage in der Zukunft** werden gestrichelt umrandet dargestellt („noch offen").
- Die **Legende** unterhalb der Jahresübersicht erklärt die Farben und Zähler (siehe Kapitel 6).

---

## 5. Einträge anlegen, bearbeiten und löschen

**Tag anklicken:** Ein Klick auf einen Werktag öffnet den Dialog `Eintrag hinzufügen` bzw. `Eintrag bearbeiten`.

Im Dialog kannst du:

- **Datum** ändern,
- **Art** aus der Liste wählen (siehe Farben unten),
- über **OK** speichern,
- über **Löschen** den Eintrag entfernen (nur bei vorhandenen Einträgen),
- über **Abbrechen** den Dialog schließen, ohne etwas zu ändern.

Hinweise:

- Für ein Datum kann immer nur **ein** Eintrag existieren. Verschiebst du einen Eintrag auf ein Datum, das bereits belegt ist, erscheint eine Warnung.
- Ein weißes Feld bedeutet: für diesen Tag wurde noch nichts erfasst.
- Ein gestrichelt umrandetes Feld bedeutet: dieser zukünftige Tag ist noch nicht erfasst.
- Ein Klick auf das leere Fenster neben dem Dialog schließt ihn ebenfalls.

---

## 6. Farben und Bedeutung

| Farbe     | Art        | Bedeutung                                        |
|-----------|------------|--------------------------------------------------|
| Grün      | Bürotag    | Vor Ort im Büro gearbeitet                       |
| Beige     | Homeoffice | Im Homeoffice gearbeitet                         |
| Ocker     | Freizeittag| Freizeittag                                      |
| Violett   | Dienstreise| Dienstreise                                      |
| Blau      | Feiertag   | Feiertag                                         |
| Rot       | Krankheit  | Krank (Krankschreibung)                          |
| Grau      | Urlaub     | Urlaub (siehe Zähler in der Legende)             |

Die **Legende** unterhalb der Jahresübersicht zeigt für jede Art die Anzahl im gewählten Zeitraum, z. B. `Bürotag (10)`.

Die Legendeneinträge sind **klickbar und fungieren als Filter**:

- Ein Klick auf eine Art (z. B. `Krankheit`) blendet alle anderen Tage aus – nur noch diese Art wird im Kalender hervorgehoben (dunkler Rahmen, Rest stark abgeblendet).
- Der aktive Filter ist grün umrandet; die übrigen Einträge sind abgeblendet.
- Ein erneuter Klick auf die aktive Art hebt den Filter wieder auf (alle Tage werden normal angezeigt).
- Per Tooltip (Maus darüberhalten) wird die Funktion des jeweiligen Eintrags angezeigt.

Für Urlaub wird zusätzlich angezeigt:

```
Urlaub (genommen x / geplant y / ungeplant z)
```

- *genommen:* Urlaubstage in diesem Jahr, die in der Vergangenheit liegen.
- *geplant:* Urlaubstage in diesem Jahr, die in der Zukunft liegen.
- *ungeplant:* verbleibende Tage bis zum eingestellten Jahreskontingent.

**Urlaubskontingent einstellen:** Das Jahreskontingent ist frei einstellbar und auf **30 Tage** voreingestellt. Unten links im Feld `Urlaubskontingent` die gewünschte Anzahl eingeben und mit **OK** bestätigen. Die Einstellung wird gespeichert und beim nächsten Öffnen wiederhergestellt.

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

Unter der Kopfzeile zeigen vier **KPI-Karten** mit Fortschrittsring (in Prozent) die wichtigsten Kennzahlen auf einen Blick:

- **Büroquote:** Anteil der Bürotage an allen Büro- und Homeoffice-Tagen (Soll 60 %).
- **Homeofficequote:** Anteil der Homeoffice-Tage (Soll 40 %).
- **Büropflicht (aktueller Monat):** erfasste Bürotage im Verhältnis zu den Pflichttagen des aktuellen Monats.
- **Urlaub (Jahr):** genommene Urlaubstage im Verhältnis zum Urlaubskontingent.

Regeln:

- **Berechnung nur aus vollständigen Monaten:** Ein Monat gilt als vollständig, wenn **alle** Werktage erfasst sind. Teilweise erfasste Monate werden nicht mitgezählt.
- Die Prozentwerte werden ganzzahlig gerundet.
- Sind keine vollständigen Monate vorhanden, zeigen Büro- und Homeofficequote **„–"**.

Beispiel: 23 Bürotage und 16 Homeoffice-Tage aus vollständigen Monaten → Basis 39 → **59 % Büro / 41 % Homeoffice**.

---

## 8. Backup: Export und Import

In der Fußzeile links befinden sich zwei Buttons. Ein automatisches Backup gibt es nicht – Export und Import erfolgen ausschließlich über die Buttons.

### 8.1 Backup exportieren

Klick auf **Backup exportieren** lädt eine JSON-Datei in den Download-Ordner des Browsers:

```
jjjj-mm-tt-hh-mm-ss-homeoffice_data.json
```

Die Datei enthält alle Tages-Einträge sowie den aktuell eingestellten Zeitraum. Beispiel:

```json
{
  "days": {
    "2026-09-01": "BUEROTAG",
    "2026-09-02": "HOMEOFFICE"
  },
  "period": {
    "start": "2026-09-01",
    "end": "2027-08-31"
  }
}
```

### 8.2 Backup importieren

Klick auf **Backup importieren** öffnet den Dateidialog. Unterstützt werden:

- **JSON-Dateien** (wie exportiert) – übernehmen den Startmonat des Zeitraums. Das Ende wird wieder auf den vollen 12-Monats-Zeitraum gesetzt.

Der Import **überschreibt** alle aktuellen Einträge. Nach erfolgreichem Import wird die Anzahl der übernommenen Einträge angezeigt. Ungültige Dateien werden mit einer Fehlermeldung abgelehnt.

> **Tipp:** Erstelle regelmäßig einen Export, um bei Verlust der Browserdaten (z. B. nach dem Leeren des Caches) deine Daten wiederherstellen zu können.

---

## 9. Versionsinfo

Unten in der Fußzeile wird die aktuelle Version angezeigt, z. B. `Version 1.2 vom 11.08.2026`.

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
