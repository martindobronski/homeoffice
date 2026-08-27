'use strict';

let urlaubTotal = 30;

const WORK_TYPES = [
    { key: 'BUEROTAG', label: 'Bürotag', color: '#185FA5' },
    { key: 'HOMEOFFICE', label: 'Homeoffice', color: '#3B6D11' },
    { key: 'DIENSTREISE', label: 'Dienstreise', color: '#5F5E5A' },
    { key: 'URLAUB', label: 'Urlaub', color: '#D4853C' },
    { key: 'FEIERTAG', label: 'Feiertag', color: '#534AB7' },
    { key: 'KRANKHEIT', label: 'Krankheit', color: '#FF1A1A' },
    { key: 'FREIZEITTAG', label: 'Freizeittag', color: '#A89928' }
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
let selectionMode = false;
let pendingSelectionDelete = false;
const selection = new Set();

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
const selectionBar = document.getElementById('selectionBar');
const selectionInfo = document.getElementById('selectionInfo');
const selectionTypesEl = document.getElementById('selectionTypes');
const exportOverlay = document.getElementById('exportOverlay');
const exportTitle = document.getElementById('exportTitle');
const exportRange = document.getElementById('exportRange');
const exportStart = document.getElementById('exportStart');
const exportEnd = document.getElementById('exportEnd');
const exportFormat = document.getElementById('exportFormat');
const exportFileFormat = document.getElementById('exportFileFormat');
const exportOk = document.getElementById('exportOk');
const exportCancel = document.getElementById('exportCancel');
const backupOverlay = document.getElementById('backupOverlay');
const backupFormat = document.getElementById('backupFormat');
const backupOk = document.getElementById('backupOk');
const backupCancel = document.getElementById('backupCancel');

const printOverlay = document.getElementById('printOverlay');
const printStart = document.getElementById('printStart');
const printEnd = document.getElementById('printEnd');
const printArtTypes = document.getElementById('printArtTypes');
const printPeriod = document.getElementById('printPeriod');
const printMonthSelect = document.getElementById('printMonthSelect');
const printQuarterSelect = document.getElementById('printQuarterSelect');

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
        showSaved();
    } catch (e) {
        // Speicherung nicht möglich (z. B. file:// in Safari) - Seite funktioniert trotzdem
    }
}

let _savedTimer = null;
let _toastAction = null;

function showToast(msg, ms, action) {
    const el = document.getElementById('toast');
    if (!el) return;
    _toastAction = action || null;
    if (_toastAction) {
        el.innerHTML = '<span>' + msg + '</span>'
            + '<button type="button" class="toast-action">' + _toastAction.label + '</button>';
    } else {
        el.textContent = msg;
    }
    el.classList.add('show');
    clearTimeout(_savedTimer);
    _savedTimer = setTimeout(function () {
        el.classList.remove('show');
        _toastAction = null;
    }, ms || 1500);
}
function showSaved() {
    showToast('Gespeichert ✓');
}
function hideToast() {
    clearTimeout(_savedTimer);
    const el = document.getElementById('toast');
    if (el) {
        el.classList.remove('show');
    }
    _toastAction = null;
}

// ---------- Undo/Redo (Rückgängig/Wiederholen) ----------

const undoStack = [];
const redoStack = [];
const UNDO_MAX = 30;

function snapshotNow() {
    return {
        days: JSON.parse(JSON.stringify(days)),
        gebucht: JSON.parse(JSON.stringify(gebucht))
    };
}

function beginChange() {
    undoStack.push(snapshotNow());
    if (undoStack.length > UNDO_MAX) {
        undoStack.shift();
    }
    redoStack.length = 0;
}

function applySnapshot(snap) {
    days = snap.days;
    gebucht = snap.gebucht;
    try {
        localStorage.setItem(DAYS_KEY, JSON.stringify(days));
        localStorage.setItem(GEBUCHT_KEY, JSON.stringify(gebucht));
    } catch (e) {}
    hideToast();
    render();
}

function performUndo() {
    const snap = undoStack.pop();
    if (!snap) {
        return;
    }
    redoStack.push(snapshotNow());
    applySnapshot(snap);
    showToast('Wiederhergestellt ✓', 8000, { label: 'Wiederholen', fn: performRedo });
}

function performRedo() {
    const snap = redoStack.pop();
    if (!snap) {
        return;
    }
    undoStack.push(snapshotNow());
    applySnapshot(snap);
    showToast('Erneut angewendet ✓', 8000, { label: 'Rückgängig', fn: performUndo });
}

document.getElementById('toast').addEventListener('click', function (e) {
    if (!_toastAction || !e.target.closest('.toast-action')) {
        return;
    }
    const fn = _toastAction.fn;
    hideToast();
    fn();
});

function showUndoable(msg) {
    showToast(msg, 8000, { label: 'Rückgängig', fn: performUndo });
}

function syncFeiertagDays() {
    const start = parseISO(periodStart);
    const end = parseISO(periodEnd);
    let count = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const iso = fmt(d);
        const istFT = window.Feiertage && Feiertage.istFeiertag(iso);
        if (istFT && days[iso] !== 'FEIERTAG') {
            days[iso] = 'FEIERTAG';
            count++;
        } else if (!istFT && days[iso] === 'FEIERTAG') {
            delete days[iso];
            count++;
        }
    }
    if (count) saveDays();
    return count;
}

function updateExportHint() {
    const el = document.getElementById('exportHint');
    if (!el) return;
    const raw = storeGet('lastExport');
    if (!raw) { el.textContent = ''; return; }
    const d = new Date(raw);
    const pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    el.textContent = 'Zuletzt exportiert: ' + pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear() + ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    const daysSince = (Date.now() - d.getTime()) / 86400000;
    el.style.color = daysSince > 30 ? '#FF1A1A' : daysSince > 7 ? '#D4853C' : '';
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
    backupFormat.value = 'json';
    backupOverlay.classList.remove('hidden');
}

function exportBackupAs() {
    const format = backupFormat.value;
    backupOverlay.classList.add('hidden');
    if (format === 'json') {
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
    } else {
        const rows = ['Datum,Art,Gebucht'];
        const isos = Object.keys(days).sort();
        for (const iso of isos) {
            rows.push(iso + ',' + days[iso] + ',' + (gebucht[iso] ? 'true' : 'false'));
        }
        const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = timestamp() + '-homeoffice_data.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }
    storeSet('lastExport', new Date().toISOString());
    updateExportHint();
}

function handleImportFile(file) {
    const reader = new FileReader();
    reader.onload = function () {
        try {
            const data = parseBackupText(reader.result);
            beginChange();
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
            showUndoable('Import durchgeführt');
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
    let ringColor = '';
    if (ampel) {
        if (invert) {
            ampelColor = pct > 100 ? '#dc2626' : pct >= 100 ? '#dc2626' : pct >= 60 ? '#eab308' : '#16a34a';
            ringColor = pct > 100 ? '#dc2626' : pct >= 100 ? '#9CA3AF' : pct >= 60 ? '#eab308' : '#16a34a';
        } else {
            const greenAt = t;
            const yellowAt = Math.round(t * 0.75);
            ampelColor = pct >= greenAt ? '#16a34a' : pct >= yellowAt ? '#eab308' : '#dc2626';
            ringColor = ampelColor;
        }
    }
    const overflow = (!invert && t < 100 && pct > t) ? pct - t : 0;
    const isOverflow = overflow > 0;
    return '<div class="kpi-card"' + (tip ? ' data-tip="' + tip + '"' : '') + '>'
        + '<div class="ring-wrap">'
        + '<div class="ring' + (isOverflow ? ' ring-pulse' : '') + '" style="--pct:' + dispPct + ';--ring-color:' + (ampel ? ringColor : color) + '"></div>'
        + '<div class="ring-pct" style="color:var(--text)">' + pct + '%</div>'
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
        'Bürotage erfasst', pflichtPct, '#185FA5',
        'Erfüllungsgrad der Büropflicht in ' + monatName + ': ' + st.office + ' erfasste Bürotage von ' + st.pflicht + ' Pflichttagen (60 % der Werktage, abgerundet). Kann von der Büroquote rechts abweichen, da hier gerundet wird und nur ' + monatName + ' zählt.', true);
    if (basis > 0) {
        const officePct = Math.round(q.office * 100 / basis);
        const officeRingPct = Math.min(100, Math.round(officePct * 100 / 60));
        const homeofficePct = Math.round(q.homeoffice * 100 / basis);
        const homeofficeRingPct = Math.min(100, Math.round(homeofficePct * 100 / 40));
        html += kpiCard('Büroquote', q.office + ' / ' + basis, 'Ist-Anwesenheit im Büro', officePct, '#185FA5',
            'Tatsächliche Verteilung über den gesamten Zeitraum (nur vollständige Monate):<br>Anteil Bürotage an allen Büro+Homeoffice-Tagen (Ziel: 60 %).', true, officeRingPct, 60);
        html += kpiCard('Homeoffice-Quote', q.homeoffice + ' / ' + basis, 'Ist-Anwesenheit remote', homeofficePct, '#3B6D11',
            'Tatsächliche Verteilung über den gesamten Zeitraum (nur vollständige Monate):<br>Anteil Homeoffice-Tage an allen Büro+Homeoffice-Tagen (Ziel: 40 %).', true, homeofficeRingPct, 40);
    } else {
        html += kpiCard('Büroquote', '–', 'keine vollständigen Monate', 0, '#185FA5', 'Noch keine vollständigen Monate vorhanden', true);
        html += kpiCard('Homeoffice-Quote', '–', 'keine vollständigen Monate', 0, '#3B6D11', 'Noch keine vollständigen Monate vorhanden', true);
    }
    html += kpiCard('Urlaub (' + now.getFullYear() + ')', urlaubYear + ' / ' + urlaubTotal + ' Tage',
        'Kontingent verbraucht', urlaubPct, '#D4853C',
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

function renderCalGrid(year, month, showEmpty) {
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
            const empty = !cls;
            const filter = activeFilter
                ? (cell.type === activeFilter ? ' highlighted' : ' dimmed')
                : '';
            const icon = cls ? '<span class="cell-icon">' + TYPE_ICONS[cell.type] + '</span>' : '';
            const emptyMark = (empty && showEmpty) ? '<span class="cell-empty" title="Diesem Tag sollte eine Anwesenheitsart zugeordnet werden.">?</span>' : '';
            const check = gebucht[cell.iso]
                ? '<span class="check" aria-label="gebucht">✓</span>'
                : '';
            const today = cell.iso === todayIso ? ' today' : '';
            const booked = gebucht[cell.iso] ? ' booked' : '';
            const sel = selection.has(cell.iso) ? ' selected' : '';
            html += '<div class="day ' + (cls || (future ? 'future' : '')) + filter + today + booked + sel + '"'
                + ' data-date="' + cell.iso + '">'
                + cell.day + icon + emptyMark + check + '</div>';
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
                + renderCalGrid(year, month, st.office > 0);
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
        + renderCalGrid(year, month, st.office > 0)
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
        const iso = fmt(d);
        const t = getDayType(iso);
        if (t && !(t === 'FEIERTAG' && window.Feiertage && Feiertage.istSonderfrei(iso))) {
            counts[t] = (counts[t] || 0) + 1;
        }
    }
    const now = new Date();
    const today = fmt(now);
    let urlaubGenommen = 0;
    let urlaubGeplant = 0;
    let krankJahr = 0;
    for (const iso of Object.keys(days)) {
        if (parseISO(iso).getFullYear() !== now.getFullYear()) {
            continue;
        }
        if (days[iso] === 'KRANKHEIT') {
            krankJahr++;
        } else if (days[iso] === 'URLAUB') {
            if (iso < today) {
                urlaubGenommen++;
            } else if (iso > today) {
                urlaubGeplant++;
            }
        }
    }
    const ungeplant = Math.max(0, urlaubTotal - urlaubGenommen - urlaubGeplant);
    legendEl.innerHTML = WORK_TYPES.map(function (t) {
        const label = t.key === 'URLAUB'
            ? 'Urlaub <b>' + urlaubGenommen + '</b> genommen · <b>' + urlaubGeplant + '</b> geplant · <b>' + ungeplant + '</b> ungeplant'
            : t.key === 'KRANKHEIT'
                ? t.label + ' <b>' + (counts[t.key] || 0) + '</b> · Jahr <b>' + krankJahr + '</b>'
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
    const isRange = !!(endDate && endDate > newDate);
    if (!isRange && dialogOrigDate !== newDate && days[newDate]) {
        alert('Für dieses Datum existiert bereits ein Eintrag.');
        return;
    }
    beginChange();
    if (isRange) {
        const start = parseISO(newDate);
        const end = parseISO(endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            days[fmt(d)] = type;
            applyGebucht(fmt(d), type);
        }
    } else {
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
    showUndoable('Gespeichert ✓');
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
    if (pendingSelectionDelete) {
        const n = selection.size;
        beginChange();
        for (const iso of selection) {
            delete days[iso];
            delete gebucht[iso];
        }
        pendingSelectionDelete = false;
        saveDays();
        saveGebucht();
        confirmOverlay.classList.add('hidden');
        exitSelectionMode();
        render();
        showUndoable(n + ' Einträge gelöscht');
        return;
    }
    if (!pendingDelete) {
        return;
    }
    let cnt = 0;
    beginChange();
    for (let d = new Date(pendingDelete.start); d <= pendingDelete.end; d.setDate(d.getDate() + 1)) {
        if (days[fmt(d)] || gebucht[fmt(d)]) {
            cnt++;
        }
        delete days[fmt(d)];
        delete gebucht[fmt(d)];
    }
    pendingDelete = null;
    saveDays();
    saveGebucht();
    closeDialog();
    confirmOverlay.classList.add('hidden');
    render();
    showUndoable(cnt + ' Einträge gelöscht');
});

confirmCancel.addEventListener('click', function () {
    pendingDelete = null;
    pendingSelectionDelete = false;
    confirmOverlay.classList.add('hidden');
});

confirmOverlay.addEventListener('click', function (e) {
    if (e.target === confirmOverlay) {
        pendingDelete = null;
        pendingSelectionDelete = false;
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
    closePrintView();
    if (!confirmOverlay.classList.contains('hidden')) {
        pendingDelete = null;
        pendingSelectionDelete = false;
        confirmOverlay.classList.add('hidden');
    } else if (selectionMode) {
        exitSelectionMode();
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
        || !urlaubConfirmOverlay.classList.contains('hidden')
        || !exportOverlay.classList.contains('hidden')
        || !printOverlay.classList.contains('hidden')) {
        return;
    }
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
        return;
    }
    shiftPeriod(e.key === 'ArrowLeft' ? -1 : 1);
});

document.addEventListener('keydown', function (e) {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod || e.altKey) {
        return;
    }
    const istZ = e.key === 'z' || e.key === 'Z';
    const istY = e.key === 'y' || e.key === 'Y';
    if (!istZ && !istY) {
        return;
    }
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
        return;
    }
    if (istZ && !e.shiftKey) {
        if (!undoStack.length) {
            return;
        }
        e.preventDefault();
        performUndo();
    } else {
        if (!redoStack.length) {
            return;
        }
        e.preventDefault();
        performRedo();
    }
});

document.getElementById('printButton').addEventListener('click', openPrintView);
document.getElementById('printOk').addEventListener('click', generatePrintDocument);
document.getElementById('printCancel').addEventListener('click', closePrintView);
printOverlay.addEventListener('click', function (e) {
    if (e.target === printOverlay) {
        closePrintView();
    }
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
    if (suppressClick || e.button !== 0) {
        return;
    }
    const cell = e.target.closest('.day[data-date]');
    if (!cell) {
        return;
    }
    if (selectionMode || e.shiftKey || e.ctrlKey || e.metaKey) {
        if (!selectionMode) {
            startSelectionMode();
        }
        toggleSelection(cell.getAttribute('data-date'), cell);
        return;
    }
    hideDayTip();
    openDialog(cell.getAttribute('data-date'));
}

function gridContext(e) {
    e.preventDefault();
    if (Date.now() - lastLongPress < 700) {
        return;
    }
    hideDayTip();
    const cell = e.target.closest('.day[data-date]');
    if (!cell) {
        return;
    }
    quickShow(cell.getAttribute('data-date'), e.clientX, e.clientY);
}

// ---------- Touch: Long-Press öffnet Schnellmenü ----------

const IS_TOUCH = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
let suppressClick = false;
let lastLongPress = 0;

function bindLongPress(el, resolver) {
    if (!IS_TOUCH) {
        return;
    }
    let timer = null;
    let startX = 0;
    let startY = 0;
    el.addEventListener('touchstart', function (e) {
        if (e.touches.length !== 1) {
            return;
        }
        const t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
        const fire = resolver(e);
        if (!fire) {
            return;
        }
        timer = setTimeout(function () {
            timer = null;
            hideDayTip();
            quickHide();
            chipMenu.classList.add('hidden');
            lastLongPress = Date.now();
            suppressClick = true;
            setTimeout(function () { suppressClick = false; }, 500);
            fire(startX, startY);
        }, 500);
    }, { passive: true });
    el.addEventListener('touchmove', function (e) {
        if (!timer) {
            return;
        }
        const t = e.touches[0];
        if (Math.abs(t.clientX - startX) > 10 || Math.abs(t.clientY - startY) > 10) {
            clearTimeout(timer);
            timer = null;
        }
    }, { passive: true });
    const cancel = function () {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    };
    el.addEventListener('touchend', cancel);
    el.addEventListener('touchcancel', cancel);
}

bindLongPress(heroEl, function (e) {
    const cell = e.target.closest('.day[data-date]');
    return cell ? function (x, y) { quickShow(cell.getAttribute('data-date'), x, y); } : null;
});
bindLongPress(yearGridEl, function (e) {
    const cell = e.target.closest('.day[data-date]');
    return cell ? function (x, y) { quickShow(cell.getAttribute('data-date'), x, y); } : null;
});
bindLongPress(legendEl, function (e) {
    const chip = e.target.closest('.chip[data-filter]');
    return chip ? function () {
        showChipMenu(chip.getAttribute('data-filter'), chip.getBoundingClientRect());
    } : null;
});

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
    if (Date.now() - lastLongPress < 700) {
        return;
    }
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
    const fileFormat = exportFileFormat.value;
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
    const fileBase = baseLabel.replace(/\s+/g, '') + '_' + range.start + '_bis_' + range.end;
    let content;
    let mimeType;
    let ext;

    if (fileFormat === 'json') {
        const data = entries.map(function (e) {
            const obj = { date: e.iso };
            if (isBooked && e.label) {
                obj.label = e.label;
            }
            return obj;
        });
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        ext = 'json';
    } else if (fileFormat === 'csv') {
        const rows = isBooked ? ['Datum,Art'] : ['Datum'];
        for (const e of entries) {
            if (isBooked) {
                rows.push(e.iso + ',' + e.label);
            } else {
                rows.push(e.iso);
            }
        }
        content = rows.join('\n');
        mimeType = 'text/csv;charset=utf-8';
        ext = 'csv';
    } else {
        let header = baseLabel;
        if (exportKind === 'URLAUB') {
            header += ' (' + entries.length + (entries.length === 1 ? ' Tag' : ' Tage') + ')';
        }
        const lines = entries.map(function (e) {
            return formatExportDate(e.iso, mode) + (isBooked && e.label ? ' · ' + e.label : '');
        });
        content = header + '\n' + lines.join('\n');
        mimeType = 'text/plain;charset=utf-8';
        ext = 'txt';
    }

    const blob = new Blob([content], { type: mimeType });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileBase + '.' + ext;
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

backupOk.addEventListener('click', exportBackupAs);
backupCancel.addEventListener('click', function () {
    backupOverlay.classList.add('hidden');
});
backupOverlay.addEventListener('click', function (e) {
    if (e.target === backupOverlay) {
        backupOverlay.classList.add('hidden');
    }
});

// ---------- Druckansicht / PDF (Anwesenheitsübersicht) ----------

const WOCHENTAGE_KURZ = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const BL_NAMES = {
    BW: 'Baden-Württemberg', BY: 'Bayern', BE: 'Berlin', BB: 'Brandenburg',
    HB: 'Bremen', HH: 'Hamburg', HE: 'Hessen', MV: 'Mecklenburg-Vorpommern',
    NI: 'Niedersachsen', NW: 'Nordrhein-Westfalen', RP: 'Rheinland-Pfalz',
    SL: 'Saarland', SN: 'Sachsen', ST: 'Sachsen-Anhalt', SH: 'Schleswig-Holstein',
    TH: 'Thüringen'
};

function formatDeDate(iso) {
    const d = parseISO(iso);
    return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
}

function buildPrintDocument(rangeStart, rangeEnd, artFilter) {    const start = parseISO(rangeStart);
    const end = parseISO(rangeEnd);
    const today = fmt(new Date());
    const jahr = new Date().getFullYear();

    const counts = {};
    let urlaubGenommen = 0;
    let urlaubGeplant = 0;
    let krankJahr = 0;
    for (const iso of Object.keys(days)) {
        if (parseISO(iso).getFullYear() === jahr && days[iso] === 'KRANKHEIT') {
            krankJahr++;
        }
    }

    const zeigebuchtSpalte = !artFilter.length || artFilter.indexOf('BUEROTAG') !== -1;

    const monate = [];
    for (let m = new Date(start.getFullYear(), start.getMonth(), 1); m <= end; m.setMonth(m.getMonth() + 1)) {
        const monatStart = new Date(Math.max(m.getTime(), start.getTime()));
        const monatEnd = new Date(Math.min(new Date(m.getFullYear(), m.getMonth() + 1, 0).getTime(), end.getTime()));
        const zeilen = [];
        for (let d = new Date(monatStart); d <= monatEnd; d.setDate(d.getDate() + 1)) {
            if (isWeekend(d)) {
                continue;
            }
            const iso = fmt(d);
            const t = getDayType(iso);
            if (!t && window.Feiertage && Feiertage.istSonderfrei(iso)) {
                continue;
            }
            if (artFilter.length && artFilter.indexOf(t) === -1) {
                continue;
            }
            if (t === 'URLAUB') {
                if (iso < today) {
                    urlaubGenommen++;
                } else if (iso > today) {
                    urlaubGeplant++;
                }
            }
            if (t) {
                counts[t] = (counts[t] || 0) + 1;
            }
            const typeDef = t ? WORK_TYPES.find(function (x) { return x.key === t; }) : null;
            let art;
            if (typeDef) {
                art = '<span class="swatch" style="background:' + typeDef.color + '"></span>'
                    + typeDef.label
                    + (t === 'FEIERTAG' && window.Feiertage && Feiertage.getName(iso) ? ' – ' + Feiertage.getName(iso) : '');
            } else {
                art = '<span class="leer">– nicht erfasst –</span>';
            }
            const zeigeHaken = t === 'BUEROTAG' && gebucht[iso];
            zeilen.push('<tr>'
                + '<td>' + formatDeDate(iso) + '</td>'
                + '<td>' + WOCHENTAGE_KURZ[d.getDay()] + '</td>'
                + '<td>' + art + '</td>'
                + (zeigebuchtSpalte ? '<td class="center">' + (zeigeHaken ? '✓' : '') + '</td>' : '')
                + '</tr>');
        }
        if (!artFilter.length || zeilen.length) {
            monate.push({ name: m.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }), zeilen: zeilen.join('\n') });
        }
    }

    if (artFilter.length && !monate.length) {
        return null;
    }

    const summaryRows = WORK_TYPES.filter(function (t) {
        return !artFilter.length || artFilter.indexOf(t.key) !== -1;
    }).map(function (t) {
        const n = counts[t.key] || 0;
        let hinweis = '';
        if (t.key === 'URLAUB') {
            hinweis = 'davon genommen: ' + urlaubGenommen + ' · geplant: ' + urlaubGeplant
                + ' · Kontingent: ' + urlaubTotal;
        } else if (t.key === 'KRANKHEIT') {
            hinweis = 'im Kalenderjahr ' + jahr + ': ' + krankJahr;
        }
        return '<tr>'
            + '<td><span class="swatch" style="background:' + t.color + '"></span>' + t.label + '</td>'
            + '<td class="center">' + n + '</td>'
            + '<td>' + hinweis + '</td>'
            + '</tr>';
    }).join('\n');

    const monatsTabellen = monate.map(function (mo) {
        return '<h3>' + mo.name + '</h3>\n'
            + '<table>\n'
            + (zeigebuchtSpalte
                ? '<colgroup><col style="width:21%"><col style="width:10%"><col style="width:57%"><col style="width:12%"></colgroup>\n'
                  + '<thead><tr><th>Datum</th><th>Tag</th><th>Anwesenheit</th><th>gebucht</th></tr></thead>\n'
                : '<colgroup><col style="width:21%"><col style="width:10%"><col style="width:69%"></colgroup>\n'
                  + '<thead><tr><th>Datum</th><th>Tag</th><th>Anwesenheit</th></tr></thead>\n')
            + '<tbody>\n' + mo.zeilen + '\n</tbody>\n</table>';
    }).join('\n');

    const blName = BL_NAMES[window.Feiertage && Feiertage.getBundesland()] || '';
    let artenLabel = '';
    if (artFilter.length) {
        artenLabel = ' &middot; Arten: ' + WORK_TYPES.filter(function (t) {
            return artFilter.indexOf(t.key) !== -1;
        }).map(function (t) { return t.label; }).join(', ');
    }
    return '<!DOCTYPE html>\n<html lang="de">\n<head>\n<meta charset="UTF-8">\n'
        + '<title>Anwesenheitsübersicht ' + rangeStart + '_bis_' + rangeEnd + '</title>\n'
        + '<style>\n'
        + '@page { size: A4; margin: 15mm; }\n'
        + 'body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #111; font-size: 10.5pt; line-height: 1.4; margin: 0 auto; max-width: 180mm; padding: 12px; }\n'
        + 'h1 { font-size: 17pt; margin: 0 0 2px; }\n'
        + 'h2 { font-size: 13pt; margin: 18px 0 6px; border-bottom: 1px solid #999; padding-bottom: 2px; }\n'
        + 'h3 { font-size: 11pt; margin: 14px 0 4px; page-break-after: avoid; }\n'
        + '.meta { color: #444; margin: 0 0 10px; }\n'
        + '@media print { body { padding: 0; } }\n'
        + 'table { width: 100%; border-collapse: collapse; page-break-inside: auto; table-layout: fixed; }\n'
        + 'th, td { border: 1px solid #999; padding: 2.5px 6px; text-align: left; font-size: 9pt; }\n'
        + 'th { background: #ECECEC; }\n'
        + '.center { text-align: center; }\n'
        + '.swatch { display: inline-block; width: 9px; height: 9px; border: 1px solid #666; margin-right: 5px; vertical-align: baseline; }\n'
        + '.leer { color: #888; font-style: italic; }\n'
        + 'thead { display: table-header-group; }\n'
        + '</style>\n</head>\n<body>\n'
        + '<h1>Anwesenheits&uuml;bersicht</h1>\n'
        + '<p class="meta">Zeitraum: ' + formatDeDate(rangeStart) + ' &ndash; ' + formatDeDate(rangeEnd)
        + (blName ? ' &middot; Bundesland: ' + blName : '')
        + ' &middot; Erstellt am ' + formatDeDate(today) + artenLabel + '</p>\n'
        + '<h2>Zusammenfassung</h2>\n'
        + '<table>\n'
        + '<colgroup><col style="width:28%"><col style="width:17%"><col style="width:55%"></colgroup>\n'
        + '<thead><tr><th>Art</th><th>Tage im Zeitraum</th><th>Hinweis</th></tr></thead>\n'
        + '<tbody>\n' + summaryRows + '\n</tbody>\n</table>\n'
        + '<h2>Monatsdetails</h2>\n'
        + monatsTabellen + '\n'
        + '</body>\n</html>';
}

function openPrintView() {
    quickMenu.classList.add('hidden');
    chipMenu.classList.add('hidden');
    fillPeriodSelects();
    selectPeriod('month');
    resetPrintArts();
    printOverlay.classList.remove('hidden');
}

function fillPrintArts() {
    printArtTypes.innerHTML = '<button type="button" class="pa-chip active" data-art="">Alle</button>'
        + WORK_TYPES.map(function (t) {
            return '<button type="button" class="pa-chip" data-art="' + t.key + '">'
                + '<span class="sw" style="background:' + t.color + '"></span>' + t.label
                + '</button>';
        }).join('');
}

function resetPrintArts() {
    printArtTypes.querySelectorAll('.pa-chip').forEach(function (chip) {
        chip.classList.toggle('active', !chip.getAttribute('data-art'));
    });
}

function selectedPrintArts() {
    const arts = [];
    printArtTypes.querySelectorAll('.pa-chip.active').forEach(function (chip) {
        const v = chip.getAttribute('data-art');
        if (v) {
            arts.push(v);
        }
    });
    return arts;
}

/* --- Zeitraum-Auswahl (Druck-Dialog) --- */

function fillPeriodSelects() {
    const now = new Date();
    const monate = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    printMonthSelect.innerHTML = monate.map(function (name, i) {
        return '<option value="' + (i + 1) + '"' + (i === now.getMonth() ? ' selected' : '') + '>' + name + '</option>';
    }).join('');
    var aktQ = Math.floor(now.getMonth() / 3) + 1;
    printQuarterSelect.innerHTML = [1, 2, 3, 4].map(function (q) {
        return '<option value="' + q + '"' + (q === aktQ ? ' selected' : '') + '>Q' + q + '</option>';
    }).join('');
}

function setPrintDates(startISO, endISO) {
    printStart.value = startISO;
    printEnd.value = endISO;
}

function applyPeriodSelection(type) {
    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth();
    function firstOf(y, mo) { return y + '-' + pad(mo + 1) + '-01'; }
    function lastOf(y, mo) { return new Date(y, mo + 1, 0).getFullYear() + '-' + pad(new Date(y, mo + 1, 0).getMonth() + 1) + '-' + pad(new Date(y, mo + 1, 0).getDate()); }

    if (type === 'month') {
        setPrintDates(firstOf(y, m), lastOf(y, m));
    } else if (type === 'monthSelect') {
        var sm = parseInt(printMonthSelect.value, 10) - 1;
        setPrintDates(firstOf(y, sm), lastOf(y, sm));
    } else if (type === 'quarterSelect') {
        var q = parseInt(printQuarterSelect.value, 10);
        var qm = (q - 1) * 3;
        setPrintDates(firstOf(y, qm), lastOf(y, qm + 2));
    } else if (type === 'year') {
        setPrintDates(y + '-01-01', y + '-12-31');
    }
}

function selectPeriod(type) {
    var now = new Date();
    printPeriod.querySelectorAll('.pa-chip').forEach(function (c) {
        c.classList.toggle('active', c.getAttribute('data-period') === type);
    });
    if (type === 'monthSelect') {
        printMonthSelect.value = String(now.getMonth() + 1);
    }
    if (type === 'quarterSelect') {
        printQuarterSelect.value = String(Math.floor(now.getMonth() / 3) + 1);
    }
    printMonthSelect.classList.toggle('hidden', type !== 'monthSelect');
    printQuarterSelect.classList.toggle('hidden', type !== 'quarterSelect');
    applyPeriodSelection(type);
}

printPeriod.addEventListener('click', function (e) {
    var chip = e.target.closest('.pa-chip');
    if (!chip) {
        return;
    }
    selectPeriod(chip.getAttribute('data-period'));
});

printMonthSelect.addEventListener('change', function () {
    applyPeriodSelection('monthSelect');
});

printQuarterSelect.addEventListener('change', function () {
    applyPeriodSelection('quarterSelect');
});

printArtTypes.addEventListener('click', function (e) {
    const chip = e.target.closest('.pa-chip');
    if (!chip) {
        return;
    }
    if (!chip.getAttribute('data-art')) {
        resetPrintArts();
        return;
    }
    chip.classList.toggle('active');
    const alleChip = printArtTypes.querySelector('.pa-chip[data-art=""]');
    if (alleChip) {
        alleChip.classList.toggle('active', !printArtTypes.querySelector('.pa-chip.active[data-art]'));
    }
});

function closePrintView() {
    printOverlay.classList.add('hidden');
}

function generatePrintDocument() {
    if (!isValidISODate(printStart.value) || !isValidISODate(printEnd.value)) {
        alert('Bitte gültiges Start- und Enddatum wählen.');
        return;
    }
    if (printEnd.value < printStart.value) {
        alert('Das Enddatum liegt vor dem Startdatum.');
        return;
    }
    closePrintView();
    quickMenu.classList.add('hidden');
    chipMenu.classList.add('hidden');
    const html = buildPrintDocument(printStart.value, printEnd.value, selectedPrintArts());
    if (!html) {
        alert('Keine Einträge der gewählten Art(en) im gewählten Zeitraum.');
        return;
    }
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    setTimeout(function () {
        URL.revokeObjectURL(url);
    }, 60000);
    if (!win) {
        alert('Das Druckdokument konnte nicht geöffnet werden. Bitte Popups für diese App zulassen.');
        return;
    }
    if (!IS_TOUCH) {
        win.addEventListener('load', function () {
            try {
                win.focus();
                win.print();
            } catch (e) {}
        });
    }
}

// ---------- Tag-Kontextmenü (Rechtsklick) ----------

let quickIso = null;
let quickPos = null;
const dayTip = document.getElementById('dayTip');

function showDayTip(e) {
    if (selectionMode) {
        return;
    }
    const emptyBadge = e.target.closest('.cell-empty');
    if (emptyBadge) {
        const rect = emptyBadge.getBoundingClientRect();
        dayTip.innerHTML = 'Diesem Tag sollte eine<br>Anwesenheitsart zugeordnet werden.';
        dayTip.classList.remove('hidden');
        const tipW = dayTip.offsetWidth;
        const tipH = dayTip.offsetHeight;
        let left = rect.left + rect.width / 2 - tipW / 2;
        let top = rect.top - tipH - 6;
        if (top < 8) top = rect.bottom + 6;
        dayTip.style.left = Math.max(8, Math.min(left, window.innerWidth - tipW - 8)) + 'px';
        dayTip.style.top = Math.max(8, Math.min(top, window.innerHeight - tipH - 8)) + 'px';
        return;
    }
    const cell = e.target.closest('.day[data-date]');
    const chip = cell ? null : e.target.closest('.chip[data-filter]');
    const quota = (!cell && !chip) ? e.target.closest('.quota-input') : null;
    const btn = (!cell && !chip && !quota) ? e.target.closest('#exportButton, #importButton, #printButton') : null;
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
            const sonderfrei = window.Feiertage && Feiertage.istSonderfrei(iso);
            const label = sonderfrei ? 'Arbeitsfrei' : (WORK_TYPES.find(t => t.key === type) || {}).label;
            html += '<div class="day-tip-type">- ' + label + ' -</div>';
            if ((!manualType || manualType === 'FEIERTAG') && window.Feiertage && !sonderfrei) {
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
        html = (btn.id === 'exportButton' ? 'Backup exportieren'
            : btn.id === 'importButton' ? 'Backup importieren' : 'Übersicht drucken / PDF')
            + '<div class="day-tip-hints">' + (btn.id === 'exportButton'
                ? 'Aktuelle Daten als Backup-Datei herunterladen.'
                : btn.id === 'importButton'
                    ? 'Backup-Datei importieren (überschreibt aktuelle Daten).'
                    : 'Anwesenheitsübersicht mit frei wählbarem Zeitraum als Druckdokument/PDF erstellen.') + '</div>';
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
    quickMenu.classList.remove('hidden');
    const menuW = quickMenu.offsetWidth;
    const menuH = quickMenu.offsetHeight;
    let left = x + 4;
    let top = y + 4;
    if (left + menuW > window.innerWidth - 8) {
        left = window.innerWidth - menuW - 8;
    }
    if (top + menuH > window.innerHeight - 8) {
        top = window.innerHeight - menuH - 8;
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
    html += '<button type="button" class="qm-item" data-set="__multiselect__">'
        + '<span class="qm-icon">🗂️</span>Mehrfachauswahl…</button>';
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
    } else {
        quickMenu.classList.remove('hidden');
    }
}

quickMenu.addEventListener('click', function (e) {
    const item = e.target.closest('.qm-item[data-set]');
    if (!item || !quickIso) {
        return;
    }
    const set = item.getAttribute('data-set');
    const iso = quickIso;
    if (set === '__delete__') {
        beginChange();
        delete days[iso];
        delete gebucht[iso];
        saveDays();
        saveGebucht();
        quickHide();
        render();
        showUndoable('Eintrag gelöscht');
    } else if (set === '__edit__') {
        quickHide();
        openDialog(iso);
    } else if (set === '__multiselect__') {
        quickHide();
        startSelectionMode();
        selection.add(iso);
        updateSelectionBar();
        renderMonths();
    } else if (set === '__gebucht__') {
        beginChange();
        if (gebucht[iso]) {
            delete gebucht[iso];
        } else {
            gebucht[iso] = true;
        }
        saveGebucht();
        quickShow(iso, quickPos.x, quickPos.y);
        render();
        showUndoable('Gespeichert ✓');
    } else {
        beginChange();
        days[iso] = set;
        saveDays();
        quickHide();
        render();
        showUndoable('Gespeichert ✓');
    }
});

// ---------- Mehrfachauswahl ----------

const selectionDeleteButton = document.getElementById('selectionDelete');
const selectionCancelButton = document.getElementById('selectionCancel');

function startSelectionMode() {
    selectionMode = true;
    hideDayTip();
    quickHide();
    chipMenu.classList.add('hidden');
    updateSelectionBar();
}

function exitSelectionMode() {
    selectionMode = false;
    selection.clear();
    document.querySelectorAll('.day.selected').forEach(function (el) {
        el.classList.remove('selected');
    });
    selectionBar.classList.add('hidden');
}

function toggleSelection(iso, cellEl) {
    if (selection.has(iso)) {
        selection.delete(iso);
        if (cellEl) {
            cellEl.classList.remove('selected');
        }
    } else {
        selection.add(iso);
        if (cellEl) {
            cellEl.classList.add('selected');
        }
    }
    updateSelectionBar();
}

function updateSelectionBar() {
    if (!selectionMode) {
        selectionBar.classList.add('hidden');
        return;
    }
    selectionBar.classList.remove('hidden');
    selectionInfo.textContent = selection.size === 0
        ? 'Mehrfachauswahl: Tage antippen'
        : selection.size + ' Tag' + (selection.size > 1 ? 'e' : '') + ' ausgewählt';
    selectionDeleteButton.classList.toggle('hidden', selection.size === 0);
}

function fillSelectionTypes() {
    selectionTypesEl.innerHTML = WORK_TYPES.map(function (t) {
        return '<button type="button" class="sb-type" data-sbtype="' + t.key + '">'
            + '<span class="sw" style="background:' + t.color + '"></span>'
            + '<span class="chip-icon">' + TYPE_ICONS[t.key] + '</span>' + t.label
            + '</button>';
    }).join('');
}

selectionTypesEl.addEventListener('click', function (e) {
    const item = e.target.closest('[data-sbtype]');
    if (!item || selection.size === 0) {
        return;
    }
    const type = item.getAttribute('data-sbtype');
    beginChange();
    for (const iso of selection) {
        days[iso] = type;
        if (type !== 'BUEROTAG') {
            delete gebucht[iso];
        }
    }
    saveDays();
    saveGebucht();
    const n = selection.size;
    exitSelectionMode();
    render();
    showUndoable(n + ' Tag' + (n > 1 ? 'e' : '') + ' gesetzt ✓');
});

selectionDeleteButton.addEventListener('click', function () {
    if (selection.size === 0) {
        return;
    }
    confirmText.innerHTML = 'Einträge in <b>' + selection.size + '</b> ausgewählten Tag(en) löschen?';
    pendingDelete = null;
    pendingSelectionDelete = true;
    confirmOverlay.classList.remove('hidden');
});

selectionCancelButton.addEventListener('click', exitSelectionMode);

if (!IS_TOUCH) {
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
}

document.addEventListener('click', function (e) {
    if (suppressClick) {
        return;
    }
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

    // Bundesland-Dropdown füllen
    var blSelect = document.getElementById('blSelect');
    var BL_NAMES = {
        BW: 'Baden-Württemberg', BY: 'Bayern', BE: 'Berlin', BB: 'Brandenburg',
        HB: 'Bremen', HH: 'Hamburg', HE: 'Hessen', MV: 'Mecklenburg-Vorpommern',
        NI: 'Niedersachsen', NW: 'Nordrhein-Westfalen', RP: 'Rheinland-Pfalz',
        SL: 'Saarland', SN: 'Sachsen', ST: 'Sachsen-Anhalt', SH: 'Schleswig-Holstein',
        TH: 'Thüringen'
    };
    Feiertage.BL_REIHENFOLGE.forEach(function (bl) {
        var opt = document.createElement('option');
        opt.value = bl;
        opt.textContent = BL_NAMES[bl] || bl;
        blSelect.appendChild(opt);
    });
    blSelect.value = Feiertage.getBundesland();
    document.getElementById('sonderfreiCheck').checked = Feiertage.getSonderfrei();

    blSelect.addEventListener('change', function () {
        Feiertage.setBundesland(blSelect.value);
        var n = syncFeiertagDays();
        render();
        if (n > 0) showToast(n + ' Feiertag' + (n > 1 ? 'e' : '') + ' angepasst');
    });
    document.getElementById('sonderfreiCheck').addEventListener('change', function (e) {
        Feiertage.setSonderfrei(e.target.checked);
        var n = syncFeiertagDays();
        render();
        if (n > 0) showToast(n + ' Feiertag' + (n > 1 ? 'e' : '') + ' angepasst');
    });

    populateQuick();
    fillTypeSelect();
    fillSelectionTypes();
    fillPrintArts();
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
    updateExportHint();
}

init();
