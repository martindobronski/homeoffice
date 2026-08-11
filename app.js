'use strict';

let urlaubTotal = 30;

const WORK_TYPES = [
    { key: 'BUEROTAG', label: 'Bürotag', color: '#5B9E64' },
    { key: 'HOMEOFFICE', label: 'Homeoffice', color: '#F2F0E9' },
    { key: 'FREIZEITTAG', label: 'Freizeittag', color: '#D9A96F' },
    { key: 'DIENSTREISE', label: 'Dienstreise', color: '#8FA8C9' },
    { key: 'FEIERTAG', label: 'Feiertag', color: '#93C5C0' },
    { key: 'KRANKHEIT', label: 'Krankheit', color: '#C0392B' },
    { key: 'URLAUB', label: 'Urlaub', color: '#9B7FBB' }
];

const COLOR = Object.fromEntries(WORK_TYPES.map(t => [t.key, t.color]));
const GRAY = '#B0B0B0';
const TYPE_ICONS = {
    BUEROTAG: '🏢',
    HOMEOFFICE: '🏠',
    FREIZEITTAG: '🏃',
    DIENSTREISE: '✈️',
    FEIERTAG: '🎉',
    KRANKHEIT: '⚕️',
    URLAUB: '🏖️'
};

const DAYS_KEY = 'homeoffice.days';
const PERIOD_KEY = 'homeoffice.period';
const URLAUB_KEY = 'homeoffice.urlaub';

let days = {};
let periodStart;
let periodEnd;
let dialogOrigDate = null;

const monthsEl = document.getElementById('months');
const startPicker = document.getElementById('startPicker');
const endPicker = document.getElementById('endPicker');
const monthBox = document.getElementById('monthBox');
const yearBox = document.getElementById('yearBox');
const applyButton = document.getElementById('applyButton');

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

function weekdayIndex(d) {
    const w = d.getDay();
    return w === 0 ? 6 : w - 1;
}

function add12mMinusDay(isoStr) {
    const d = parseISO(isoStr);
    return fmt(new Date(d.getFullYear(), d.getMonth() + 12, d.getDate() - 1));
}

// ---------- Speicher ----------

function loadDays() {
    try {
        days = JSON.parse(localStorage.getItem(DAYS_KEY)) || {};
    } catch (e) {
        days = {};
    }
}

function saveDays() {
    localStorage.setItem(DAYS_KEY, JSON.stringify(days));
}

function loadPeriod() {
    let s = null;
    let e = null;
    try {
        const p = JSON.parse(localStorage.getItem(PERIOD_KEY));
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
    localStorage.setItem(PERIOD_KEY, JSON.stringify({ start: periodStart, end: periodEnd }));
}

function loadUrlaub() {
    const v = parseInt(localStorage.getItem(URLAUB_KEY), 10);
    urlaubTotal = (Number.isFinite(v) && v >= 0) ? v : 30;
}

function saveUrlaub() {
    localStorage.setItem(URLAUB_KEY, String(urlaubTotal));
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

function kpiCard(label, value, sub, pct, color) {
    const card = document.createElement('div');
    card.className = 'kpi-card';
    const l = document.createElement('div');
    l.className = 'kpi-label';
    l.textContent = label;
    const v = document.createElement('div');
    v.className = 'kpi-value';
    v.textContent = value;
    const bar = document.createElement('div');
    bar.className = 'kpi-bar';
    const fill = document.createElement('div');
    fill.className = 'kpi-bar-fill';
    fill.style.background = color || '#5B9E64';
    fill.style.width = Math.max(0, Math.min(100, pct)) + '%';
    bar.appendChild(fill);
    const s = document.createElement('div');
    s.className = 'kpi-sub';
    s.textContent = sub;
    card.appendChild(l);
    card.appendChild(v);
    card.appendChild(bar);
    card.appendChild(s);
    return card;
}

function renderKpis() {
    const kpis = document.getElementById('kpis');
    kpis.innerHTML = '';
    const q = periodQuota(periodStart, periodEnd);
    const basis = q.office + q.homeoffice;
    if (basis > 0) {
        const officePct = Math.round(q.office * 100 / basis);
        const homeofficePct = Math.round(q.homeoffice * 100 / basis);
        kpis.appendChild(kpiCard('Büroquote', officePct + ' %', 'Soll 60 %',
            officePct / 60 * 100, '#5B9E64'));
        kpis.appendChild(kpiCard('Homeofficequote', homeofficePct + ' %', 'Soll 40 %',
            homeofficePct / 40 * 100, '#D9A96F'));
    } else {
        kpis.appendChild(kpiCard('Büroquote', '–', 'keine vollständigen Monate', 0, '#5B9E64'));
        kpis.appendChild(kpiCard('Homeofficequote', '–', 'keine vollständigen Monate', 0, '#D9A96F'));
    }
    const now = new Date();
    const st = monthStat(now.getFullYear(), now.getMonth() + 1);
    const monatName = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('de-DE', { month: 'long' });
    const pflichtPct = st.pflicht > 0 ? st.office / st.pflicht * 100 : 0;
    kpis.appendChild(kpiCard('Büropflicht (' + monatName + ')', st.office + ' / ' + st.pflicht + ' Tage',
        'Bürotage erfasst', pflichtPct, '#5B9E64'));
    let urlaubYear = 0;
    for (const iso of Object.keys(days)) {
        if (parseISO(iso).getFullYear() === now.getFullYear() && days[iso] === 'URLAUB') {
            urlaubYear++;
        }
    }
    const urlaubPct = urlaubTotal > 0 ? urlaubYear / urlaubTotal * 100 : 0;
    kpis.appendChild(kpiCard('Urlaub (' + now.getFullYear() + ')', urlaubYear + ' / ' + urlaubTotal + ' Tage',
        'Kontingent', urlaubPct, '#9B7FBB'));
}

// ---------- Monatskalender ----------

function renderMonths() {
    monthsEl.innerHTML = '';
    const start = parseISO(periodStart);
    const end = parseISO(periodEnd);
    const endAnchor = new Date(end.getFullYear(), end.getMonth(), 1);
    const now = new Date();
    let y = start.getFullYear();
    let m = start.getMonth() + 1;
    while (new Date(y, m - 1, 1) <= endAnchor) {
        const focus = y === now.getFullYear() && m === now.getMonth() + 1;
        monthsEl.appendChild(buildMonthPanel(y, m, focus));
        m++;
        if (m === 13) {
            m = 1;
            y++;
        }
    }
}

function buildMonthPanel(year, month, focus) {
    const st = monthStat(year, month);

    const panel = document.createElement('div');
    panel.className = 'month-panel ' + (focus ? 'focus' : 'mini');

    const title = document.createElement('div');
    title.className = 'month-title' + (focus ? ' focus' : '');
    const monat = new Date(year, month - 1, 1).toLocaleDateString('de-DE', { month: 'long' });
    title.textContent = monat + ' ' + year + ' (' + st.workdays + ' Werktage - '
        + st.office + ' von ' + st.pflicht + ' Büropflichttagen)';
    panel.appendChild(title);

    const week = document.createElement('div');
    week.className = 'weekday-row';
    for (const wd of ['Mo', 'Di', 'Mi', 'Do', 'Fr']) {
        const c = document.createElement('div');
        c.textContent = wd;
        week.appendChild(c);
    }
    panel.appendChild(week);

    const grid = document.createElement('div');
    grid.className = 'day-grid';
    let lead = weekdayIndex(new Date(year, month - 1, 1));
    if (lead >= 5) {
        lead = 0;
    }
    for (let i = 0; i < lead; i++) {
        grid.appendChild(emptyCell());
    }
    const dim = new Date(year, month, 0).getDate();
    for (let day = 1; day <= dim; day++) {
        const d = new Date(year, month - 1, day);
        if (isWeekend(d)) {
            continue;
        }
        grid.appendChild(buildDayCell(d));
    }
    panel.appendChild(grid);
    return panel;
}

function emptyCell() {
    const c = document.createElement('div');
    c.className = 'cell empty';
    return c;
}

function buildDayCell(d) {
    const iso = fmt(d);
    const type = days[iso];
    const c = document.createElement('div');
    c.className = 'cell';
    const num = document.createElement('span');
    num.className = 'cell-day';
    num.textContent = d.getDate();
    c.appendChild(num);
    if (type && TYPE_ICONS[type]) {
        const icon = document.createElement('span');
        icon.className = 'cell-icon';
        icon.textContent = TYPE_ICONS[type];
        c.appendChild(icon);
    }
    c.style.background = type ? (COLOR[type] || GRAY) : '#FFFFFF';
    c.title = d.toLocaleDateString('de-DE',
        { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    c.addEventListener('click', function () {
        openDialog(iso);
    });
    return c;
}

// ---------- Legende ----------

function renderLegend() {
    const legend = document.getElementById('legend');
    legend.innerHTML = '';
    const start = parseISO(periodStart);
    const end = parseISO(periodEnd);
    const counts = {};
    for (const iso of Object.keys(days)) {
        const d = parseISO(iso);
        if (d < start || d > end) {
            continue;
        }
        const t = days[iso];
        counts[t] = (counts[t] || 0) + 1;
    }
    const now = new Date();
    const today = fmt(now);
    let urlaubYear = 0;
    let urlaubGenommen = 0;
    let urlaubGeplant = 0;
    for (const iso of Object.keys(days)) {
        if (parseISO(iso).getFullYear() !== now.getFullYear()) {
            continue;
        }
        if (days[iso] !== 'URLAUB') {
            continue;
        }
        urlaubYear++;
        if (iso < today) {
            urlaubGenommen++;
        } else if (iso > today) {
            urlaubGeplant++;
        }
    }
    const ungeplant = Math.max(0, urlaubTotal - urlaubYear);
    for (const t of WORK_TYPES) {
        const item = document.createElement('span');
        item.className = 'legend-item';
        const swatch = document.createElement('span');
        swatch.className = 'swatch';
        swatch.style.background = t.color;
        const label = document.createElement('span');
        label.textContent = t.key === 'URLAUB'
            ? 'Urlaub (genommen ' + urlaubGenommen + ' / geplant ' + urlaubGeplant
                + ' / ungeplant ' + ungeplant + ')'
            : t.label + ' (' + (counts[t.key] || 0) + ')';
        item.appendChild(swatch);
        item.appendChild(label);
        legend.appendChild(item);
    }
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

// ---------- Initialisierung ----------

function render() {
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
    render();
}

init();
