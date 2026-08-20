'use strict';

/**
 * Gesetzliche Feiertage für alle 16 deutschen Bundesländer.
 *
 * Enthält die 9 bundeseinheitlichen Feiertage plus BL-spezifische
 * Feiertage (Reformationstag, Allerheiligen, Fronleichnam, Buß- und Bettag).
 * Optional: 24.12. / 31.12. als betrieblich arbeitsfreie Sondertage.
 *
 * Alle Termine werden berechnet (nicht fest hinterlegt), damit die Liste
 * ohne Pflege für jedes Jahr korrekt bleibt. Bewegliche Feiertage werden
 * über die Gaußsche Osterformel aus dem Ostersonntag abgeleitet.
 *
 * API: Feiertage.istFeiertag(iso), .istSonderfrei(iso), .getName(iso),
 *      .setBundesland(bl), .getBundesland(), .setSonderfrei(bool), .getSonderfrei()
 */
(function (global) {

    var BL_KEY = 'bundesland';
    var SONDER_KEY = 'sonderfrei';
    var DEFAULT_BL = 'HH';

    // BL-spezifische Zusatzregeln: true = dieser Feiertag gilt in diesem BL
    var BL_REGELN = {
        BW: { allerheiligen: true, fronleichnam: true },
        BY: { allerheiligen: true, fronleichnam: true },
        BE: { reformationstag: true },
        BB: { reformationstag: true },
        HB: { reformationstag: true },
        HH: { reformationstag: true },
        HE: { fronleichnam: true },
        MV: { reformationstag: true },
        NI: { reformationstag: true },
        NW: { allerheiligen: true, fronleichnam: true },
        RP: { fronleichnam: true },
        SL: { allerheiligen: true, fronleichnam: true },
        SN: { reformationstag: true, bustag: true },
        ST: { reformationstag: true },
        SH: { reformationstag: true },
        TH: { reformationstag: true }
    };

    var BL_REIHENFOLGE = [
        'BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV',
        'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'
    ];

    function ostersonntag(jahr) {
        var a = jahr % 19;
        var b = Math.floor(jahr / 100);
        var c = jahr % 100;
        var d = Math.floor(b / 4);
        var e = b % 4;
        var f = Math.floor((b + 8) / 25);
        var g = Math.floor((b - f + 1) / 3);
        var h = (19 * a + b - d - g + 15) % 30;
        var i = Math.floor(c / 4);
        var k = c % 4;
        var l = (32 + 2 * e + 2 * i - h - k) % 7;
        var m = Math.floor((a + 11 * h + 22 * l) / 451);
        var zaehler = h + l - 7 * m + 114;
        var monat = Math.floor(zaehler / 31);
        var tag = (zaehler % 31) + 1;
        return new Date(jahr, monat - 1, tag);
    }

    function addTage(datum, n) {
        var d = new Date(datum);
        d.setDate(d.getDate() + n);
        return d;
    }

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function iso(d) {
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }

    function getBundesland() {
        try { return localStorage.getItem(BL_KEY) || DEFAULT_BL; }
        catch (e) { return DEFAULT_BL; }
    }

    function setBundesland(bl) {
        try { localStorage.setItem(BL_KEY, bl); } catch (e) {}
        leereCache();
    }

    function getSonderfrei() {
        try { return localStorage.getItem(SONDER_KEY) === '1'; }
        catch (e) { return false; }
    }

    function setSonderfrei(v) {
        try { localStorage.setItem(SONDER_KEY, v ? '1' : '0'); } catch (e) {}
        leereCache();
    }

    function leereCache() {
        for (var k in cache) { delete cache[k]; }
    }

    function feiertageJahr(jahr) {
        var bl = getBundesland();
        var regeln = BL_REGELN[bl] || {};
        var sonder = getSonderfrei();
        var ostern = ostersonntag(jahr);
        var map = {};

        function setzen(datumIso, name, sf) {
            map[datumIso] = { name: name, sonderfrei: !!sf };
        }

        // 9 bundeseinheitliche Feiertage
        setzen(iso(new Date(jahr, 0, 1)), 'Neujahr');
        setzen(iso(addTage(ostern, -2)), 'Karfreitag');
        setzen(iso(addTage(ostern, 1)), 'Ostermontag');
        setzen(iso(new Date(jahr, 4, 1)), 'Tag der Arbeit');
        setzen(iso(addTage(ostern, 39)), 'Christi Himmelfahrt');
        setzen(iso(addTage(ostern, 50)), 'Pfingstmontag');
        setzen(iso(new Date(jahr, 9, 3)), 'Tag der Deutschen Einheit');
        setzen(iso(new Date(jahr, 11, 25)), '1. Weihnachtstag');
        setzen(iso(new Date(jahr, 11, 26)), '2. Weihnachtstag');

        // Reformationstag (31.10.)
        if (regeln.reformationstag) {
            setzen(iso(new Date(jahr, 9, 31)), 'Reformationstag');
        }

        // Allerheiligen (1.11.)
        if (regeln.allerheiligen) {
            setzen(iso(new Date(jahr, 10, 1)), 'Allerheiligen');
        }

        // Fronleichnam (Ostersonntag + 60)
        if (regeln.fronleichnam) {
            setzen(iso(addTage(ostern, 60)), 'Fronleichnam');
        }

        // Buß- und Bettag (Mittwoch vor dem 23.11., oder am 23.11. wenn Mittwoch)
        if (regeln.bustag) {
            var nov23 = new Date(jahr, 10, 23);
            var diff = (nov23.getDay() - 3 + 7) % 7;
            var bustag = new Date(jahr, 10, 23 - diff);
            setzen(iso(bustag), 'Buß- und Bettag');
        }

        // Betrieblich arbeitsfreie Sondertage 24.12. / 31.12.
        if (sonder) {
            var heiligabend = iso(new Date(jahr, 11, 24));
            if (!map[heiligabend]) {
                setzen(heiligabend, 'Heiligabend', true);
            }
            var silvester = iso(new Date(jahr, 11, 31));
            if (!map[silvester]) {
                setzen(silvester, 'Silvester', true);
            }
        }

        return map;
    }

    var cache = {};

    function getJahresKarte(jahr) {
        if (!cache[jahr]) {
            cache[jahr] = feiertageJahr(jahr);
        }
        return cache[jahr];
    }

    function getEintrag(isoDatum) {
        var jahr = parseInt(String(isoDatum).slice(0, 4), 10);
        if (!Number.isFinite(jahr)) { return null; }
        return getJahresKarte(jahr)[isoDatum] || null;
    }

    function getName(isoDatum) {
        var e = getEintrag(isoDatum);
        return e ? e.name : null;
    }

    function istFeiertag(isoDatum) {
        return !!getEintrag(isoDatum);
    }

    function istSonderfrei(isoDatum) {
        var e = getEintrag(isoDatum);
        return !!(e && e.sonderfrei);
    }

    global.Feiertage = {
        istFeiertag: istFeiertag,
        istSonderfrei: istSonderfrei,
        getName: getName,
        setBundesland: setBundesland,
        getBundesland: getBundesland,
        setSonderfrei: setSonderfrei,
        getSonderfrei: getSonderfrei,
        BL_REIHENFOLGE: BL_REIHENFOLGE
    };

})(window);
