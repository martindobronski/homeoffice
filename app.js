'use strict';

let urlaubTotal = 30;

const WORK_TYPES = [
    { key: 'BUEROTAG', label: 'Bürotag', color: '#2D6A4F' },
    { key: 'HOMEOFFICE', label: 'Homeoffice', color: '#8A8471' },
    { key: 'FREIZEITTAG', label: 'Freizeittag', color: '#B9791E' },
    { key: 'DIENSTREISE', label: 'Dienstreise', color: '#6B5CA5' },
    { key: 'FEIERTAG', label: 'Feiertag', color: '#4C7EA8' },
    { key: 'KRANKHEIT', label: 'Krankheit', color: '#B23A48' },
    { key: 'URLAUB', label: 'Urlaub', color: '#867F70' }
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

const DAYS_KEY = 'homeoffice.days';
const PERIOD_KEY = 'homeoffice.period';
const URLAUB_KEY = 'homeoffice.urlaub';

let days = {};
let periodStart;
let periodEnd;
let dialogOrigDate = null;
let activeFilter = null;

const startPicker = document.getElementById('startPicker');
const endPicker = document.getElementById('endPicker');
const monthBox = document.getElementById('monthBox');
const yearBox = document.getElementById('yearBox');
const applyButton = document.getElementById('applyButton');

const heroEl = document.getElementById('hero');
const heroTitleEl = document.getElementById('heroTitle');
const yearGridEl = document.getElementById('yearGrid');
const legendEl = document.getElementById('legend');
const dashboardTitle = document.getElementById('dashboardTitle');

const overlay = document.getElementById('modalOverlay');
const dialogTitle = document.getElementById('dialogTitle');
const dialogDate = document.getElementById('dialogDate');
const dialogType = document.getElementById('dialogType');
const dialogDelete = document.getElementById('dialogDelete');

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

function loadPeriod() {
    let s = null;
    let e = null;
    try {
        const p = JSON.parse(storeGet(PERIOD_KEY));
        s = p.start;
        e = p.end;
    } catch (err) {
        // ignore
    }
    const defaultStart = fmt(new Date(new Date().getFullYear(), 0, 1));
    if (!s || !e || s > e) {
        periodStart = defaultStart;
        periodEnd = add12mMinusDay(defaultStart);
    } else {
        periodStart = s;
        periodEnd = e;
    }
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
        return { days: data.days, period: data.period };
    }
    return { days: csvToDays(text), period: null };
}

function exportBackup() {
    const data = {
        days: days,
        period: { start: periodStart, end: periodEnd }
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
            if (data.period && data.period.start && data.period.end) {
                periodStart = data.period.start;
                periodEnd = data.period.end;
                savePeriod();
            }
            saveDays();
            populateQuick();
            syncPickers();
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
    for (const iso of Object.keys(days)) {
        const d = parseISO(iso);
        if (d.getFullYear() !== year || d.getMonth() !== month - 1) {
            continue;
        }
        if (isWeekend(d)) {
            continue;
        }
        const t = days[iso];
        recorded[t] = (recorded[t] || 0) + 1;
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
    let maxYear = now.getFullYear() + 1;
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
    syncPickers();
    savePeriod();
    render();
}

function syncPickers() {
    startPicker.value = periodStart;
    endPicker.value = periodEnd;
}

function onStartChange() {
    if (!startPicker.value) {
        return;
    }
    periodStart = startPicker.value;
    periodEnd = add12mMinusDay(periodStart);
    endPicker.value = periodEnd;
    savePeriod();
    render();
}

function onEndChange() {
    if (!endPicker.value) {
        return;
    }
    periodEnd = endPicker.value;
    if (periodEnd < periodStart) {
        periodStart = periodEnd;
        startPicker.value = periodStart;
    }
    savePeriod();
    render();
}

// ---------- KPI-Karten ----------

function kpiCard(label, value, sub, pct, color) {
    return '<div class="kpi-card">'
        + '<div class="ring-wrap">'
        + '<div class="ring" style="--pct:' + pct + ';--ring-color:' + color + '"></div>'
        + '<div class="ring-pct" style="color:' + color + '">' + pct + '%</div>'
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
    let html = '';
    if (basis > 0) {
        const officePct = Math.round(q.office * 100 / basis);
        const homeofficePct = Math.round(q.homeoffice * 100 / basis);
        html += kpiCard('Büroquote', q.office + ' / ' + basis, 'Ist-Anwesenheit im Büro', officePct, '#2D6A4F');
        html += kpiCard('Homeoffice-Quote', q.homeoffice + ' / ' + basis, 'Ist-Anwesenheit remote', homeofficePct, '#8A8471');
    } else {
        html += kpiCard('Büroquote', '–', 'keine vollständigen Monate', 0, '#2D6A4F');
        html += kpiCard('Homeoffice-Quote', '–', 'keine vollständigen Monate', 0, '#8A8471');
    }
    const now = new Date();
    const st = monthStat(now.getFullYear(), now.getMonth() + 1);
    const monatName = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('de-DE', { month: 'long' });
    const pflichtPct = st.pflicht > 0 ? Math.round(st.office / st.pflicht * 100) : 0;
    html += kpiCard('Büropflicht (' + monatName + ')', st.office + ' / ' + st.pflicht + ' Tage',
        'Bürotage erfasst', pflichtPct, '#2D6A4F');
    let urlaubYear = 0;
    for (const iso of Object.keys(days)) {
        if (parseISO(iso).getFullYear() === now.getFullYear() && days[iso] === 'URLAUB') {
            urlaubYear++;
        }
    }
    const urlaubPct = urlaubTotal > 0 ? Math.round(urlaubYear / urlaubTotal * 100) : 0;
    html += kpiCard('Urlaub (' + now.getFullYear() + ')', urlaubYear + ' / ' + urlaubTotal + ' Tage',
        'Kontingent verbraucht', urlaubPct, '#867F70');
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
        cells.push({ row: row, col: col, day: d, iso: fmt(new Date(year, month - 1, d)), type: days[fmt(new Date(year, month - 1, d))] });
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
            const dayTitle = parseISO(cell.iso).toLocaleDateString('de-DE',
                { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
            html += '<div class="day ' + (cls || (future ? 'future' : '')) + filter + '"'
                + ' data-date="' + cell.iso + '"'
                + ' title="' + dayTitle + '">'
                + cell.day + '</div>';
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
        + '<div class="n">' + st.office + ' / ' + st.pflicht + '</div>'
        + '<div class="l">Bürotage (Soll)</div>'
        + '<div class="progress-bar" style="width:120px"><div style="width:' + pct + '%"></div></div>'
        + '</div>'
        + '</div>'
        + '</div>'
        + renderCalGrid(year, month);
}

function cardHTML(year, month) {
    const st = monthStat(year, month);
    const pct = st.pflicht > 0 ? Math.round(st.office / st.pflicht * 100) : 0;
    return '<div class="month-card">'
        + '<div class="m-head">'
        + '<h4>' + monthName(year, month) + '</h4>'
        + '<span>' + st.office + '/' + st.pflicht + '</span>'
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
            cards += cardHTML(y, m);
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
    for (const iso of Object.keys(days)) {
        const d = parseISO(iso);
        if (d < start || d > end) {
            continue;
        }
        counts[days[iso]] = (counts[days[iso]] || 0) + 1;
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
        const title = activeFilter === t.key
            ? 'Filter aufheben (alle anzeigen)'
            : 'Nur „' + t.label + '“ anzeigen';
        return '<button type="button" class="chip' + active + '"'
            + ' data-filter="' + t.key + '"'
            + ' title="' + title + '">'
            + '<span class="sw" style="background:' + t.color + '"></span>'
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
    dialogTitle.textContent = existing ? 'Eintrag bearbeiten' : 'Eintrag hinzufügen';
    dialogDate.value = iso;
    dialogType.value = existing || 'HOMEOFFICE';
    dialogDelete.classList.toggle('hidden', !existing);
    overlay.classList.remove('hidden');
}

function closeDialog() {
    overlay.classList.add('hidden');
    dialogOrigDate = null;
}

document.getElementById('dialogOk').addEventListener('click', function () {
    const newDate = dialogDate.value;
    const type = dialogType.value;
    if (!newDate) {
        alert('Bitte ein Datum wählen.');
        return;
    }
    if (dialogOrigDate !== newDate && days[newDate]) {
        alert('Für dieses Datum existiert bereits ein Eintrag.');
        return;
    }
    if (dialogOrigDate !== newDate && days[dialogOrigDate]) {
        delete days[dialogOrigDate];
    }
    days[newDate] = type;
    saveDays();
    closeDialog();
    render();
});

dialogDelete.addEventListener('click', function () {
    if (!confirm('Eintrag vom ' + dialogDate.value + ' löschen?')) {
        return;
    }
    delete days[dialogOrigDate];
    saveDays();
    closeDialog();
    render();
});

document.getElementById('dialogCancel').addEventListener('click', closeDialog);
overlay.addEventListener('click', function (e) {
    if (e.target === overlay) {
        closeDialog();
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

document.getElementById('urlaubApply').addEventListener('click', function () {
    const v = parseInt(document.getElementById('urlaubInput').value, 10);
    if (!Number.isFinite(v) || v < 0) {
        alert('Bitte eine gültige Anzahl Urlaubstage eingeben.');
        return;
    }
    urlaubTotal = v;
    saveUrlaub();
    render();
});

// ---------- Ereignis-Delegation ----------

function gridClick(e) {
    const cell = e.target.closest('.day[data-date]');
    if (cell) {
        openDialog(cell.getAttribute('data-date'));
    }
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

// ---------- Initialisierung ----------

function render() {
    dashboardTitle.textContent = 'Anwesenheits-Dashboard ' + parseISO(periodStart).getFullYear();
    syncQuickSelection();
    renderKpis();
    renderMonths();
    renderLegend();
}

function init() {
    loadDays();
    loadPeriod();
    loadUrlaub();
    document.getElementById('urlaubInput').value = urlaubTotal;
    populateQuick();
    fillTypeSelect();
    syncPickers();
    applyButton.addEventListener('click', applyQuickSelection);
    startPicker.addEventListener('change', onStartChange);
    endPicker.addEventListener('change', onEndChange);
    heroEl.addEventListener('click', gridClick);
    yearGridEl.addEventListener('click', gridClick);
    render();
}

init();
