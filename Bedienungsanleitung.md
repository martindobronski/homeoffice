# Bedienungsanleitung

## Büro – Anwesenheitsübersicht (Version 1.0)

Die App erfasst für jeden Werktag, ob du im **Büro** oder im **Homeoffice** gearbeitet hast. Urlaub, Krankheit und andere Sonderformen sind zwar keine Arbeit, sollen aber ebenfalls erfasst werden, damit jeder Werktag dokumentiert ist. Daraus werden eine Übersicht über alle Monate, die Anzahl der Büropflichttage sowie das Verhältnis Büro/Homeoffice berechnet.

---

## 1. Starten der App

Die App läuft im Browser. Zum Starten genügt es, die Datei `index.html` im Browser zu öffnen (z. B. per Doppelklick auf die Datei). Es ist kein Webserver erforderlich.

Die Daten werden im Browser gespeichert (localStorage). Solange du denselben Browser und Computer verwendest, bleiben alle Einträge erhalten.

---

## 2. Aufbau der Oberfläche

Das Fenster ist in drei Bereiche gegliedert:

- **Kopfzeile:** Zeitraum (Start und Ende), Schnellwahl des Zeitraumbeginns und die Büro/Homeoffice-Quote rechts oben.
- **Mitte:** Kalenderblätter für alle Monate des gewählten Zeitraums.
- **Fußzeile:** Backup-Buttons (links), Legende mit Zählern (Mitte), Versionsinfo (rechts unten).

Alle Elemente werden auf 90 % Größe dargestellt (wie eine Browser-Zoomstufe von 90 %).

---

## 3. Zeitraum wählen

In der Kopfzeile steht: `Anwesenheit im Zeitraum: [Start] – [Ende]`.

- **Startdatum ändern:** Wird ein neues Startdatum gewählt, wird das Enddatum automatisch auf **Start + 12 Monate – 1 Tag** gesetzt. Danach kann das Enddatum auch einzeln geändert werden.
- **Schnellwahl:** Über `Schnellwahl Zeitraumbeginn: [Monat] [Jahr]` + **Übernehmen** springst du direkt zu einem bestimmten Startmonat.
- Die Auswahl wird gespeichert und beim nächsten Öffnen wiederhergestellt.

---

## 4. Die Monatskalender

Für jeden Monat des Zeitraums erscheint ein Kalenderblatt mit folgendem Aufbau:

- **Monatstitel:** z. B. `September 2026 (22 Werktage - 13 von 13 Büropflichttagen)`
  - *Werktage:* Anzahl der Arbeitstage (Montag bis Freitag) im Monat.
  - *Büropflichttage:* So viele Bürotage sind im Monat mindestens erforderlich (siehe Kapitel 6).
- **Wochentagskopf:** Mo – Di – Mi – Do – Fr.
- **Tageszellen:** Jeder Werktag ist ein Feld. Leere Felder am Anfang der ersten Woche füllen den Kalender aus. Wochenenden werden nicht dargestellt.

**Aktueller Monat:** Der Monat mit dem heutigen Datum wird mit einem grünen Balken in der Überschrift und einem grünen Rahmen hervorgehoben.

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
- Ein Klick auf das leere Fenster neben dem Dialog schließt ihn ebenfalls.

---

## 6. Farben und Bedeutung

| Farbe     | Art        | Bedeutung                                        |
|-----------|------------|--------------------------------------------------|
| Grün      | Bürotag    | Vor Ort im Büro gearbeitet                       |
| Gelb      | Homeoffice | Im Homeoffice gearbeitet                         |
| Orange    | Freizeittag| Freizeittag                                      |
| Blau      | Dienstreise| Dienstreise                                      |
| Cyan      | Feiertag   | Feiertag                                         |
| Rot       | Krankheit  | Krank (Krankschreibung)                          |
| Grau      | Urlaub     | Urlaub (siehe Zähler in der Legende)             |

Die **Legende** in der Fußzeile zeigt für jede Art die Anzahl im gewählten Zeitraum, z. B. `Bürotag (13)`.

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

Die Darstellung im Monatstitel zeigt den Ist- und Sollwert, z. B. `13 von 13 Büropflichttagen`.

### 7.2 Verhältnis Büro/Homeoffice (Quote)

Rechts oben in der Kopfzeile steht:

```
Büro: X/B (p %) · Homeoffice: Y/B (p %)
```

- **X** = Bürotage, **Y** = Homeoffice-Tage, **B** = Büro + Homeoffice insgesamt.
- **Berechnung nur aus vollständigen Monaten:** Ein Monat gilt als vollständig, wenn **alle** Werktage erfasst sind. Teilweise erfasste Monate werden nicht mitgezählt.
- Die Prozentwerte werden ganzzahlig gerundet.
- Sind keine vollständigen Monate vorhanden, wird **„–"** angezeigt.
- Ein Mauszeiger über der Quote zeigt den Hinweis: *„Verhältnis Büro zu Homeoffice - nur vollständige Monate (alle Werktage erfasst)"*.

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

- **JSON-Dateien** (wie exportiert) – übernehmen zusätzlich den Zeitraum.
- **CSV-Dateien** (z. B. aus der Java-Version), eine Zeile pro Eintrag im Format `JJJJ-MM-TT,ART`, z. B. `2026-09-01,BUEROTAG`.

Der Import **überschreibt** alle aktuellen Einträge. Nach erfolgreichem Import wird die Anzahl der übernommenen Einträge angezeigt. Ungültige Dateien werden mit einer Fehlermeldung abgelehnt.

> **Tipp:** Erstelle regelmäßig einen Export, um bei Verlust der Browserdaten (z. B. nach dem Leeren des Caches) deine Daten wiederherstellen zu können.

---

## 9. Versionsinfo

Unten rechts wird die aktuelle Version angezeigt, z. B. `Version 1.0 vom 11.08.2026`.

---

## 10. Häufige Fragen

**Warum zeigt die Quote „–"?**
Weil noch kein vollständiger Monat (alle Werktage erfasst) im gewählten Zeitraum liegt.

**Warum ändert sich das Enddatum von selbst?**
Das Enddatum folgt dem Startdatum: Start + 12 Monate – 1 Tag. Es kann danach einzeln angepasst werden.

**Wo werden meine Daten gespeichert?**
Im Browser (localStorage). Andere Browser, Computer oder das Löschen der Browserdaten löschen auch die Einträge – deshalb regelmäßig exportieren.

**Kann ich ein Datum zweimal erfassen?**
Nein, pro Datum ist nur ein Eintrag möglich. Ein Klick auf einen erfassten Tag öffnet den Dialog zum Bearbeiten.
