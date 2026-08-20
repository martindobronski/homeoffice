'use strict';

let urlaubTotal = 30;

const WORK_TYPES = [
    { key: 'BUEROTAG', label: 'Bürotag', color: '#3B6D11' },
    { key: 'HOMEOFFICE', label: 'Homeoffice', color: '#5F5E5A' },
    { key: 'DIENSTREISE', label: 'Dienstreise', color: '#534AB7' },
    { key: 'URLAUB', label: 'Urlaub', color: '#993C1D' },
    { key: 'FEIERTAG', label: 'Feiertag', color: '#185FA5' },
    { key: 'KRANKHEIT', label: 'Krankheit', color: '#A32D2D' },
    { key: 'FREIZEITTAG', label: 'Freizeittag', color: '#854F0B' }
];

const TYPE_CLASS = {
    BUEROTAG: 'office',
    HOMEOFFICE: 'ho',
    FREIZEITTAG: 'free',
    DIENSTREISE: 'travel',
    FEIERTAG: 'holiday',
    KRANKHEIT: 'sick',
    URLAUB: 'vacation'
};

const TYPE_ICONS = {
    BUEROTAG: '🏢',
    HOMEOFFICE: '🏠',
    FREIZEITTAG: '🏃',
    DIENSTREISE: '✈️',
    FEIERTAG: '🎉',
    KRANKHEIT: '🤒',
    URLAUB: '🏖️'
};

const EXPORT_LABELS = {
    BUEROTAG: 'Bürotage',
    HOMEOFFICE: 'Homeoffice-Tage',
    DIENSTREISE: 'Dienstreisetage',
    URLAUB: 'Urlaubstage',
    FEIERTAG: 'Feiertage',
    KRANKHEIT: 'Krankheitstage',
    FREIZEITTAG: 'Freizeittage'
};

const DAYS_KEY = 'homeoffice.days';
const PERIOD_KEY = 'homeoffice.period';
const URLAUB_KEY = 'homeoffice.urlaub';
const GEBUCHT_KEY = 'homeoffice.gebucht';

let days = {};
let gebucht = {};
let periodStart;
let periodEnd;
let dialogOrigDate = null;
let pendingDelete = null;
let activeFilter = null;
let chipMenuExportKey = null;
let exportKind = null;
let exportMode = 'all';

const monthBox = document.getElementById('monthBox');
const yearBox = document.getElementById('yearBox');
const prevMonthButton = document.getElementById('prevMonthButton');
const nextMonthButton = document.getElementById('nextMonthButton');
const todayButton = document.getElementById('todayButton');

const heroEl = document.getElementById('hero');
const heroTitleEl = document.getElementById('heroTitle');
const yearGridEl = document.getElementById('yearGrid');
const legendEl = document.getElementById('legend');
const kpiStripEl = document.getElementById('kpiStrip');
const quotaWrapEl = document.querySelector('.quota-input');
const footerActionsEl = document.querySelector('.footer-actions');
const todayButtonEl = document.getElementById('todayButton');
const rangeControlsEl = document.querySelector('.range-controls');
const dashboardTitle = document.getElementById('dashboardTitle');

const overlay = document.getElementById('modalOverlay');
const dialogTitle = document.getElementById('dialogTitle');
const dialogDate = document.getElementById('dialogDate');
const dialogEndDate = document.getElementById('dialogEndDate');
const dialogType = document.getElementById('dialogType');
const dialogDelete = document.getElementById('dialogDelete');
const dialogGebucht = document.getElementById('dialogGebucht');

const confirmOverlay = document.getElementById('confirmOverlay');
const confirmText = document.getElementById('confirmText');
const confirmDelete = document.getElementById('confirmDelete');
const confirmCancel = document.getElementById('confirmCancel');

const quickMenu = document.getElementById('quickMenu');

const chipMenu = document.getElementById('chipMenu');
const exportOverlay = document.getElementById('exportOverlay');
const exportTitle = document.getElementById('exportTitle');
const exportRange = document.getElementById('exportRange');
const exportStart = document.getElementById('exportStart');
const exportEnd = document.getElementById('exportEnd');
const exportFormat = document.getElementById('exportFormat');
const exportOk = document.getElementById('exportOk');
const exportCancel = document.getElementById('exportCancel');

function pad(n) {
    return String(n).padStart(2, '0');
}

function fmt(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function parseISO(s) {
    const parts = s.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

function isWeekend(d) {
    const w = d.getDay();
    return w === 0 || w === 6;
}

// Liefert die "wirksame" Art eines Tages: ein manueller Eintrag hat immer
// Vorrang. Existiert keiner, wird automatisch auf einen Hamburger Feiertag
// (inkl. 24./31.12.) zurückgefallen, sofern feiertage.js geladen ist.
// Automatische Feiertage werden dabei NICHT in `days` geschrieben oder
// gespeichert - sie bleiben rein rechnerisch, damit spätere Aktualisierungen
// der Feiertagsliste keine "eingefrorenen" Alt-Daten hinterlassen.
function getDayType(iso) {
    if (days[iso]) {
        return days[iso];
    }
    if (window.Feiertage && Feiertage.istFeiertag(iso)) {
        return 'FEIERTAG';
    }
    return undefined;
}

function add12mMinusDay(isoStr) {
    const d = parseISO(isoStr);
    return fmt(new Date(d.getFullYear(), d.getMonth() + 12, d.getDate() - 1));
}

// ---------- Speicher ----------

function storeGet(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null;
    }
}

function storeSet(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        // Speicherung nicht möglich (z. B. file:// in Safari) - Seite funktioniert trotzdem
    }
}

function loadDays() {
    try {
        days = JSON.parse(storeGet(DAYS_KEY)) || {};
    } catch (e) {
        days = {};
    }
}

function saveDays() {
    storeSet(DAYS_KEY, JSON.stringify(days));
}

function loadGebucht() {
    try {
        gebucht = JSON.parse(storeGet(GEBUCHT_KEY)) || {};
    } catch (e) {
        gebucht = {};
    }
}

function saveGebucht() {
    storeSet(GEBUCHT_KEY, JSON.stringify(gebucht));
}


function isValidISODate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = parseISO(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  // Verhindert, dass z. B. 2026-02-31 als gültiges Datum
  // interpretiert und automatisch auf März verschoben wird.
  return fmt(date) === value;
}

function getDefaultPeriod() {
  const now = new Date();

  const start = fmt(new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ));

  return {
    start: start,
    end: add12mMinusDay(start)
  };
}




function loadPeriod() {
  let storedStart = null;

  try {
    const raw = storeGet(PERIOD_KEY);
    const saved = raw ? JSON.parse(raw) : null;

    if (saved && typeof saved === 'object') {
      storedStart = saved.start;
    }
  } catch (err) {
    // Beschädigte localStorage-Daten werden ignoriert.
  }

  if (isValidISODate(storedStart)) {
    periodStart = storedStart;
    periodEnd = add12mMinusDay(periodStart);
    return;
  }

  // Fallback: erster Tag des aktuellen Monats
  // bis 12 Monate minus 1 Tag später.
  const defaultPeriod = getDefaultPeriod();

  periodStart = defaultPeriod.start;
  periodEnd = defaultPeriod.end;

  // Reparierte Werte direkt wieder speichern.
  savePeriod();
}


function savePeriod() {
    storeSet(PERIOD_KEY, JSON.stringify({ start: periodStart, end: periodEnd }));
}

function loadUrlaub() {
    const v = parseInt(storeGet(URLAUB_KEY), 10);
    urlaubTotal = (Number.isFinite(v) && v >= 0) ? v : 30;
}

function saveUrlaub() {
    storeSet(URLAUB_KEY, String(urlaubTotal));
}

// ---------- Export / Import ----------

function timestamp() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '-'
        + pad(d.getHours()) + '-' + pad(d.getMinutes()) + '-' + pad(d.getSeconds());
}

function csvToDays(text) {
    const map = {};
    for (const raw of String(text).split(/\r?\n/)) {
        const line = raw.trim();
        if (!line) {
            continue;
        }
        const i = line.indexOf(',');
        if (i < 0) {
            throw new Error('ungültige Zeile: ' + line);
        }
        const date = line.slice(0, i).trim();
        const type = line.slice(i + 1).trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new Error('ungültiges Datum: ' + date);
        }
        if (!type) {
            throw new Error('fehlender Typ in Zeile: ' + line);
        }
        map[date] = type;
    }
    return map;
}

function parseBackupText(text) {
    let data = null;
    try {
        data = JSON.parse(text);
    } catch (e) {
        data = null;
    }
    if (data && typeof data === 'object') {
        if (!data.days || typeof data.days !== 'object') {
            throw new Error('ungültige JSON-Backup-Datei');
        }
        for (const key of Object.keys(data.days)) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
                throw new Error('ungültiges Datum: ' + key);
            }
            if (typeof data.days[key] !== 'string') {
                throw new Error('ungültiger Eintrag');
            }
        }
        return { days: data.days, period: data.period, gebucht: data.gebucht };
    }
    return { days: csvToDays(text), period: null, gebucht: {} };
}

function exportBackup() {
    const data = {
        days: days,
        period: { start: periodStart, end: periodEnd },
        gebucht: gebucht
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = timestamp() + '-homeoffice_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
}

function handleImportFile(file) {
    const reader = new FileReader();
    reader.onload = function () {
        try {
            const data = parseBackupText(reader.result);
            days = data.days;
            gebucht = data.gebucht && typeof data.gebucht === 'object' ? data.gebucht : {};
            if (data.period && data.period.start && isValidISODate(data.period.start)) {
                periodStart = data.period.start;
                periodEnd = add12mMinusDay(periodStart);
                savePeriod();
            }
            saveDays();
            saveGebucht();
            populateQuick();
            render();
            alert('Backup importiert: ' + Object.keys(days).length + ' Einträge.');
        } catch (e) {
            alert('Import fehlgeschlagen: ' + e.message);
        }
    };
    reader.onerror = function () {
        alert('Datei konnte nicht gelesen werden.');
    };
    reader.readAsText(file);
}

// ---------- Berechnung ----------

function workdaysInMonth(year, month) {
    const dim = new Date(year, month, 0).getDate();
    let count = 0;
    for (let day = 1; day <= dim; day++) {
        if (!isWeekend(new Date(year, month - 1, day))) {
            count++;
        }
    }
    return count;
}

function monthStat(year, month) {
    const recorded = {};
    const dim = new Date(year, month, 0).getDate();
    for (let day = 1; day <= dim; day++) {
        const d = new Date(year, month - 1, day);
        if (isWeekend(d)) {
            continue;
        }
        const t = getDayType(fmt(d));
        if (t) {
            recorded[t] = (recorded[t] || 0) + 1;
        }
    }
    const workdays = workdaysInMonth(year, month);
    const recordedTotal = Object.values(recorded).reduce((a, b) => a + b, 0);
    const neutral = Object.entries(recorded)
        .filter(([t]) => t !== 'HOMEOFFICE' && t !== 'BUEROTAG')
        .reduce((a, [, v]) => a + v, 0);
    const office = recorded['BUEROTAG'] || 0;
    const basis = workdays - neutral;
    return {
        year: year,
        month: month,
        workdays: workdays,
        office: office,
        recorded: recorded,
        neutral: neutral,
        basis: basis,
        pflicht: Math.floor(basis * 0.6),
        complete: recordedTotal === workdays
    };
}

function periodQuota(fromIso, toIso) {
    const from = parseISO(fromIso);
    const to = parseISO(toIso);
    const endAnchor = new Date(to.getFullYear(), to.getMonth(), 1);
    let y = from.getFullYear();
    let m = from.getMonth() + 1;
    let office = 0;
    let homeoffice = 0;
    while (new Date(y, m - 1, 1) <= endAnchor) {
        const st = monthStat(y, m);
        if (st.complete) {
            office += st.office;
            homeoffice += st.recorded['HOMEOFFICE'] || 0;
        }
        m++;
        if (m === 13) {
            m = 1;
            y++;
        }
    }
    return { office: office, homeoffice: homeoffice };
}

// ---------- Kopfzeile ----------

function populateQuick() {
    const now = new Date();
    let minYear = now.getFullYear() - 5;
    let maxYear = now.getFullYear() + 9;
    for (const iso of Object.keys(days)) {
        const y = parseISO(iso).getFullYear();
        minYear = Math.min(minYear, y);
        maxYear = Math.max(maxYear, y);
    }
    yearBox.innerHTML = '';
    for (let y = minYear; y <= maxYear; y++) {
        const o = document.createElement('option');
        o.value = y;
        o.textContent = y;
        yearBox.appendChild(o);
    }
    monthBox.innerHTML = '';
    for (let m = 1; m <= 12; m++) {
        const o = document.createElement('option');
        o.value = m;
        o.textContent = new Date(2000, m - 1, 1).toLocaleDateString('de-DE', { month: 'long' });
        monthBox.appendChild(o);
    }
}

function syncQuickSelection() {
    const d = parseISO(periodStart);
    monthBox.value = String(d.getMonth() + 1);
    yearBox.value = String(d.getFullYear());
}

function applyQuickSelection() {
    const m = parseInt(monthBox.value, 10);
    const y = parseInt(yearBox.value, 10);
    if (!m || !y) {
        return;
    }
    periodStart = fmt(new Date(y, m - 1, 1));
    periodEnd = add12mMinusDay(periodStart);
    savePeriod();
    render();
}

function shiftPeriod(delta) {
    const d = parseISO(periodStart);
    periodStart = fmt(new Date(d.getFullYear(), d.getMonth() + delta, 1));
    periodEnd = add12mMinusDay(periodStart);
    savePeriod();
    render();
}

function goToToday() {
    const today = new Date();
    periodStart = fmt(new Date(today.getFullYear(), today.getMonth(), 1));
    periodEnd = add12mMinusDay(periodStart);
    savePeriod();
    render();
}

// ---------- KPI-Karten ----------

function kpiCard(label, value, sub, pct, color, tip, ampel, ringPct, target, invert) {
    const dispPct = ringPct != null ? ringPct : pct;
    const t = target || 100;
    let ampelColor = '';
    if (ampel) {
        if (invert) {
            ampelColor = pct >= 100 ? '#dc2626' : pct >= 60 ? '#eab308' : '#16a34a';
        } else {
            const greenAt = t;
            const yellowAt = Math.round(t * 0.75);
            ampelColor = pct >= greenAt ? '#16a34a' : pct >= yellowAt ? '#eab308' : '#dc2626';
        }
    }
    const overflow = (!invert && t < 100 && pct > t) ? pct - t : 0;
    const isOverflow = overflow > 0;
    return '<div class="kpi-card"' + (tip ? ' data-tip="' + tip + '"' : '') + '>'
        + '<div class="ring-wrap">'
        + '<div class="ring' + (isOverflow ? ' ring-pulse' : '') + '" style="--pct:' + dispPct + ';--ring-color:' + (ampel ? ampelColor : color) + '"></div>'
        + '<div class="ring-pct" style="color:' + (ampel ? ampelColor : color) + '">' + pct + '%</div>'
        + '</div>'
        + '<div class="kpi-text">'
        + '<div class="kpi-value">' + value + '</div>'
        + '<div class="kpi-label">' + label + '</div>'
        + '<div class="kpi-label" style="color:var(--text-faint)">' + sub + '</div>'
        + '</div>'
        + '</div>';
}

function renderKpis() {
    const strip = document.getElementById('kpiStrip');
    const q = periodQuota(periodStart, periodEnd);
    const basis = q.office + q.homeoffice;
    const now = new Date();
    const st = monthStat(now.getFullYear(), now.getMonth() + 1);
    const monatName = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('de-DE', { month: 'long' });
    const pflichtPct = st.pflicht > 0 ? Math.round(st.office / st.pflicht * 100) : 0;
    let urlaubYear = 0;
    for (const iso of Object.keys(days)) {
        if (parseISO(iso).getFullYear() === now.getFullYear() && days[iso] === 'URLAUB') {
            urlaubYear++;
        }
    }
    const urlaubPct = urlaubTotal > 0 ? Math.round(urlaubYear / urlaubTotal * 100) : 0;
    let html = '';
    html += kpiCard('Büropflicht (' + monatName + ')', st.office + ' / ' + st.pflicht + ' Tage',
        'Bürotage erfasst', pflichtPct, '#3B6D11',
        'Erfüllungsgrad der Büropflicht in ' + monatName + ': ' + st.office + ' erfasste Bürotage von ' + st.pflicht + ' Pflichttagen (60 % der Werktage, abgerundet). Kann von der Büroquote rechts abweichen, da hier gerundet wird und nur ' + monatName + ' zählt.', true);
    if (basis > 0) {
        const officePct = Math.round(q.office * 100 / basis);
        const officeRingPct = Math.min(100, Math.round(officePct * 100 / 60));
        const homeofficePct = Math.round(q.homeoffice * 100 / basis);
        const homeofficeRingPct = Math.min(100, Math.round(homeofficePct * 100 / 40));
        html += kpiCard('Büroquote', q.office + ' / ' + basis, 'Ist-Anwesenheit im Büro', officePct, '#3B6D11',
            'Tatsächliche Verteilung über den gesamten Zeitraum (nur vollständige Monate):<br>Anteil Bürotage an allen Büro+Homeoffice-Tagen (Ziel: 60 %).', true, officeRingPct, 60);
        html += kpiCard('Homeoffice-Quote', q.homeoffice + ' / ' + basis, 'Ist-Anwesenheit remote', homeofficePct, '#5F5E5A',
            'Tatsächliche Verteilung über den gesamten Zeitraum (nur vollständige Monate):<br>Anteil Homeoffice-Tage an allen Büro+Homeoffice-Tagen (Ziel: 40 %).', true, homeofficeRingPct, 40);
    } else {
        html += kpiCard('Büroquote', '–', 'keine vollständigen Monate', 0, '#3B6D11', 'Noch keine vollständigen Monate vorhanden', true);
        html += kpiCard('Homeoffice-Quote', '–', 'keine vollständigen Monate', 0, '#5F5E5A', 'Noch keine vollständigen Monate vorhanden', true);
    }
    html += kpiCard('Urlaub (' + now.getFullYear() + ')', urlaubYear + ' / ' + urlaubTotal + ' Tage',
        'Kontingent verbraucht', urlaubPct, '#993C1D',
        'Verbrauchtes Urlaubskontingent im laufenden Kalenderjahr ' + now.getFullYear() + ' (' + urlaubYear + ' von ' + urlaubTotal + ' Tagen). Bezieht sich immer auf das echte Kalenderjahr, unabhängig vom gewählten Anzeigezeitraum.', true, null, 100, true);
    strip.innerHTML = html;
}

// ---------- Monatskalender ----------

function buildMonthCells(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells = [];
    let row = 0;
    let prevCol = -1;
    for (let d = 1; d <= daysInMonth; d++) {
        const wd = new Date(year, month - 1, d).getDay();
        if (wd === 0 || wd === 6) {
            continue;
        }
        const col = wd - 1;
        if (col <= prevCol) {
            row++;
        }
        prevCol = col;
        cells.push({ row: row, col: col, day: d, iso: fmt(new Date(year, month - 1, d)), type: getDayType(fmt(new Date(year, month - 1, d))) });
    }
    return { cells: cells, rows: row + 1, workdays: cells.length };
}

function renderCalGrid(year, month) {
    const { cells, rows } = buildMonthCells(year, month);
    const todayIso = fmt(new Date());
    let html = '<div class="cal-grid" style="grid-template-rows:auto repeat(' + rows + ',1fr)">';
    for (const wd of ['Mo', 'Di', 'Mi', 'Do', 'Fr']) {
        html += '<div class="cal-head">' + wd + '</div>';
    }
    const grid = Array.from({ length: rows }, function () { return Array(5).fill(null); });
    for (const c of cells) {
        grid[c.row][c.col] = c;
    }
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < 5; c++) {
            const cell = grid[r][c];
            if (!cell) {
                html += '<div class="day empty"></div>';
                continue;
            }
            const cls = TYPE_CLASS[cell.type];
            const future = !cls && cell.iso > todayIso;
            const filter = activeFilter
                ? (cell.type === activeFilter ? ' highlighted' : ' dimmed')
                : '';
            const icon = cls ? '<span class="cell-icon">' + TYPE_ICONS[cell.type] + '</span>' : '';
            const check = gebucht[cell.iso]
                ? '<span class="check" aria-label="gebucht">✓</span>'
                : '';
            const today = cell.iso === todayIso ? ' today' : '';
            html += '<div class="day ' + (cls || (future ? 'future' : '')) + filter + today + '"'
                + ' data-date="' + cell.iso + '">'
                + cell.day + icon + check + '</div>';
        }
    }
    html += '</div>';
    return html;
}

function monthName(year, month) {
    return new Date(year, month - 1, 1).toLocaleDateString('de-DE', { month: 'long' });
}

function heroHTML(year, month) {
    const st = monthStat(year, month);
    const pct = st.pflicht > 0 ? Math.round(st.office / st.pflicht * 100) : 0;
    const pctColor = pct >= 100 ? '#16a34a' : pct >= 80 ? '#eab308' : '#dc2626';
    return '<div class="hero-head">'
        + '<div>'
        + '<div class="badge">● Läuft gerade</div>'
        + '<h3>' + monthName(year, month) + ' ' + year + '</h3>'
        + '</div>'
        + '<div class="hero-stats">'
        + '<div class="hero-stat">'
        + '<div class="n">' + st.workdays + '</div>'
        + '<div class="l">Werktage</div>'
        + '</div>'
        + '<div class="hero-stat">'
        + '<div class="n" title="Erfüllungsgrad der Büropflicht: ' + st.office + ' erfasste Bürotage von ' + st.pflicht + ' Pflichttagen (60% der Werktage, abgerundet) = ' + pct + ' %. Unabhängig von der Büro-/Homeoffice-Ist-Verteilung oben in den KPI-Karten.">' + st.office + ' / ' + st.pflicht + ' <span style="background:' + pctColor + ';color:#fff;padding:1px 6px;border-radius:4px;font-weight:700;font-size:11px;border:1px solid #000;position:relative;top:-4px">' + pct + ' %</span></div>'
        + '<div class="l" style="text-align:left">Bürotage (Ist/Soll)</div>'
        + '<div class="progress-bar"><div style="width:' + pct + '%"></div></div>'
        + '</div>'
        + '</div>'
        + '</div>'
        + renderCalGrid(year, month);
}

function cardHTML(year, month, showYear) {
    const st = monthStat(year, month);
    const pct = st.pflicht > 0 ? Math.round(st.office / st.pflicht * 100) : 0;
    const pctColor = pct >= 100 ? '#16a34a' : pct >= 80 ? '#eab308' : '#dc2626';
    return '<div class="month-card">'
        + '<div class="m-head">'
        + '<h4>' + monthName(year, month) + ' <span class="m-year">' + year + '</span></h4>'
        + '<span title="Erfüllungsgrad der Büropflicht: ' + st.office + ' erfasste Bürotage von ' + st.pflicht + ' Pflichttagen (60% der Werktage, abgerundet) = ' + pct + ' %. Unabhängig von der Büro-/Homeoffice-Ist-Verteilung oben in den KPI-Karten.">' + st.office + ' von ' + st.pflicht + ' Solltagen erfüllt <span style="background:' + pctColor + ';color:#fff;padding:1px 6px;border-radius:4px;font-weight:700;font-size:11px;border:1px solid #000;position:relative;top:-1px">' + pct + ' %</span></span>'
        + '</div>'
        + '<div class="progress-bar"><div style="width:' + pct + '%"></div></div>'
        + renderCalGrid(year, month)
        + '</div>';
}

function renderMonths() {
    const start = parseISO(periodStart);
    const end = parseISO(periodEnd);
    const endAnchor = new Date(end.getFullYear(), end.getMonth(), 1);
    const now = new Date();
    const curAnchor = new Date(now.getFullYear(), now.getMonth(), 1);
    const inRange = curAnchor >= new Date(start.getFullYear(), start.getMonth(), 1)
        && curAnchor <= endAnchor;
    const showYear = start.getFullYear() !== endAnchor.getFullYear();
    let y = start.getFullYear();
    let m = start.getMonth() + 1;
    let heroShown = false;
    let cards = '';
    while (new Date(y, m - 1, 1) <= endAnchor) {
        const isCurrent = y === now.getFullYear() && m === now.getMonth() + 1;
        if (isCurrent && inRange) {
            heroEl.innerHTML = heroHTML(y, m);
            heroShown = true;
        } else {
            cards += cardHTML(y, m, showYear);
        }
        m++;
        if (m === 13) {
            m = 1;
            y++;
        }
    }
    yearGridEl.innerHTML = cards;
    heroEl.classList.toggle('hidden', !heroShown);
    heroTitleEl.classList.toggle('hidden', !heroShown);
}

// ---------- Legende ----------

function renderLegend() {
    const start = parseISO(periodStart);
    const end = parseISO(periodEnd);
    const counts = {};
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (isWeekend(d)) {
            continue;
        }
        const t = getDayType(fmt(d));
        if (t) {
            counts[t] = (counts[t] || 0) + 1;
        }
    }
    const now = new Date();
    const today = fmt(now);
    let urlaubGenommen = 0;
    let urlaubGeplant = 0;
    for (const iso of Object.keys(days)) {
        if (parseISO(iso).getFullYear() !== now.getFullYear()) {
            continue;
        }
        if (days[iso] !== 'URLAUB') {
            continue;
        }
        if (iso < today) {
            urlaubGenommen++;
        } else if (iso > today) {
            urlaubGeplant++;
        }
    }
    const ungeplant = Math.max(0, urlaubTotal - urlaubGenommen - urlaubGeplant);
    legendEl.innerHTML = WORK_TYPES.map(function (t) {
        const label = t.key === 'URLAUB'
            ? 'Urlaub <b>' + urlaubGenommen + '</b> genommen · <b>' + urlaubGeplant + '</b> geplant · <b>' + ungeplant + '</b> ungeplant'
            : t.label + ' <b>' + (counts[t.key] || 0) + '</b>';
        const active = activeFilter === t.key ? ' active' : (activeFilter ? ' dimmed' : '');
        return '<button type="button" class="chip' + active + '"'
            + ' data-filter="' + t.key + '">'
            + '<span class="sw" style="background:' + t.color + '"></span>'
            + '<span class="chip-icon">' + TYPE_ICONS[t.key] + '</span>'
            + label
            + '</button>';
    }).join('');
}

// ---------- Dialog ----------

function fillTypeSelect() {
    dialogType.innerHTML = '';
    for (const t of WORK_TYPES) {
        const o = document.createElement('option');
        o.value = t.key;
        o.textContent = t.label;
        dialogType.appendChild(o);
    }
}

function openDialog(iso) {
    dialogOrigDate = iso;
    const existing = days[iso];
    const resolved = getDayType(iso);
    dialogTitle.textContent = existing ? 'Eintrag bearbeiten' : 'Eintrag hinzufügen';
    dialogDate.value = iso;
    dialogEndDate.value = iso;
    dialogType.value = resolved || 'BUEROTAG';
    dialogGebucht.checked = !!gebucht[iso];
    dialogDelete.classList.toggle('hidden', !existing);
    updateGebuchtVisibility();
    overlay.classList.remove('hidden');
}

function updateGebuchtVisibility() {
    dialogGebuchtWrap.classList.toggle('hidden', dialogType.value !== 'BUEROTAG');
}

function closeDialog() {
    overlay.classList.add('hidden');
    dialogOrigDate = null;
}

dialogDate.addEventListener('change', function () {
    if (dialogEndDate.value && dialogEndDate.value < dialogDate.value) {
        dialogEndDate.value = dialogDate.value;
    }
});

dialogType.addEventListener('change', updateGebuchtVisibility);

function setGebuchtFlag(iso, checked) {
    if (checked) {
        gebucht[iso] = true;
    } else {
        delete gebucht[iso];
    }
}

function applyGebucht(iso, type) {
    if (type === 'BUEROTAG') {
        setGebuchtFlag(iso, dialogGebucht.checked);
    } else {
        delete gebucht[iso];
    }
}

document.getElementById('dialogOk').addEventListener('click', function () {
    const newDate = dialogDate.value;
    const endDate = dialogEndDate.value;
    const type = dialogType.value;
    if (!newDate) {
        alert('Bitte ein Startdatum wählen.');
        return;
    }
    if (endDate && endDate > newDate) {
        const start = parseISO(newDate);
        const end = parseISO(endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            days[fmt(d)] = type;
            applyGebucht(fmt(d), type);
        }
    } else {
        if (dialogOrigDate !== newDate && days[newDate]) {
            alert('Für dieses Datum existiert bereits ein Eintrag.');
            return;
        }
        if (dialogOrigDate !== newDate && days[dialogOrigDate]) {
            delete days[dialogOrigDate];
            delete gebucht[dialogOrigDate];
        }
        days[newDate] = type;
        applyGebucht(newDate, type);
    }
    saveDays();
    saveGebucht();
    closeDialog();
    render();
});

dialogDelete.addEventListener('click', function () {
    const startIso = dialogDate.value;
    const endIso = dialogEndDate.value && dialogEndDate.value > startIso ? dialogEndDate.value : startIso;
    const start = parseISO(startIso);
    const end = parseISO(endIso);
    let count = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (days[fmt(d)]) {
            count++;
        }
    }
    confirmText.innerHTML = endIso === startIso
        ? 'Eintrag vom <b>' + startIso + '</b> löschen?'
        : 'Einträge von <b>' + startIso + '</b> bis <b>' + endIso + '</b> (' + count + ' Tag(e)) löschen?';
    pendingDelete = { start: start, end: end };
    confirmOverlay.classList.remove('hidden');
});

confirmDelete.addEventListener('click', function () {
    if (!pendingDelete) {
        return;
    }
    for (let d = new Date(pendingDelete.start); d <= pendingDelete.end; d.setDate(d.getDate() + 1)) {
        delete days[fmt(d)];
        delete gebucht[fmt(d)];
    }
    pendingDelete = null;
    saveDays();
    saveGebucht();
    closeDialog();
    confirmOverlay.classList.add('hidden');
    render();
});

confirmCancel.addEventListener('click', function () {
    pendingDelete = null;
    confirmOverlay.classList.add('hidden');
});

confirmOverlay.addEventListener('click', function (e) {
    if (e.target === confirmOverlay) {
        pendingDelete = null;
        confirmOverlay.classList.add('hidden');
    }
});

document.getElementById('dialogCancel').addEventListener('click', closeDialog);
overlay.addEventListener('click', function (e) {
    if (e.target === overlay) {
        closeDialog();
    }
});

document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') {
        return;
    }
    quickHide();
    hideDayTip();
    closeDialog();
    if (!chipMenu.classList.contains('hidden')) {
        chipMenu.classList.add('hidden');
    }
    closeExportDialog();
    if (!confirmOverlay.classList.contains('hidden')) {
        pendingDelete = null;
        confirmOverlay.classList.add('hidden');
    }
    if (!urlaubConfirmOverlay.classList.contains('hidden')) {
        pendingUrlaub = null;
        urlaubConfirmOverlay.classList.add('hidden');
    }
});

document.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
        return;
    }
    if (!overlay.classList.contains('hidden') || !confirmOverlay.classList.contains('hidden')
        || !urlaubConfirmOverlay.classList.contains('hidden')) {
        return;
    }
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
        return;
    }
    shiftPeriod(e.key === 'ArrowLeft' ? -1 : 1);
});

document.getElementById('exportButton').addEventListener('click', exportBackup);
document.getElementById('importButton').addEventListener('click', function () {
    document.getElementById('importFile').click();
});
document.getElementById('importFile').addEventListener('change', function (e) {
    const file = e.target.files && e.target.files[0];
    if (file) {
        handleImportFile(file);
    }
    e.target.value = '';
});

const urlaubConfirmOverlay = document.getElementById('urlaubConfirmOverlay');
const urlaubConfirmText = document.getElementById('urlaubConfirmText');
let pendingUrlaub = null;

document.getElementById('urlaubApply').addEventListener('click', function () {
    const v = parseInt(document.getElementById('urlaubInput').value, 10);
    if (!Number.isFinite(v) || v < 0) {
        alert('Bitte eine gültige Anzahl Urlaubstage eingeben.');
        return;
    }
    if (v === urlaubTotal) {
        return;
    }
    pendingUrlaub = v;
    urlaubConfirmText.innerHTML = 'Kontingent von <b>' + urlaubTotal + '</b> auf <b>' + v + '</b> Tage ändern?';
    urlaubConfirmOverlay.classList.remove('hidden');
});

urlaubConfirmOverlay.addEventListener('click', function (e) {
    if (e.target === urlaubConfirmOverlay) {
        pendingUrlaub = null;
        urlaubConfirmOverlay.classList.add('hidden');
    }
});

document.getElementById('urlaubConfirmOk').addEventListener('click', function () {
    if (pendingUrlaub === null) {
        return;
    }
    urlaubTotal = pendingUrlaub;
    pendingUrlaub = null;
    saveUrlaub();
    render();
    urlaubConfirmOverlay.classList.add('hidden');
});

document.getElementById('urlaubConfirmCancel').addEventListener('click', function () {
    pendingUrlaub = null;
    urlaubConfirmOverlay.classList.add('hidden');
});

// ---------- Ereignis-Delegation ----------

function gridClick(e) {
    if (e.button !== 0) {
        return;
    }
    const cell = e.target.closest('.day[data-date]');
    if (cell) {
        hideDayTip();
        openDialog(cell.getAttribute('data-date'));
    }
}

function gridContext(e) {
    e.preventDefault();
    hideDayTip();
    const cell = e.target.closest('.day[data-date]');
    if (!cell) {
        return;
    }
    quickShow(cell.getAttribute('data-date'), e.clientX, e.clientY);
}

legendEl.addEventListener('click', function (e) {
    const chip = e.target.closest('.chip[data-filter]');
    if (!chip) {
        return;
    }
    const key = chip.getAttribute('data-filter');
    activeFilter = activeFilter === key ? null : key;
    renderMonths();
    renderLegend();
});

// ---------- Legenden-Kontextmenü & Export ----------

function positionChipMenu(rect) {
    const menuW = chipMenu.offsetWidth;
    const menuH = chipMenu.offsetHeight;
    let left = rect.left + rect.width + 6;
    let top = rect.top;
    if (left + menuW > window.innerWidth - 8) {
        left = rect.left - menuW - 6;
    }
    if (top + menuH > window.innerHeight - 8) {
        top = window.innerHeight - menuH - 8;
    }
    chipMenu.style.left = Math.max(8, left) + 'px';
    chipMenu.style.top = Math.max(8, top) + 'px';
}

function showChipMenu(key, rect) {
    chipMenuExportKey = key;
    const label = EXPORT_LABELS[key] || key;
    let html = '<div class="qm-date">' + label + '</div>';
    if (key === 'URLAUB') {
        html += '<button type="button" class="qm-item" data-chipexport="urlaub-genommen">'
            + '<span class="qm-icon">📄</span>Export → Genommene Urlaubstage…</button>';
        html += '<button type="button" class="qm-item" data-chipexport="urlaub-geplant">'
            + '<span class="qm-icon">📄</span>Export → Geplante Urlaubstage…</button>';
        html += '<button type="button" class="qm-item" data-chipexport="urlaub-alle">'
            + '<span class="qm-icon">📄</span>Export → Alle eingetragenen Urlaubstage…</button>';
    } else {
        html += '<button type="button" class="qm-item" data-chipexport="list">'
            + '<span class="qm-icon">📄</span>Export → ' + label + '…</button>';
    }
    if (key === 'BUEROTAG') {
        html += '<button type="button" class="qm-item" data-chipexport="gebucht">'
            + '<span class="qm-icon">☑</span>Export → gebucht-Tage…</button>';
    }
    chipMenu.innerHTML = html;
    chipMenu.classList.remove('hidden');
    positionChipMenu(rect);
}

legendEl.addEventListener('contextmenu', function (e) {
    const chip = e.target.closest('.chip[data-filter]');
    if (!chip) {
        return;
    }
    e.preventDefault();
    quickHide();
    hideDayTip();
    showChipMenu(chip.getAttribute('data-filter'), chip.getBoundingClientRect());
});

chipMenu.addEventListener('click', function (e) {
    const item = e.target.closest('[data-chipexport]');
    if (!item) {
        return;
    }
    const action = item.getAttribute('data-chipexport');
    chipMenu.classList.add('hidden');
    if (action === 'gebucht') {
        openExportDialog('GEBUCHT', 'all');
    } else if (action === 'urlaub-genommen') {
        openExportDialog('URLAUB', 'taken');
    } else if (action === 'urlaub-geplant') {
        openExportDialog('URLAUB', 'planned');
    } else if (action === 'urlaub-alle') {
        openExportDialog('URLAUB', 'all');
    } else {
        openExportDialog(chipMenuExportKey, 'all');
    }
});

function updateExportCustom() {
    const custom = exportRange.value === 'custom';
    exportStart.closest('.field-group').classList.toggle('hidden', !custom);
    exportEnd.closest('.field-group').classList.toggle('hidden', !custom);
}

const EXPORT_MODE_LABELS = {
    'URLAUB:taken': 'Genommene Urlaubstage',
    'URLAUB:planned': 'Geplante Urlaubstage',
    'URLAUB:all': 'Alle eingetragenen Urlaubstage'
};

function exportLabel(kind, mode) {
    if (kind === 'GEBUCHT') {
        return 'gebucht';
    }
    const t = WORK_TYPES.find(function (x) { return x.key === kind; });
    return EXPORT_MODE_LABELS[kind + ':' + mode]
        || (t ? EXPORT_LABELS[kind] || t.label : kind);
}

function openExportDialog(kind, mode) {
    exportKind = kind;
    exportMode = mode;
    exportTitle.textContent = exportLabel(kind, mode) + ' exportieren';
    exportStart.value = periodStart;
    exportEnd.value = periodEnd;
    exportRange.value = (kind === 'URLAUB' || kind === 'FEIERTAG' || kind === 'KRANKHEIT' || kind === 'FREIZEITTAG') ? 'year' : 'month';
    updateExportCustom();
    exportOverlay.classList.remove('hidden');
}

function closeExportDialog() {
    exportOverlay.classList.add('hidden');
    exportKind = null;
    exportMode = 'all';
}

function exportRangeDates() {
    const now = new Date();
    let start;
    let end;
    if (exportRange.value === 'month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (exportRange.value === 'quarter') {
        const q = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), q * 3, 1);
        end = new Date(now.getFullYear(), q * 3 + 3, 0);
    } else if (exportRange.value === 'year') {
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
    } else {
        if (!isValidISODate(exportStart.value) || !isValidISODate(exportEnd.value)) {
            alert('Bitte gültiges Start- und Enddatum wählen.');
            return null;
        }
        start = parseISO(exportStart.value);
        end = parseISO(exportEnd.value);
        if (end < start) {
            alert('Das Enddatum liegt vor dem Startdatum.');
            return null;
        }
    }
    return { start: fmt(start), end: fmt(end) };
}

function formatExportDate(iso, mode) {
    if (mode === 'iso') {
        return iso;
    }
    const d = parseISO(iso);
    return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
}

function exportList() {
    const range = exportRangeDates();
    if (!range) {
        return;
    }
    const mode = exportFormat.value;
    const isBooked = exportKind === 'GEBUCHT';
    const today = fmt(new Date());
    const entries = [];
    if (isBooked) {
        for (const iso of Object.keys(gebucht)) {
            if (iso >= range.start && iso <= range.end) {
                const t = WORK_TYPES.find(function (x) { return x.key === days[iso]; });
                entries.push({ iso: iso, label: t ? t.label : '' });
            }
        }
    } else {
        for (let d = parseISO(range.start); fmt(d) <= range.end; d.setDate(d.getDate() + 1)) {
            const iso = fmt(d);
            if (getDayType(iso) !== exportKind) {
                continue;
            }
            if (exportMode === 'taken' && iso >= today) {
                continue;
            }
            if (exportMode === 'planned' && iso <= today) {
                continue;
            }
            entries.push({ iso: iso, label: '' });
        }
    }
    entries.sort(function (a, b) { return a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : 0; });
    if (entries.length === 0) {
        alert('Keine Einträge im gewählten Zeitraum.');
        return;
    }
    const baseLabel = exportLabel(exportKind, exportMode);
    let header = baseLabel;
    if (exportKind === 'URLAUB') {
        header += ' (' + entries.length + (entries.length === 1 ? ' Tag' : ' Tage') + ')';
    }
    const lines = entries.map(function (e) {
        return formatExportDate(e.iso, mode) + (isBooked && e.label ? ' · ' + e.label : '');
    });
    const blob = new Blob([header + '\n' + lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = baseLabel.replace(/\s+/g, '') + '_' + range.start + '_bis_' + range.end + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    closeExportDialog();
}

exportRange.addEventListener('change', updateExportCustom);
exportOk.addEventListener('click', exportList);
exportCancel.addEventListener('click', closeExportDialog);
exportOverlay.addEventListener('click', function (e) {
    if (e.target === exportOverlay) {
        closeExportDialog();
    }
});

// ---------- Tag-Kontextmenü (Rechtsklick) ----------

let quickIso = null;
let quickPos = null;
const dayTip = document.getElementById('dayTip');

function showDayTip(e) {
    const cell = e.target.closest('.day[data-date]');
    const chip = cell ? null : e.target.closest('.chip[data-filter]');
    const quota = (!cell && !chip) ? e.target.closest('.quota-input') : null;
    const btn = (!cell && !chip && !quota) ? e.target.closest('#exportButton, #importButton') : null;
    const today = (!cell && !chip && !quota && !btn) ? e.target.closest('#todayButton') : null;
    const nav = (!cell && !chip && !quota && !btn && !today) ? e.target.closest('#prevMonthButton, #nextMonthButton') : null;
    const rangeLabel = (!cell && !chip && !quota && !btn && !today && !nav) ? e.target.closest('.range-label') : null;
    const kpiCard = (!cell && !chip && !quota && !btn && !today && !nav && !rangeLabel) ? e.target.closest('.kpi-card[data-tip]') : null;
    if (!cell && !chip && !quota && !btn && !today && !nav && !rangeLabel && !kpiCard) {
        return;
    }
    if (!overlay.classList.contains('hidden') || !confirmOverlay.classList.contains('hidden')
        || !urlaubConfirmOverlay.classList.contains('hidden')) {
        return;
    }
    const rect = (cell || chip || quota || btn || today || nav || rangeLabel || kpiCard).getBoundingClientRect();
    let html;
    if (cell) {
        const iso = cell.getAttribute('data-date');
        const manualType = days[iso];
        const type = getDayType(iso);
        html = parseISO(iso).toLocaleDateString('de-DE',
            { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
        if (type) {
            const sonderfrei = !manualType && window.Feiertage && Feiertage.istSonderfrei(iso);
            const label = sonderfrei ? 'Arbeitsfrei' : (WORK_TYPES.find(t => t.key === type) || {}).label;
            html += '<div class="day-tip-type">- ' + label + ' -</div>';
            if (!manualType && window.Feiertage) {
                const feiertagsName = Feiertage.getName(iso);
                if (feiertagsName) {
                    html += '<div class="day-tip-type" style="opacity:.75">' + feiertagsName + '</div>';
                }
            }
        }
        html += '<div class="day-tip-hints">Linksklick: Eintrag bearbeiten<br>Rechtsklick: Schnellauswahl</div>';
    } else if (chip) {
        const key = chip.getAttribute('data-filter');
        const t = WORK_TYPES.find(x => x.key === key);
        html = (activeFilter === key ? 'Filter aufheben (alle anzeigen)' : 'Nur „' + t.label + '“ anzeigen');
        html += '<div class="day-tip-hints">Linksklick: Filtern<br>Rechtsklick: Export</div>';
    } else if (quota) {
        html = 'Urlaubskontingent'
            + '<div class="day-tip-hints">Hier kann das jährliche Urlaubskontingent angepasst werden.</div>';
    } else if (btn) {
        html = (btn.id === 'exportButton' ? 'Backup exportieren' : 'Backup importieren')
            + '<div class="day-tip-hints">' + (btn.id === 'exportButton'
                ? 'Aktuelle Daten als Backup-Datei herunterladen.'
                : 'Backup-Datei importieren (überschreibt aktuelle Daten).') + '</div>';
    } else if (today) {
        html = 'Heute'
            + '<div class="day-tip-hints">Zeitraum Start-Monat auf aktuellen Monat setzen.</div>';
    } else if (nav) {
        const isNext = nav.id === 'nextMonthButton';
        html = (isNext ? 'Nächster Monat' : 'Vorheriger Monat')
            + '<div class="day-tip-hints">' + (isNext ? 'Mausklick oder Cursortaste rechts drücken.' : 'Mausklick oder Cursortaste links drücken.') + '</div>';
    } else if (rangeLabel) {
        html = 'Zeitraum Start-Monat'
            + '<div class="day-tip-hints">Einstellen des Start Monats des Anzeigezeitraums.</div>';
    } else if (kpiCard) {
        html = kpiCard.getAttribute('data-tip');
    }
    dayTip.innerHTML = html;
    dayTip.classList.toggle('day-tip-wrap', !!(quota || btn || today || rangeLabel || kpiCard));
    dayTip.classList.remove('hidden');
    const tipW = dayTip.offsetWidth;
    const tipH = dayTip.offsetHeight;
    let left = rect.left + rect.width / 2 - tipW / 2;
    let top = rect.top - tipH - 6;
    if (top < 8) {
        top = rect.bottom + ((nav || today || rangeLabel || kpiCard) ? 6 : 6);
    }
    dayTip.style.left = Math.max(8, Math.min(left, window.innerWidth - tipW - 8)) + 'px';
    dayTip.style.top = Math.max(8, Math.min(top, window.innerHeight - tipH - 8)) + 'px';
}

function hideDayTip() {
    dayTip.classList.add('hidden');
}

function quickHide() {
    quickMenu.classList.add('hidden');
    quickIso = null;
    quickPos = null;
}

function positionQuickMenuAt(x, y) {
    const menuW = quickMenu.offsetWidth;
    const menuH = quickMenu.offsetHeight;
    let left = x + 4;
    let top = y + 4;
    if (left + menuW > window.innerWidth - 8) {
        left = x - menuW - 4;
    }
    if (top + menuH > window.innerHeight - 8) {
        top = y - menuH - 4;
    }
    quickMenu.style.left = Math.max(8, left) + 'px';
    quickMenu.style.top = Math.max(8, top) + 'px';
}

function quickShow(iso, x, y) {
    const alreadyOpen = quickIso === iso && !quickMenu.classList.contains('hidden');
    quickIso = iso;
    quickPos = { x: x, y: y };
    const existing = days[iso];
    const resolved = getDayType(iso);
    const booked = !!gebucht[iso];
    const tipDate = parseISO(iso).toLocaleDateString('de-DE',
        { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    let html = '<div class="qm-date">' + tipDate + '</div>';
    html += '<button type="button" class="qm-item qm-edit" data-set="__edit__">'
        + '<span class="qm-icon">⚙️</span>Eintrag bearbeiten</button>';
    if (existing === 'BUEROTAG') {
        html += '<button type="button" class="qm-item' + (booked ? ' qm-booked' : '') + '" data-set="__gebucht__">'
            + '<span class="qm-icon">' + (booked ? '☑' : '☐') + '</span>gebucht'
            + (booked ? '<span class="qm-active">✓</span>' : '')
            + '</button>';
    }
    html += '<div class="qm-divider"></div>';
    for (let i = 0; i < WORK_TYPES.length; i++) {
        const t = WORK_TYPES[i];
        if (i === 3) {
            html += '<div class="qm-divider"></div>';
        }
        html += '<button type="button" class="qm-item" data-set="' + t.key + '">'
            + '<span class="qm-swatch" style="background:' + t.color + '"></span>'
            + '<span class="qm-icon">' + TYPE_ICONS[t.key] + '</span>'
            + t.label
            + (resolved === t.key ? '<span class="qm-active">✓</span>' : '')
            + '</button>';
    }
    if (existing) {
        html += '<button type="button" class="qm-item qm-del" data-set="__delete__">'
            + '<span class="qm-icon">🗑</span>Löschen</button>';
    }
    quickMenu.innerHTML = html;
    if (!alreadyOpen) {
        positionQuickMenuAt(x, y);
    }
    quickMenu.classList.remove('hidden');
}

quickMenu.addEventListener('click', function (e) {
    const item = e.target.closest('.qm-item[data-set]');
    if (!item || !quickIso) {
        return;
    }
    const set = item.getAttribute('data-set');
    const iso = quickIso;
    if (set === '__delete__') {
        delete days[iso];
        delete gebucht[iso];
        saveDays();
        saveGebucht();
        quickHide();
        render();
    } else if (set === '__edit__') {
        quickHide();
        openDialog(iso);
    } else if (set === '__gebucht__') {
        if (gebucht[iso]) {
            delete gebucht[iso];
        } else {
            gebucht[iso] = true;
        }
        saveGebucht();
        quickShow(iso, quickPos.x, quickPos.y);
        render();
    } else {
        days[iso] = set;
        saveDays();
        quickHide();
        render();
    }
});

heroEl.addEventListener('mouseover', showDayTip);
yearGridEl.addEventListener('mouseover', showDayTip);
kpiStripEl.addEventListener('mouseover', showDayTip);
legendEl.addEventListener('mouseover', showDayTip);
quotaWrapEl.addEventListener('mouseover', showDayTip);
footerActionsEl.addEventListener('mouseover', showDayTip);
todayButtonEl.addEventListener('mouseover', showDayTip);
rangeControlsEl.addEventListener('mouseover', showDayTip);
heroEl.addEventListener('mouseout', hideDayTip);
yearGridEl.addEventListener('mouseout', hideDayTip);
kpiStripEl.addEventListener('mouseout', hideDayTip);
legendEl.addEventListener('mouseout', hideDayTip);
quotaWrapEl.addEventListener('mouseout', hideDayTip);
footerActionsEl.addEventListener('mouseout', hideDayTip);
todayButtonEl.addEventListener('mouseout', hideDayTip);
rangeControlsEl.addEventListener('mouseout', hideDayTip);

document.addEventListener('click', function (e) {
    if (!quickMenu.classList.contains('hidden') && !quickMenu.contains(e.target)) {
        quickHide();
    }
    if (!chipMenu.classList.contains('hidden') && !chipMenu.contains(e.target)) {
        chipMenu.classList.add('hidden');
    }
    hideDayTip();
});

document.addEventListener('contextmenu', function (e) {
    if (!chipMenu.classList.contains('hidden')
        && !chipMenu.contains(e.target)
        && !e.target.closest('.chip[data-filter]')) {
        chipMenu.classList.add('hidden');
    }
});

// ---------- Initialisierung ----------

function render() {
    const startYear = parseISO(periodStart).getFullYear();
    const endYear = parseISO(periodEnd).getFullYear();
    dashboardTitle.textContent = 'Anwesenheits-Dashboard ' + (startYear === endYear ? startYear : startYear + '/' + endYear);
    syncQuickSelection();
    renderKpis();
    renderMonths();
    renderLegend();
}

function init() {
    loadDays();
    loadPeriod();
    loadUrlaub();
    loadGebucht();
    document.getElementById('urlaubInput').value = urlaubTotal;
    populateQuick();
    fillTypeSelect();
    monthBox.addEventListener('change', applyQuickSelection);
    yearBox.addEventListener('change', applyQuickSelection);
    prevMonthButton.addEventListener('click', function () { shiftPeriod(-1); });
    nextMonthButton.addEventListener('click', function () { shiftPeriod(1); });
    todayButton.addEventListener('click', goToToday);
    heroEl.addEventListener('click', gridClick);
    yearGridEl.addEventListener('click', gridClick);
    yearGridEl.addEventListener('contextmenu', gridContext);
    heroEl.addEventListener('contextmenu', gridContext);
    render();
}

init();
