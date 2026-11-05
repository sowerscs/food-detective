
// ---------- state ----------
const SEED_DATE = '2026-11-02';
const SEED_TS = Date.UTC(2026, 10, 2, 14, 0, 0);
function mk(id, meal, name, serving, qty, per, groups, level, icon, note){
  return { id, meal, name, serving, qty, per, groups, level, icon, note: note || '', createdAt: SEED_TS };
}
function seedDay(){
  return { date: SEED_DATE, water: 0, energy: null, updatedAt: SEED_TS, entries: [
    mk('seed1', 'breakfast', 'Egg whites', '1 cup', 1, { kcal: 126, p: 26.5, c: 1.8, f: 0.4, fiber: 0, sugar: 1.7, added: 0, sodium: 403 }, ['protein'], 1, '\u{1F95A}'),
    mk('seed2', 'breakfast', 'Banana', '1 medium', 1, { kcal: 105, p: 1.3, c: 27, f: 0.4, fiber: 3.1, sugar: 14, added: 0, sodium: 1 }, ['fruit'], 1, '\u{1F34C}'),
    mk('seed3', 'breakfast', 'Sambazon organic açaí juice', '8 fl oz', 1, { kcal: 140, p: 1, c: 29, f: 2.5, fiber: 1, sugar: 28, added: 22, sodium: null }, ['fruit'], 3, '\u{1F9C3}', 'Has caffeine from yerba mate and green tea extracts, about a quarter shot of espresso.'),
    mk('seed4', 'lunch', 'Sirloin steak, fat trimmed', '3 oz cooked', 1, { kcal: 170, p: 25, c: 0, f: 7, fiber: 0, sugar: 0, added: 0, sodium: 55 }, ['protein'], 1, '\u{1F969}'),
    mk('seed5', 'lunch', 'White rice, cooked', '1/2 cup', 1, { kcal: 103, p: 2, c: 22, f: 0.2, fiber: 0.3, sugar: 0, added: 0, sodium: 1 }, ['grain'], 2, '\u{1F35A}'),
    mk('seed6', 'lunch', 'Gayo Azul Gouda cheese', '1 slice (21 g)', 2, { kcal: 70, p: 5, c: 0, f: 6, fiber: 0, sugar: 0, added: 0, sodium: 140, calcium: 160, satfat: 4 }, ['dairy'], 2, '\u{1F9C0}')
  ] };
}
function defaultSettings(){ return { name: '', age: 9, activity: 'mid', refKcal: null, refP: null, refC: null, refF: null, showNumbers: false, showSwaps: true }; }
function defaultRewards(){ return { weeklyGoal: 50, weeklyReward: 'Pick the family activity for the weekend', monthlyGoal: 200, monthlyReward: 'A bigger reward we choose together', ledger: [], bonuses: [] }; }
function defaultProgress(){ return { lessons: {}, quizBest: 0, quizBestDate: null, quizRounds: 0, badges: {}, arenaDays: {}, cases: {}, habits: {}, rewards: defaultRewards() }; }
function demoMode(){ try { return localStorage.getItem('fe.demo') === '1'; } catch (e) { return false; } }
function freshState(empty){
  const days = {};
  if (!empty && demoMode()) days[SEED_DATE] = seedDay();
  return { meta: { settings: defaultSettings(), progress: defaultProgress(), updatedAt: SEED_TS }, days };
}
function normalizeDay(d, date){
  d = d && typeof d === 'object' ? d : {};
  const deleted = {}; if (d.deleted && typeof d.deleted === 'object') Object.keys(d.deleted).forEach(k => { const ts = Number(d.deleted[k]); if (ts > 0) deleted[String(k).slice(0, 40)] = ts; });
  return {
    date: date || d.date,
    water: Math.max(0, Math.min(12, parseInt(d.water, 10) || 0)),
    energy: [1,2,3,4].includes(d.energy) ? d.energy : null,
    updatedAt: Number(d.updatedAt) || 0,
    waterAt: Number(d.waterAt) || 0, energyAt: Number(d.energyAt) || 0, deleted,
    entries: Array.isArray(d.entries) ? d.entries.filter(e => e && typeof e === 'object' && e.name).map(e => ({
      id: String(e.id || uid()), meal: MEALS.some(m => m.id === e.meal) ? e.meal : 'snack',
      name: String(e.name).slice(0, 80), serving: String(e.serving || '1 serving').slice(0, 40),
      qty: Math.max(0.01, Math.min(99, num(e.qty) || 1)),
      per: normPer(e.per), groups: Array.isArray(e.groups) ? e.groups.filter(g => typeof g === 'string') : [],
      level: [1,2,3].includes(e.level) ? e.level : null, icon: String(e.icon || '\u{1F37D}️').slice(0, 8),
      note: String(e.note || '').slice(0, 200), createdAt: Number(e.createdAt) || 0, updatedAt: Number(e.updatedAt) || Number(e.createdAt) || 0, src: ['label','list','seed','scan','ocr'].indexOf(e.src) >= 0 ? e.src : 'seed',
      dev: String(e.dev || '').slice(0, 40), by: String(e.by || '').slice(0, 40)
    })) : []
  };
}
function normPer(p){
  p = p && typeof p === 'object' ? p : {};
  const out = {};
  ['kcal','p','c','f','fiber','sugar','added','sodium','calcium','satfat'].forEach(k => {
    if (p[k] == null || p[k] === '') { out[k] = (k === 'kcal' || k === 'p' || k === 'c' || k === 'f') ? 0 : null; }
    else out[k] = Math.max(0, num(p[k]));
  });
  return out;
}
function normalizeMeta(m){
  m = m && typeof m === 'object' ? m : {};
  const s = Object.assign(defaultSettings(), m.settings || {});
  s.name = String(s.name || '').slice(0, 30);
  s.age = KCAL_TABLE[s.age] ? Number(s.age) : 9;
  s.activity = ACTIVITIES.some(a => a.id === s.activity) ? s.activity : 'mid';
  ['refKcal','refP','refC','refF'].forEach(k => { s[k] = s[k] == null || s[k] === '' ? null : Math.max(0, num(s[k])) || null; });
  s.showNumbers = s.showNumbers === true; s.showSwaps = s.showSwaps !== false;
  const p = Object.assign(defaultProgress(), m.progress || {});
  p.lessons = p.lessons && typeof p.lessons === 'object' ? p.lessons : {};
  p.badges = p.badges && typeof p.badges === 'object' ? p.badges : {};
  p.arenaDays = p.arenaDays && typeof p.arenaDays === 'object' ? p.arenaDays : {};
  p.cases = p.cases && typeof p.cases === 'object' ? p.cases : {};
  p.quizBestDate = /^\d{4}-\d{2}-\d{2}$/.test(String(p.quizBestDate)) ? p.quizBestDate : null;
  const rw = Object.assign(defaultRewards(), p.rewards && typeof p.rewards === 'object' ? p.rewards : {});
  rw.weeklyGoal = Math.max(1, Math.min(999, parseInt(rw.weeklyGoal, 10) || 50)); rw.monthlyGoal = Math.max(1, Math.min(9999, parseInt(rw.monthlyGoal, 10) || 200));
  rw.weeklyReward = String(rw.weeklyReward || '').slice(0, 80); rw.monthlyReward = String(rw.monthlyReward || '').slice(0, 80);
  rw.ledger = (Array.isArray(rw.ledger) ? rw.ledger : []).filter(x => x && typeof x === 'object' && /^\d{4}-\d{2}-\d{2}$/.test(String(x.date))).map(x => ({ id: String(x.id || uid()), date: x.date, kind: ['weekly','monthly','bonus'].indexOf(x.kind) >= 0 ? x.kind : 'bonus', key: String(x.key || ''), label: String(x.label || '').slice(0, 120), stars: Math.max(0, Math.min(50, parseInt(x.stars, 10) || 0)) })).slice(-400);
  p.rewards = rw;
  const hb = p.habits && typeof p.habits === 'object' ? p.habits : {};
  p.habits = {};
  Object.keys(hb).forEach(id => { const r = hb[id]; if (!r || typeof r !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(String(r.startDate))) return; p.habits[id] = { startDate: r.startDate, days: r.days && typeof r.days === 'object' ? r.days : {}, mastered: Number(r.mastered) || null, stopped: Number(r.stopped) || null, at: Number(r.at) || 0 }; });
  p.quizBest = Math.max(0, Math.min(8, parseInt(p.quizBest, 10) || 0));
  p.quizRounds = Math.max(0, parseInt(p.quizRounds, 10) || 0);
  return { settings: s, progress: p, updatedAt: Number(m.updatedAt) || 0, settingsAt: Number(m.settingsAt) || 0, rewardsAt: Number(m.rewardsAt) || 0, erasedAt: Number(m.erasedAt) || 0 };
}
function normalizeState(st){
  st = st && typeof st === 'object' ? st : {};
  const days = {};
  if (st.days && typeof st.days === 'object') Object.keys(st.days).forEach(k => { if (/^\d{4}-\d{2}-\d{2}$/.test(k)) days[k] = normalizeDay(st.days[k], k); });
  return { meta: normalizeMeta(st.meta), days };
}
let state = freshState(false);
const LS_KEY = 'foodExplorer.v2';
function loadLocal(){
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || data.v !== 2) return false;
    state = normalizeState(data.state); bump();
    return true;
  } catch (e) { return false; }
}
function saveLocal(){ try { localStorage.setItem(LS_KEY, JSON.stringify({ v: 2, state })); } catch (e) { /* storage unavailable in this browser */ } }

function getDay(date){ return state.days[date] || { date, water: 0, energy: null, updatedAt: 0, waterAt: 0, energyAt: 0, deleted: {}, entries: [] }; }
function ensureDay(date){ if (!state.days[date]) state.days[date] = { date, water: 0, energy: null, updatedAt: 0, waterAt: 0, energyAt: 0, deleted: {}, entries: [] }; if (!state.days[date].deleted) state.days[date].deleted = {}; return state.days[date]; }
function touchDay(date){ const d = ensureDay(date); d.updatedAt = Date.now(); bump(); saveLocal(); queuePush(date); queueReportPushes(); }
function touchMeta(){ state.meta.updatedAt = Date.now(); bump(); saveLocal(); queuePush('meta'); queueReportPushes(); }

// ---------- nutrition math ----------
const KEYS = ['kcal','p','c','f','fiber','sugar','added','sodium','calcium'];
function entryTotals(e){ const t = {}; KEYS.forEach(k => { t[k] = (e.per && e.per[k] != null ? num(e.per[k]) : 0) * (num(e.qty) || 1); }); return t; }
function totals(day){ const t = {}; KEYS.forEach(k => t[k] = 0); (day.entries || []).forEach(e => { const et = entryTotals(e); KEYS.forEach(k => t[k] += et[k]); }); return t; }
function refs(){
  const s = state.meta.settings;
  const act = ACTIVITIES.find(a => a.id === s.activity) || ACTIVITIES[1];
  const auto = (KCAL_TABLE[s.age] || KCAL_TABLE[9])[act.idx];
  const kcal = s.refKcal || auto;
  const r5 = n => Math.max(5, Math.round(n / 5) * 5);
  return { kcal, autoKcal: auto, p: s.refP || r5(kcal * 0.14 / 4), c: s.refC || r5(kcal * 0.55 / 4), f: s.refF || r5(kcal * 0.31 / 9), fiber: 26, sodium: 1800, added: 25 };
}
function groupsOf(day){ const g = new Set(); (day.entries || []).forEach(e => (e.groups || []).forEach(x => g.add(x))); return g; }
function allEntries(){ return Object.values(state.days).flatMap(d => d.entries.map(e => Object.assign({ date: d.date }, e))); }
function distinctFoods(){ const n = new Set(); allEntries().forEach(e => n.add(e.name.trim().toLowerCase())); return n.size; }
// Streak with rest days. Every 5 logged days bank one rest day that protects the streak when a day is skipped.
function streakInfo(){
  const logged = s => !!(state.days[s] && state.days[s].entries.length);
  const dates = Object.keys(state.days).filter(logged).sort();
  if (!dates.length) return { count: 0, banked: 0 };
  let end = todayStr(); if (!logged(end)) end = addDays(end, -1);
  let count = 0, banked = 0, used = 0;
  for (let d = dates[0], i = 0; d <= end && i < 4000; d = addDays(d, 1), i++) {
    if (logged(d)) { count++; if (count % 5 === 0) banked++; }
    else if (banked > 0) { banked--; used++; }
    else { count = 0; banked = 0; }
  }
  return { count, banked, used };
}
function streak(){ return streakInfo().count; }
function myFoods(){
  const seen = {};
  allEntries().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).forEach(e => {
    const k = e.name.trim().toLowerCase();
    if (!seen[k]) seen[k] = { name: e.name, serving: e.serving, per: e.per, groups: e.groups, level: e.level, icon: e.icon, note: e.note, mine: true };
  });
  return Object.values(seen);
}
// ---------- game layer ----------
function seededShuffle(arr, seedStr){
  let s = 0; for (let i = 0; i < seedStr.length; i++) s = (s * 31 + seedStr.charCodeAt(i)) >>> 0;
  const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function questsFor(date){ return seededShuffle(QUESTS, 'quest-' + date).slice(0, 3); }
function questStatus(date){ const d = getDay(date); return questsFor(date).map(q => ({ q, done: !!q.check(d, date) })); }
function isNewFood(e, date){
  const k = e.name.trim().toLowerCase();
  return !Object.keys(state.days).some(dt => dt < date && state.days[dt].entries.some(x => x.name.trim().toLowerCase() === k));
}
function dayStars(day){
  if (!day) return 0;
  let n = 0;
  if (day.entries.length) n += 2;
  if (day.energy) n += 1;
  if ((day.water || 0) >= 4) n += 1;
  const g = groupsOf(day);
  if (g.has('fruit') && g.has('veg')) n += 2;
  if (GROUPS.every(x => g.has(x.id))) n += 2;
  n += questStatus(day.date).filter(x => x.done).length * 2;
  return n;
}
// ---------- weekly challenges ----------
function weekStart(date){ const d = parseDate(date); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return dateStr(d); }
function weekDays(ws){ const out = []; for (let i = 0; i < 7; i++) out.push(getDay(addDays(ws, i))); return out; }
function challengeFor(ws){ return seededShuffle(WEEKLY, 'week-' + ws)[0]; }
function challengeProgress(ws){ const ch = challengeFor(ws); const n = Math.min(ch.target, ch.count(weekDays(ws), ws)); return { ch, n, done: n >= ch.target, ws }; }
function completedChallenges(){
  const dates = Object.keys(state.days).filter(d => state.days[d].entries.length || state.days[d].water || state.days[d].energy).sort();
  if (!dates.length) return [];
  let ws = weekStart(dates[0]); const cur = weekStart(todayStr()); const out = [];
  for (let i = 0; i < 600 && ws <= cur; i++) { const p = challengeProgress(ws); if (p.done) out.push(p); ws = addDays(ws, 7); }
  return out;
}
// ---------- habit lab ----------
function habitDef(id){ return HABITS.find(h => h.id === id); }
function habitRecs(){ const out = {}; Object.keys(state.meta.progress.habits).forEach(id => { if (habitDef(id)) out[id] = state.meta.progress.habits[id]; }); return out; }
function activeHabits(){ return Object.keys(habitRecs()).filter(id => !habitRecs()[id].mastered && !habitRecs()[id].stopped); }
function habitDoneOn(id, date){
  const h = habitDef(id), rec = habitRecs()[id]; if (!h || !rec || date < rec.startDate) return false;
  if (h.auto) return !!h.auto(getDay(date));
  return !!rec.days[date];
}
function habitDays(id){
  const h = habitDef(id), rec = habitRecs()[id]; if (!h || !rec) return 0;
  if (h.auto) return Object.keys(state.days).filter(d => d >= rec.startDate && h.auto(state.days[d])).length;
  return Object.keys(rec.days).filter(d => d >= rec.startDate).length;
}
function habitLevel(n){ let L = null; HABIT_LEVELS.forEach(x => { if (n >= x.days) L = x; }); return L; }
function habitStars(){ let n = 0; Object.keys(habitRecs()).forEach(id => { const d = habitDays(id); n += Math.min(d, HABIT_GOAL); HABIT_LEVELS.forEach(x => { if (d >= x.days) n += 5; }); }); return n; }
function checkHabits(){
  Object.keys(habitRecs()).forEach(id => {
    const rec = habitRecs()[id];
    if (!rec.mastered && habitDays(id) >= HABIT_GOAL) { rec.mastered = Date.now(); rec.at = Date.now(); touchMeta(); const h = habitDef(id); celebrate(h.em + ' Habit mastered! ' + h.name + ' is part of you now.'); }
  });
}
// ---------- daily detective case ----------
const CASE_POOL = FOODS.filter(f => f.groups.length === 1 && f.groups[0] !== 'other' && f.level);
function caseFor(date){
  const f = seededShuffle(CASE_POOL, 'case-' + date)[0];
  const dayNum = Math.round(parseDate(date).getTime() / 86400000);
  const kind = dayNum % 2 === 0 ? 'group' : 'level';
  let opts, answer, why;
  if (kind === 'group') {
    const right = GROUPS.find(g => g.id === f.groups[0]);
    const others = seededShuffle(GROUPS.filter(g => g.id !== f.groups[0]), 'caseopt-' + date).slice(0, 3);
    opts = seededShuffle(others.concat([right]), 'caseord-' + date).map(g => ({ id: g.id, label: g.icon + ' ' + g.name }));
    answer = f.groups[0]; why = f.name + ' belongs to the ' + right.name.toLowerCase() + ' group.';
  } else {
    opts = LEVELS.map(L => ({ id: String(L.id), label: L.short + '. ' + L.name }));
    answer = String(f.level);
    why = f.name + ' is Level ' + f.level + ', ' + (f.level === 1 ? 'barely changed from how it grows.' : f.level === 2 ? 'changed a little, with a few ingredients added.' : 'changed a lot, made in a factory with a long ingredient list.');
  }
  return { food: f, kind, opts, answer, why, question: kind === 'group' ? 'Which food group does it belong to?' : 'How processed is it?' };
}
function caseStars(){ const c = state.meta.progress.cases; return Object.keys(c).filter(d => c[d] && c[d].correct).length; }

function fueledDay(day){ return !!day && ['breakfast','lunch','dinner'].every(m => day.entries.some(e => e.meal === m)) && GROUPS.filter(g => groupsOf(day).has(g.id)).length >= 3; }
let starsCache = { key: '', value: 0, byDate: {} }; let stateVer = 0;
function bump(){ stateVer++; }
// Every star is attributed to a date, so weekly and monthly totals and the lifetime total always agree.
function starsByDate(){
  const key = stateVer + '|' + todayStr();
  if (starsCache.key === key) return starsCache.byDate;
  const map = {}; const add = (date, n) => { if (date && n) map[date] = (map[date] || 0) + n; };
  const p = state.meta.progress; const tsDate = ts => dateStr(new Date(Number(ts) || Date.now()));
  const dates = Object.keys(state.days).sort(); const seen = new Set();
  dates.forEach(date => {
    const d = state.days[date];
    add(date, dayStars(d));
    if (fueledDay(d)) add(date, 3);
    d.entries.forEach(e => { const k = e.name.trim().toLowerCase(); if (!seen.has(k)) { seen.add(k); add(date, 1); } });
    if (p.cases[date] && p.cases[date].correct) add(date, 1);
  });
  Object.keys(habitRecs()).forEach(id => {
    const h = habitDef(id), rec = habitRecs()[id];
    const done = (h.auto ? dates.filter(dt => dt >= rec.startDate && h.auto(state.days[dt])) : Object.keys(rec.days).filter(dt => dt >= rec.startDate).sort()).slice(0, HABIT_GOAL);
    done.forEach((dt, i) => { add(dt, 1); if (HABIT_LEVELS.some(L => L.days === i + 1)) add(dt, 5); });
  });
  completedChallenges().forEach(c => add(addDays(c.ws, 6), 10));
  Object.keys(p.lessons).forEach(id => add(tsDate(p.lessons[id]), 3));
  Object.keys(p.badges).forEach(id => add(tsDate(p.badges[id]), 2));
  if (p.quizBest) add(p.quizBestDate || Object.keys(p.arenaDays).sort()[0] || todayStr(), p.quizBest);
  (p.rewards && p.rewards.ledger || []).forEach(x => { if (x.kind === 'bonus') add(x.date, x.stars); });
  let total = 0; Object.keys(map).forEach(k => { total += map[k]; });
  starsCache = { key, value: total, byDate: map };
  return map;
}
function stars(){ starsByDate(); return starsCache.value; }
function starsBetween(a, b){ const m = starsByDate(); let n = 0; Object.keys(m).forEach(d => { if (d >= a && d <= b) n += m[d]; }); return n; }
function weekTotal(ws){ return starsBetween(ws, addDays(ws, 6)); }
function monthKey(date){ return date.slice(0, 7); }
function monthTotal(ym){ const m = starsByDate(); let n = 0; Object.keys(m).forEach(d => { if (d.slice(0, 7) === ym) n += m[d]; }); return n; }
function monthName(ym){ const p = ym.split('-'); return MONTHS[parseInt(p[1], 10) - 1] + ' ' + p[0]; }
function rewardGiven(kind, key){ return (state.meta.progress.rewards.ledger || []).find(x => x.kind === kind && x.key === key) || null; }
function goalStatus(kind, key){
  const rw = state.meta.progress.rewards;
  const goal = kind === 'weekly' ? rw.weeklyGoal : rw.monthlyGoal; const label = kind === 'weekly' ? rw.weeklyReward : rw.monthlyReward;
  const n = kind === 'weekly' ? weekTotal(key) : monthTotal(key);
  return { kind, key, goal, label, n, reached: n >= goal, given: rewardGiven(kind, key) };
}
function rankFor(n){ let r = RANKS[0]; RANKS.forEach(x => { if (n >= x.min) r = x; }); return r; }
function nextRank(n){ return RANKS.find(x => x.min > n) || null; }
function snapshotGame(){ const n = stars(); return { stars: n, rank: rankFor(n).name, quests: questStatus(ui.date).filter(x => x.done).map(x => x.q.id) }; }
function afterChange(before){
  const now = snapshotGame();
  const newQuests = now.quests.filter(id => before.quests.indexOf(id) < 0);
  newQuests.forEach(id => { const q = QUESTS.find(x => x.id === id); if (q) toast(q.em + ' Mission complete. ' + q.text + '!'); });
  if (now.stars > before.stars) toast('⭐ +' + (now.stars - before.stars) + ' star' + (now.stars - before.stars === 1 ? '' : 's'));
  if (now.rank !== before.rank) { const r = rankFor(now.stars); celebrate(r.em + ' Rank up! You are now a ' + r.name + '.'); }
}

// ---------- swap ideas ----------
function addedOf(e){ return (e.per && e.per.added != null ? num(e.per.added) : 0) * (num(e.qty) || 1); }
function sodiumOf(e){ return (e.per && e.per.sodium != null ? num(e.per.sodium) : 0) * (num(e.qty) || 1); }
function fiberOf(e){ return (e.per && e.per.fiber != null ? num(e.per.fiber) : 0) * (num(e.qty) || 1); }
function isDrink(e){ return /juice|soda|\bcola\b|drink|lemonade|smoothie|\btea\b|coffee|milk|water/i.test(e.name) || /fl oz/i.test(e.serving || ''); }
function isSnacky(e){ return /chips|crackers|fruit snacks|cookie|candy|chocolate|gumm|pretzel|toaster pastry|granola bar|cereal|cake|donut|doughnut|brownie|ice cream|popsicle/i.test(e.name) || (e.groups || []).indexOf('other') >= 0; }
function entryTraits(e){ if (!state.meta.settings.showSwaps) return []; const out = []; TRAITS.forEach(t => { try { if (out.length < 2 && t.test(e)) out.push(t); } catch (err) { /* skip */ } }); return out; }
function swapCandidates(date){
  const names = new Set();
  for (let i = 1; i <= 7; i++) { const d = state.days[addDays(date, -i)]; if (!d) continue; d.entries.forEach(e => entryTraits(e).forEach(t => t.swaps.forEach(n => names.add(n.toLowerCase())))); }
  return names;
}
function swapTried(day, date){ if (!day.entries.length) return false; const c = swapCandidates(date); if (!c.size) return false; return day.entries.some(e => c.has(e.name.trim().toLowerCase())); }
function swapDays(){ return Object.values(state.days).filter(d => swapTried(d, d.date)).length; }

// ---------- badges ----------
function checkBadges(){
  const p = state.meta.progress; const earned = [];
  const award = id => { if (!p.badges[id]) { p.badges[id] = Date.now(); earned.push(id); } };
  const days = Object.values(state.days);
  const entries = allEntries();
  if (entries.length) award('first-bite');
  if (p.lessons.label) award('label-reader');
  if (LESSONS.every(l => p.lessons[l.id])) award('detective');
  if (p.quizBest >= 8) award('quiz-whiz');
  days.forEach(d => {
    const g = groupsOf(d);
    if (g.has('fruit') && g.has('veg')) award('rainbow');
    if (GROUPS.every(x => g.has(x.id))) award('high-five');
    if ((d.water || 0) >= 6) award('hydration');
  });
  const n = distinctFoods();
  if (n >= 10) award('explorer-10');
  if (n >= 25) award('explorer-25');
  const s = streak();
  if (s >= 3) award('streak-3');
  if (s >= 7) award('streak-7');
  if (days.filter(d => d.energy).length >= 5) award('energy-5');
  if (days.filter(d => d.entries.some(e => e.meal === 'breakfast')).length >= 5) award('breakfast-5');
  if (swapDays() >= 5) award('swap-star');
  if (entries.filter(e => e.src === 'scan' || e.src === 'ocr').length >= 5) award('scanner');
  if (earned.length) { touchMeta(); earned.forEach(id => { const b = BADGES.find(x => x.id === id); if (b) celebrate(b.em + ' Badge earned. ' + b.name + '!'); }); }
}


// ---------- weekly report (written to the family journal so the Monday email can read it) ----------
function entryReport(e){ const t = entryTotals(e); return { name: e.name, amount: servingLabel(e), kcal: Math.round(t.kcal), p: round1(t.p), c: round1(t.c), f: round1(t.f), fiber: e.per.fiber == null ? null : round1(t.fiber), added: e.per.added == null ? null : round1(t.added), sodium: e.per.sodium == null ? null : Math.round(t.sodium), groups: e.groups || [], level: e.level || null, traits: entryTraits(e).map(x => x.label), src: e.src || '' }; }
function weeklyReport(ws){
  const we = addDays(ws, 6); const p = state.meta.progress; const s = state.meta.settings; const byDate = starsByDate();
  const days = []; const sum = {}; KEYS.forEach(k => sum[k] = 0); const groupDays = {}; GROUPS.forEach(g => groupDays[g.id] = 0);
  let logged = 0, fueled = 0, missionsDone = 0, water = 0, energySum = 0, energyDays = 0, sweet = 0, level3 = 0, swapDaysN = 0; const names = new Set(); const newNames = new Set(); const missingMeal = { breakfast: 0, lunch: 0, dinner: 0 };
  for (let i = 0; i < 7; i++) {
    const date = addDays(ws, i); const d = getDay(date); const t = totals(d); const g = groupsOf(d); const qs = questStatus(date);
    const meals = {}; MEALS.forEach(m => { meals[m.id] = d.entries.filter(e => e.meal === m.id).map(entryReport); });
    if (d.entries.length) { logged++; KEYS.forEach(k => sum[k] += t[k]); ['breakfast','lunch','dinner'].forEach(m => { if (!meals[m].length) missingMeal[m]++; }); }
    if (fueledDay(d)) fueled++;
    GROUPS.forEach(x => { if (g.has(x.id)) groupDays[x.id]++; });
    missionsDone += qs.filter(x => x.done).length; water += d.water || 0; if (d.energy) { energySum += d.energy; energyDays++; }
    d.entries.forEach(e => { names.add(e.name.trim().toLowerCase()); if (isNewFood(e, date)) newNames.add(e.name); const tr = entryTraits(e).map(x => x.id); if (tr.indexOf('sugary-drink') >= 0) sweet++; if (e.level === 3) level3++; });
    if (swapTried(d, date)) swapDaysN++;
    days.push({ date, weekday: WEEKDAYS[parseDate(date).getDay()], logged: d.entries.length > 0, fueled: fueledDay(d), water: d.water || 0, energy: d.energy || null, energyName: d.energy ? FACES[d.energy - 1].name : '', stars: byDate[date] || 0, missions: qs.map(x => ({ text: x.q.text, done: x.done })), groups: GROUPS.filter(x => g.has(x.id)).map(x => x.id), meals, totals: { kcal: Math.round(t.kcal), p: round1(t.p), c: round1(t.c), f: round1(t.f), fiber: round1(t.fiber), added: round1(t.added), sodium: Math.round(t.sodium) } });
  }
  const wk = goalStatus('weekly', ws); const mo = goalStatus('monthly', monthKey(we)); const ch = challengeProgress(ws);
  const inWeek = ts => { const d = dateStr(new Date(Number(ts) || 0)); return d >= ws && d <= we; };
  const lessonsThisWeek = Object.keys(p.lessons).filter(id => inWeek(p.lessons[id])).map(id => (LESSONS.find(l => l.id === id) || {}).title || id);
  const badgesThisWeek = Object.keys(p.badges).filter(id => inWeek(p.badges[id])).map(id => (BADGES.find(b => b.id === id) || {}).name || id);
  const habits = activeHabits().map(id => { const h = habitDef(id); const n = habitDays(id); const L = habitLevel(n); let done = 0; for (let i = 0; i < 7; i++) if (habitDoneOn(id, addDays(ws, i))) done++; return { name: h.name, days: n, goal: HABIT_GOAL, level: L ? L.name : '', doneThisWeek: done }; });
  const n = stars(); const rk = rankFor(n); const si = streakInfo();
  const rec = [];
  const worstMeal = Object.keys(missingMeal).sort((a, b) => missingMeal[b] - missingMeal[a])[0];
  if (logged >= 3 && fueled < 4 && missingMeal[worstMeal] >= 2) rec.push({ id: 'fueled', text: (worstMeal.charAt(0).toUpperCase() + worstMeal.slice(1)) + ' was missing from the log on ' + missingMeal[worstMeal] + ' of the ' + logged + ' logged days. Logging it together at the table is the easiest way to turn those into fueled days.' });
  if (logged >= 3 && groupDays.veg < Math.min(4, logged)) rec.push({ id: 'veg', text: 'Veggies showed up on ' + groupDays.veg + ' of ' + logged + ' logged days. A veggie at dinner is the simplest add, and it is one of the habits she can pick in the Habit Lab.' });
  if (logged >= 3 && groupDays.fruit < Math.min(4, logged)) rec.push({ id: 'fruit', text: 'Fruit showed up on ' + groupDays.fruit + ' of ' + logged + ' logged days. Fruit with breakfast is a habit she can start with one tap.' });
  if (logged >= 3 && water / logged < 4) rec.push({ id: 'water', text: 'Water averaged ' + round1(water / logged) + ' cups on logged days. A bottle next to her homework spot usually fixes that on its own.' });
  if (sweet >= 3) rec.push({ id: 'sweet', text: 'Sweet drinks appeared ' + sweet + ' times this week. The swap ideas in the app point to water, milk, or 100 percent juice in a small glass. No need to make a thing of it, just keep the everyday drinks within reach.' });
  if (logged >= 3 && names.size < 10) rec.push({ id: 'variety', text: 'She logged ' + names.size + ' different foods. Variety is where the vitamins hide, so one new food this week, chosen by her, is a good mission.' });
  if (wk.reached && !wk.given) rec.push({ id: 'reward', text: 'She reached the weekly star goal (' + wk.n + ' of ' + wk.goal + '). It has not been marked as given yet, so a quick celebration and a tap in the Chief’s office closes the loop.' });
  if (!wk.reached && logged >= 5) rec.push({ id: 'goal', text: 'She logged ' + logged + ' days but landed at ' + wk.n + ' of ' + wk.goal + ' stars. If this repeats, lower the weekly goal a little. The target should be reachable most weeks.' });
  if (energyDays >= 4 && energySum / energyDays <= 2) rec.push({ id: 'energy', text: 'Her energy check-ins averaged low this week. Worth a look at sleep and breakfast before anything else.' });
  if (lessonsThisWeek.length === 0 && Object.keys(p.lessons).length < LESSONS.length) rec.push({ id: 'lesson', text: 'No Academy lessons this week. One lesson together takes about five minutes and is worth 3 stars.' });
  return { version: 1, weekStart: ws, weekEnd: we, name: s.name, generatedAt: Math.max(state.meta.updatedAt || 0, Math.max.apply(null, days.map(d => (state.days[d.date] || {}).updatedAt || 0))), showNumbers: !!s.showNumbers, refKcal: refs().kcal,
    week: { daysLogged: logged, fueledDays: fueled, stars: wk.n, weeklyGoal: { goal: wk.goal, n: wk.n, reached: wk.reached, given: !!wk.given, reward: wk.label }, monthlyGoal: { key: mo.key, goal: mo.goal, n: mo.n, reached: mo.reached, given: !!mo.given, reward: mo.label }, missionsDone, missionsTotal: 21, distinctFoods: names.size, newFoods: Array.from(newNames).slice(0, 20), swapDays: swapDaysN, waterAvg: logged ? round1(water / logged) : 0, energyAvg: energyDays ? round1(energySum / energyDays) : null, energyDays, groupDays, sweetDrinks: sweet, level3Foods: level3, lessonsThisWeek, badgesThisWeek, rank: rk.name, lifetimeStars: n, streak: si.count, habits, challenge: { name: ch.ch.name, text: ch.ch.text, n: ch.n, target: ch.ch.target, done: ch.done }, totals: { kcal: Math.round(sum.kcal), p: round1(sum.p), c: round1(sum.c), f: round1(sum.f), fiber: round1(sum.fiber), added: round1(sum.added), sodium: Math.round(sum.sodium) }, avgPerLoggedDay: logged ? { kcal: Math.round(sum.kcal / logged), p: round1(sum.p / logged), c: round1(sum.c / logged), f: round1(sum.f / logged), fiber: round1(sum.fiber / logged), added: round1(sum.added / logged), sodium: Math.round(sum.sodium / logged) } : null },
    days, recommendations: rec };
}
function queueReportPushes(){ const ws = weekStart(todayStr()); queuePush('report:' + ws); queuePush('report:' + addDays(ws, -7)); }
