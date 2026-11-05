// ---------- family journal sync (Firebase) ----------
// How it stays reliable
// 1. Every change is saved on the device first and put in an outbox that survives closing the app.
// 2. The outbox is sent with a transaction that reads the cloud copy, merges it with this device's copy
//    entry by entry, and writes the result, so two devices can never overwrite each other.
// 3. Merges give the same answer on every device (ties broken the same way), so devices always converge.
// 4. Anything that fails is retried on a timer, when the app comes back to the screen, and when the internet returns.
// 5. Each device reports itself (name, last sync, waiting changes, app version) so a parent can see them all.
const APP_VERSION = '4.1.0';
const FIREBASE_CONFIG = { apiKey: "AIzaSyAll5XE3Afsy4a3qvKTsCQr1q3p9QovLe4", authDomain: "food-explorer-7f778.firebaseapp.com", projectId: "food-explorer-7f778", storageBucket: "food-explorer-7f778.firebasestorage.app", messagingSenderId: "546707480929", appId: "1:546707480929:web:f5e02ee46d540b33832520" };
const FIREBASE_VERSION = '10.14.1';
const remote = { M: null, authM: null, fs: null, auth: null, fam: '', status: 'local', detail: '', loaded: false, gotMeta: false, gotDays: false, unsubs: [], flushing: false, again: false, flushTimer: null, loadTimer: null, retryTimer: null, retryMs: 0, lastOk: 0, lastPull: 0, lastResume: 0, devices: [], deviceAt: 0, gen: 0, pendingSince: 0, updAt: 0, downloads: null };
try { remote.lastOk = Number(localStorage.getItem('fe.lastSync')) || 0; } catch (e) { /* ignore */ }

// ---------- family code ----------
function normalizeCode(code){
  let c = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (/^[A-Z]+[0-9]+$/.test(c)) c = c.replace(/^([A-Z]+)([0-9]+)$/, '$1-$2');
  return c.slice(0, 40);
}
let memFamily = '';
function familyCode(){ try { return (localStorage.getItem('fe.family') || '').trim() || memFamily; } catch (e) { return memFamily; } }
function setFamilyCode(code){ memFamily = code || ''; try { if (code) localStorage.setItem('fe.family', code); else localStorage.removeItem('fe.family'); } catch (e) { /* storage blocked: remembered for this visit only */ } }
function migrateFamilyCode(){ const c = familyCode(); if (c && normalizeCode(c) !== c) setFamilyCode(normalizeCode(c)); }
function needsJoin(){ return !!FIREBASE_CONFIG && !familyCode(); }
function joinLink(code){ const base = location.protocol === 'https:' ? location.origin + location.pathname : 'https://sowerscs.github.io/food-detective/'; return base + '#join=' + encodeURIComponent(code || familyCode()); }
function sha256(ascii){
  function rotr(v, a){ return (v >>> a) | (v << (32 - a)); }
  const maxWord = Math.pow(2, 32); let result = '';
  const words = []; const asciiBitLength = ascii.length * 8;
  const hash = sha256.h = sha256.h || []; const k = sha256.k = sha256.k || []; let primeCounter = k.length;
  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (Math.pow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += '\x80';
  while (ascii.length % 64 - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) { const j = ascii.charCodeAt(i); if (j >> 8) return ''; words[i >> 2] |= j << ((3 - i) % 4) * 8; }
  words[words.length] = (asciiBitLength / maxWord) | 0; words[words.length] = asciiBitLength;
  const h = hash.slice(0, 8);
  for (let j = 0; j < words.length;) {
    const w = words.slice(j, j += 16); const oldHash = h.slice(0);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = h[0], e = h[4];
      const temp1 = h[7] + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & h[5]) ^ ((~e) & h[6])) + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rotr(w15, 7) ^ rotr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rotr(w2, 17) ^ rotr(w2, 19) ^ (w2 >>> 10))) | 0);
      const temp2 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & h[1]) ^ (a & h[2]) ^ (h[1] & h[2]));
      h.unshift((temp1 + temp2) | 0); h[4] = (h[4] + temp1) | 0; h.length = 8;
    }
    for (let i = 0; i < 8; i++) h[i] = (h[i] + oldHash[i]) | 0;
  }
  for (let i = 0; i < 8; i++) for (let j = 3; j + 1; j--) { const b = (h[i] >> (j * 8)) & 255; result += ((b < 16) ? 0 : '') + b.toString(16); }
  return result;
}
// ---------- this device ----------
function deviceId(){ try { let id = localStorage.getItem('fe.device'); if (!id) { id = 'd' + uid(); localStorage.setItem('fe.device', id); } return id; } catch (e) { return 'd-unsaved'; } }
function isStandalone(){ try { return window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches); } catch (e) { return false; } }
function deviceKind(){
  const ua = navigator.userAgent || '';
  const os = /iPhone/.test(ua) ? 'iPhone' : (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) ? 'iPad' : /Android/.test(ua) ? (/Mobile/.test(ua) ? 'Android phone' : 'Android tablet') : /CrOS/.test(ua) ? 'Chromebook' : /Macintosh/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows PC' : 'Computer';
  let br = isStandalone() ? 'home screen app' : /EdgA?\/|EdgiOS/.test(ua) ? 'Edge' : (/CriOS|Chrome\//.test(ua) && !/OPR\//.test(ua)) ? 'Chrome' : /FxiOS|Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'browser';
  if (/FBAN|FBAV|Instagram|Line\/|GSA\//.test(ua)) br = 'in-app browser';
  return os + ', ' + br;
}
function deviceName(){ try { return (localStorage.getItem('fe.deviceName') || '').trim() || deviceKind(); } catch (e) { return deviceKind(); } }
function setDeviceName(n){ try { if (n) localStorage.setItem('fe.deviceName', n.slice(0, 30)); else localStorage.removeItem('fe.deviceName'); } catch (e) { /* ignore */ } }

// ---------- outbox (survives closing the app) ----------
const DIRTY_KEY = 'fe.dirty';
let dirty = {}; let dirtyN = 0;
try { const d = JSON.parse(localStorage.getItem(DIRTY_KEY) || '{}'); if (d && typeof d === 'object') dirty = d; } catch (e) { dirty = {}; }
function saveDirty(){ try { localStorage.setItem(DIRTY_KEY, JSON.stringify(dirty)); } catch (e) { /* ignore */ } }
function isReportKey(k){ return k.indexOf('report:') === 0; }
function pendingKeys(){ return Object.keys(dirty).filter(k => !isReportKey(k)); }
function queuePush(key){
  dirty[key] = Date.now() + '-' + (++dirtyN); saveDirty();
  if (!isReportKey(key) && !remote.pendingSince) remote.pendingSince = Date.now();
  if (!isReportKey(key) && remote.status === 'synced') setSync('sending');
  scheduleFlush(isReportKey(key) ? 2500 : 250);
}
function queueReportPushes(){ const ws = weekStart(todayStr()); queuePush('report:' + ws); queuePush('report:' + addDays(ws, -7)); }
function scheduleFlush(ms, force){
  if (!remote.fam) return;
  const due = Date.now() + (ms || 0);
  if (remote.flushTimer && remote.flushDue <= due && !force) return;   // a send is already coming sooner
  clearTimeout(remote.flushTimer); remote.flushDue = due;
  remote.flushTimer = setTimeout(() => { remote.flushTimer = null; flush(); }, ms || 0);
}

// ---------- merging (same answer on every device) ----------
function canon(o){ return JSON.stringify(o, (k, v) => (v && typeof v === 'object' && !Array.isArray(v)) ? Object.keys(v).sort().reduce((a, kk) => { a[kk] = v[kk]; return a; }, {}) : v); }
function plain(o){ return JSON.parse(JSON.stringify(o)); }
function erasedAt(){ return (state && state.meta && state.meta.erasedAt) || 0; }
function mergeDay(local, theirs, date){
  const E = erasedAt();
  const L = local ? normalizeDay(local, date) : null, R = theirs ? normalizeDay(theirs, date) : null;
  const sides = [L, R].filter(Boolean); if (!sides.length) return null;
  const tomb = {}; sides.forEach(sd => Object.keys(sd.deleted || {}).forEach(id => { tomb[id] = Math.max(tomb[id] || 0, sd.deleted[id]); }));
  const byId = {};
  sides.forEach(sd => sd.entries.forEach(e => {
    const ts = e.updatedAt || e.createdAt || 0;
    if (E && ts <= E) return;
    if (tomb[e.id] && tomb[e.id] >= ts) return;
    const cur = byId[e.id]; if (!cur) { byId[e.id] = e; return; }
    const cts = cur.updatedAt || cur.createdAt || 0;
    if (ts > cts || (ts === cts && canon(e) > canon(cur))) byId[e.id] = e;
  }));
  const entries = Object.values(byId).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const cutoff = Date.now() - 45 * 86400000; Object.keys(tomb).forEach(id => { if (tomb[id] < cutoff || (E && tomb[id] <= E)) delete tomb[id]; });
  const pick = (f, at) => {
    const useAt = sides.some(sd => sd[at]); let best = null;
    sides.forEach(sd => { const t = useAt ? (sd[at] || 0) : (sd.updatedAt || 0); const v = sd[f]; if (!best || t > best.t || (t === best.t && JSON.stringify(v) > JSON.stringify(best.v))) best = { v, t }; });
    if (E && best.t <= E) return { v: f === 'water' ? 0 : null, at: 0 };
    return { v: best.v, at: useAt ? best.t : 0 };
  };
  const w = pick('water', 'waterAt'), en = pick('energy', 'energyAt');
  return { date, entries, water: w.v, waterAt: w.at, energy: en.v, energyAt: en.at, deleted: tomb, updatedAt: Math.max.apply(null, sides.map(sd => sd.updatedAt || 0)) };
}
function pickBy(a, b, ta, tb){ if (ta !== tb) return ta > tb ? a : b; return canon(a) >= canon(b) ? a : b; }
function mergeMap(x, y){ const o = {}; [x || {}, y || {}].forEach(m => Object.keys(m).forEach(k => { if (!(k in o) || canon(m[k]) > canon(o[k])) o[k] = m[k]; })); return o; }
function unionMin(x, y){ const o = {}; [x || {}, y || {}].forEach(m => Object.keys(m).forEach(k => { const v = Number(m[k]) || 0; o[k] = (k in o) ? Math.min(o[k], v) : v; })); return o; }
function mergeMeta(local, theirs){
  let L = normalizeMeta(local), R = normalizeMeta(theirs);
  const E = Math.max(L.erasedAt, R.erasedAt);
  const blank = () => { const m = normalizeMeta({}); m.erasedAt = E; return m; };
  if (E) { if (L.erasedAt < E && L.updatedAt <= E) L = blank(); if (R.erasedAt < E && R.updatedAt <= E) R = blank(); }
  const a = L.progress, b = R.progress;
  const legacyS = !L.settingsAt && !R.settingsAt, legacyR = !L.rewardsAt && !R.rewardsAt;
  const settings = clone(pickBy(L.settings, R.settings, legacyS ? L.updatedAt : L.settingsAt, legacyS ? R.updatedAt : R.settingsAt));
  const cfg = x => ({ weeklyGoal: x.weeklyGoal, weeklyReward: x.weeklyReward, monthlyGoal: x.monthlyGoal, monthlyReward: x.monthlyReward });
  const rc = clone(pickBy(cfg(a.rewards), cfg(b.rewards), legacyR ? L.updatedAt : L.rewardsAt, legacyR ? R.updatedAt : R.rewardsAt));
  const ledger = {}; [a.rewards.ledger, b.rewards.ledger].forEach(ls => (ls || []).forEach(x => { if (!ledger[x.id] || canon(x) > canon(ledger[x.id])) ledger[x.id] = x; }));
  const habits = {};
  Array.from(new Set(Object.keys(a.habits).concat(Object.keys(b.habits)))).forEach(id => {
    const x = a.habits[id], y = b.habits[id];
    if (!x || !y) { habits[id] = clone(x || y); return; }
    const base = clone(pickBy(x, y, x.at || 0, y.at || 0)); base.days = Object.assign({}, x.days, y.days); habits[id] = base;
  });
  let quizBest = a.quizBest, quizBestDate = a.quizBestDate;
  if (b.quizBest > a.quizBest || (b.quizBest === a.quizBest && (b.quizBestDate || '9999') < (a.quizBestDate || '9999'))) { quizBest = b.quizBest; quizBestDate = b.quizBestDate; }
  const progress = {
    lessons: unionMin(a.lessons, b.lessons), badges: unionMin(a.badges, b.badges), arenaDays: mergeMap(a.arenaDays, b.arenaDays), cases: mergeMap(a.cases, b.cases),
    quizBest, quizBestDate, quizRounds: Math.max(a.quizRounds || 0, b.quizRounds || 0), habits,
    rewards: Object.assign(defaultRewards(), rc, { ledger: Object.values(ledger).sort((x, y) => x.date < y.date ? -1 : x.date > y.date ? 1 : (x.id < y.id ? -1 : 1)).slice(-400) })
  };
  return normalizeMeta({ settings, progress, updatedAt: Math.max(L.updatedAt, R.updatedAt), settingsAt: Math.max(L.settingsAt, R.settingsAt), rewardsAt: Math.max(L.rewardsAt, R.rewardsAt), erasedAt: E });
}
function applyErase(){
  const E = erasedAt(); if (!E) return false; let changed = false;
  Object.keys(state.days).forEach(date => {
    const d = state.days[date]; const m = mergeDay(d, null, date);
    if (!m.entries.length && !m.water && !m.energy) { delete state.days[date]; changed = true; }
    else if (canon(m) !== canon(normalizeDay(d, date))) { state.days[date] = m; changed = true; }
  });
  return changed;
}

// ---------- status ----------
function setSync(status, detail){
  const changed = remote.status !== status || remote.detail !== (detail || '');
  remote.status = status; remote.detail = detail || '';
  if (!pendingKeys().length) remote.pendingSince = 0;
  if (changed) refreshSyncViews();
}
let syncViewTimer = null;
function refreshSyncViews(){
  clearTimeout(syncViewTimer);
  syncViewTimer = setTimeout(() => {
    try {
      renderTop();
      const fc = document.getElementById('family-card'); if (fc) fc.outerHTML = familyCardHTML();
      const ss = document.getElementById('sync-status'); if (ss) ss.innerHTML = syncStatusHTML();
      const sb = document.getElementById('sync-banner'); if (sb) sb.outerHTML = syncBannerHTML();
    } catch (e) { /* views not ready yet */ }
  }, 30);
}
function errCode(e){ return String((e && e.code) || '').replace(/^(firestore|auth)\//, ''); }
function errText(e){ const c = errCode(e); return c ? c.replace(/-/g, ' ') : String((e && e.message) || 'no connection').slice(0, 80); }
function isOffline(e){ const c = errCode(e); return navigator.onLine === false || c === 'unavailable' || c === 'network-request-failed' || c === 'deadline-exceeded' || /offline|network|fetch|load/i.test(String(e && e.message)); }
function ago(ts){
  if (!ts) return 'never';
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 45) return 'just now'; if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min ago';
  const d = new Date(ts); const t = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (dateStr(d) === todayStr()) return 'today ' + t; if (dateStr(d) === addDays(todayStr(), -1)) return 'yesterday ' + t;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + t;
}
function syncText(){
  const n = pendingKeys().length; const waiting = n ? n + (n === 1 ? ' change is' : ' changes are') + ' saved on this device and waiting to send. ' : '';
  switch (remote.status) {
    case 'synced': return { dot: 'synced', short: 'Synced', label: 'Everything is saved to the family journal', text: 'Last synced ' + ago(remote.lastOk) + '. Every connected phone and computer sees the same entries.' };
    case 'sending': return { dot: 'busy', short: 'Sending', label: 'Sending to the family journal', text: waiting || 'Sending now.' };
    case 'connecting': return { dot: 'busy', short: 'Connecting', label: 'Connecting to the family journal', text: waiting + 'Entries are always saved on this device first.' };
    case 'slow': return { dot: 'busy', short: 'Connecting', label: 'Still reaching the family journal', text: waiting + 'The connection is slow. Nothing is lost, it will finish on its own.' };
    case 'offline': return { dot: 'busy', short: 'Offline' + (n ? ' · ' + n : ''), label: 'No internet right now', text: waiting + 'They send by themselves when the internet is back.' };
    case 'retry': return { dot: 'bad', short: 'Retrying' + (n ? ' · ' + n : ''), label: 'Could not reach the family journal', text: waiting + 'Trying again automatically' + (remote.detail ? ' (' + remote.detail + ')' : '') + '.' };
    default: return { dot: 'bad', short: 'Not connected', label: 'Not connected to a family journal', text: 'Enter the family code to connect this device.' };
  }
}

// ---------- connecting ----------
async function loadFirebase(){
  if (remote.M) return;
  const base = 'https://www.gstatic.com/firebasejs/' + FIREBASE_VERSION + '/';
  const mods = await Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')]);
  const appM = mods[0], authM = mods[1], fsM = mods[2];
  const app = appM.getApps().length ? appM.getApp() : appM.initializeApp(FIREBASE_CONFIG);
  let fs; try { fs = fsM.initializeFirestore(app, { experimentalAutoDetectLongPolling: true }); } catch (e) { fs = fsM.getFirestore(app); }
  remote.auth = authM.getAuth(app); remote.authM = authM; remote.fs = fs; remote.M = fsM;
}
async function ensureAuth(){
  const a = remote.auth;
  if (!a.currentUser && typeof a.authStateReady === 'function') { try { await a.authStateReady(); } catch (e) { /* ignore */ } }
  if (!a.currentUser) await remote.authM.signInAnonymously(a);
}
function fref(path){ return remote.M.doc(remote.fs, remote.fam + '/' + path); }
function stopSync(){
  remote.gen++;
  remote.unsubs.forEach(u => { try { u(); } catch (e) { /* ignore */ } }); remote.unsubs = [];
  clearTimeout(remote.flushTimer); remote.flushTimer = null; clearTimeout(remote.loadTimer); clearTimeout(remote.retryTimer);
  remote.fam = ''; remote.code = ''; remote.loaded = remote.gotMeta = remote.gotDays = false; remote.devices = []; remote.flushing = false;
  setSync('local');
}
async function startSync(){
  stopSync();
  const code = familyCode(); if (!FIREBASE_CONFIG || !code) return;
  const gen = remote.gen;
  setSync('connecting');
  try {
    await loadFirebase(); await ensureAuth();
    if (gen !== remote.gen) return;
    remote.fam = 'families/' + sha256(code); remote.code = code;
    subscribe(gen);
    remote.loadTimer = setTimeout(() => { if (gen === remote.gen && !remote.loaded) setSync(navigator.onLine === false ? 'offline' : 'slow'); }, 12000);
    scheduleFlush(0);
  } catch (e) {
    if (gen !== remote.gen) return;
    setSync(isOffline(e) ? 'offline' : 'retry', errText(e));
    remote.retryTimer = setTimeout(() => { if (gen === remote.gen) startSync(); }, 15000);
  }
}
function subscribe(gen){
  const M = remote.M, fam = remote.fam;
  const onErr = e => {
    if (gen !== remote.gen) return;
    setSync(isOffline(e) ? 'offline' : 'retry', errText(e));
    clearTimeout(remote.retryTimer); remote.retryTimer = setTimeout(() => { if (gen === remote.gen) startSync(); }, 10000);
  };
  remote.unsubs.push(M.onSnapshot(fref('journal/meta'), snap => { if (gen === remote.gen) { try { onMetaSnap(snap); } catch (e) { console.warn(e); } } }, onErr));
  remote.unsubs.push(M.onSnapshot(M.query(M.collection(remote.fs, fam + '/days'), M.orderBy('date', 'desc'), M.limit(400)), snap => { if (gen === remote.gen) { try { onDaysSnap(snap); } catch (e) { console.warn(e); } } }, onErr));
  remote.unsubs.push(M.onSnapshot(M.collection(remote.fs, fam + '/devices'), snap => { if (gen === remote.gen) { remote.devices = snap.docs.map(d => d.data()).filter(d => d && d.id); refreshSyncViews(); } }, () => { /* the device list is optional */ }));
}
function markLoaded(snap){
  if (snap && snap.metadata && snap.metadata.fromCache) return;
  if (!remote.loaded && remote.gotMeta && remote.gotDays) { remote.loaded = true; clearTimeout(remote.loadTimer); pingDevice(true); }
  if (!remote.loaded) return;
  if (Object.keys(dirty).length && !remote.flushing) scheduleFlush(pendingKeys().length ? 0 : 2500);
  if (!remote.flushing) setSync(pendingKeys().length ? 'sending' : 'synced');
}
function changedLocal(){ bump(); saveLocal(); clearTimeout(changedLocal.t); changedLocal.t = setTimeout(() => { render(); if (ui.sheet && typeof renderSheet === 'function' && ui.sheet.kind === 'sync') renderSheet(); }, 40); }
function onMetaSnap(snap){
  remote.gotMeta = true;
  const theirs = snap.exists() ? snap.data() : null;
  if (theirs) {
    const before = canon(normalizeMeta(state.meta)); const m = mergeMeta(state.meta, theirs);
    if (canon(m) !== before) { state.meta = m; applyErase(); changedLocal(); queueReportPushes(); }
    if (canon(m) !== canon(normalizeMeta(theirs))) queuePush('meta');
  } else queuePush('meta');
  markLoaded(snap);
}
function mergeRemoteDay(doc){
  const d = doc.data(); const date = /^\d{4}-\d{2}-\d{2}$/.test(doc.id) ? doc.id : d && d.date;
  if (!d || !date) return { date: null, changed: false };
  const cur = state.days[date]; const m = mergeDay(cur || null, d, date);
  let changed = false;
  if (m && (m.entries.length || m.water || m.energy || cur)) {
    if (!cur || canon(m) !== canon(normalizeDay(cur, date))) { state.days[date] = m; changed = true; }
    if (canon(m) !== canon(normalizeDay(d, date))) queuePush(date);
  }
  return { date, changed };
}
function onDaysSnap(snap){
  remote.gotDays = true;
  let changed = false; const seen = new Set(); let oldest = null;
  snap.docs.forEach(doc => { const r = mergeRemoteDay(doc); if (!r.date) return; seen.add(r.date); if (!oldest || r.date < oldest) oldest = r.date; if (r.changed) changed = true; });
  const complete = snap.size < 400;
  Object.keys(state.days).forEach(date => {
    if (seen.has(date)) return; const d = state.days[date];
    if (!d.entries.length && !d.water && !d.energy) return;
    if (complete || (oldest && date >= oldest)) queuePush(date);
  });
  if (changed) { changedLocal(); queueReportPushes(); }
  markLoaded(snap);
}
async function pullRecent(force){
  if (!remote.fam || !remote.M || !remote.M.getDocsFromServer) return;
  const now = Date.now(); if (!force && now - remote.lastPull < 20000) return; remote.lastPull = now;
  const gen = remote.gen, M = remote.M;
  try {
    const res = await Promise.all([M.getDocFromServer(fref('journal/meta')), M.getDocsFromServer(M.query(M.collection(remote.fs, remote.fam + '/days'), M.where('date', '>=', addDays(todayStr(), -45))))]);
    if (gen !== remote.gen) return;
    if (res[0].exists()) onMetaSnap(res[0]);
    let changed = false; res[1].docs.forEach(doc => { if (mergeRemoteDay(doc).changed) changed = true; });
    if (changed) { changedLocal(); queueReportPushes(); }
    if (remote.loaded && !remote.flushing && !pendingKeys().length) setSync('synced');
  } catch (e) { if (gen === remote.gen && isOffline(e)) setSync('offline'); }
}

// ---------- sending ----------
async function pushKey(key, gen){
  const M = remote.M;
  if (isReportKey(key)) { const ws = key.slice(7); await M.setDoc(fref('reports/' + ws), plain(weeklyReport(ws))); return; }
  const isMeta = key === 'meta'; const ref = fref(isMeta ? 'journal/meta' : 'days/' + key);
  let out = null;
  await M.runTransaction(remote.fs, async tx => {
    const snap = await tx.get(ref);
    const theirs = snap.exists() ? snap.data() : null;
    out = isMeta ? mergeMeta(state.meta, theirs) : mergeDay(state.days[key] || null, theirs, key);
    if (!out) return;
    if (!isMeta) out.date = key;
    if (theirs && canon(out) === canon(isMeta ? normalizeMeta(theirs) : normalizeDay(theirs, key))) return;
    tx.set(ref, plain(out));
  });
  if (gen !== remote.gen || !out) return;
  if (isMeta) { const m = mergeMeta(state.meta, out); if (canon(m) !== canon(normalizeMeta(state.meta))) { state.meta = m; applyErase(); changedLocal(); } }
  else { const cur = state.days[key]; const m = mergeDay(cur || null, out, key); if (!cur || canon(m) !== canon(normalizeDay(cur, key))) { if (!m.entries.length && !m.water && !m.energy && !cur) return; state.days[key] = m; changedLocal(); } }
}
async function flush(){
  if (!remote.fam || !remote.M) return;
  if (remote.flushing) { remote.again = true; return; }
  remote.flushing = true; const gen = remote.gen;
  const order = k => k === 'meta' ? 0 : isReportKey(k) ? 2 : 1;
  try {
    const keys = Object.keys(dirty).sort((a, b) => order(a) - order(b) || (a < b ? -1 : 1));
    if (pendingKeys().length) setSync('sending');
    for (const key of keys) {
      if (gen !== remote.gen) return;
      if (!(key in dirty)) continue;
      if (isReportKey(key) && (!remote.loaded || pendingKeys().length)) continue;
      const tag = dirty[key];
      await pushKey(key, gen);
      if (dirty[key] === tag) { delete dirty[key]; saveDirty(); }
    }
    remote.retryMs = 0; remote.lastOk = Date.now();
    try { localStorage.setItem('fe.lastSync', String(remote.lastOk)); } catch (e) { /* ignore */ }
    if (remote.loaded) setSync(pendingKeys().length ? 'sending' : 'synced');
  } catch (err) {
    if (gen !== remote.gen) return;
    remote.retryMs = Math.min(60000, Math.max(3000, (remote.retryMs || 1500) * 2));
    setSync(isOffline(err) ? 'offline' : 'retry', errText(err));
    scheduleFlush(remote.retryMs, true);
  } finally {
    if (gen === remote.gen) {
      remote.flushing = false;
      if (remote.again) { remote.again = false; scheduleFlush(150); }
    }
  }
  pingDevice(false);
}
function latestEntryTs(){ let t = 0; Object.values(state.days).forEach(d => d.entries.forEach(e => { if ((e.createdAt || 0) > t) t = e.createdAt; })); return t; }
async function pingDevice(force){
  if (!remote.fam || !remote.loaded) return;
  const now = Date.now(); if (!force && now - remote.deviceAt < 60000) return; remote.deviceAt = now;
  const body = { id: deviceId(), name: deviceName(), kind: deviceKind(), app: APP_VERSION, lastSeen: now, lastSync: remote.lastOk || 0, pending: pendingKeys().length, entries: allEntries().length, lastEntry: latestEntryTs(), standalone: !!isStandalone() };
  try { await remote.M.setDoc(fref('devices/' + deviceId()), body, { merge: true }); } catch (e) { /* not important enough to retry */ }
}
function syncDiagnostics(){ return { app: APP_VERSION, status: remote.status, detail: remote.detail, connected: !!remote.fam, loaded: remote.loaded, flushing: remote.flushing, waiting: Object.keys(dirty), lastSync: remote.lastOk, device: deviceName(), online: navigator.onLine }; }
try { window.foodDetectiveSync = syncDiagnostics; } catch (e) { /* ignore */ }
function syncNow(){ if (!familyCode()) return; if (!remote.fam) { startSync(); return; } remote.retryMs = 0; scheduleFlush(0); pullRecent(true); pingDevice(true); }

// ---------- joining a family journal ----------
async function joinFamily(input, create, childName){
  const code = normalizeCode(input);
  if (code.length < 4) { ui.join = { code: String(input || ''), msg: 'The family code has at least 4 letters or numbers.' }; renderView(); return; }
  ui.join = { code, busy: true, msg: 'Looking for the family journal…' }; renderView();
  try {
    await loadFirebase(); await ensureAuth();
    const M = remote.M; const fam = 'families/' + sha256(code);
    const snap = await M.getDocFromServer(M.doc(remote.fs, fam + '/journal/meta'));
    if (!snap.exists() && !create) { ui.join = { code, notFound: true, msg: 'No family journal uses the code ' + code + '. Check it with a parent and try again.' }; renderView(); return; }
    if (snap.exists()) { state.meta = mergeMeta(state.meta, snap.data()); }
    else {
      const now = Date.now(); state.meta.settings.name = String(childName || '').trim().slice(0, 30); state.meta.settingsAt = now; state.meta.updatedAt = now;
      await M.setDoc(M.doc(remote.fs, fam + '/journal/meta'), plain(normalizeMeta(state.meta)));
    }
    bump(); saveLocal(); setFamilyCode(code); ui.join = null;
    Object.keys(state.days).forEach(d => { const day = state.days[d]; if (day.entries.length || day.water || day.energy) queuePush(d); });
    render(); startSync();
    toast(snap.exists() ? '✅ Connected to the family journal' : '✅ New family journal started');
  } catch (e) {
    ui.join = { code, msg: isOffline(e) ? 'This device is offline. Connect to Wi-Fi or data, then tap Connect.' : 'Could not reach the family journal (' + errText(e) + '). Try again in a moment.' };
    renderView();
  }
}
function leaveFamily(){ stopSync(); setFamilyCode(''); remote.devices = []; ui.join = null; render(); }
function eraseEverything(){
  const E = Date.now(); const dates = Object.keys(state.days);
  state = freshState(true);
  state.meta.erasedAt = E; state.meta.updatedAt = E; state.meta.settingsAt = E; state.meta.rewardsAt = E;
  bump(); saveLocal();
  ui.date = todayStr(); ui.lesson = null; ui.arena = null;
  queuePush('meta'); dates.forEach(d => queuePush(d));
  render();
}

// ---------- keeping every device current ----------
function onResume(){
  const now = Date.now(); if (now - remote.lastResume < 3000) return; remote.lastResume = now;
  checkForUpdate();
  if (!familyCode()) return;
  if (!remote.fam) { startSync(); return; }
  scheduleFlush(0); pullRecent(false); pingDevice(false);
}
function newerVersion(a, b){ const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) { if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0); } return false; }
async function checkForUpdate(){
  if (location.protocol !== 'https:') return;
  const now = Date.now(); if (now - remote.updAt < 5 * 60000) return; remote.updAt = now;
  try {
    const r = await fetch('version.json?t=' + now, { cache: 'no-store' }); if (!r.ok) return;
    const v = String((await r.json()).version || '');
    if (!v || !newerVersion(v, APP_VERSION)) return;
    let tried = ''; try { tried = sessionStorage.getItem('fe.updTried') || ''; } catch (e) { /* ignore */ }
    if (tried === v) return;
    ui.updateReady = v; maybeReloadForUpdate();
  } catch (e) { /* try again later */ }
}
function maybeReloadForUpdate(){
  if (!ui.updateReady) return;
  const a = document.activeElement; const typing = a && /INPUT|TEXTAREA|SELECT/.test(a.tagName);
  if (ui.sheet || typing || ui.lesson || ui.arena) return;
  try { sessionStorage.setItem('fe.updTried', ui.updateReady); } catch (e) { /* ignore */ }
  location.replace(location.pathname + '?v=' + encodeURIComponent(ui.updateReady) + '#' + ui.view);
}
function installLifecycle(){
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') onResume(); else pingDevice(true); });
  window.addEventListener('online', () => { remote.lastResume = 0; onResume(); });
  window.addEventListener('offline', () => { if (familyCode()) setSync('offline'); });
  window.addEventListener('focus', onResume);
  window.addEventListener('pageshow', e => { if (e.persisted) { remote.lastResume = 0; onResume(); } });
  // a second tab of the app on the same device: merge what it saved instead of overwriting it
  window.addEventListener('storage', e => {
    try {
      if (e.key === LS_KEY && e.newValue) {
        const other = normalizeState(JSON.parse(e.newValue).state); let changed = false;
        const m = mergeMeta(state.meta, other.meta); if (canon(m) !== canon(normalizeMeta(state.meta))) { state.meta = m; changed = true; }
        Object.keys(other.days).forEach(date => { const cur = state.days[date]; const md = mergeDay(cur || null, other.days[date], date); if (md && (!cur || canon(md) !== canon(normalizeDay(cur, date)))) { state.days[date] = md; changed = true; } });
        if (changed) { bump(); render(); }
      } else if (e.key === DIRTY_KEY && e.newValue) {
        const other = JSON.parse(e.newValue) || {}; Object.keys(other).forEach(k => { if (!(k in dirty)) dirty[k] = other[k]; });
      } else if (e.key === 'fe.family' && (e.newValue || '') !== remote.code) { render(); startSync(); }
    } catch (err) { /* ignore */ }
  });
  setInterval(() => { if (document.visibilityState !== 'visible') return; if (familyCode() && Object.keys(dirty).length && !remote.flushing) scheduleFlush(0); pingDevice(false); refreshSyncViews(); }, 30000);
  setInterval(checkForUpdate, 30 * 60000);
}
