// ---------- reports for a nutritionist or doctor, and the parent dashboard ----------
// Charts are plain SVG with native tooltips (each mark carries a <title>), thin marks, hairline grid,
// and colors from the --viz-* tokens, which have separately validated light and dark steps.
const REPORT_MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
const SRC_NAMES = { label: 'Typed from label', list: 'Food list', seed: 'Food list', scan: 'Barcode scan', ocr: 'Label photo' };
function rangeDates(start, end){ const out = []; for (let d = start; d <= end && out.length < 370; d = addDays(d, 1)) out.push(d); return out; }
function presetRange(id){
  const end = todayStr();
  if (id === '14') return { start: addDays(end, -13), end };
  if (id === '30') return { start: addDays(end, -29), end };
  if (id === 'month') return { start: end.slice(0, 8) + '01', end };
  if (id === 'all') { const ds = Object.keys(state.days).filter(d => state.days[d].entries.length).sort(); return { start: ds[0] || end, end }; }
  return { start: addDays(end, -6), end };
}
function shortDate(s){ const d = parseDate(s); return (d.getMonth() + 1) + '/' + d.getDate(); }
function longDate(s){ return parseDate(s).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }
function rangeText(a, b){ const o = { month: 'short', day: 'numeric', year: 'numeric' }; return parseDate(a).toLocaleDateString([], o) + ' to ' + parseDate(b).toLocaleDateString([], o); }
function fmtInt(n){ return Math.round(n || 0).toLocaleString(); }
function fmt1(n){ return (Math.round((n || 0) * 10) / 10).toLocaleString(); }

function reportData(start, end){
  if (end < start) { const t = start; start = end; end = t; }
  const r = refs(); const s = state.meta.settings;
  const days = rangeDates(start, end).map(date => {
    const d = getDay(date); const t = totals(d); const g = groupsOf(d); const meals = {};
    REPORT_MEALS.forEach(m => { meals[m] = d.entries.filter(e => e.meal === m); });
    return { date, entries: d.entries, t, groups: g, meals, n: d.entries.length, water: d.water || 0, energy: d.energy || null };
  });
  const logged = days.filter(x => x.n);
  const avg = k => logged.length ? logged.reduce((a, x) => a + (x.t[k] || 0), 0) / logged.length : 0;
  const a = { kcal: avg('kcal'), p: avg('p'), c: avg('c'), f: avg('f'), fiber: avg('fiber'), added: avg('added'), sugar: avg('sugar'), sodium: avg('sodium') };
  const eP = a.p * 4, eC = a.c * 4, eF = a.f * 9, eT = eP + eC + eF;
  const mealDays = {}; REPORT_MEALS.forEach(m => { mealDays[m] = logged.filter(x => x.meals[m].length).length; });
  const groupDays = {}; GROUPS.forEach(g => { groupDays[g.id] = logged.filter(x => x.groups.has(g.id)).length; });
  const foods = {}; const levels = { 1: 0, 2: 0, 3: 0 }; let entriesN = 0;
  logged.forEach(x => x.entries.forEach(e => {
    entriesN++; const k = e.name.trim().toLowerCase(); const et = entryTotals(e);
    if (!foods[k]) foods[k] = { name: e.name.trim(), count: 0, kcal: 0, groups: new Set() };
    foods[k].count++; foods[k].kcal += et.kcal; (e.groups || []).forEach(gid => foods[k].groups.add(gid));
    if (e.level) levels[e.level]++;
  }));
  const topFoods = Object.values(foods).sort((x, y) => y.count - x.count || y.kcal - x.kcal).slice(0, 12);
  const waterDays = logged.length ? logged.reduce((acc, x) => acc + x.water, 0) / logged.length : 0;
  const energyDays = days.filter(x => x.energy);
  return { start, end, days, logged, r, s, avg: a, share: eT ? { p: eP / eT, c: eC / eT, f: eF / eT } : { p: 0, c: 0, f: 0 }, mealDays, groupDays, topFoods, levels, entriesN, waterAvg: waterDays, energyAvg: energyDays.length ? energyDays.reduce((acc, x) => acc + x.energy, 0) / energyDays.length : null };
}

// ---------- chart builders ----------
function niceStep(max, ticks){ const raw = max / ticks; const p = Math.pow(10, Math.floor(Math.log10(raw || 1))); const n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
function vizColumns(o){
  // o: { title, sub, items: [{ label, v, tip }], ref, refLabel, color, unit, height }
  const items = o.items; const n = Math.max(1, items.length);
  const W = 640, H = o.height || 220, L = 46, R = 14, T = 16, B = 30;
  const top = Math.max(1, o.ref || 0, ...items.map(x => x.v || 0));
  const step = niceStep(top * 1.08, 4); const max = Math.ceil(top * 1.08 / step) * step;
  const y = v => T + (H - T - B) * (1 - v / max); const slot = (W - L - R) / n; const bw = Math.min(24, Math.max(4, slot * 0.62));
  let g = '';
  for (let v = 0; v <= max + 1e-9; v += step) g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '" class="viz-grid"/><text x="' + (L - 6) + '" y="' + (y(v) + 4).toFixed(1) + '" class="viz-tick" text-anchor="end">' + (max >= 10000 ? Math.round(v / 1000) + 'K' : v.toLocaleString()) + '</text>';
  const every = n <= 8 ? 1 : n <= 16 ? 2 : n <= 31 ? 5 : 10;
  items.forEach((it, i) => {
    const cx = L + slot * i + slot / 2; const x = cx - bw / 2; const yv = y(it.v || 0); const y0 = y(0); const h = y0 - yv; const rad = Math.min(4, h, bw / 2);
    const path = h <= 0 ? '' : 'M' + x.toFixed(1) + ',' + y0.toFixed(1) + 'V' + (yv + rad).toFixed(1) + 'Q' + x.toFixed(1) + ',' + yv.toFixed(1) + ' ' + (x + rad).toFixed(1) + ',' + yv.toFixed(1) + 'H' + (x + bw - rad).toFixed(1) + 'Q' + (x + bw).toFixed(1) + ',' + yv.toFixed(1) + ' ' + (x + bw).toFixed(1) + ',' + (yv + rad).toFixed(1) + 'V' + y0.toFixed(1) + 'Z';
    g += '<g class="viz-mark"><title>' + esc(it.tip || (it.label + ', ' + fmtInt(it.v) + (o.unit ? ' ' + o.unit : ''))) + '</title><rect x="' + (L + slot * i).toFixed(1) + '" y="' + T + '" width="' + slot.toFixed(1) + '" height="' + (H - T - B) + '" class="viz-hit"/>' + (path ? '<path d="' + path + '" style="fill:' + o.color + '"/>' : '') + '</g>';
    if (i % every === 0 || i === n - 1 && n <= 16) g += '<text x="' + cx.toFixed(1) + '" y="' + (H - 10) + '" class="viz-tick" text-anchor="middle">' + esc(it.label) + '</text>';
  });
  g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(0).toFixed(1) + '" y2="' + y(0).toFixed(1) + '" class="viz-axis"/>';
  if (o.ref) g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(o.ref).toFixed(1) + '" y2="' + y(o.ref).toFixed(1) + '" class="viz-ref"/><text x="' + (W - R) + '" y="' + (y(o.ref) - 5).toFixed(1) + '" class="viz-ref-label" text-anchor="end">' + esc(o.refLabel || '') + '</text>';
  return '<figure class="viz"><figcaption><b>' + esc(o.title) + '</b>' + (o.sub ? '<span>' + esc(o.sub) + '</span>' : '') + '</figcaption><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.title) + '">' + g + '</svg></figure>';
}
function vizSegments(title, sub, parts){
  const tot = parts.reduce((x, p) => x + p.v, 0) || 1;
  const label = parts.map(p => p.name + ' ' + Math.round(p.v / tot * 100) + '%').join(', ');
  return '<figure class="viz"><figcaption><b>' + esc(title) + '</b>' + (sub ? '<span>' + esc(sub) + '</span>' : '') + '</figcaption><div class="viz-seg" role="img" aria-label="' + esc(label) + '">' +
    parts.filter(p => p.v > 0).map(p => { const pct = Math.round(p.v / tot * 100); return '<span style="flex:' + p.v + ';background:' + p.color + ';color:' + (p.dark ? '#1F2A44' : '#fff') + '" title="' + esc(p.name + ' ' + pct + '%') + '">' + (pct >= 12 ? pct + '%' : '') + '</span>'; }).join('') +
    '</div><div class="viz-legend">' + parts.map(p => '<span><i style="background:' + p.color + '"></i>' + esc(p.name) + '</span>').join('') + '</div></figure>';
}
function vizGrid(title, sub, rows, dates, color){
  // rows: [{ label, on: date => bool, tip: date => string }]
  const n = dates.length; const W = 640, L = 86, R = 8, T = 8, rowH = 22, B = 22; const H = T + rows.length * rowH + B;
  const slot = (W - L - R) / n; const cell = Math.max(4, Math.min(16, slot - 3));
  let g = '';
  rows.forEach((row, ri) => {
    const cy = T + ri * rowH + rowH / 2;
    g += '<text x="' + (L - 8) + '" y="' + (cy + 4) + '" class="viz-tick" text-anchor="end">' + esc(row.label) + '</text>';
    dates.forEach((d, i) => { const x = L + slot * i + (slot - cell) / 2; const on = row.on(d); g += '<rect x="' + x.toFixed(1) + '" y="' + (cy - cell / 2).toFixed(1) + '" width="' + cell.toFixed(1) + '" height="' + cell.toFixed(1) + '" rx="3" class="' + (on ? 'viz-on' : 'viz-off') + '"' + (on ? ' style="fill:' + color + '"' : '') + '><title>' + esc(row.tip ? row.tip(d) : row.label + (on ? ' logged ' : ' not logged ') + shortDate(d)) + '</title></rect>'; });
  });
  const every = n <= 8 ? 1 : n <= 16 ? 2 : n <= 31 ? 5 : 10;
  dates.forEach((d, i) => { if (i % every === 0) g += '<text x="' + (L + slot * i + slot / 2).toFixed(1) + '" y="' + (H - 6) + '" class="viz-tick" text-anchor="middle">' + shortDate(d) + '</text>'; });
  return '<figure class="viz"><figcaption><b>' + esc(title) + '</b>' + (sub ? '<span>' + esc(sub) + '</span>' : '') + '</figcaption><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(title) + '">' + g + '</svg></figure>';
}
function statTile(label, value, sub){ return '<div class="rep-tile"><div class="rep-tile-l">' + esc(label) + '</div><div class="rep-tile-v">' + esc(value) + '</div>' + (sub ? '<div class="rep-tile-s">' + esc(sub) + '</div>' : '') + '</div>'; }

// ---------- the report ----------
function reportSummaryHTML(R, compact){
  const nD = R.days.length; const a = R.avg;
  let h = '<div class="rep-tiles">' +
    statTile('Days logged', R.logged.length + ' of ' + nD, R.entriesN + ' foods in all') +
    statTile('Energy, average logged day', fmtInt(a.kcal) + ' kcal', 'Reference about ' + fmtInt(R.r.kcal)) +
    statTile('Protein, carbs, fat', fmtInt(a.p) + ' / ' + fmtInt(a.c) + ' / ' + fmtInt(a.f) + ' g', 'Average logged day') +
    statTile('Fiber', fmt1(a.fiber) + ' g', 'Average logged day') +
    (compact ? '' : statTile('Added sugar', fmt1(a.added) + ' g', 'Where the label lists it') + statTile('Sodium', fmtInt(a.sodium) + ' mg', 'Where the label lists it')) +
    (compact ? statTile('Fueled days', R.days.filter(x => fueledDay(getDay(x.date))).length + ' of ' + nD, 'Breakfast, lunch, dinner and 3 groups') : '') +
    statTile('Water', fmt1(R.waterAvg) + ' cups', 'Average logged day') +
    (compact ? '' : statTile('Energy check-in', R.energyAvg == null ? 'None' : fmt1(R.energyAvg) + ' of 4', 'How she said she felt')) +
    '</div>';
  h += vizColumns({ title: 'Energy per day', sub: 'Calories logged each day. The line is the reference for her age and activity.', items: R.days.map(x => ({ label: shortDate(x.date), v: Math.round(x.t.kcal), tip: WEEKDAYS[parseDate(x.date).getDay()] + ' ' + shortDate(x.date) + ', ' + fmtInt(x.t.kcal) + ' kcal, ' + x.n + ' foods' })), ref: R.r.kcal, refLabel: 'Reference ' + fmtInt(R.r.kcal), color: 'var(--viz-energy)', unit: 'kcal' });
  h += vizSegments('Where the energy came from', 'Share of calories from protein, carbohydrate and fat, averaged over logged days', [
    { name: 'Protein', v: R.share.p, color: 'var(--viz-protein)' }, { name: 'Carbohydrate', v: R.share.c, color: 'var(--viz-carb)' }, { name: 'Fat', v: R.share.f, color: 'var(--viz-fat)', dark: true }]);
  h += vizGrid('Meals logged', 'A filled square means at least one food was logged for that meal', REPORT_MEALS.map(m => { const meal = MEALS.find(x => x.id === m); const nm = meal ? meal.name : m; return { label: nm, on: d => { const x = R.days.find(y => y.date === d); return !!(x && x.meals[m].length); }, tip: d => { const x = R.days.find(y => y.date === d); const k = x ? x.meals[m] : []; return nm + ' ' + shortDate(d) + (k.length ? ', ' + k.map(e => e.name).join(', ') : ', nothing logged'); } }; }), R.days.map(x => x.date), 'var(--viz-energy)');
  h += vizGrid('Food groups', 'A filled square means the group showed up that day', GROUPS.map(gr => ({ label: gr.name, on: d => { const x = R.days.find(y => y.date === d); return !!(x && x.groups.has(gr.id)); } })), R.days.map(x => x.date), 'var(--viz-energy)');
  if (!compact) {
    h += '<div class="rep-pair">' +
      vizColumns({ title: 'Fiber per day', sub: 'Grams', items: R.days.map(x => ({ label: shortDate(x.date), v: round1(x.t.fiber), tip: shortDate(x.date) + ', ' + fmt1(x.t.fiber) + ' g fiber' })), color: 'var(--viz-energy)', unit: 'g', height: 180 }) +
      vizColumns({ title: 'Added sugar per day', sub: 'Grams, from labels that list it', items: R.days.map(x => ({ label: shortDate(x.date), v: round1(x.t.added), tip: shortDate(x.date) + ', ' + fmt1(x.t.added) + ' g added sugar' })), color: 'var(--viz-energy)', unit: 'g', height: 180 }) + '</div>';
  }
  return h;
}
function reportFoodsHTML(R){
  if (!R.topFoods.length) return '';
  return '<h3 class="rep-h3">Most logged foods</h3><table class="rep-table"><thead><tr><th>Food</th><th class="n">Times</th><th class="n">kcal in all</th><th>Groups</th></tr></thead><tbody>' +
    R.topFoods.map(f => '<tr><td>' + esc(f.name) + '</td><td class="n">' + f.count + '</td><td class="n">' + fmtInt(f.kcal) + '</td><td>' + esc(Array.from(f.groups).map(gid => (GROUPS.find(g => g.id === gid) || {}).name || gid).join(', ')) + '</td></tr>').join('') + '</tbody></table>';
}
function reportEntriesHTML(R){
  let h = '<h3 class="rep-h3">Every entry, day by day</h3>';
  R.days.slice().reverse().forEach(x => {
    h += '<section class="rep-day"><div class="rep-day-head"><b>' + esc(longDate(x.date)) + '</b><span>' + (x.n ? fmtInt(x.t.kcal) + ' kcal · P ' + fmtInt(x.t.p) + ' g · C ' + fmtInt(x.t.c) + ' g · F ' + fmtInt(x.t.f) + ' g · water ' + x.water + ' cups' : 'Nothing logged') + '</span></div>';
    if (x.n) {
      h += '<table class="rep-table"><thead><tr><th>Meal</th><th>Food</th><th>Amount</th><th class="n">kcal</th><th class="n">P g</th><th class="n">C g</th><th class="n">F g</th><th class="n">Fiber</th><th class="n">Added sugar</th><th class="n">Sodium mg</th><th>Logged</th></tr></thead><tbody>';
      REPORT_MEALS.forEach(m => x.meals[m].forEach(e => { const t = entryTotals(e); const meal = MEALS.find(z => z.id === m); h += '<tr><td>' + esc(meal ? meal.name : m) + '</td><td>' + esc(e.name) + '</td><td>' + esc(servingLabel(e)) + '</td><td class="n">' + fmtInt(t.kcal) + '</td><td class="n">' + fmt1(t.p) + '</td><td class="n">' + fmt1(t.c) + '</td><td class="n">' + fmt1(t.f) + '</td><td class="n">' + (e.per.fiber == null ? '' : fmt1(t.fiber)) + '</td><td class="n">' + (e.per.added == null ? '' : fmt1(t.added)) + '</td><td class="n">' + (e.per.sodium == null ? '' : fmtInt(t.sodium)) + '</td><td class="muted">' + esc((e.createdAt ? new Date(e.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '') + (e.by ? ', ' + e.by : '')) + '</td></tr>'; }));
      h += '</tbody></table>';
    }
    h += '</section>';
  });
  return h;
}
function reportHTML(R){
  const s = R.s; const act = ACTIVITIES.find(x => x.id === s.activity) || ACTIVITIES[1];
  return '<article class="rep">' +
    '<header class="rep-head"><div class="rep-kicker">Food journal report</div><h2>' + esc(s.name || 'Food Detective journal') + '</h2>' +
    '<div class="rep-meta">' + esc(rangeText(R.start, R.end)) + ' · age ' + esc(String(s.age)) + ' · ' + esc(act.name.toLowerCase()) + ' · generated ' + esc(new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })) + '</div></header>' +
    reportSummaryHTML(R, false) + reportFoodsHTML(R) + reportEntriesHTML(R) +
    '<footer class="rep-foot">Logged in Food Detective by the child and her parents on their own devices. Amounts are what was entered. Nutrition values come from food labels, barcode lookups (Open Food Facts) or the app’s food list, so treat them as estimates. Fiber, added sugar and sodium count only foods whose label lists them. The reference energy is a general estimate for age and activity from the Dietary Guidelines for Americans, not a prescription.</footer></article>';
}
function renderReport(){
  if (!ui.gate) return renderGrownups();
  const rr = ui.report || (ui.report = Object.assign({ preset: '7' }, presetRange('7')));
  const R = reportData(rr.start, rr.end);
  const presets = [['7', '7 days'], ['14', '14 days'], ['30', '30 days'], ['month', 'This month'], ['all', 'All']];
  return '<div class="rep-tools no-print"><button class="link" data-action="goto" data-view="grownups">‹ Chief’s office</button>' +
    '<h2 style="margin:6px 0 10px">Report for a nutritionist or doctor</h2>' +
    '<div class="seg" role="group" aria-label="Date range">' + presets.map(p => '<button type="button" class="' + (rr.preset === p[0] ? 'on' : '') + '" data-action="report-range" data-range="' + p[0] + '">' + p[1] + '</button>').join('') + '</div>' +
    '<div class="grid2" style="margin-top:8px"><div class="field"><label for="rep-start">From</label><input id="rep-start" class="input" type="date" data-report="start" value="' + rr.start + '" max="' + todayStr() + '"></div><div class="field"><label for="rep-end">To</label><input id="rep-end" class="input" type="date" data-report="end" value="' + rr.end + '" max="' + todayStr() + '"></div></div>' +
    '<div class="stack"><button class="btn block" data-action="report-print">\u{1F5A8}️ Print or save as PDF</button><button class="btn secondary block" data-action="report-excel">\u{1F4CA} Excel workbook with charts</button></div>' +
    '<p class="hint">The PDF is easiest to send to a doctor. The Excel workbook has the same charts plus every entry in a sortable table.</p></div>' +
    reportHTML(R);
}
function dashboardCardHTML(){
  const R = reportData(addDays(todayStr(), -6), todayStr());
  return '<section class="card" id="dash-card"><div class="card-head"><h2>Dashboard</h2><span class="small muted">last 7 days</span></div>' + reportSummaryHTML(R, true) +
    '<div class="row" style="margin-top:10px;flex-wrap:wrap;gap:8px"><button class="btn sm" data-action="goto" data-view="report">Open the full report</button><button class="btn sm secondary" data-action="report-excel-quick">Excel</button></div></section>';
}
async function saveOrShare(name, blob){
  const mobile = /iPhone|iPad|Android/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  try {
    const file = new File([blob], name, { type: blob.type });
    if (mobile && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast('Saved ' + name);
}
function reportFileName(R, ext){ return 'food-journal-' + (R.s.name ? R.s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' : '') + R.start + '-to-' + R.end + '.' + ext; }
function downloadExcel(R){ try { saveOrShare(reportFileName(R, 'xlsx'), buildWorkbook(R)); } catch (e) { console.error(e); toast('Could not build the Excel file'); } }
