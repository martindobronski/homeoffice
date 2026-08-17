'use strict';

/**
 * Gesetzliche Feiertage für Hamburg + betrieblich arbeitsfreie Sondertage.
 *
 * Enthält die 9 bundeseinheitlichen Feiertage plus den Reformationstag
 * (in Hamburg seit 2018 gesetzlicher Feiertag), sowie den 24.12. und
 * 31.12. als arbeitsfreie Sondertage (sofern sie nicht ohnehin schon
 * auf einen gesetzlichen Feiertag fallen).
 *
 * Alle Termine werden berechnet (nicht fest hinterlegt), damit die Liste
 * ohne Pflege für jedes Jahr korrekt bleibt. Bewegliche Feiertage werden
 * über die Gaußsche Osterformel aus dem Ostersonntag abgeleitet.
 *
 * Diese Datei erzeugt keine neue "Art": Alle hier gelieferten Tage werden
 * von app.js als ganz normale FEIERTAG-Einträge behandelt und können vom
 * Nutzer jederzeit manuell überschrieben werden (ein manueller Eintrag hat
 * immer Vorrang und wird nicht durch diese Datei verändert oder gespeichert).
 */
(function (global) {

    function ostersonntag(jahr) {
        // Gaußsche Osterformel (gültig für den gregorianischen Kalender)
        const a = jahr % 19;
        const b = Math.floor(jahr / 100);
        const c = jahr % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const zaehler = h + l - 7 * m + 114;
        const monat = Math.floor(zaehler / 31); // 3 = März, 4 = April
        const tag = (zaehler % 31) + 1;
        return new Date(jahr, monat - 1, tag);
    }

    function addTage(datum, n) {
        const d = new Date(datum);
        d.setDate(d.getDate() + n);
        return d;
    }

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function iso(d) {
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }

    // Liefert alle Feiertage + arbeitsfreie Sondertage für Hamburg in einem Jahr.
    // Rückgabe: { "JJJJ-MM-TT": "Bezeichnung", ... }
    function feiertageJahrHH(jahr) {
        const ostern = ostersonntag(jahr);
        const map = {};

        function setzen(datumIso, name, sonderfrei) {
            map[datumIso] = { name: name, sonderfrei: !!sonderfrei };
        }

        // -- 9 bundeseinheitliche Feiertage --
        setzen(iso(new Date(jahr, 0, 1)), 'Neujahr');
        setzen(iso(addTage(ostern, -2)), 'Karfreitag');
        setzen(iso(addTage(ostern, 1)), 'Ostermontag');
        setzen(iso(new Date(jahr, 4, 1)), 'Tag der Arbeit');
        setzen(iso(addTage(ostern, 39)), 'Christi Himmelfahrt');
        setzen(iso(addTage(ostern, 50)), 'Pfingstmontag');
        setzen(iso(new Date(jahr, 9, 3)), 'Tag der Deutschen Einheit');
        setzen(iso(new Date(jahr, 11, 25)), '1. Weihnachtstag');
        setzen(iso(new Date(jahr, 11, 26)), '2. Weihnachtstag');

        // -- Hamburg-spezifisch --
        // Reformationstag ist in Hamburg seit 2018 gesetzlicher Feiertag.
        if (jahr >= 2018) {
            setzen(iso(new Date(jahr, 9, 31)), 'Reformationstag');
        }

        // -- Sonderregelung 24.12. / 31.12. --
        // Beide Tage sind KEINE gesetzlichen Feiertage, gelten aber
        // betrieblich als arbeitsfrei. Sie werden trotzdem als FEIERTAG
        // geführt (keine eigene Art), aber mit sonderfrei:true markiert,
        // damit die Oberfläche sie im Tooltip als "Arbeitsfrei" statt als
        // "Feiertag" anzeigen kann. Nur gesetzt, wenn an dem Datum nicht
        // bereits ein echter Feiertag liegt (praktisch nie der Fall).
        const heiligabend = iso(new Date(jahr, 11, 24));
        if (!map[heiligabend]) {
            setzen(heiligabend, 'Heiligabend', true);
        }
        const silvester = iso(new Date(jahr, 11, 31));
        if (!map[silvester]) {
            setzen(silvester, 'Silvester', true);
        }

        return map;
    }

    const cache = {};

    function getJahresKarte(jahr) {
        if (!cache[jahr]) {
            cache[jahr] = feiertageJahrHH(jahr);
        }
        return cache[jahr];
    }

    function getEintrag(isoDatum) {
        const jahr = parseInt(String(isoDatum).slice(0, 4), 10);
        if (!Number.isFinite(jahr)) {
            return null;
        }
        return getJahresKarte(jahr)[isoDatum] || null;
    }

    function getName(isoDatum) {
        const e = getEintrag(isoDatum);
        return e ? e.name : null;
    }

    function istFeiertag(isoDatum) {
        return !!getEintrag(isoDatum);
    }

    // true für 24.12./31.12.: arbeitsfrei, aber kein gesetzlicher Feiertag.
    function istSonderfrei(isoDatum) {
        const e = getEintrag(isoDatum);
        return !!(e && e.sonderfrei);
    }

    global.Feiertage = {
        istFeiertag: istFeiertag,
        istSonderfrei: istSonderfrei,
        getName: getName
    };

})(window);
