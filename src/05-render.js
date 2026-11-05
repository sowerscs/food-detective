
// ---------- ui state and rendering ----------
const VIEWS = ['today', 'week', 'learn', 'badges', 'grownups', 'report'];
const ui = { view: 'today', date: todayStr(), lesson: null, arena: null, sort: null, sugar: null, nfTip: null, gate: false, sheet: null, confirmErase: false, exportText: '' };
const ICONS = {
  today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>',
  week: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  badges: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9Z"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
  mark: '<svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#5BB6E8"/><circle cx="27" cy="27" r="13" fill="#fff"/><circle cx="27" cy="27" r="8" fill="#D98B3C"/><circle cx="23" cy="24" r="2.5" fill="#fff"/><path d="M37 37l11 11" stroke="#fff" stroke-width="7" stroke-linecap="round"/></svg>'
};
function render(){ renderTop(); renderTabs(); renderView(); }
function renderTop(){
  const s = syncText();
  $('#topbar').innerHTML = '<div class="brand">' + ICONS.mark + '<div><div class="brand-name">Food Detective</div><div class="brand-tag">Every bite is a clue</div></div></div>' +
    (needsJoin() ? '' : '<button class="sync-pill" data-action="sync-open" aria-label="' + esc(s.label) + '"><span class="sync-dot ' + s.dot + '"></span><span>' + esc(s.short) + '</span></button>') +
    '<button class="icon-btn" data-action="goto" data-view="grownups" aria-label="Chief\u2019s office">' + ICONS.gear + '</button>';
}
function renderTabs(){
  if (needsJoin()) { $('#tabbar').innerHTML = ''; return; }
  const tabs = [['today', 'Today'], ['week', 'Case files'], ['learn', 'Academy'], ['badges', 'HQ']];
  $('#tabbar').innerHTML = tabs.map(t => '<button class="tab' + (ui.view === t[0] ? ' active' : '') + '" data-action="goto" data-view="' + t[0] + '" aria-current="' + (ui.view === t[0] ? 'page' : 'false') + '">' + ICONS[t[0]] + '<span>' + t[1] + '</span></button>').join('');
}
function renderView(){
  const v = $('#view'); const top = v.scrollTop;
  let html = '';
  document.body.classList.toggle('joining', needsJoin());
  if (needsJoin()) { v.innerHTML = joinHTML(); v.scrollTop = 0; $('#fab').style.display = 'none'; return; }
  if (ui.view === 'today') html = syncBannerHTML() + renderToday();
  else if (ui.view === 'week') html = renderWeek();
  else if (ui.view === 'learn') html = ui.lesson ? renderLesson() : (ui.arena ? renderArena() : renderLearn());
  else if (ui.view === 'badges') html = renderBadges();
  else if (ui.view === 'report') html = renderReport();
  else html = renderGrownups();
  v.innerHTML = html;
  v.scrollTop = ui.scrollReset ? 0 : top;
  ui.scrollReset = false;
  $('#fab').style.display = ui.view === 'today' ? '' : 'none';
}
function setView(view, opts){
  if (VIEWS.indexOf(view) < 0) view = 'today';
  ui.view = view; ui.scrollReset = true;
  if (opts && opts.date) ui.date = opts.date;
  try { if (location.hash !== '#' + view) history.replaceState(null, '', '#' + view); } catch (e) { /* no history access */ }
  render();
}
function gaugeHTML(cls, val, ref, label){
  const scale = Math.max(ref, val) * 1.06;
  return '<div class="gauge ' + cls + '"><i style="width:' + pct(val, scale).toFixed(1) + '%"></i><span class="tick" style="left:' + pct(ref, scale).toFixed(1) + '%" data-label="' + esc(label) + '"></span></div>';
}
function tankLabel(ratio){
  if (ratio <= 0) return 'Empty tank';
  if (ratio < 0.35) return 'Just getting started';
  if (ratio < 0.7) return 'Halfway fueled';
  if (ratio <= 1.05) return 'Fueled up';
  return 'Big fuel day';
}
function renderToday(){
  const date = ui.date, day = getDay(date), t = totals(day), r = refs(), s = state.meta.settings; const show = !!s.showNumbers;
  const isToday = date === todayStr();
  let h = '<div class="daynav"><button class="icon-btn" data-action="day-prev" aria-label="Previous day">‹</button><div class="daynav-mid"><div class="daynav-title">' + esc(niceDate(date)) + '</div>' +
    (isToday ? '<div class="daynav-sub">' + esc(greeting()) + ', Detective' + (s.name ? ' ' + esc(s.name) : '') + '!</div>' : '<button class="link" data-action="day-today">Jump to today</button>') +
    '</div><button class="icon-btn" data-action="day-next" aria-label="Next day">›</button></div>';
  h += questsCardHTML(date);
  h += caseCardHTML(date);
  const big = t.kcal > r.kcal * 1.05;
  const note = t.kcal === 0 ? 'Nothing logged yet. Tap + Add food to start.' : show ? 'A typical day for you uses about ' + fmt(r.kcal, 0) + '. ' + (big ? 'Big fuel day! Busy, growing bodies use lots.' : 'Numbers are for learning, not limits.') : 'The marker is a typical day. ' + (big ? 'Busy, growing bodies go past it, and that is normal.' : 'Your body is the boss of how hungry you are.');
  h += '<section class="card"><div class="card-head"><h2>' + (show ? 'Fuel logged ' + (isToday ? 'today' : 'this day') : 'Fuel tank') + '</h2><span class="small muted">' + day.entries.length + ' food' + (day.entries.length === 1 ? '' : 's') + '</span></div>' +
    (show ? '<div class="fuel-big"><b class="num">' + fmt(t.kcal, 0) + '</b><span>calories</span></div>' : '<div class="fuel-big"><b style="font-size:30px">' + esc(tankLabel(t.kcal / r.kcal)) + '</b></div>') +
    gaugeHTML('', t.kcal, r.kcal, show ? 'typical day ' + fmt(r.kcal, 0) : 'typical day') +
    '<div class="gauge-note">' + esc(note) + '</div><div class="macros">' +
    macroTile('protein', 'Protein', 'building blocks', t.p, r.p, show) + macroTile('carb', 'Carbs', 'quick energy', t.c, r.c, show) + macroTile('fat', 'Fat', 'brain food', t.f, r.f, show) + '</div>' + mixHTML(t, show) + '</section>';
  h += plateCardHTML(day);
  h += '<section class="card"><div class="card-head"><h2>Water</h2><span class="small muted">' + day.water + ' cup' + (day.water === 1 ? '' : 's') + '</span></div><div class="cups">' +
    [1,2,3,4,5,6,7,8].map(n => '<button class="cup' + (day.water >= n ? ' on' : '') + '" data-action="water" data-n="' + n + '" aria-label="' + n + ' cups of water" aria-pressed="' + (day.water >= n) + '"><svg viewBox="0 0 30 38"><path class="fill" d="M6 6h18l-2 28H8z"/><path class="outline" d="M5 5h20l-2.2 29H7.2z"/></svg></button>').join('') +
    '</div><p class="hint">Tap a cup each time you drink one.</p></section>';
  h += '<section class="card"><div class="card-head"><h2>Energy check-in</h2></div><p class="small muted" style="margin-top:0">How is your energy right now?</p><div class="faces">' +
    FACES.map(f => '<button class="face' + (day.energy === f.id ? ' on' : '') + '" data-action="energy" data-n="' + f.id + '" aria-pressed="' + (day.energy === f.id) + '"><span class="em">' + f.em + '</span>' + f.name + '</button>').join('') + '</div></section>';
  MEALS.forEach(m => {
    const list = day.entries.filter(e => e.meal === m.id);
    const sub = list.reduce((a, e) => a + entryTotals(e).kcal, 0);
    h += '<section class="card meal"><div class="meal-head"><span class="em">' + m.icon + '</span><h2>' + m.name + '</h2>' + (list.length && show ? '<span class="kcal num">' + fmt(sub, 0) + ' cal</span>' : '') + '</div>';
    if (!list.length) h += '<p class="empty">Nothing here yet.</p>';
    list.forEach(e => {
      const et = entryTotals(e); const tr = entryTraits(e);
      h += '<div class="entry"><button class="entry-main" data-action="edit-entry" data-id="' + esc(e.id) + '" data-date="' + date + '"><span class="em">' + esc(e.icon || '\u{1F37D}️') + '</span><span class="mid"><div class="name">' + esc(e.name) + '</div><div class="serv">' + esc(servingLabel(e)) + (!show && (e.groups || []).length ? ' · ' + (e.groups || []).map(g => (GROUPS.find(x => x.id === g) || {}).icon || '').join('') : '') + '</div></span>' +
        (show ? '<span><div class="kcal num">' + fmt(et.kcal, 0) + '</div><div class="pcf num">P ' + fmt(et.p) + ' · C ' + fmt(et.c) + ' · F ' + fmt(et.f) + '</div></span>' : '<span class="muted">›</span>') + '</button>' +
        (tr.length ? '<div class="traits">' + tr.map(x => '<button class="trait" data-action="swap-open" data-id="' + esc(e.id) + '" data-date="' + date + '">' + x.em + ' ' + esc(x.label) + ' · swap ideas</button>').join('') + '</div>' : '') + '</div>';
    });
    h += '<button class="meal-add" data-action="add-food" data-meal="' + m.id + '">+ Add to ' + m.name + '</button></section>';
  });
  const fi = (parseDate(date).getTime() / 86400000) | 0;
  h += '<section class="card" style="background:var(--carb-soft)"><div class="card-head"><h2>\u{1F4A1} Did you know?</h2></div><p style="margin:0;font-weight:700">' + esc(FACTS[((fi % FACTS.length) + FACTS.length) % FACTS.length]) + '</p></section>';
  return h;
}
function plateCardHTML(day){
  const g = groupsOf(day); const on = id => g.has(id);
  const sector = (id, d, cx, cy, icon) => '<path d="' + d + '" class="sec' + (on(id) ? ' on ' + id : '') + '"/><text x="' + cx + '" y="' + cy + '" class="sec-icon">' + icon + '</text>';
  const ic = id => (GROUPS.find(x => x.id === id) || {}).icon;
  const svg = '<svg class="plate" viewBox="0 0 170 120" role="img" aria-label="Plate with the food groups logged today"><circle cx="60" cy="60" r="56" class="rim"/>' +
    sector('fruit', 'M60,60 L10,60 A50,50 0 0,1 60,10 Z', 36, 42, ic('fruit')) +
    sector('veg', 'M60,60 L60,10 A50,50 0 0,1 110,60 Z', 84, 42, ic('veg')) +
    sector('protein', 'M60,60 L110,60 A50,50 0 0,1 60,110 Z', 84, 90, ic('protein')) +
    sector('grain', 'M60,60 L60,110 A50,50 0 0,1 10,60 Z', 36, 90, ic('grain')) +
    '<rect x="128" y="42" width="30" height="48" rx="6" class="sec cup' + (on('dairy') ? ' on dairy' : '') + '"/><text x="143" y="72" class="sec-icon">' + ic('dairy') + '</text></svg>';
  const n = GROUPS.filter(x => on(x.id)).length;
  return '<section class="card"><div class="card-head"><h2>My plate</h2><span class="small muted">' + n + ' of 5 groups</span></div>' + svg +
    '<p class="hint" style="text-align:center;margin-top:6px">' + (n === 5 ? 'Every group on the plate. High five!' : n === 0 ? 'Fruits, veggies, grains, protein, and dairy light up as you log them.' : 'Still open ' + GROUPS.filter(x => !on(x.id)).map(x => x.name.toLowerCase()).join(', ') + '.') + '</p></section>';
}
function questsCardHTML(date){
  const n = stars(); const rk = rankFor(n); const nx = nextRank(n); const qs = questStatus(date); const done = qs.filter(x => x.done).length; const si = streakInfo();
  const wk = challengeProgress(weekStart(date)); const isToday = date === todayStr();
  let h = '<section class="card" style="padding:12px 16px"><div class="row between" style="margin-bottom:8px"><span class="status">' + rk.em + ' ' + esc(rk.name) + '</span><span class="status num">⭐ ' + n + '</span><span class="status num" title="Every 5 logged days bank a rest day">\u{1F525} ' + si.count + (si.banked > 0 ? ' <span class="small muted">\u{1F6E1}️' + si.banked + '</span>' : '') + '</span></div>' +
    (nx ? '<div class="gauge" style="height:8px"><i style="width:' + pct(n - rk.min, nx.min - rk.min).toFixed(1) + '%;background:var(--fat)"></i></div><p class="hint" style="margin:4px 0 10px">' + (nx.min - n) + ' stars to ' + nx.em + ' ' + esc(nx.name) + '</p>' : '<p class="hint" style="margin:4px 0 10px">Top rank reached. Legendary.</p>');
  h += '<div class="row between" style="margin-bottom:2px"><b>' + wk.ch.em + ' ' + esc(wk.ch.name) + '</b><span class="small muted num">' + wk.n + ' of ' + wk.ch.target + ' · +10</span></div><div class="gauge" style="height:8px;margin-bottom:4px"><i style="width:' + pct(wk.n, wk.ch.target).toFixed(1) + '%;background:var(--carb)"></i></div><p class="hint" style="margin:0 0 10px">' + (wk.done ? 'Challenge complete! Trophy earned.' : esc(wk.ch.text) + ' this week.') + '</p>';
  const fday = getDay(date); const fm = ['breakfast','lunch','dinner'].map(m => fday.entries.some(e => e.meal === m)); const fg = GROUPS.filter(g => groupsOf(fday).has(g.id)).length; const fd = fueledDay(fday);
  h += '<div class="row between"><b>\u{1F50B} Fueled day</b><span class="small muted">' + (fd ? '+3 earned' : '+3') + '</span></div><div class="row wrap" style="gap:6px;margin:4px 0 10px">' +
    ['Breakfast','Lunch','Dinner'].map((m, k) => '<span class="chip' + (fm[k] ? ' on' : '') + '" style="min-height:30px;padding:3px 10px;font-size:13px">' + (fm[k] ? '\u2705 ' : '') + m + '</span>').join('') + '<span class="chip' + (fg >= 3 ? ' on' : '') + '" style="min-height:30px;padding:3px 10px;font-size:13px">' + (fg >= 3 ? '\u2705 ' : '') + '3 food groups</span></div>';
  h += '<div class="row between"><b>' + (isToday ? 'Today’s missions' : 'Missions for this day') + '</b><span class="small muted">' + done + ' of 3 · +2 each</span></div>' +
    qs.map(x => '<div class="row" style="padding:5px 0;font-weight:800;' + (x.done ? 'color:var(--good)' : '') + '"><span style="font-size:20px;width:26px;text-align:center">' + (x.done ? '✅' : x.q.em) + '</span><span style="flex:1;' + (x.done ? 'text-decoration:line-through;opacity:.8' : '') + '">' + esc(x.q.text) + '</span></div>').join('');
  const act = activeHabits();
  if (act.length) {
    h += '<div class="row between" style="margin-top:8px"><b>My habits</b><span class="small muted">+1 a day</span></div>' + act.map(id => {
      const hd = habitDef(id); const on = habitDoneOn(id, date); const days = habitDays(id);
      return '<button type="button" class="row" style="width:100%;text-align:left;background:none;border:0;padding:6px 0;font-weight:800;color:' + (on ? 'var(--good)' : 'var(--ink)') + '" data-action="habit-check" data-id="' + id + '" aria-pressed="' + on + '"' + (hd.auto ? ' disabled' : '') + '><span style="font-size:20px;width:26px;text-align:center">' + (on ? '✅' : hd.em) + '</span><span style="flex:1">' + esc(hd.name) + '</span><span class="small muted num">' + Math.min(days, HABIT_GOAL) + '/' + HABIT_GOAL + (hd.auto ? ' · auto' : on ? '' : ' · tap') + '</span></button>';
    }).join('');
  } else {
    h += '<p class="hint" style="margin-top:8px"><button class="link" data-action="goto" data-view="badges">Pick a habit to practice ›</button></p>';
  }
  return h + '</section>';
}
function caseCardHTML(date){
  const c = caseFor(date); const rec = state.meta.progress.cases[date];
  let h = '<section class="card"><div class="card-head"><h2>\u{1F575}️ Daily case</h2><span class="small muted">+1 star</span></div><div class="row" style="margin-bottom:8px"><span style="font-size:40px">' + esc(c.food.icon) + '</span><div><div style="font-family:var(--font-display);font-size:19px;font-weight:600">' + esc(c.food.name) + '</div><div class="small muted" style="font-weight:700">' + esc(c.question) + '</div></div></div>';
  h += c.opts.map(o => { let cls = 'opt'; if (rec) { if (o.id === c.answer) cls += ' correct'; else if (o.id === rec.pick) cls += ' wrong'; } return '<button class="' + cls + '" data-action="case-pick" data-id="' + esc(o.id) + '"' + (rec ? ' disabled' : '') + '>' + o.label + '</button>'; }).join('');
  if (rec) h += '<div class="feedback ' + (rec.correct ? 'ok' : 'no') + '">' + (rec.correct ? 'Case closed! ' : 'Not this time. ') + esc(c.why) + '</div>';
  return h + '</section>';
}
function macroTile(cls, label, sub, val, ref, show){
  return '<div class="macro ' + cls + '"><div class="lbl">' + label + '</div><div class="sub">' + sub + '</div>' + (show ? '<div class="val num">' + fmt(val) + ' <small>g</small></div>' : '<div style="height:8px"></div>') + gaugeHTML(cls, val, ref, show ? fmt(ref, 0) : '') + '</div>';
}
function mixHTML(t, show){
  const pk = t.p * 4, ck = t.c * 4, fk = t.f * 9, sum = pk + ck + fk;
  if (sum <= 0) return '';
  const P = Math.round(pk / sum * 100), C = Math.round(ck / sum * 100), Fp = Math.max(0, 100 - P - C);
  return '<div class="mix"><div class="small muted" style="font-weight:800;margin-bottom:4px">Where the energy comes from</div><div class="mix-bar"><i class="p" style="width:' + P + '%"></i><i class="c" style="width:' + C + '%"></i><i class="f" style="width:' + Fp + '%"></i></div>' +
    '<div class="legend"><span class="p"><i></i>Protein' + (show ? ' ' + P + '%' : '') + '</span><span class="c"><i></i>Carbs' + (show ? ' ' + C + '%' : '') + '</span><span class="f"><i></i>Fat' + (show ? ' ' + Fp + '%' : '') + '</span></div>' +
    (show ? '<p class="hint">Over a whole day, kids usually land around carbs 45 to 65%, protein 10 to 30%, fat 25 to 35%.</p>' : '<p class="hint">A mix of all three is the goal. Carbs usually take the biggest slice.</p>') + '</div>';
}
function renderWeek(){
  const t = todayStr(); const r = refs();
  const dates = []; for (let i = 6; i >= 0; i--) dates.push(addDays(t, -i));
  const days = dates.map(d => getDay(d));
  const logged = days.filter(d => d.entries.length).length;
  const names = new Set(); days.forEach(d => d.entries.forEach(e => names.add(e.name.trim().toLowerCase())));
  const rainbow = days.filter(d => { const g = groupsOf(d); return g.has('fruit') && g.has('veg'); }).length;
  const en = days.filter(d => d.energy); const avg = en.length ? en.reduce((a, d) => a + d.energy, 0) / en.length : 0;
  const face = avg ? FACES[Math.min(3, Math.max(0, Math.round(avg) - 1))] : null;
  let h = '<h2 style="font-size:22px;margin:10px 0 6px">Last 7 days</h2><div class="tiles">' +
    '<div class="tile"><div class="v num">' + logged + '<span class="muted" style="font-size:16px">/7</span></div><div class="l">days logged</div></div>' +
    '<div class="tile"><div class="v num">' + names.size + '</div><div class="l">different foods</div></div>' +
    '<div class="tile"><div class="v num">' + rainbow + '</div><div class="l">rainbow days</div></div>' +
    '<div class="tile"><div class="v">' + (face ? face.em + ' <span style="font-size:16px">' + face.name + '</span>' : '<span class="muted" style="font-size:16px">no check-ins</span>') + '</div><div class="l">typical energy</div></div></div>';
  const show = !!state.meta.settings.showNumbers;
  const kcals = days.map(d => totals(d).kcal); const scale = Math.max(r.kcal, Math.max.apply(null, kcals)) * 1.15;
  h += '<section class="card"><div class="card-head"><h2>Fuel by day</h2><span class="small muted">' + (show ? 'calories' : 'fuel tank') + '</span></div><div class="chart"><div class="ref-line" style="bottom:' + (22 + pct(r.kcal, scale) * 1.10).toFixed(1) + 'px"><span>typical day' + (show ? ' ' + fmt(r.kcal, 0) : '') + '</span></div>' +
    days.map((d, i) => { const k = kcals[i]; const dd = parseDate(d.date); return '<div class="bar-col' + (d.date === t ? ' today' : '') + '"><div class="v num">' + (k && show ? fmt(k, 0) : '') + '</div><div class="bar' + (k ? '' : ' empty') + '" style="height:' + (k ? pct(k, scale) : 2).toFixed(1) + '%"></div><div class="d">' + WEEKDAYS[dd.getDay()].slice(0, 3) + '</div></div>'; }).join('') +
    '</div><p class="hint">The dashed line is a typical day, not a limit. Busy days land above it and that is normal.</p></section>';
  days.slice().reverse().forEach(d => {
    const dd = parseDate(d.date); const tt = totals(d); const g = groupsOf(d);
    h += '<button class="dayrow" data-action="goto-day" data-date="' + d.date + '"><span class="d"><b>' + (d.date === t ? 'Today' : WEEKDAYS[dd.getDay()].slice(0, 3)) + '</b><span>' + MONTHS[dd.getMonth()] + ' ' + dd.getDate() + '</span></span><span class="mid">' +
      (d.entries.length ? '<b>' + d.entries.length + ' food' + (d.entries.length === 1 ? '' : 's') + '</b>' + (show ? ' · P ' + fmt(tt.p, 0) + ' · C ' + fmt(tt.c, 0) + ' · F ' + fmt(tt.f, 0) : ' · ' + GROUPS.filter(x => g.has(x.id)).length + ' groups') + '<br><span class="ems">' + GROUPS.filter(x => g.has(x.id)).map(x => x.icon).join('') + (d.water ? ' \u{1F4A7}' + d.water : '') + (d.energy ? ' ' + FACES[d.energy - 1].em : '') + '</span>' : 'Nothing logged') +
      '</span>' + (d.entries.length && show ? '<span class="kcal num">' + fmt(tt.kcal, 0) + '</span>' : '') + '</button>';
  });
  return h;
}
function renderLearn(){
  const p = state.meta.progress; const done = LESSONS.filter(l => p.lessons[l.id]).length;
  let h = '<section class="card" style="background:var(--accent);color:var(--accent-ink)"><h2 style="color:inherit;font-size:22px">Food Detective Academy</h2><p style="margin:4px 0 0;font-weight:700">' + done + ' of ' + LESSONS.length + ' lessons done · ' + stars() + ' stars</p></section>';
  h += '<section class="card"><div class="card-head"><h2>\u{1F3DF}️ Quiz Arena</h2><span class="small muted">best ' + p.quizBest + '/8</span></div><p class="small muted" style="margin:0 0 10px">8 random questions from every lesson. Score 8 of 8 for the Quiz Whiz badge.</p><button class="btn block" data-action="arena-start">Start a round</button></section>';
  h += '<div class="lesson-list">' + LESSONS.map((l, i) => '<button class="lesson-card" data-action="lesson-open" data-id="' + l.id + '"><span class="em">' + l.icon + '</span><span class="mid"><div class="t">' + (i + 1) + '. ' + esc(l.title) + '</div><div class="b">' + esc(l.blurb) + '</div></span>' + (p.lessons[l.id] ? '<span class="done">✓ done</span>' : '<span class="muted small">›</span>') + '</button>').join('') + '</div>';
  return h;
}
function lessonPages(l){ return l.slides.concat(l.quiz.map(q => ({ type: 'quiz', q }))).concat([{ type: 'done' }]); }
function renderLesson(){
  const l = LESSONS.find(x => x.id === ui.lesson.id); const pages = lessonPages(l); const i = ui.lesson.index; const pg = pages[i];
  let h = '<div class="lesson-top"><button class="icon-btn" data-action="lesson-close" aria-label="Back to lessons">‹</button><h2>' + l.icon + ' ' + esc(l.title) + '</h2></div>' +
    '<div class="dots">' + pages.map((x, k) => '<span class="dot' + (k === i ? ' on' : k < i ? ' seen' : '') + '"></span>').join('') + '</div><section class="card slide">';
  let canNext = true;
  if (pg.html) h += pg.html;
  else if (pg.type === 'label') h += labelHTML();
  else if (pg.type === 'sort') h += sortHTML();
  else if (pg.type === 'sugar') h += sugarHTML();
  else if (pg.type === 'quiz') { const picked = ui.lesson.answers[i]; canNext = picked != null; h += quizHTML(pg.q, picked, 'lesson-answer'); }
  else if (pg.type === 'done') {
    const first = !state.meta.progress.lessons[l.id];
    if (first) { state.meta.progress.lessons[l.id] = Date.now(); touchMeta(); setTimeout(() => { checkBadges(); }, 50); celebrate('⭐ +3 stars. ' + l.title + ' complete!'); }
    const right = l.quiz.filter((q, k) => ui.lesson.answers[l.slides.length + k] === q.a).length;
    const idx = LESSONS.indexOf(l); const next = LESSONS[idx + 1];
    h += '<div class="big-em">\u{1F389}</div><h3 style="text-align:center">Lesson complete!</h3><p style="text-align:center">You got ' + right + ' of ' + l.quiz.length + ' quiz questions right.</p>' +
      '<div class="lesson-foot"><button class="btn secondary" data-action="lesson-close">All lessons</button>' + (next ? '<button class="btn" data-action="lesson-open" data-id="' + next.id + '">Next lesson ›</button>' : '<button class="btn" data-action="arena-start">Quiz Arena</button>') + '</div>';
  }
  h += '</section>';
  if (pg.type !== 'done') h += '<div class="lesson-foot"><button class="btn secondary" data-action="lesson-prev"' + (i === 0 ? ' disabled' : '') + '>‹ Back</button><button class="btn" data-action="lesson-next"' + (canNext ? '' : ' disabled') + '>' + (pages[i + 1] && pages[i + 1].type === 'done' ? 'Finish' : 'Next ›') + '</button></div>';
  return h;
}
function quizHTML(q, picked, action){
  let h = '<h3>' + esc(q.q) + '</h3>';
  q.opts.forEach((o, k) => { let cls = 'opt'; if (picked != null) { if (k === q.a) cls += ' correct'; else if (k === picked) cls += ' wrong'; } h += '<button class="' + cls + '" data-action="' + action + '" data-k="' + k + '"' + (picked != null ? ' disabled' : '') + '>' + esc(o) + '</button>'; });
  if (picked != null) h += '<div class="feedback ' + (picked === q.a ? 'ok' : 'no') + '">' + (picked === q.a ? 'Yes! ' : 'Not quite. ') + esc(q.why) + '</div>';
  return h;
}
function labelHTML(){
  const tip = ui.nfTip; const on = k => (tip === k ? ' on' : '');
  const row = (k, cls, left, right) => '<button class="nf-row ' + cls + on(k) + '" data-action="nf-tip" data-tip="' + k + '"><span>' + left + '</span>' + (right ? '<b>' + right + '</b>' : '') + '</button>';
  return '<h3>Tap any line</h3><div class="nf"><div class="nf-title">Nutrition Facts</div>' +
    row('servings', 'noline', '10 servings per container', '') + row('serving', '', '<b>Serving size</b>', '1 cup (28g)') +
    row('calories', 'thick', '<span class="small">Amount per serving</span><br><span class="callbl">Calories</span>', '<span class="cal">100</span>') +
    row('dv', 'med', '', '% Daily Value*') +
    row('fat', '', '<b>Total Fat</b> 2g', '3%') + row('satfat', 'indent', 'Saturated Fat 0g', '0%') + row('trans', 'indent', '<i>Trans</i> Fat 0g', '') +
    row('sodium', '', '<b>Sodium</b> 140mg', '6%') + row('carbs', '', '<b>Total Carbohydrate</b> 20g', '7%') + row('fiber', 'indent', 'Dietary Fiber 3g', '11%') +
    row('sugars', 'indent', 'Total Sugars 1g', '') + row('added', 'indent2', 'Includes 1g Added Sugars', '2%') + row('protein', '', '<b>Protein</b> 3g', '') +
    row('vitamins', 'thick', 'Vitamin D 2mcg 10% · Calcium 130mg 10%<br>Iron 9mg 50% · Potassium 180mg 4%', '') +
    '<button class="nf-foot' + on('dv') + '" data-action="nf-tip" data-tip="dv">* The % Daily Value tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.</button>' +
    '<button class="nf-ing' + on('ingredients') + '" data-action="nf-tip" data-tip="ingredients"><b>INGREDIENTS:</b> Whole grain oats, corn starch, sugar, salt, tripotassium phosphate, vitamin E (mixed tocopherols) added to preserve freshness.</button></div>' +
    '<div class="nf-tip">' + esc(tip ? LABEL_TIPS[tip] : 'Tap any line on the label to learn what it means. Start with the serving size.') + '</div>';
}
function sortHTML(){
  if (!ui.sort) ui.sort = { order: shuffle(SORT_ITEMS), i: 0, score: 0, picked: null };
  const g = ui.sort;
  if (g.i >= g.order.length) return '<h3>Sort it! Results</h3><div class="score">' + g.score + ' of ' + g.order.length + '</div><p style="text-align:center">' + (g.score === g.order.length ? 'Perfect sorting, detective!' : g.score >= 7 ? 'Great detective work!' : 'Good try. Play again and watch for the long ingredient lists.') + '</p><button class="btn block secondary" data-action="sort-again">Play again</button>';
  const it = g.order[g.i];
  let h = '<h3>Sort it! ' + (g.i + 1) + ' of ' + g.order.length + '</h3><div class="sort-card"><div class="em">' + it.em + '</div><div class="name">' + esc(it.name) + '</div></div><div class="levels">' +
    LEVELS.map(L => { let cls = 'lvl'; if (g.picked != null) { if (L.id === it.level) cls += ' correct'; else if (L.id === g.picked) cls += ' wrong'; } return '<button class="' + cls + '" data-action="sort-pick" data-k="' + L.id + '"' + (g.picked != null ? ' disabled' : '') + '><b>' + L.id + '</b>' + esc(L.name) + '</button>'; }).join('') + '</div>';
  if (g.picked != null) h += '<div class="feedback ' + (g.picked === it.level ? 'ok' : 'no') + '">' + (g.picked === it.level ? 'Yes! ' : 'Not quite. Level ' + it.level + '. ') + esc(it.why) + '</div><button class="btn block" style="margin-top:10px" data-action="sort-next">' + (g.i + 1 >= g.order.length ? 'See results' : 'Next food ›') + '</button>';
  return h;
}
function sugarHTML(){
  const picked = ui.sugar;
  const best = SUGAR_DRINKS.reduce((a, d, k) => d.added > SUGAR_DRINKS[a].added ? k : a, 0);
  let h = '<h3>Sugar detective</h3><p>Which drink has the MOST added sugar? Tap one.</p><div class="drinks">' +
    SUGAR_DRINKS.map((d, k) => { let cls = 'drink'; if (picked != null) { if (k === best) cls += ' correct'; else if (k === picked) cls += ' wrong'; } return '<button class="' + cls + '" data-action="sugar-pick" data-k="' + k + '"' + (picked != null ? ' disabled' : '') + '><span class="em">' + d.em + '</span>' + esc(d.name) + '<span class="sub">' + esc(d.sub) + '</span></button>'; }).join('') + '</div>';
  if (picked != null) h += '<div class="feedback ' + (picked === best ? 'ok' : 'no') + '">' + (picked === best ? 'Yes! ' : 'Not quite. ') + 'Cola has the most added sugar.</div><ul style="padding-left:18px;margin-top:8px">' + SUGAR_DRINKS.map(d => '<li><b>' + esc(d.name) + '.</b> ' + esc(d.why) + '</li>').join('') + '</ul>';
  return h;
}
function renderArena(){
  const a = ui.arena;
  if (a.i >= a.qs.length) {
    const p = state.meta.progress;
    if (!a.saved) { a.saved = true; p.quizRounds++; if (a.score > p.quizBest) { p.quizBest = a.score; p.quizBestDate = todayStr(); } touchMeta(); setTimeout(() => checkBadges(), 50); }
    return '<div class="lesson-top"><button class="icon-btn" data-action="arena-close" aria-label="Back to lessons">‹</button><h2>\u{1F3DF}️ Quiz Arena</h2></div><section class="card"><div class="big-em">' + (a.score === 8 ? '\u{1F3C6}' : a.score >= 6 ? '\u{1F31F}' : '\u{1F4AA}') + '</div><div class="score">' + a.score + ' of 8</div><p style="text-align:center">' + (a.score === 8 ? 'Perfect round! Quiz Whiz!' : a.score >= 6 ? 'Great round. The lessons have the rest.' : 'Nice try. Replay a lesson or two and come back.') + '</p><div class="lesson-foot"><button class="btn secondary" data-action="arena-close">Lessons</button><button class="btn" data-action="arena-start">Play again</button></div></section>';
  }
  const q = a.qs[a.i];
  return '<div class="lesson-top"><button class="icon-btn" data-action="arena-close" aria-label="Back to lessons">‹</button><h2>\u{1F3DF}️ Question ' + (a.i + 1) + ' of 8</h2><span class="small muted num">score ' + a.score + '</span></div><section class="card">' + quizHTML(q, a.picked, 'arena-answer') + '</section>' +
    (a.picked != null ? '<button class="btn block" data-action="arena-next">' + (a.i + 1 >= a.qs.length ? 'See score' : 'Next ›') + '</button>' : '');
}
function renderBadges(){
  const p = state.meta.progress; const si = streakInfo(); const n = stars(); const rk = rankFor(n); const nx = nextRank(n);
  const today = todayStr(); const qs = questStatus(today); const wk = challengeProgress(weekStart(today)); const trophies = completedChallenges();
  const act = activeHabits(); const recs = habitRecs(); const mastered = Object.keys(recs).filter(id => recs[id].mastered);
  const daysLeft = 7 - ((parseDate(today).getDay() + 6) % 7);
  let h = '<section class="card" style="text-align:center"><div class="big-em" style="margin:0">' + rk.em + '</div><h2 style="font-size:24px">' + esc(rk.name) + '</h2><div class="stars-big num" style="margin-top:6px">⭐ ' + n + '</div>' +
    (nx ? '<div class="gauge" style="height:10px;margin:12px 0 4px"><i style="width:' + pct(n - rk.min, nx.min - rk.min).toFixed(1) + '%;background:var(--fat)"></i></div><p class="hint">' + (nx.min - n) + ' more stars to ' + nx.em + ' ' + esc(nx.name) + '</p>' : '<p class="hint">Top rank. Legendary explorer.</p>') +
    '<div class="row wrap" style="justify-content:center;gap:14px;margin-top:6px"><span class="status">\u{1F525} ' + si.count + ' day streak</span><span class="status">\u{1F6E1}️ ' + si.banked + ' rest day' + (si.banked === 1 ? '' : 's') + '</span><span class="status">\u{1F3C5} ' + Object.keys(p.badges).length + ' of ' + BADGES.length + ' badges</span></div><p class="hint">Every 5 days you log banks a rest day, so one skipped day does not break the streak.</p></section>';
  h += starGoalsHTML();
  h += '<section class="card"><div class="card-head"><h2>' + wk.ch.em + ' ' + esc(wk.ch.name) + '</h2><span class="small muted">' + daysLeft + ' day' + (daysLeft === 1 ? '' : 's') + ' left</span></div><p style="margin:0 0 6px;font-weight:700">' + esc(wk.ch.text) + '</p><div class="gauge" style="height:10px"><i style="width:' + pct(wk.n, wk.ch.target).toFixed(1) + '%;background:var(--carb)"></i></div><p class="hint">' + (wk.done ? 'Done! Trophy earned and 10 stars added.' : wk.n + ' of ' + wk.ch.target + ' so far. Finish it for a trophy and 10 stars. A new challenge starts every Monday.') + '</p></section>';
  h += '<section class="card"><div class="card-head"><h2>\u{1F9EA} Habit Lab</h2><span class="small muted">' + act.length + ' of 2 active</span></div><p class="small muted" style="margin:0 0 8px">Pick up to two habits. Practice each one for ' + HABIT_GOAL + ' days to master it. Bronze at 7, silver at 14, gold at 21.</p>';
  act.forEach(id => {
    const hd = habitDef(id); const d = habitDays(id); const L = habitLevel(d); const on = habitDoneOn(id, today);
    h += '<div style="padding:8px 0;border-top:1px solid var(--line)"><div class="row between"><span class="status">' + hd.em + ' ' + esc(hd.name) + '</span><span class="small muted num">' + (L ? L.em + ' ' + L.name + ' · ' : '') + Math.min(d, HABIT_GOAL) + '/' + HABIT_GOAL + '</span></div><div class="gauge" style="height:8px;margin:6px 0"><i style="width:' + pct(d, HABIT_GOAL).toFixed(1) + '%;background:var(--good)"></i></div><div class="row between">' +
      (hd.auto ? '<span class="hint" style="margin:0">Counted automatically from your journal' + (on ? ' · done today ✅' : '') + '</span>' : '<button class="btn sm ' + (on ? 'secondary' : '') + '" data-action="habit-check" data-id="' + id + '">' + (on ? '✅ Done today' : 'Did it today') + '</button>') +
      '<button class="link" data-action="habit-stop" data-id="' + id + '">Stop</button></div></div>';
  });
  if (act.length < 2) {
    const avail = HABITS.filter(hd => !recs[hd.id] || (!recs[hd.id].mastered && recs[hd.id].stopped));
    h += '<details class="more"' + (act.length === 0 || ui.pickOpen ? ' open' : '') + '><summary>Pick a habit</summary>' + avail.map(hd => '<div class="row between" style="padding:6px 0;border-top:1px solid var(--line)"><span class="status">' + hd.em + ' ' + esc(hd.name) + (hd.auto ? ' <span class="small muted">auto</span>' : '') + '</span><button class="btn sm secondary" data-action="habit-pick" data-id="' + hd.id + '">Start</button></div>').join('') + '</details>';
  }
  if (mastered.length) h += '<div class="row wrap" style="margin-top:8px"><span class="small muted" style="font-weight:800">Mastered</span>' + mastered.map(id => '<span class="chip on">' + habitDef(id).em + ' ' + esc(habitDef(id).name) + '</span>').join('') + '</div>';
  h += '</section>';
  h += '<section class="card"><div class="card-head"><h2>\u{1F33B} Detective’s garden</h2><span class="small muted">last 4 weeks</span></div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;text-align:center;font-size:26px">' +
    Array.from({ length: 28 }, (_, i) => { const d = addDays(today, i - 27); const day = getDay(d); const logged = day.entries.length > 0; const q = logged ? questStatus(d).filter(x => x.done).length : 0; const em = !logged ? (d === today ? '\u{1FAB4}' : '·') : q >= 3 ? '\u{1F33B}' : q >= 2 ? '\u{1F33F}' : '\u{1F331}'; return '<span title="' + esc(niceDate(d)) + '" style="' + (d === today ? 'background:var(--accent-soft);border-radius:8px' : '') + '">' + em + '</span>'; }).join('') +
    '</div><p class="hint">Log a day to plant a sprout. Two missions grow leaves, all three grow a flower. Today’s pot is waiting.</p></section>';
  h += '<section class="card"><div class="card-head"><h2>\u{1F3C6} Trophy case</h2><span class="small muted">' + trophies.length + ' weekly</span></div>' + (trophies.length ? trophies.slice().reverse().map(t => '<div class="kv"><span>' + t.ch.em + ' ' + esc(t.ch.name) + '</span><b class="small muted">week of ' + esc(niceDate(t.ws)) + '</b></div>').join('') : '<p class="hint" style="margin:0">Finish a weekly challenge to put the first trophy here.</p>') + '</section>';
  h += '<section class="card"><div class="card-head"><h2>Today’s missions</h2><span class="small muted">' + qs.filter(x => x.done).length + ' of 3</span></div>' +
    qs.map(x => '<div class="row" style="padding:5px 0;font-weight:800;' + (x.done ? 'color:var(--good)' : '') + '"><span style="font-size:20px;width:26px;text-align:center">' + (x.done ? '✅' : x.q.em) + '</span><span style="flex:1">' + esc(x.q.text) + '</span><span class="small muted">+2</span></div>').join('') +
    '<p class="hint">New missions every day. Finish them on the Today page.</p></section>';
  h += '<section class="card"><h2>Badges</h2><div class="badges" style="margin-top:8px">' + BADGES.map(b => '<div class="badge' + (p.badges[b.id] ? '' : ' locked') + '"><div class="em">' + b.em + '</div><div class="t">' + esc(b.name) + '</div><div class="h">' + esc(b.how) + '</div></div>').join('') + '</div></section>';
  h += '<section class="card"><h2>Ranks</h2>' + RANKS.map(r => '<div class="kv"><span>' + r.em + ' ' + esc(r.name) + (r.name === rk.name ? ' <span class="small" style="color:var(--accent)">◀ you</span>' : '') + '</span><b class="num">' + r.min + ' stars</b></div>').join('') + '</section>';
  h += '<section class="card"><h2>How to earn stars</h2>' +
    [['Log something on a day', '+2'], ['Fueled day (breakfast, lunch, dinner and 3 food groups)', '+3'], ['Bonus stars from a grown-up', 'up to +10'], ['Energy check-in', '+1'], ['4 cups of water', '+1'], ['Fruit and a veggie on the same day', '+2'], ['All 5 food groups in a day', '+2'], ['Each daily mission', '+2'], ['Daily case solved', '+1'], ['Each habit day, and +5 per medal', '+1'], ['Weekly challenge', '+10'], ['Each new food you discover', '+1'], ['Each lesson finished', '+3'], ['Each badge', '+2'], ['Best Quiz Arena score', 'up to +8']].map(x => '<div class="kv"><span>' + x[0] + '</span><b>' + x[1] + '</b></div>').join('') +
    '<p class="hint">Stars come from habits and discoveries, never from eating more or less.</p></section>';
  return h;
}
function starGoalsHTML(){
  const today = todayStr(); const w = goalStatus('weekly', weekStart(today)); const m = goalStatus('monthly', monthKey(today));
  const line = (g, title) => '<div style="padding:8px 0;border-top:1px solid var(--line)"><div class="row between"><b>' + title + '</b><span class="small muted num">' + g.n + ' of ' + g.goal + ' ⭐</span></div><div class="gauge" style="height:10px;margin:6px 0"><i style="width:' + pct(g.n, g.goal).toFixed(1) + '%;background:' + (g.reached ? 'var(--good)' : 'var(--fat)') + '"></i></div>' +
    '<div class="small" style="font-weight:800">' + (g.given ? '✅ ' + esc(g.label) + ' <span class="muted">given ' + esc(niceDate(g.given.date)) + '</span>' : g.reached ? '\u{1F389} Goal reached! ' + esc(g.label) + '. Show a grown-up.' : '\u{1F381} ' + esc(g.label || 'Ask a grown-up what the reward is')) + '</div></div>';
  const recent = (state.meta.progress.rewards.ledger || []).filter(x => x.kind === 'bonus').slice(-3).reverse();
  return '<section class="card"><div class="card-head"><h2>\u{1F381} Star goals</h2><span class="small muted">set by the Chief</span></div>' + line(w, 'This week') + line(m, monthName(m.key)) +
    (recent.length ? '<div style="padding:8px 0;border-top:1px solid var(--line)"><b>Bonus stars</b>' + recent.map(x => '<div class="kv"><span>' + esc(x.label) + '</span><b class="num">+' + x.stars + ' ⭐</b></div>').join('') + '</div>' : '') +
    '<p class="hint">Stars never get taken away. A week that misses the goal just starts fresh on Monday.</p></section>';
}
function rewardAdminHTML(){
  const rw = state.meta.progress.rewards; const today = todayStr(); const w = goalStatus('weekly', weekStart(today)); const m = goalStatus('monthly', monthKey(today));
  const btn = g => g.given ? '<span class="small muted">given ' + esc(niceDate(g.given.date)) + '</span>' : g.reached ? '<button class="btn sm" data-action="reward-given" data-kind="' + g.kind + '" data-key="' + g.key + '">Mark as given</button>' : '<span class="small muted num">' + (g.goal - g.n) + ' to go</span>';
  let h = '<section class="card"><h2>Reward system</h2><p class="small muted" style="margin:0 0 8px">Stars are her points. Set a weekly and a monthly goal with the reward attached, and mark it given when you hand it over. She sees the goals and her progress on the Rewards page. You can also give bonus stars for healthy things you saw her do away from the app.</p>' +
    '<div class="grid2"><div class="field"><label for="rw-wg">Weekly goal (stars)</label><input id="rw-wg" class="input" type="number" inputmode="numeric" min="1" step="1" data-reward="weeklyGoal" value="' + rw.weeklyGoal + '"></div><div class="field"><label for="rw-mg">Monthly goal (stars)</label><input id="rw-mg" class="input" type="number" inputmode="numeric" min="1" step="1" data-reward="monthlyGoal" value="' + rw.monthlyGoal + '"></div></div>' +
    '<div class="field"><label for="rw-wr">Weekly reward</label><input id="rw-wr" class="input" data-reward="weeklyReward" maxlength="80" value="' + esc(rw.weeklyReward) + '"></div><div class="field"><label for="rw-mr">Monthly reward</label><input id="rw-mr" class="input" data-reward="monthlyReward" maxlength="80" value="' + esc(rw.monthlyReward) + '"></div>' +
    '<div class="kv"><span>This week</span><span class="row"><b class="num">' + w.n + ' / ' + w.goal + '</b>' + btn(w) + '</span></div><div class="kv"><span>' + esc(monthName(m.key)) + '</span><span class="row"><b class="num">' + m.n + ' / ' + m.goal + '</b>' + btn(m) + '</span></div>' +
    '<form id="bonus-form" style="margin-top:10px"><div class="row" style="align-items:flex-end"><div class="field" style="flex:1;margin:0"><label for="bonus-reason">Bonus stars for</label><input id="bonus-reason" class="input" maxlength="60" placeholder="helped cook dinner" autocomplete="off"></div><div class="field" style="width:84px;margin:0"><label for="bonus-stars">Stars</label><input id="bonus-stars" class="input" type="number" inputmode="numeric" min="1" max="10" value="3"></div></div><button class="btn sm secondary" type="submit" style="margin-top:8px">Give bonus stars</button></form>';
  const ledger = (rw.ledger || []).slice(-8).reverse();
  if (ledger.length) h += '<details class="more"><summary>Reward log</summary>' + ledger.map(x => '<div class="kv"><span>' + esc(niceDate(x.date)) + ' · ' + esc(x.label) + '</span><b class="num">' + (x.kind === 'bonus' ? '+' + x.stars + ' ⭐' : x.kind) + '</b></div>').join('') + '</details>';
  const weeks = []; let ws = weekStart(today); for (let i = 0; i < 8; i++) { weeks.push(ws); ws = addDays(ws, -7); }
  const months = []; const d0 = parseDate(today); for (let i = 0; i < 6; i++) { months.push(dateStr(new Date(d0.getFullYear(), d0.getMonth() - i, 1)).slice(0, 7)); }
  h += '<details class="more"><summary>Scoreboard</summary><div class="small muted" style="font-weight:800;margin:6px 0 2px">Weeks</div>' + weeks.map(k => { const g = goalStatus('weekly', k); const logged = weekDays(k).filter(x => x.entries.length).length; const fueled = weekDays(k).filter(fueledDay).length; return '<div class="kv"><span>' + esc(niceDate(k)) + ' <span class="muted">' + logged + ' logged · ' + fueled + ' fueled</span></span><b class="num">' + g.n + ' ⭐' + (g.given ? ' ✅' : g.reached ? ' \u{1F389}' : '') + '</b></div>'; }).join('') +
    '<div class="small muted" style="font-weight:800;margin:10px 0 2px">Months</div>' + months.map(k => { const g = goalStatus('monthly', k); return '<div class="kv"><span>' + esc(monthName(k)) + '</span><b class="num">' + g.n + ' ⭐' + (g.given ? ' ✅' : g.reached ? ' \u{1F389}' : '') + '</b></div>'; }).join('') + '</details>';
  return h + '</section>';
}
function rewardTipsHTML(){
  return '<section class="card"><h2>Reward ideas for the Chief</h2>' +
    '<p class="small"><b>Reward the habits, not the numbers.</b> Stars come from logging, regular meals, variety, water, trying swaps, lessons and habits. The app never pays for eating less or for staying under a line, and no star is ever taken away. Paying a child to land under a calorie number teaches her to override hunger and to leave food off the log, which is the pattern pediatric guidance links to disordered eating.</p>' +
    '<p class="small"><b>Never use food as a reward or a punishment.</b> Dessert for stars makes sweets more valuable and ties eating to feelings. Rewards work best as time, choice and experiences.</p>' +
    '<p class="small"><b>Weekly reward ideas.</b> She picks the weekend activity. A later bedtime on Friday. She chooses the family dinner and cooks it with you. A park, library, pool or skate trip. A game night where she picks the game. Extra screen time tokens. A friend over.</p>' +
    '<p class="small"><b>Monthly reward ideas.</b> A zoo, museum or beach day. A new book or craft kit. A small toy budget she manages herself. A one-on-one outing with a parent.</p>' +
    '<p class="small"><b>Small, soon and certain beats big and far.</b> Set the weekly goal so she reaches it most weeks, then raise it slowly. Keep the monthly goal for consistency. Let her help choose the rewards. Praise the process you see, like trying a swap or noticing she was full.</p>' +
    '<p class="small"><b>Keep it the same in both homes.</b> The family code shares the journal, the goals and the reward log everywhere, so the rules do not change when the house does.</p>' +
    '<p class="small"><b>Fade it over time.</b> When a habit sticks, move its reward from weekly to monthly to an occasional celebration. The ranks, garden and badges keep going on their own.</p>' +
    '<p class="small"><b>Pause if you see warning signs.</b> Hiding food, skipping meals to earn, worry about logging, or talk about being fat or needing to be thin. Stop the rewards for a while and talk with her pediatrician.</p></section>';
}
function familyCardHTML(){
  const sy = syncText(); const code = familyCode();
  let h = '<section class="card" id="family-card"><div class="card-head"><h2>Family journal</h2><span class="status"><span class="sync-dot ' + sy.dot + '"></span>' + esc(sy.short) + '</span></div>' + syncStatusHTML();
  if (code) {
    h += '<div class="kv" style="margin-top:10px"><span>Family code</span><b>' + esc(code) + '</b></div>' +
      '<div class="row" style="margin-top:10px;flex-wrap:wrap;gap:8px"><button class="btn sm" data-action="family-share">Share the family link</button><button class="btn sm secondary" data-action="sync-now">Sync now</button></div>' +
      (ui.shareText ? '<div class="field" style="margin-top:8px"><label for="share-link">Family link</label><input id="share-link" class="input" readonly value="' + esc(ui.shareText) + '"></div>' : '') +
      '<p class="hint">Send the family link to every phone, tablet and computer she uses, in both homes. Tapping it connects that device with no typing. A device that is not connected cannot log food, so nothing gets stranded on one device. Anyone with the code or link can see the journal, so keep it in the family.</p>' +
      (ui.confirmLeave ? '<div class="row" style="gap:8px"><button class="btn sm danger" data-action="family-disconnect-yes">Yes, disconnect</button><button class="btn sm secondary" data-action="family-disconnect-no">Keep connected</button></div>' : '<button class="btn sm secondary" data-action="family-disconnect">Disconnect this device</button>');
  }
  return h + '</section>';
}
function syncStatusHTML(){
  const s = syncText();
  return '<div class="sync-line"><span class="sync-dot ' + s.dot + '"></span><b>' + esc(s.label) + '</b></div><p class="small" style="margin:4px 0 0">' + esc(s.text) + '</p>' + (familyCode() ? devicesHTML() : '');
}
function devicesHTML(){
  const me = deviceId(); const now = Date.now();
  const list = (remote.devices || []).filter(d => d.id !== me).concat(remote.loaded ? [{ id: me, name: deviceName(), app: APP_VERSION, lastSeen: now, lastSync: remote.lastOk, pending: pendingKeys().length }] : []).sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
  if (!list.length) return '';
  return '<div class="dev-list"><div class="small muted" style="font-weight:800;margin:12px 0 2px">Devices on this journal</div>' + list.map(d => {
    const waiting = (d.pending || 0) > 0; const old = d.app && newerVersion(APP_VERSION, d.app); const quiet = now - (d.lastSeen || 0) > 3 * 86400000;
    const line = (waiting ? '⏳ ' + d.pending + ' waiting to send' : '✅ Synced ' + ago(d.lastSync || d.lastSeen)) + ' · opened ' + ago(d.lastSeen) + (old ? ' · older app version, it updates the next time it opens' : '') + (quiet && !old ? ' · not opened in a few days' : '');
    return '<div class="dev"><div class="dev-name">' + esc(d.name || d.kind || 'Device') + (d.id === me ? ' <span class="chip on">this device</span>' : '') + '</div><div class="small muted">' + esc(line) + '</div></div>';
  }).join('') + '</div>' + (list.length === 1 && remote.loaded ? '<p class="hint">Only this device is on this journal so far. Open Food Detective on the other devices and they appear here.</p>' : '');
}
function syncBannerHTML(){
  const n = pendingKeys().length; const st = remote.status;
  const show = !!familyCode() && n > 0 && (st === 'offline' || st === 'retry' || st === 'slow' || (remote.pendingSince && Date.now() - remote.pendingSince > 120000));
  if (!show) return '<div id="sync-banner"></div>';
  return '<div id="sync-banner" class="note sun sync-banner" role="status" data-action="sync-open">\u{1F4E1} ' + n + (n === 1 ? ' change is' : ' changes are') + ' saved on this device and will reach the family journal as soon as the internet is back. Nothing is lost.</div>';
}
function joinHTML(){
  const j = ui.join || {};
  return '<section class="card join-card"><div class="join-mark">' + ICONS.mark + '</div><h2>Connect to your family journal</h2>' +
    '<p>Food Detective keeps one journal that every phone and computer in the family shares. Enter your family code once on this device and everything stays in sync.</p>' +
    '<form id="join-form"><div class="field"><label for="join-code">Family code</label><input id="join-code" class="input join-input" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" placeholder="FAMILY-CODE" maxlength="40" value="' + esc(j.code || '') + '"' + (j.busy ? ' disabled' : '') + '></div>' +
    '<button class="btn block" type="submit"' + (j.busy ? ' disabled' : '') + '>' + (j.busy ? 'Connecting…' : 'Connect') + '</button></form>' +
    (j.msg ? '<p class="note' + (j.notFound ? ' sun' : '') + '" role="status">' + esc(j.msg) + '</p>' : '') +
    (j.notFound ? '<details class="more"><summary>Starting a brand new family journal?</summary><p class="small">Only do this if your family has never used Food Detective. Everyone else should use the code they already have.</p><form id="create-form"><div class="field"><label for="create-name">Child’s first name</label><input id="create-name" class="input" maxlength="30" autocomplete="off"></div><button class="btn secondary" type="submit">Start a new journal with ' + esc(j.code) + '</button></form></details>' : '') +
    '<p class="hint">A parent has the code. Tapping the family link a parent shares connects this device automatically. You only do this once on each device.</p></section>';
}
function renderGrownups(){
  if (!ui.gate) return '<section class="card gate"><div class="big-em">\u{1F512}</div><h2>Chief\u2019s office</h2><p class="muted">Parents only. Settings, rewards, backups and notes.</p><form id="gate-form"><label for="gate-input" class="small muted" style="font-weight:800">What is 6 × 7?</label><input id="gate-input" class="input" inputmode="numeric" autocomplete="off" aria-label="Answer"><button class="btn" type="submit">Unlock</button></form><p class="hint" id="gate-msg"></p></section>';
  const s = state.meta.settings; const r = refs(); const sy = syncText();
  const days = Object.keys(state.days).filter(d => state.days[d].entries.length).length;
  return '<h2 style="font-size:22px;margin:10px 0 4px">Chief\u2019s office</h2>' + dashboardCardHTML() +
    '<section class="card settings"><h2>The detective</h2><div class="field"><label for="s-name">Name shown in the app</label><input id="s-name" class="input" data-setting="name" value="' + esc(s.name) + '" maxlength="30"></div>' +
    '<div class="grid2"><div class="field"><label for="s-age">Age</label><select id="s-age" class="input" data-setting="age">' + [9,10,11,12,13].map(a => '<option value="' + a + '"' + (s.age === a ? ' selected' : '') + '>' + a + '</option>').join('') + '</select></div>' +
    '<div class="field"><label for="s-act">Activity</label><select id="s-act" class="input" data-setting="activity">' + ACTIVITIES.map(a => '<option value="' + a.id + '"' + (s.activity === a.id ? ' selected' : '') + '>' + a.name + '</option>').join('') + '</select></div></div>' +
    '<p class="hint">Typical day for a girl of ' + s.age + ' who is ' + (ACTIVITIES.find(a => a.id === s.activity) || ACTIVITIES[1]).name.toLowerCase() + ' is about ' + fmt(r.autoKcal, 0) + ' calories (Dietary Guidelines for Americans). The macro markers come from the usual balance for kids, protein about 14%, carbs 55%, fat 31% of energy. Override any of them below, or leave blank for automatic.</p>' +
    '<div class="grid4"><div class="field"><label for="s-kcal">Calories</label><input id="s-kcal" class="input" type="number" inputmode="numeric" min="0" step="1" data-setting="refKcal" value="' + (s.refKcal || '') + '" placeholder="' + r.autoKcal + '"></div>' +
    '<div class="field"><label for="s-p">Protein g</label><input id="s-p" class="input" type="number" inputmode="numeric" min="0" step="1" data-setting="refP" value="' + (s.refP || '') + '" placeholder="' + r.p + '"></div>' +
    '<div class="field"><label for="s-c">Carbs g</label><input id="s-c" class="input" type="number" inputmode="numeric" min="0" step="1" data-setting="refC" value="' + (s.refC || '') + '" placeholder="' + r.c + '"></div>' +
    '<div class="field"><label for="s-f">Fat g</label><input id="s-f" class="input" type="number" inputmode="numeric" min="0" step="1" data-setting="refF" value="' + (s.refF || '') + '" placeholder="' + r.f + '"></div></div></section>' +
    '<section class="card"><h2>What she sees</h2><label class="row between" style="padding:8px 0;border-top:1px solid var(--line)"><span><b>Show calorie and gram numbers</b><br><span class="small muted">Off shows gauges only. Turn on for a teaching session.</span></span><input type="checkbox" data-setting="showNumbers"' + (s.showNumbers ? ' checked' : '') + ' style="width:24px;height:24px;flex:0 0 auto"></label>' +
    '<label class="row between" style="padding:8px 0;border-top:1px solid var(--line)"><span><b>Show swap ideas</b><br><span class="small muted">Curious notes on sweet drinks, caffeine, Level 3 snacks, salty or fried foods, with everyday options to try next time.</span></span><input type="checkbox" data-setting="showSwaps"' + (s.showSwaps ? ' checked' : '') + ' style="width:24px;height:24px;flex:0 0 auto"></label>' +
    '<p class="hint">Swap ideas never score or count her foods. They say what a food is like and what else she could try, and every card ends with all foods fit. Labeling foods good or bad is the pattern pediatric guidance links to food anxiety. Noticing and trying options is the pattern that builds habits.</p></section>' +
    '<section class="card"><h2>How to use the numbers</h2><p class="small">The gauges compare her day to typical amounts for a girl her age and activity level, not goals or limits. On purpose there is no weight tracking, no deficit, and no warning for going over. With numbers off she sees a fuel tank and three bars. With numbers on she sees calories and grams, the way a science class would.</p><p class="small">Pediatric guidance is consistent here. Focus on variety, regular meals, and listening to hunger and fullness, and keep weight and dieting out of the conversation. For questions about her growth or eating, her pediatrician or a registered dietitian is the right person to ask.</p></section>' +
    familyCardHTML() +
    '<section class="card"><h2>Camera features</h2><p class="small" style="margin:0">Scan a barcode and the app looks it up in Open Food Facts, a free public database. Only the barcode number is sent. Snap the label and the numbers are read on the device itself, nothing is uploaded. Both fill in the form for her to check, which is a label-reading lesson in itself. If a product is missing from the database, typing it in from the label always works.</p></section>' +
    (FIREBASE_CONFIG ? '' : '<section class="card"><div class="card-head"><h2>Cloud sync</h2><span class="status"><span class="sync-dot ' + sy.dot + '"></span>' + esc(sy.label) + '</span></div><p class="small" style="margin:0">' + esc(sy.text) + '</p>' + (remote.status === 'synced' ? '<p class="hint">If you share this app by link, anyone signed in with the link may be able to read the journal, so share it only with family.</p>' : '') + '</section>') +
    rewardAdminHTML() + rewardTipsHTML() +
    '<section class="card"><h2>Backup and export</h2><p class="small">' + days + ' day' + (days === 1 ? '' : 's') + ' with entries · ' + allEntries().length + ' foods logged.</p>' +
    '<div class="stack"><button class="btn secondary block" data-action="export-json">Save a backup (.json)</button><button class="btn secondary block" data-action="export-csv">Export the journal (.csv)</button>' +
    '<label class="btn secondary block" for="import-file">Restore from a backup<input id="import-file" type="file" accept=".json,application/json" style="display:none"></label></div>' +
    (ui.exportText ? '<div class="field"><label for="export-text">' + (remote.downloads ? 'Copy of the export' : 'Downloads are off in this view, so copy the text below and save it in a file') + '</label><textarea id="export-text" class="input" readonly rows="5">' + esc(ui.exportText) + '</textarea><button class="btn sm secondary" data-action="copy-export">Copy to clipboard</button></div>' : '') +
    '<details class="more"' + (ui.confirmErase ? ' open' : '') + '><summary>Erase everything</summary><p class="small muted">Removes all journal entries, progress, badges, and settings on this device' + (remote.fam ? ' and in the family journal on every device' : '') + '. Save a backup first.</p>' + (ui.confirmErase ? '<div class="row"><button class="btn danger" data-action="erase-yes">Yes, erase it all</button><button class="btn secondary" data-action="erase-no">Keep my data</button></div>' : '<button class="btn danger sm" data-action="erase-ask">Erase all data</button>') + '</details></section>' +
    '<section class="card sources"><h2>Where the numbers come from</h2><ul style="padding-left:18px;margin:0">' +
    '<li><a href="https://www.dietaryguidelines.gov/" target="_blank" rel="noopener">Dietary Guidelines for Americans 2020–2025</a>. Typical daily calories by age, sex, and activity. Macronutrient ranges for ages 4 to 18. Added sugars under 10% of calories.</li>' +
    '<li>National Academies Dietary Reference Intakes. Protein RDA 34 g a day for ages 9 to 13. Fiber 26 g a day for girls 9 to 13. Sodium guideline 1,800 mg a day for ages 9 to 13.</li>' +
    '<li><a href="https://www.heart.org/" target="_blank" rel="noopener">American Heart Association</a>. Added sugar under 25 g a day for children.</li>' +
    '<li><a href="https://www.healthychildren.org/" target="_blank" rel="noopener">American Academy of Pediatrics, HealthyChildren.org</a>. No caffeine under age 12, no energy drinks under 18, and a focus on healthy habits rather than weight.</li>' +
    '<li>Starter food values are typical estimates from <a href="https://fdc.nal.usda.gov/" target="_blank" rel="noopener">USDA FoodData Central</a> and product labels. The package label always wins.</li></ul></section>' +
    '<p class="hint" style="text-align:center;margin:16px 0">Food Detective · made for ' + esc(s.name || 'your detective') + ' · <button class="link" data-action="gate-lock">Lock the office</button></p>';
}
