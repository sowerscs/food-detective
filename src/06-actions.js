
// ---------- toasts and celebrations ----------
const toastQ = []; let toastBusy = false;
function toast(msg){ toastQ.push(msg); if (!toastBusy) nextToast(); }
function nextToast(){
  const el = $('#toast'); const msg = toastQ.shift();
  if (msg == null) { toastBusy = false; el.classList.remove('show'); return; }
  toastBusy = true; el.textContent = msg; el.classList.add('show');
  setTimeout(() => { el.classList.remove('show'); setTimeout(nextToast, 250); }, 1900);
}
function celebrate(msg){
  toast(msg);
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = $('#confetti'); const colors = ['#5BB6E8', '#F3A2C4', '#D98B3C', '#B1A3E6', '#FFFFFF', '#7CD3A6'];
    let h = ''; for (let i = 0; i < 28; i++) h += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + colors[i % colors.length] + ';animation-delay:' + (Math.random() * 0.5).toFixed(2) + 's;animation-duration:' + (1.4 + Math.random()).toFixed(2) + 's"></i>';
    c.innerHTML = h; setTimeout(() => { c.innerHTML = ''; }, 2600);
  } catch (e) { /* decoration only */ }
}

// ---------- add and edit food sheet ----------
function blankDraft(){ return { name: '', serving: '1 serving', qty: 1, per: { kcal: 0, p: 0, c: 0, f: 0, fiber: null, sugar: null, added: null, sodium: null }, groups: [], level: null, note: '', icon: '\u{1F37D}️', src: 'label' }; }
function openSheet(kind, opts){
  opts = opts || {};
  if (kind === 'edit' || kind === 'swap') {
    const day = getDay(opts.date); const e = day.entries.find(x => x.id === opts.id); if (!e) return;
    ui.sheet = kind === 'swap' ? { kind: 'swap', date: opts.date, id: e.id, entry: e } : { kind: 'edit', date: opts.date, id: e.id, meal: e.meal, draft: clone(e), picked: true, confirmDelete: false, q: '' };
  } else {
    ui.sheet = { kind: 'add', date: ui.date, meal: opts.meal || mealByTime(), draft: blankDraft(), picked: false, manual: false, q: '' };
  }
  renderSheet();
  document.body.classList.add('sheet-open');
  const root = $('#sheet-root'); root.classList.add('open'); root.setAttribute('aria-hidden', 'false');
  setTimeout(() => { const el = ui.sheet && ui.sheet.kind === 'add' ? $('#food-search') : null; if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* ignore */ } } }, 60);
}
function openSyncSheet(){ ui.sheet = { kind: 'sync' }; renderSheet(); document.body.classList.add('sheet-open'); const root = $('#sheet-root'); root.classList.add('open'); root.setAttribute('aria-hidden', 'false'); }
function syncSheetHTML(){
  let name = ''; try { name = localStorage.getItem('fe.deviceName') || ''; } catch (e) { /* ignore */ }
  return '<div class="scrim" data-action="sheet-close"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Family journal"><div class="sheet-head"><h2>\u{1F4E1} Family journal</h2><button class="icon-btn" data-action="sheet-close" aria-label="Close" style="box-shadow:none;background:var(--surface-2)">\u00d7</button></div><div class="sheet-body"><div id="sync-status">' + syncStatusHTML() + '</div>' +
    (familyCode() ? '<form id="device-form" style="margin-top:14px"><div class="field"><label for="device-name">Name this device</label><input id="device-name" class="input" maxlength="30" autocomplete="off" placeholder="' + esc(deviceKind()) + '" value="' + esc(name) + '"></div><button class="btn sm secondary" type="submit">Save name</button><p class="hint">A name like Kitchen iPad or Dad\u2019s phone makes the device list easy to read.</p></form>' : '') +
    '</div><div class="sheet-foot">' + (familyCode() ? '<button class="btn" style="flex:1" data-action="sync-now">Sync now</button>' : '<button class="btn" style="flex:1" data-action="sheet-close">OK</button>') + '</div></div>';
}
function closeSheet(){ stopCamera(); ui.sheet = null; setTimeout(maybeReloadForUpdate, 300); const root = $('#sheet-root'); root.classList.remove('open'); root.setAttribute('aria-hidden', 'true'); root.innerHTML = ''; document.body.classList.remove('sheet-open'); }
function swapSheetHTML(sh){
  const e = sh.entry; const tr = entryTraits(e);
  let h = '<div class="scrim" data-action="sheet-close"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Swap ideas"><div class="sheet-head"><h2>\u{1F575}\uFE0F Detective notes</h2><button class="icon-btn" data-action="sheet-close" aria-label="Close" style="box-shadow:none;background:var(--surface-2)">\u00d7</button></div><div class="sheet-body">' +
    '<div class="row" style="margin:4px 0 10px"><span style="font-size:36px">' + esc(e.icon || '\u{1F37D}\uFE0F') + '</span><div><div style="font-family:var(--font-display);font-size:19px;font-weight:600">' + esc(e.name) + '</div><div class="small muted" style="font-weight:700">' + esc(servingLabel(e)) + '</div></div></div>';
  tr.forEach(t => {
    h += '<div class="swap-card"><div class="swap-title">' + t.em + ' ' + esc(t.label) + '</div><p style="margin:4px 0 8px">' + esc(t.why) + '</p><div class="small muted" style="font-weight:800;margin-bottom:4px">Next time you could try</div><div class="chips">' +
      t.swaps.map(n => { const f = FOODS.find(x => x.name === n); return '<span class="chip on">' + (f ? f.icon : '\u{1FAE7}') + ' ' + esc(n) + '</span>'; }).join('') + '</div><p class="hint" style="margin-top:8px">\u2795 ' + esc(t.addon) + '</p></div>';
  });
  h += '<p class="note" style="margin-top:12px">' + esc(SWAP_FOOTER) + '</p></div><div class="sheet-foot"><button type="button" class="btn" style="flex:1" data-action="sheet-close">Got it</button></div></div>';
  return h;
}
function renderSheet(){
  const sh = ui.sheet; if (!sh) return;
  if (sh.kind === 'swap') { $('#sheet-root').innerHTML = swapSheetHTML(sh); return; }
  if (sh.kind === 'sync') { $('#sheet-root').innerHTML = syncSheetHTML(); return; }
  if (sh.mode === 'scan') { $('#sheet-root').innerHTML = scanSheetHTML(sh); if (!sh.scan) setTimeout(startLiveScan, 50); return; }
  if (sh.mode === 'ocr') { $('#sheet-root').innerHTML = ocrSheetHTML(sh); return; }
  const title = sh.kind === 'edit' ? 'Edit food' : 'Add food';
  let h = '<div class="scrim" data-action="sheet-close"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="' + title + '"><div class="sheet-head"><h2>' + title + '</h2><button class="icon-btn" data-action="sheet-close" aria-label="Close" style="box-shadow:none;background:var(--surface-2)">×</button></div><div class="sheet-body">';
  if (sh.kind === 'edit') { const e0 = getDay(sh.date).entries.find(x => x.id === sh.id); if (e0 && e0.createdAt) h += '<p class="hint" style="margin:0 0 8px">Logged ' + esc(new Date(e0.createdAt).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })) + (e0.by ? ' on ' + esc(e0.by) : '') + '</p>'; }
  h += '<div class="seg" role="group" aria-label="Meal">' + MEALS.map(m => '<button type="button" class="' + (sh.meal === m.id ? 'on' : '') + '" data-action="sheet-meal" data-meal="' + m.id + '">' + m.icon + ' ' + m.name + '</button>').join('') + '</div>';
  if (sh.kind === 'add' && !sh.picked && !sh.manual) {
    h += '<div class="choice-row"><button type="button" class="btn secondary" data-action="sheet-scan">\u{1F4F7} Scan a barcode</button><button type="button" class="btn secondary" data-action="sheet-ocr">\u{1F3F7}\uFE0F Snap the label</button></div>' +
      '<div class="field" style="margin-top:4px"><label for="food-search">Search foods</label><input id="food-search" class="input" type="search" placeholder="apple, cheese, chicken…" autocomplete="off" autocorrect="off" autocapitalize="off" value="' + esc(sh.q) + '"></div>' +
      '<button type="button" class="btn secondary block" data-action="sheet-manual">✏️ Type it in from the label</button><div class="results" id="results">' + resultsHTML(sh.q) + '</div>';
  } else {
    h += formHTML(sh);
  }
  h += '</div>';
  if (sh.picked || sh.manual || sh.kind === 'edit') {
    h += '<div class="sheet-foot">' + (sh.kind === 'edit' ? (sh.confirmDelete ? '<button type="button" class="btn danger" data-action="entry-delete-yes">Really delete</button>' : '<button type="button" class="btn secondary" data-action="entry-delete">Delete</button>') : '<button type="button" class="btn secondary" data-action="sheet-back">‹ Back</button>') +
      '<button type="submit" form="food-form" class="btn" style="flex:1">' + (sh.kind === 'edit' ? 'Save changes' : 'Add to ' + (MEALS.find(m => m.id === sh.meal) || MEALS[3]).name) + '</button></div>';
  }
  h += '</div>';
  $('#sheet-root').innerHTML = h;
}
function resultsHTML(q){
  q = (q || '').trim().toLowerCase();
  const mine = myFoods(); const match = f => !q || f.name.toLowerCase().indexOf(q) >= 0;
  const mineHits = mine.filter(match).slice(0, q ? 8 : 6);
  const mineNames = new Set(mine.map(f => f.name.toLowerCase()));
  let starter = FOODS.filter(f => match(f) && !mineNames.has(f.name.toLowerCase()));
  if (!q) starter = POPULAR.map(n => FOODS.find(f => f.name === n)).filter(f => f && !mineNames.has(f.name.toLowerCase()));
  starter = starter.slice(0, q ? 25 : 12);
  const item = (f, src, i) => '<button type="button" class="result" data-action="pick-food" data-src="' + src + '" data-i="' + i + '"><span class="em">' + esc(f.icon) + '</span><span class="mid"><div class="name">' + esc(f.name) + '</div><div class="serv">' + esc(f.serving) + '</div></span><span class="kcal num">' + fmt(f.per.kcal, 0) + ' cal</span></button>';
  let h = '';
  if (mineHits.length) h += '<h3>My foods</h3>' + mineHits.map(f => item(f, 'mine', mine.indexOf(f))).join('');
  if (starter.length) h += '<h3>' + (q ? 'Starter foods' : 'Popular starters') + '</h3>' + starter.map(f => item(f, 'starter', FOODS.indexOf(f))).join('');
  if (!mineHits.length && !starter.length) h += '<p class="hint" style="padding:12px 0">No match for “' + esc(q) + '”. Tap “Type it in from the label” to add it yourself.</p>';
  return h;
}
function amountRowHTML(sh){
  const d = sh.draft; const opts = amountOptions(d.serving);
  if (!opts.length) return '';
  if (!opts.some(o => o.unit === sh.amountUnit)) sh.amountUnit = opts[0].unit;
  const cur = opts.find(o => o.unit === sh.amountUnit);
  const amount = (num(d.qty) || 1) * cur.perServing;
  return '<div class="field" style="margin-top:0"><label for="f-amount">How much did you eat?</label><div class="row"><input id="f-amount" class="input" type="number" inputmode="decimal" step="any" min="0" value="' + fmtAmount(amount) + '" style="flex:1">' +
    (opts.length > 1 ? '<select id="f-unit" class="input" style="width:120px">' + opts.map(o => '<option value="' + esc(o.unit) + '"' + (o.unit === cur.unit ? ' selected' : '') + '>' + esc(o.unit === 'count' ? plural(o.noun, 2) : o.label) + '</option>').join('') + '</select>' : '<span class="status" style="min-width:60px">' + esc(cur.unit === 'count' ? plural(cur.noun, amount) : cur.label) + '</span>') +
    '</div><p class="hint" id="amount-hint">' + amountHint(d, cur) + '</p></div>';
}
function amountHint(d, cur){ const q = num(d.qty) || 1; return 'One serving is ' + esc(d.serving) + '. That is ' + fmt(q, 2) + ' serving' + (Math.abs(q - 1) < 0.005 ? '' : 's') + '.'; }
function syncAmountFromQty(){
  const sh = ui.sheet; if (!sh || !sh.draft) return; const opts = amountOptions(sh.draft.serving); const cur = opts.find(o => o.unit === sh.amountUnit) || opts[0]; if (!cur) return;
  const el = $('#f-amount'); if (el && document.activeElement !== el) el.value = fmtAmount((num(sh.draft.qty) || 1) * cur.perServing);
  const hint = $('#amount-hint'); if (hint) hint.innerHTML = amountHint(sh.draft, cur);
}
function syncQtyFromAmount(){
  const sh = ui.sheet; if (!sh || !sh.draft) return; const opts = amountOptions(sh.draft.serving); const cur = opts.find(o => o.unit === sh.amountUnit) || opts[0]; if (!cur) return;
  const amount = num($('#f-amount') && $('#f-amount').value); if (amount <= 0) return;
  sh.draft.qty = Math.max(0.01, Math.min(99, Math.round(amount / cur.perServing * 1000) / 1000));
  const q = $('#f-qty'); if (q) q.value = sh.draft.qty;
  const hint = $('#amount-hint'); if (hint) hint.innerHTML = amountHint(sh.draft, cur);
  const p = $('#preview'); if (p && state.meta.settings.showNumbers) p.innerHTML = previewText(sh.draft);
}
function formHTML(sh){
  const d = sh.draft; const v = x => x == null ? '' : x;
  return '<form id="food-form" novalidate>' +
    '<div class="field" style="margin-top:12px"><label for="f-name">Food</label><input id="f-name" class="input" data-draft="name" value="' + esc(d.name) + '" maxlength="80" placeholder="What did you eat?" autocomplete="off"></div>' +
    '<div class="grid2"><div class="field"><label for="f-serving">One serving is</label><input id="f-serving" class="input" data-draft="serving" value="' + esc(d.serving) + '" maxlength="40" placeholder="1 cup" autocomplete="off"></div>' +
    '<div class="field"><label for="f-qty">How many servings</label><div class="stepper"><button type="button" data-action="qty" data-d="-1" aria-label="Fewer servings">−</button><input id="f-qty" class="input" type="number" inputmode="decimal" step="any" min="0.01" max="99" data-draft="qty" value="' + v(d.qty) + '"><button type="button" data-action="qty" data-d="1" aria-label="More servings">+</button></div></div></div>' +
    '<div id="amount-row">' + amountRowHTML(sh) + '</div>' +
    (sh.ocrNote ? '<p class="note" style="font-size:14px">\u{1F3F7}\uFE0F ' + esc(sh.ocrNote) + '</p>' : '') +
    '<p class="hint">Numbers below are for ONE serving, straight from the label.</p>' +
    '<div class="grid4"><div class="field"><label for="f-kcal">Calories</label><input id="f-kcal" class="input" type="number" inputmode="decimal" step="any" min="0" data-draft="per.kcal" value="' + v(d.per.kcal) + '"></div>' +
    '<div class="field"><label for="f-p">Protein g</label><input id="f-p" class="input" type="number" inputmode="decimal" step="any" min="0" data-draft="per.p" value="' + v(d.per.p) + '"></div>' +
    '<div class="field"><label for="f-c">Carbs g</label><input id="f-c" class="input" type="number" inputmode="decimal" step="any" min="0" data-draft="per.c" value="' + v(d.per.c) + '"></div>' +
    '<div class="field"><label for="f-f">Fat g</label><input id="f-f" class="input" type="number" inputmode="decimal" step="any" min="0" data-draft="per.f" value="' + v(d.per.f) + '"></div></div>' +
    (state.meta.settings.showNumbers ? '<div class="preview" id="preview">' + previewText(d) + '</div>' : '<div id="preview" class="hint">Tip. The serving size on the label is a measuring tool, not a rule.</div>') +
    '<details class="more"' + (d.per.fiber != null || d.per.sugar != null || d.per.added != null || d.per.sodium != null ? ' open' : '') + '><summary>More from the label</summary><div class="grid4"><div class="field"><label for="f-fiber">Fiber g</label><input id="f-fiber" class="input" type="number" inputmode="decimal" step="any" min="0" data-draft="per.fiber" value="' + v(d.per.fiber) + '"></div>' +
    '<div class="field"><label for="f-sugar">Sugars g</label><input id="f-sugar" class="input" type="number" inputmode="decimal" step="any" min="0" data-draft="per.sugar" value="' + v(d.per.sugar) + '"></div>' +
    '<div class="field"><label for="f-added">Added sugar g</label><input id="f-added" class="input" type="number" inputmode="decimal" step="any" min="0" data-draft="per.added" value="' + v(d.per.added) + '"></div>' +
    '<div class="field"><label for="f-sodium">Sodium mg</label><input id="f-sodium" class="input" type="number" inputmode="decimal" step="any" min="0" data-draft="per.sodium" value="' + v(d.per.sodium) + '"></div></div>' +
    '<div class="field"><label for="f-note">Detective note</label><input id="f-note" class="input" data-draft="note" value="' + esc(d.note || '') + '" maxlength="200" placeholder="caffeine? dyes? first ingredient?" autocomplete="off"></div></details>' +
    '<div class="field"><label>Food groups</label><div class="chips">' + GROUPS.map(g => '<button type="button" class="chip' + ((d.groups || []).indexOf(g.id) >= 0 ? ' on' : '') + '" data-action="toggle-group" data-g="' + g.id + '" aria-pressed="' + ((d.groups || []).indexOf(g.id) >= 0) + '"><span class="em">' + g.icon + '</span>' + g.name + '</button>').join('') + '</div></div>' +
    '<div class="field"><label>How processed is it? (optional)</label><div class="seg">' + LEVELS.map(L => '<button type="button" class="' + (d.level === L.id ? 'on' : '') + '" data-action="set-level" data-k="' + L.id + '">' + L.short + '</button>').join('') + '</div><p class="hint">' + esc(d.level ? (LEVELS.find(L => L.id === d.level) || {}).name : 'Level 1 whole, Level 2 changed a little, Level 3 changed a lot.') + '</p></div>' +
    '<div class="field"><label for="f-icon">Emoji</label><input id="f-icon" class="input" data-draft="icon" value="' + esc(d.icon || '') + '" maxlength="8" style="max-width:110px;text-align:center;font-size:22px"></div>' +
    '</form>';
}
function previewText(d){
  const et = entryTotals(d);
  return 'This adds <b>' + fmt(et.kcal, 0) + ' calories</b>, ' + fmt(et.p) + ' g protein, ' + fmt(et.c) + ' g carbs, ' + fmt(et.f) + ' g fat' + (fmt(d.qty) !== '1' ? ' (' + fmt(d.qty) + ' servings)' : '') + '.';
}
function readDraftFromForm(){
  const sh = ui.sheet; if (!sh) return;
  const d = sh.draft;
  document.querySelectorAll('#food-form [data-draft]').forEach(inp => {
    const key = inp.dataset.draft; const val = inp.value;
    if (key.indexOf('per.') === 0) { const k = key.slice(4); d.per[k] = val === '' ? (['kcal','p','c','f'].indexOf(k) >= 0 ? 0 : null) : Math.max(0, num(val)); }
    else if (key === 'qty') d.qty = Math.max(0.01, Math.min(99, num(val) || 1));
    else d[key] = val;
  });
}
function pickFood(src, i){
  const f = src === 'mine' ? myFoods()[i] : FOODS[i]; if (!f) return;
  const sh = ui.sheet; sh.draft = Object.assign(blankDraft(), clone(f), { qty: 1, src: 'list' }); sh.picked = true; sh.manual = false;
  renderSheet();
  setTimeout(() => { const el = $('#f-amount') || $('#f-qty'); if (el) { try { el.focus({ preventScroll: true }); el.select(); } catch (e) { /* ignore */ } } }, 60);
}
function saveSheet(){
  const sh = ui.sheet; if (!sh) return;
  readDraftFromForm();
  const d = sh.draft;
  d.name = (d.name || '').trim();
  if (!d.name) { const el = $('#f-name'); if (el) { el.focus(); el.style.borderColor = 'var(--bad)'; } toast('Give the food a name first'); return; }
  if (!d.serving || !d.serving.trim()) d.serving = '1 serving';
  const before = snapshotGame();
  const day = ensureDay(sh.date);
  if (sh.kind === 'edit') {
    const e = day.entries.find(x => x.id === sh.id); if (!e) { closeSheet(); return; }
    Object.assign(e, { meal: sh.meal, name: d.name, serving: d.serving, qty: d.qty, per: normPer(d.per), groups: d.groups || [], level: d.level || null, note: d.note || '', icon: d.icon || '\u{1F37D}️', updatedAt: Date.now() });
    toast('Saved');
  } else {
    day.entries.push({ id: uid(), meal: sh.meal, name: d.name, serving: d.serving, qty: d.qty, per: normPer(d.per), groups: d.groups || [], level: d.level || null, note: d.note || '', icon: d.icon || '\u{1F37D}️', createdAt: Date.now(), updatedAt: Date.now(), src: ['list','scan','ocr'].indexOf(d.src) >= 0 ? d.src : 'label', dev: deviceId(), by: deviceName() });
    toast((MEALS.find(m => m.id === sh.meal) || MEALS[3]).icon + ' Logged in ' + (MEALS.find(m => m.id === sh.meal) || MEALS[3]).name);
  }
  const date = sh.date;
  closeSheet();
  touchDay(date);
  render();
  checkBadges();
  checkHabits();
  afterChange(before);
}
function deleteEntry(){
  const sh = ui.sheet; if (!sh || sh.kind !== 'edit') return;
  const day = ensureDay(sh.date); day.entries = day.entries.filter(x => x.id !== sh.id); day.deleted[sh.id] = Date.now();
  const date = sh.date; closeSheet(); touchDay(date); render(); toast('Deleted');
}

// ---------- export and import ----------
function backupJSON(){ return JSON.stringify({ v: 2, app: 'Food Detective', exportedAt: new Date().toISOString(), state }, null, 1); }
function journalCSV(){
  const esc2 = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
  const rows = [['date','meal','food','serving','servings','amount_eaten','calories','protein_g','carbs_g','fat_g','fiber_g','sugar_g','added_sugar_g','sodium_mg','food_groups','processing_level','note']];
  Object.keys(state.days).sort().forEach(date => {
    const d = state.days[date];
    MEALS.forEach(m => d.entries.filter(e => e.meal === m.id).forEach(e => { const t = entryTotals(e); rows.push([date, m.name, e.name, e.serving, e.qty, servingLabel(e), round1(t.kcal), round1(t.p), round1(t.c), round1(t.f), e.per.fiber == null ? '' : round1(t.fiber), e.per.sugar == null ? '' : round1(t.sugar), e.per.added == null ? '' : round1(t.added), e.per.sodium == null ? '' : round1(t.sodium), (e.groups || []).join('|'), e.level || '', e.note || '']); }));
    rows.push([date, 'Day', 'Water cups', '', d.water, '', '', '', '', '', '', '', '', '', '', '', d.energy ? 'energy ' + FACES[d.energy - 1].name : '']);
  });
  return rows.map(r => r.map(esc2).join(',')).join('\r\n');
}
async function exportFile(kind){
  const isCSV = kind === 'csv'; const data = isCSV ? journalCSV() : backupJSON();
  const name = 'food-detective-' + (isCSV ? 'casebook' : 'backup') + '-' + todayStr() + (isCSV ? '.csv' : '.json');
  ui.exportText = data; renderView();
  if (remote.downloads) {
    try { await remote.downloads.save({ filename: name, data }); toast('Saved ' + name); return; }
    catch (err) { const code = err && err.code; if (code === 'declined') { toast('Download cancelled'); return; } toast('Download did not work here. Copy the text instead.'); }
  }
  try {
    const blob = new Blob([data], { type: isCSV ? 'text/csv' : 'application/json' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (e) { /* downloads blocked in this view, the textarea remains */ }
}
function importBackup(text){
  let data; try { data = JSON.parse(text); } catch (e) { toast('That file is not a Food Detective backup'); return; }
  const st = data && data.state ? data.state : data;
  if (!st || typeof st !== 'object' || !st.days) { toast('That file is not a Food Detective backup'); return; }
  const incoming = normalizeState(st); const now = Date.now();
  Object.keys(incoming.days).forEach(d => { incoming.days[d].updatedAt = now; });
  incoming.meta.updatedAt = now;
  state = incoming; bump(); saveLocal();
  Object.keys(state.days).forEach(d => queuePush(d)); queuePush('meta');
  ui.exportText = ''; render(); checkBadges(); toast('Backup restored. ' + allEntries().length + ' foods loaded.');
}

// ---------- actions ----------
const ACTIONS = {
  'goto': el => { if (el.dataset.view === 'grownups') { ui.confirmErase = false; } setView(el.dataset.view); },
  'day-prev': () => { ui.date = addDays(ui.date, -1); renderView(); },
  'day-next': () => { ui.date = addDays(ui.date, 1); renderView(); },
  'day-today': () => { ui.date = todayStr(); renderView(); },
  'goto-day': el => { setView('today', { date: el.dataset.date }); },
  'add-food': el => openSheet('add', { meal: el.dataset.meal }),
  'edit-entry': el => openSheet('edit', { id: el.dataset.id, date: el.dataset.date }),
  'sheet-close': () => closeSheet(),
  'sheet-meal': el => { ui.sheet.meal = el.dataset.meal; if (ui.sheet.picked || ui.sheet.manual || ui.sheet.kind === 'edit') readDraftFromForm(); renderSheet(); },
  'sheet-manual': () => { ui.sheet.manual = true; ui.sheet.draft = blankDraft(); renderSheet(); setTimeout(() => { const el = $('#f-name'); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* ignore */ } } }, 60); },
  'sheet-back': () => { ui.sheet.picked = false; ui.sheet.manual = false; ui.sheet.ocrNote = ''; renderSheet(); },
  'pick-food': el => pickFood(el.dataset.src, parseInt(el.dataset.i, 10)),
  'qty': el => { readDraftFromForm(); const d = ui.sheet.draft; const step = d.qty < 1 || (d.qty === 1 && el.dataset.d === '-1') ? 0.25 : 0.5; d.qty = Math.max(0.25, Math.min(99, Math.round((d.qty + step * parseInt(el.dataset.d, 10)) * 100) / 100)); $('#f-qty').value = d.qty; if (state.meta.settings.showNumbers) $('#preview').innerHTML = previewText(d); syncAmountFromQty(); },
  'swap-open': el => openSheet('swap', { id: el.dataset.id, date: el.dataset.date }),
  'sheet-scan': () => { ui.sheet.mode = 'scan'; ui.sheet.scan = null; renderSheet(); },
  'sheet-ocr': () => { ui.sheet.mode = 'ocr'; ui.sheet.ocr = null; renderSheet(); },
  'scan-close': () => { stopCamera(); ui.sheet.mode = null; ui.sheet.scan = null; ui.sheet.ocr = null; renderSheet(); },
  'scan-again': () => { ui.sheet.scan = null; renderSheet(); },
  'scan-use': () => useScannedProduct(),
  'scan-to-ocr': () => { stopCamera(); ui.sheet.mode = 'ocr'; ui.sheet.scan = null; ui.sheet.ocr = null; renderSheet(); },
  'scan-to-manual': () => { stopCamera(); ui.sheet.mode = null; ui.sheet.scan = null; ui.sheet.ocr = null; ui.sheet.manual = true; ui.sheet.draft = blankDraft(); renderSheet(); setTimeout(() => { const el = $('#f-name'); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* ignore */ } } }, 60); },
  'family-disconnect': () => { ui.confirmLeave = true; refreshSyncViews(); },
  'family-disconnect-no': () => { ui.confirmLeave = false; refreshSyncViews(); },
  'family-disconnect-yes': () => { ui.confirmLeave = false; leaveFamily(); toast('This device is disconnected'); },
  'family-share': () => { shareJoinLink(); },
  'sync-open': () => { openSyncSheet(); syncNow(); },
  'report-range': el => { const id = el.dataset.range; ui.report = Object.assign({ preset: id }, presetRange(id)); renderView(); },
  'report-print': () => { try { window.print(); } catch (e) { toast('Printing is not available in this browser'); } },
  'report-excel': () => { const rr = ui.report || presetRange('7'); downloadExcel(reportData(rr.start, rr.end)); },
  'report-excel-quick': () => { downloadExcel(reportData(addDays(todayStr(), -6), todayStr())); },
  'sync-now': () => { syncNow(); toast('Syncing with the family journal\u2026'); },
  'toggle-group': el => { readDraftFromForm(); const d = ui.sheet.draft; const g = el.dataset.g; d.groups = d.groups || []; const i = d.groups.indexOf(g); if (i >= 0) d.groups.splice(i, 1); else d.groups.push(g); el.classList.toggle('on', i < 0); el.setAttribute('aria-pressed', String(i < 0)); },
  'set-level': el => { readDraftFromForm(); const d = ui.sheet.draft; const k = parseInt(el.dataset.k, 10); d.level = d.level === k ? null : k; renderSheet(); },
  'entry-delete': () => { ui.sheet.confirmDelete = true; readDraftFromForm(); renderSheet(); },
  'entry-delete-yes': () => deleteEntry(),
  'water': el => { const n = parseInt(el.dataset.n, 10); const before = snapshotGame(); const day = ensureDay(ui.date); day.water = day.water === n ? n - 1 : n; day.waterAt = Date.now(); touchDay(ui.date); renderView(); checkBadges(); checkHabits(); afterChange(before); },
  'energy': el => { const n = parseInt(el.dataset.n, 10); const before = snapshotGame(); const day = ensureDay(ui.date); day.energy = day.energy === n ? null : n; day.energyAt = Date.now(); touchDay(ui.date); renderView(); checkBadges(); afterChange(before); },
  'lesson-open': el => { ui.lesson = { id: el.dataset.id, index: 0, answers: {} }; ui.sort = null; ui.sugar = null; ui.nfTip = null; ui.arena = null; setView('learn'); },
  'lesson-close': () => { ui.lesson = null; setView('learn'); },
  'lesson-prev': () => { if (ui.lesson.index > 0) { ui.lesson.index--; ui.scrollReset = true; renderView(); } },
  'lesson-next': () => { const l = LESSONS.find(x => x.id === ui.lesson.id); if (ui.lesson.index < lessonPages(l).length - 1) { const before = snapshotGame(); ui.lesson.index++; ui.scrollReset = true; renderView(); afterChange(before); } },
  'lesson-answer': el => { ui.lesson.answers[ui.lesson.index] = parseInt(el.dataset.k, 10); renderView(); },
  'nf-tip': el => { ui.nfTip = el.dataset.tip; renderView(); },
  'sort-pick': el => { ui.sort.picked = parseInt(el.dataset.k, 10); if (ui.sort.picked === ui.sort.order[ui.sort.i].level) ui.sort.score++; renderView(); },
  'sort-next': () => { ui.sort.i++; ui.sort.picked = null; renderView(); },
  'sort-again': () => { ui.sort = null; renderView(); },
  'sugar-pick': el => { ui.sugar = parseInt(el.dataset.k, 10); renderView(); },
  'arena-start': () => { ui.lesson = null; const pool = LESSONS.flatMap(l => l.quiz); ui.arena = { qs: shuffle(pool).slice(0, 8), i: 0, score: 0, picked: null, saved: false }; setView('learn'); },
  'arena-answer': el => { const a = ui.arena; a.picked = parseInt(el.dataset.k, 10); if (a.picked === a.qs[a.i].a) a.score++; renderView(); },
  'arena-next': () => { const a = ui.arena; const before = snapshotGame(); a.i++; a.picked = null; if (a.i >= a.qs.length) { state.meta.progress.arenaDays[todayStr()] = true; } ui.scrollReset = true; renderView(); afterChange(before); },
  'arena-close': () => { ui.arena = null; setView('learn'); },
  'habit-pick': el => { const id = el.dataset.id; if (!habitDef(id) || activeHabits().length >= 2) return; const before = snapshotGame(); const recs = state.meta.progress.habits; const old = recs[id]; recs[id] = { startDate: todayStr(), days: old && old.days ? old.days : {}, mastered: null, stopped: null, at: Date.now() }; ui.pickOpen = true; touchMeta(); renderView(); toast(habitDef(id).em + ' New habit started. Day 1 is today!'); afterChange(before); },
  'habit-stop': el => { const rec = state.meta.progress.habits[el.dataset.id]; if (!rec) return; rec.stopped = Date.now(); rec.at = Date.now(); touchMeta(); renderView(); toast('Habit paused. Your days are saved.'); },
  'habit-check': el => { const id = el.dataset.id; const hd = habitDef(id); const rec = state.meta.progress.habits[id]; if (!hd || hd.auto || !rec) return; const date = ui.view === 'today' ? ui.date : todayStr(); if (date > todayStr()) { toast('That day has not happened yet'); return; } const before = snapshotGame(); if (rec.days[date]) delete rec.days[date]; else rec.days[date] = true; rec.at = Date.now(); touchMeta(); renderView(); checkHabits(); afterChange(before); },
  'case-pick': el => { const date = ui.date; if (state.meta.progress.cases[date]) return; const c = caseFor(date); const before = snapshotGame(); state.meta.progress.cases[date] = { pick: el.dataset.id, correct: el.dataset.id === c.answer }; touchMeta(); renderView(); afterChange(before); },
  'reward-given': el => { const kind = el.dataset.kind, key = el.dataset.key; const g = goalStatus(kind, key); if (!g.reached || g.given) return; state.meta.progress.rewards.ledger.push({ id: uid(), date: todayStr(), kind, key, label: g.label || (kind + ' reward'), stars: 0 }); touchMeta(); renderView(); toast('Marked as given'); },
  'gate-lock': () => { ui.gate = false; try { sessionStorage.removeItem('fe.gate'); } catch (e) { /* ignore */ } setView('today'); },
  'export-json': () => exportFile('json'),
  'export-csv': () => exportFile('csv'),
  'copy-export': async () => { try { await navigator.clipboard.writeText(ui.exportText); toast('Copied'); } catch (e) { const ta = $('#export-text'); if (ta) { ta.focus(); ta.select(); } toast('Select the text and copy it'); } },
  'erase-ask': () => { ui.confirmErase = true; renderView(); },
  'erase-no': () => { ui.confirmErase = false; renderView(); },
  'erase-yes': () => { ui.confirmErase = false; eraseEverything(); toast('Everything erased'); }
};
function bindEvents(){
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]'); if (!el) return;
    const fn = ACTIONS[el.dataset.action]; if (!fn) return;
    e.preventDefault();
    try { fn(el, e); } catch (err) { console.error(err); toast('Something went wrong. Try that again.'); }
  });
  document.addEventListener('submit', e => {
    if (e.target.id === 'food-form') { e.preventDefault(); saveSheet(); }
    else if (e.target.id === 'join-form') { e.preventDefault(); joinFamily($('#join-code').value); }
    else if (e.target.id === 'create-form') { e.preventDefault(); const nm = ($('#create-name').value || '').trim(); if (!nm) { toast('Add your child\u2019s first name'); $('#create-name').focus(); return; } joinFamily((ui.join && ui.join.code) || '', true, nm); }
    else if (e.target.id === 'device-form') { e.preventDefault(); setDeviceName(($('#device-name').value || '').trim()); remote.deviceAt = 0; pingDevice(true); refreshSyncViews(); toast('Device name saved'); }
    else if (e.target.id === 'bonus-form') {
      e.preventDefault();
      const reason = ($('#bonus-reason').value || '').trim(); const n = Math.max(1, Math.min(10, parseInt($('#bonus-stars').value, 10) || 0));
      if (!reason) { toast('Say what the bonus is for'); $('#bonus-reason').focus(); return; }
      const before = snapshotGame();
      state.meta.progress.rewards.ledger.push({ id: uid(), date: todayStr(), kind: 'bonus', key: '', label: reason.slice(0, 60), stars: n });
      touchMeta(); renderView(); celebrate('\u2B50 Bonus! +' + n + ' for ' + reason.slice(0, 40)); afterChange(before);
    }
    else if (e.target.id === 'gate-form') {
      e.preventDefault();
      const v = ($('#gate-input').value || '').trim();
      if (v === '42') { ui.gate = true; try { sessionStorage.setItem('fe.gate', '1'); } catch (err) { /* ignore */ } renderView(); }
      else { $('#gate-msg').textContent = 'Not quite. Six times seven.'; }
    }
  });
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'food-search') { ui.sheet.q = t.value; const r = $('#results'); if (r) r.innerHTML = resultsHTML(t.value); }
    else if (t.id === 'f-amount') { syncQtyFromAmount(); }
    else if (t.closest && t.closest('#food-form') && t.dataset.draft) {
      readDraftFromForm(); const p = $('#preview'); if (p && state.meta.settings.showNumbers) p.innerHTML = previewText(ui.sheet.draft);
      if (t.id === 'f-serving') { const row = $('#amount-row'); if (row) row.innerHTML = amountRowHTML(ui.sheet); }
      else if (t.id === 'f-qty') syncAmountFromQty();
    }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'f-unit') { ui.sheet.amountUnit = t.value; syncAmountFromQty(); return; }
    if (t.dataset && t.dataset.report && /^\d{4}-\d{2}-\d{2}$/.test(t.value)) { const rr = ui.report || (ui.report = Object.assign({ preset: '7' }, presetRange('7'))); rr[t.dataset.report] = t.value > todayStr() ? todayStr() : t.value; if (rr.end < rr.start) { const x = rr.start; rr.start = rr.end; rr.end = x; } rr.preset = ''; renderView(); return; }
    if (t.dataset && t.dataset.reward) {
      const rw = state.meta.progress.rewards; const k = t.dataset.reward;
      if (k === 'weeklyGoal' || k === 'monthlyGoal') rw[k] = Math.max(1, Math.min(k === 'weeklyGoal' ? 999 : 9999, parseInt(t.value, 10) || rw[k]));
      else rw[k] = t.value.trim().slice(0, 80);
      state.meta.rewardsAt = Date.now(); touchMeta(); renderView();
    } else if (t.dataset && t.dataset.setting) {
      const s = state.meta.settings; const k = t.dataset.setting;
      if (t.type === 'checkbox') s[k] = !!t.checked;
      else if (k === 'name') s.name = t.value.trim().slice(0, 30);
      else if (k === 'age') s.age = parseInt(t.value, 10);
      else if (k === 'activity') s.activity = t.value;
      else s[k] = t.value === '' ? null : Math.max(0, num(t.value)) || null;
      state.meta.settingsAt = Date.now(); touchMeta(); renderTop(); if (k !== 'name') renderView();
    } else if (t.id === 'scan-file' && t.files && t.files[0]) {
      const f = t.files[0]; t.value = ''; decodeBarcodeFile(f).catch(() => setScanStatus('Could not read that photo. Try again or type it in.'));
    } else if ((t.id === 'ocr-file' || t.id === 'ocr-file2') && t.files && t.files[0]) {
      const f = t.files[0]; t.value = ''; readLabelFile(f);
    } else if (t.id === 'import-file' && t.files && t.files[0]) {
      const reader = new FileReader(); reader.onload = () => importBackup(String(reader.result || '')); reader.readAsText(t.files[0]); t.value = '';
    }
  });
  window.addEventListener('hashchange', () => { if (handleJoinHash()) return; const v = location.hash.replace('#', ''); if (VIEWS.indexOf(v) >= 0 && v !== ui.view) { ui.view = v; ui.scrollReset = true; render(); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && ui.sheet) closeSheet(); });
}

// ---------- start ----------
async function shareJoinLink(){
  const url = joinLink(); const text = 'Tap this link to connect this device to our Food Detective family journal.';
  if (navigator.share) { try { await navigator.share({ title: 'Food Detective family link', text, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(url); toast('Family link copied. Paste it into a text to each device.'); return; } catch (e) { /* show it instead */ }
  ui.shareText = url; refreshSyncViews();
}
function handleJoinHash(){
  const m = /join=([^&]+)/.exec(location.hash); if (!m) return false;
  let code = ''; try { code = decodeURIComponent(m[1]); } catch (e) { code = m[1]; }
  try { history.replaceState(null, '', location.pathname + location.search + '#today'); } catch (e) { /* ignore */ }
  ui.view = 'today';
  if (normalizeCode(code) && normalizeCode(code) !== familyCode()) joinFamily(code); else { render(); if (!remote.fam) startSync(); }
  return true;
}
function init(){
  if (!loadLocal()) { state = freshState(false); saveLocal(); }
  migrateFamilyCode();
  try { if (sessionStorage.getItem('fe.gate') === '1') ui.gate = true; } catch (e) { /* ignore */ }
  const v = location.hash.replace('#', ''); if (VIEWS.indexOf(v) >= 0) ui.view = v;
  ui.date = todayStr();
  render();
  bindEvents();
  installLifecycle();
  checkBadges();
  if (!handleJoinHash()) startSync();
  setTimeout(checkForUpdate, 4000);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
</script>
</body>
</html>
