
// ---------- camera: barcode scanning and label reading ----------
// Barcodes are looked up in Open Food Facts (only the barcode is sent). Label photos are read on the device with Tesseract and never uploaded.
const ZXING_URL = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';
const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
const OFF_URL = 'https://world.openfoodfacts.org/api/v2/product/';
const OFF_FIELDS = 'code,product_name,product_name_en,brands,serving_size,serving_quantity,nutriments,nova_group,categories_tags,image_front_small_url';
const scripts = {};
function loadScript(url){
  if (!scripts[url]) scripts[url] = new Promise((resolve, reject) => {
    const s = document.createElement('script'); s.src = url; s.async = true;
    s.onload = () => resolve(); s.onerror = () => { delete scripts[url]; reject(new Error('could not load ' + url)); };
    document.head.appendChild(s);
  });
  return scripts[url];
}
const cam = { stream: null, reader: null, active: false, worker: null };
function stopCamera(){
  cam.active = false;
  try { if (cam.reader && cam.reader.reset) cam.reader.reset(); } catch (e) { /* ignore */ }
  try { if (cam.stream) cam.stream.getTracks().forEach(t => t.stop()); } catch (e) { /* ignore */ }
  cam.stream = null;
}
function setScanStatus(msg, cls){ const el = $('#scan-status'); if (el) { el.textContent = msg; el.className = 'scan-status' + (cls ? ' ' + cls : ''); } }
async function getReader(){
  await loadScript(ZXING_URL);
  const Z = window.ZXing; if (!Z || !Z.BrowserMultiFormatReader) throw new Error('scanner unavailable');
  const hints = new Map();
  hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E, Z.BarcodeFormat.CODE_128]);
  hints.set(Z.DecodeHintType.TRY_HARDER, true);
  return new Z.BrowserMultiFormatReader(hints, 400);
}
async function startLiveScan(){
  const video = $('#scan-video'); if (!video) return;
  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { setScanStatus('This browser cannot use the camera here. Take a photo of the barcode instead.'); return; }
  setScanStatus('Starting the camera…');
  try {
    const reader = await getReader(); cam.reader = reader; cam.active = true;
    await reader.decodeFromConstraints({ video: { facingMode: { ideal: 'environment' } } }, video, (result, err) => {
      if (!cam.active) return;
      if (result && result.getText) { const code = String(result.getText()).trim(); if (/^\d{8,14}$/.test(code)) { cam.active = false; stopCamera(); onBarcode(code); } }
    });
    if (cam.active) setScanStatus('Point the camera at the barcode');
  } catch (e) {
    const name = e && e.name;
    if (name === 'NotAllowedError' || name === 'SecurityError') setScanStatus('Camera is blocked. Allow it in the browser settings, or take a photo of the barcode instead.');
    else if (name === 'NotFoundError') setScanStatus('No camera found. Take a photo of the barcode instead.');
    else setScanStatus('The scanner could not start. Take a photo of the barcode instead, or type it in.');
  }
}
async function decodeBarcodeFile(file){
  setScanStatus('Looking for a barcode in the photo…');
  stopCamera();
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    let code = null;
    if (window.BarcodeDetector) {
      try { const det = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] }); const found = await det.detect(img); if (found && found.length) code = found[0].rawValue; } catch (e) { /* fall through */ }
    }
    if (!code) {
      const reader = await getReader();
      try { const r = await reader.decodeFromImageElement(img); code = r && r.getText ? r.getText() : null; } catch (e) { code = null; }
      if (!code) { const r2 = await decodeScaled(reader, img); code = r2; }
    }
    if (!code) { setScanStatus('No barcode found in that photo. Get closer, keep it flat and well lit, and try again.', 'muted'); return; }
    onBarcode(String(code).trim());
  } finally { URL.revokeObjectURL(url); }
}
async function decodeScaled(reader, img){
  const sizes = [1200, 800]; for (const w of sizes) {
    try {
      const c = document.createElement('canvas'); const r = Math.min(1, w / Math.max(img.naturalWidth, 1)); c.width = Math.round(img.naturalWidth * r); c.height = Math.round(img.naturalHeight * r);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const i2 = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = c.toDataURL('image/png'); });
      const r2 = await reader.decodeFromImageElement(i2); if (r2 && r2.getText) return r2.getText();
    } catch (e) { /* try next */ }
  }
  return null;
}
async function onBarcode(code){
  const sh = ui.sheet; if (!sh) return;
  sh.scan = { code, state: 'looking', product: null };
  renderSheet();
  try {
    let p = await lookupBarcode(code);
    if (!p && code.length === 12) p = await lookupBarcode('0' + code);
    if (!p && code.length === 13 && code[0] === '0') p = await lookupBarcode(code.slice(1));
    if (!ui.sheet || ui.sheet !== sh) return;
    sh.scan = { code, state: p ? 'found' : 'missing', product: p };
  } catch (e) {
    if (!ui.sheet || ui.sheet !== sh) return;
    sh.scan = { code, state: 'error', product: null, message: (e && e.message) || '' };
  }
  renderSheet();
}
async function lookupBarcode(code){
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 12000);
  let res;
  try { res = await fetch(OFF_URL + encodeURIComponent(code) + '.json?fields=' + OFF_FIELDS, { signal: ctrl.signal }); }
  finally { clearTimeout(t); }
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('the food database answered ' + res.status);
  const d = await res.json();
  if (!d || d.status !== 1 || !d.product) return null;
  return mapProduct(d.product, code);
}
function groupsFromTags(tags){
  const t = (tags || []).join(' ').toLowerCase(); const g = [];
  const has = re => re.test(t);
  if (has(/fruit|berries|apple|banana|citrus|juices/)) g.push('fruit');
  if (has(/vegetable|salad|legume|beans|peas|potato|carrot|tomato/)) g.push('veg');
  if (has(/cereal|bread|pasta|rice|crackers|grain|oat|tortilla|bagel|waffle|pancake|noodle/)) g.push('grain');
  if (has(/meat|poultry|chicken|beef|pork|fish|seafood|egg|legume|beans|nut|seed|tofu|peanut-butter|sausage|deli/)) g.push('protein');
  if (has(/dairy|dairies|milk|cheese|yogurt|yoghurt|ice-cream/)) g.push('dairy');
  if (!g.length && has(/snack|sweet|candy|chocolate|cookie|biscuit|chips|crisps|beverage|soda|drink|dessert|confection/)) g.push('other');
  return g.slice(0, 3);
}
function mapProduct(p, code){
  const n = p.nutriments || {};
  const servKcal = n['energy-kcal_serving'];
  const perServ = servKcal != null && servKcal !== '';
  const pick = k => { const v = perServ ? n[k + '_serving'] : n[k + '_100g']; return v == null || v === '' ? null : Math.max(0, num(v)); };
  const kcal = perServ ? num(servKcal) : (n['energy-kcal_100g'] != null ? num(n['energy-kcal_100g']) : null);
  if (kcal == null) return null;
  const sodium = pick('sodium');
  let name = String(p.product_name_en || p.product_name || '').trim();
  const brand = String(p.brands || '').split(',')[0].trim();
  if (!name) name = brand || 'Scanned food';
  else if (brand && name.toLowerCase().indexOf(brand.toLowerCase()) < 0) name = name + ' (' + brand + ')';
  const groups = groupsFromTags(p.categories_tags);
  const nova = parseInt(p.nova_group, 10);
  const level = nova === 1 ? 1 : (nova === 2 || nova === 3) ? 2 : nova === 4 ? 3 : null;
  const icon = groups[0] === 'fruit' ? '\u{1F34E}' : groups[0] === 'veg' ? '\u{1F966}' : groups[0] === 'grain' ? '\u{1F33E}' : groups[0] === 'protein' ? '\u{1F357}' : groups[0] === 'dairy' ? '\u{1F95B}' : '\u{1F4E6}';
  return {
    code, name: name.slice(0, 80), brand, image: p.image_front_small_url || '',
    serving: perServ ? String(p.serving_size || (p.serving_quantity ? p.serving_quantity + ' g' : '1 serving')).slice(0, 40) : '100 g',
    perServ,
    per: { kcal: Math.round(kcal), p: pick('proteins') || 0, c: pick('carbohydrates') || 0, f: pick('fat') || 0, fiber: pick('fiber'), sugar: pick('sugars'), added: pick('added-sugars'), sodium: sodium == null ? null : Math.round(sodium * 1000), satfat: pick('saturated-fat') },
    groups, level, icon
  };
}
function useScannedProduct(){
  const sh = ui.sheet; const p = sh && sh.scan && sh.scan.product; if (!p) return;
  sh.draft = Object.assign(blankDraft(), { name: p.name, serving: p.serving, qty: 1, per: p.per, groups: p.groups, level: p.level, icon: p.icon, note: p.perServ ? '' : 'Values are per 100 g. Check the package for the serving size.', src: 'scan' });
  sh.mode = 'form'; sh.picked = true; sh.manual = false; sh.scan = null;
  renderSheet();
}
// ---- label reading (OCR on the device)
async function readLabelFile(file){
  const sh = ui.sheet; if (!sh) return;
  sh.ocr = { state: 'working', progress: 0, preview: URL.createObjectURL(file), found: null, text: '' };
  renderSheet();
  try {
    const canvas = await downscale(file, 1600);
    await loadScript(TESSERACT_URL);
    if (!window.Tesseract) throw new Error('reader unavailable');
    if (!cam.worker) cam.worker = await window.Tesseract.createWorker('eng', 1, { logger: m => { if (ui.sheet === sh && sh.ocr && m && m.status === 'recognizing text') { sh.ocr.progress = Math.round((m.progress || 0) * 100); const bar = $('#ocr-bar'); if (bar) bar.style.width = sh.ocr.progress + '%'; const st = $('#ocr-status'); if (st) st.textContent = 'Reading the label… ' + sh.ocr.progress + '%'; } } });
    const out = await cam.worker.recognize(canvas);
    if (ui.sheet !== sh) return;
    const text = (out && out.data && out.data.text) || '';
    const found = parseLabel(text);
    sh.ocr.state = 'done'; sh.ocr.text = text; sh.ocr.found = found;
    const keys = Object.keys(found).filter(k => found[k] != null && k !== 'serving');
    if (!keys.length) { sh.ocr.state = 'empty'; renderSheet(); return; }
    sh.draft = Object.assign(blankDraft(), { serving: found.serving || '1 serving', per: { kcal: found.kcal || 0, p: found.p || 0, c: found.c || 0, f: found.f || 0, fiber: found.fiber, sugar: found.sugar, added: found.added, sodium: found.sodium, satfat: found.satfat, calcium: found.calcium }, src: 'ocr' });
    sh.mode = 'form'; sh.manual = true; sh.picked = false; sh.ocrNote = 'Read from the label photo. Found ' + keys.map(k => ({ kcal: 'calories', p: 'protein', c: 'carbs', f: 'fat', fiber: 'fiber', sugar: 'sugars', added: 'added sugar', sodium: 'sodium', satfat: 'saturated fat', calcium: 'calcium' })[k] || k).join(', ') + '. Check each number against the label and add the food name.';
    renderSheet();
    setTimeout(() => { const el = $('#f-name'); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* ignore */ } } }, 60);
  } catch (e) {
    if (ui.sheet !== sh) return;
    sh.ocr.state = 'error'; sh.ocr.message = (e && e.message) || '';
    renderSheet();
  }
}
function downscale(file, max){
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => {
      const r = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight, 1));
      const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * r); c.height = Math.round(img.naturalHeight * r);
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, c.width, c.height);
      try { const d = ctx.getImageData(0, 0, c.width, c.height); const px = d.data; for (let i = 0; i < px.length; i += 4) { const y = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]; const v = Math.max(0, Math.min(255, (y - 128) * 1.25 + 128)); px[i] = px[i + 1] = px[i + 2] = v; } ctx.putImageData(d, 0, 0); } catch (e) { /* keep color */ }
      URL.revokeObjectURL(url); resolve(c);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('could not read the photo')); };
    img.src = url;
  });
}
function parseLabel(raw){
  let t = String(raw || '').replace(/\r/g, '\n');
  t = t.replace(/(\d)\s*[oO]\s*g\b/g, '$1 0g').replace(/\b[oO]\s*(g|mg)\b/g, '0$1').replace(/\b[oO]g\b/g, '0g').replace(/(\d)[lI](\d)/g, '$1 1$2').replace(/\brng\b|\bmq\b/g, 'mg').replace(/,/g, '.');
  const f = {};
  const numRe = '([0-9]+(?:\\.[0-9]+)?)';
  const grab = (re) => { const m = t.match(re); return m ? num(m[1]) : null; };
  const g = (label) => grab(new RegExp(label + '[^0-9\\n]{0,10}' + numRe + '\\s*g\\b', 'i'));
  const mg = (label) => grab(new RegExp(label + '[^0-9\\n]{0,10}' + numRe + '\\s*mg\\b', 'i'));
  f.kcal = grab(/calories[^0-9\n]{0,14}([0-9]{1,4})\b/i);
  if (f.kcal == null) { const m = t.match(/calories[\s\S]{0,40}?\b([0-9]{2,4})\b/i); if (m) f.kcal = num(m[1]); }
  f.f = g('total\\s*fat'); f.satfat = g('saturated\\s*fat');
  f.sodium = mg('sodium'); f.c = g('total\\s*carb\\w*'); f.fiber = g('dietary\\s*fib\\w*') != null ? g('dietary\\s*fib\\w*') : g('fib[eo]r');
  f.sugar = g('total\\s*sugars') != null ? g('total\\s*sugars') : g('\\bsugars');
  f.added = grab(new RegExp('includes[^0-9\\n]{0,10}' + numRe + '\\s*g[^\\n]{0,12}added', 'i')); if (f.added == null) f.added = g('added\\s*sugars');
  f.p = g('protein'); f.calcium = mg('calcium');
  const sm = t.match(/serving\s*size[^A-Za-z0-9\n]{0,6}([^\n]{2,40})/i); if (sm) f.serving = sm[1].replace(/\s+/g, ' ').trim().replace(/[.\-:]+$/, '');
  ['kcal','f','satfat','sodium','c','fiber','sugar','added','p','calcium'].forEach(k => { if (f[k] != null && (f[k] > 5000 || f[k] < 0)) f[k] = null; });
  return f;
}
function scanSheetHTML(sh){
  const sc = sh.scan;
  let h = '<div class="scrim" data-action="scan-close"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Scan a barcode"><div class="sheet-head"><h2>\u{1F4F7} Scan a barcode</h2><button class="icon-btn" data-action="scan-close" aria-label="Close" style="box-shadow:none;background:var(--surface-2)">×</button></div><div class="sheet-body">';
  if (!sc) {
    h += '<div class="scan-box"><video id="scan-video" playsinline muted autoplay></video><div class="frame"></div></div><div id="scan-status" class="scan-status">Starting the camera…</div>' +
      '<label class="btn secondary block" for="scan-file">\u{1F4F8} Take a photo of the barcode instead<input id="scan-file" type="file" accept="image/*" capture="environment" style="display:none"></label>' +
      '<p class="hint" style="text-align:center">Only the barcode number is sent to the Open Food Facts database.</p>';
  } else if (sc.state === 'looking') {
    h += '<div class="scan-status">Found barcode ' + esc(sc.code) + '</div><div class="progress"><i style="width:60%"></i></div><div class="scan-status muted">Looking it up…</div>';
  } else if (sc.state === 'found') {
    const p = sc.product;
    h += '<div class="scan-status" style="color:var(--good)">✅ Found it</div><div class="product">' + (p.image ? '<img src="' + esc(p.image) + '" alt="">' : '<span class="em">' + p.icon + '</span>') + '<div><div class="name">' + esc(p.name) + '</div><div class="sub">' + esc(p.serving) + (state.meta.settings.showNumbers ? ' · ' + fmt(p.per.kcal, 0) + ' cal · P ' + fmt(p.per.p) + ' · C ' + fmt(p.per.c) + ' · F ' + fmt(p.per.f) : '') + '</div>' + (p.level ? '<div class="sub">Level ' + p.level + ' · ' + esc((LEVELS.find(L => L.id === p.level) || {}).name) + '</div>' : '') + '</div></div>' +
      (p.perServ ? '' : '<p class="hint">The database only had values per 100 grams. Check the package for the serving size after you add it.</p>') +
      '<button class="btn block lg" data-action="scan-use">Use this food</button><button class="btn ghost block" data-action="scan-again">Scan a different barcode</button>';
  } else if (sc.state === 'missing') {
    h += '<div class="scan-status">Barcode ' + esc(sc.code) + ' is not in the database yet</div><p class="hint" style="text-align:center">About one in three U.S. products is missing. The label on the package has everything you need.</p><div class="choice-row"><button class="btn secondary" data-action="scan-to-ocr">\u{1F3F7}️ Snap the label</button><button class="btn secondary" data-action="scan-to-manual">✏️ Type it in</button></div><button class="btn ghost block" data-action="scan-again">Scan again</button>';
  } else {
    h += '<div class="scan-status">The food database could not be reached</div><p class="hint" style="text-align:center">' + esc(sc.message || 'Check the connection and try again.') + '</p><div class="choice-row"><button class="btn secondary" data-action="scan-again">Try again</button><button class="btn secondary" data-action="scan-to-manual">✏️ Type it in</button></div>';
  }
  return h + '</div></div>';
}
function ocrSheetHTML(sh){
  const o = sh.ocr;
  let h = '<div class="scrim" data-action="scan-close"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Read a label"><div class="sheet-head"><h2>\u{1F3F7}️ Snap the label</h2><button class="icon-btn" data-action="scan-close" aria-label="Close" style="box-shadow:none;background:var(--surface-2)">×</button></div><div class="sheet-body">';
  if (!o) {
    h += '<p>Take a straight, well lit photo of the Nutrition Facts panel. The numbers get read on this device and fill in the form for you to check.</p>' +
      '<label class="btn block lg" for="ocr-file">\u{1F4F8} Take a photo of the label<input id="ocr-file" type="file" accept="image/*" capture="environment" style="display:none"></label>' +
      '<label class="btn secondary block" for="ocr-file2" style="margin-top:8px">\u{1F5BC}️ Choose a photo<input id="ocr-file2" type="file" accept="image/*" style="display:none"></label>' +
      '<p class="hint" style="text-align:center">The first time takes a little longer while the reader downloads.</p>';
  } else if (o.state === 'working') {
    h += '<img class="ocr-preview" src="' + esc(o.preview) + '" alt=""><div id="ocr-status" class="scan-status">Reading the label… ' + o.progress + '%</div><div class="progress"><i id="ocr-bar" style="width:' + o.progress + '%"></i></div>';
  } else if (o.state === 'empty') {
    h += '<img class="ocr-preview" src="' + esc(o.preview) + '" alt=""><div class="scan-status">No nutrition numbers found</div><p class="hint" style="text-align:center">Fill the frame with just the Nutrition Facts panel, hold the phone flat, and avoid glare.</p><div class="choice-row"><label class="btn secondary" for="ocr-file">Try another photo<input id="ocr-file" type="file" accept="image/*" capture="environment" style="display:none"></label><button class="btn secondary" data-action="scan-to-manual">✏️ Type it in</button></div>';
  } else {
    h += '<div class="scan-status">The label reader could not start</div><p class="hint" style="text-align:center">' + esc(o.message || 'Check the connection and try again.') + '</p><div class="choice-row"><label class="btn secondary" for="ocr-file">Try again<input id="ocr-file" type="file" accept="image/*" capture="environment" style="display:none"></label><button class="btn secondary" data-action="scan-to-manual">✏️ Type it in</button></div>';
  }
  return h + '</div></div>';
}
