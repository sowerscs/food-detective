// ---------- Excel workbook with native charts (built on the device, no server) ----------
// A small stored-zip writer plus hand-written SpreadsheetML: Summary (charts at the top, key figures below),
// Daily totals, Entries (one row per food), Foods, About.
const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(bytes){ let c = 0xFFFFFFFF; for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zipStore(files){
  const enc = new TextEncoder(); const parts = []; const central = []; let offset = 0;
  const u16 = n => [n & 255, (n >>> 8) & 255]; const u32 = n => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
  files.forEach(f => {
    const name = enc.encode(f.name); const data = typeof f.data === 'string' ? enc.encode(f.data) : f.data; const crc = crc32(data);
    const head = [].concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
    parts.push(new Uint8Array(head), name, data);
    central.push(new Uint8Array([].concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset))), name);
    offset += head.length + name.length + data.length;
  });
  const cdSize = central.reduce((a, b) => a + b.length, 0);
  const end = new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(cdSize), u32(offset), u16(0)));
  return new Blob(parts.concat(central, [end]), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
function xq(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''); }
function colName(i){ let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
// styles: 0 normal, 1 header, 2 title, 3 integer, 4 one decimal, 5 percent, 6 muted, 7 bold
function cellXML(ref, v, st){
  if (v == null || v === '' || (typeof v === 'number' && !isFinite(v))) return st ? '<c r="' + ref + '" s="' + st + '"/>' : '';
  if (typeof v === 'number') return '<c r="' + ref + '"' + (st ? ' s="' + st + '"' : '') + '><v>' + v + '</v></c>';
  return '<c r="' + ref + '" t="inlineStr"' + (st ? ' s="' + st + '"' : '') + '><is><t xml:space="preserve">' + xq(v) + '</t></is></c>';
}
function sheetXML(rows, opts){
  opts = opts || {};
  const cols = opts.widths ? '<cols>' + opts.widths.map((w, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>').join('') + '</cols>' : '';
  const views = '<sheetViews><sheetView workbookViewId="0"' + (opts.first ? ' tabSelected="1"' : '') + '>' + (opts.freeze ? '<pane ySplit="' + opts.freeze + '" topLeftCell="A' + (opts.freeze + 1) + '" activePane="bottomLeft" state="frozen"/>' : '') + '</sheetView></sheetViews>';
  const data = rows.map((row, ri) => { if (!row) return ''; const cells = row.map((c, ci) => { const o = c && typeof c === 'object' ? c : { v: c }; return cellXML(colName(ci) + (ri + 1), o.v, o.s || 0); }).join(''); return cells ? '<row r="' + (ri + 1) + '">' + cells + '</row>' : ''; }).join('');
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    (opts.landscape ? '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>' : '') + views + '<sheetFormatPr defaultRowHeight="15"/>' + cols + '<sheetData>' + data + '</sheetData>' +
    (opts.filter ? '<autoFilter ref="' + opts.filter + '"/>' : '') +
    '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>' +
    (opts.landscape ? '<pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/>' : '') +
    (opts.drawing ? '<drawing r:id="rId1"/>' : '') + '</worksheet>';
}
function strCache(vals){ return '<c:strCache><c:ptCount val="' + vals.length + '"/>' + vals.map((v, i) => '<c:pt idx="' + i + '"><c:v>' + xq(v) + '</c:v></c:pt>').join('') + '</c:strCache>'; }
function numCache(vals, fmt){ return '<c:numCache><c:formatCode>' + xq(fmt || 'General') + '</c:formatCode><c:ptCount val="' + vals.length + '"/>' + vals.map((v, i) => v == null ? '' : '<c:pt idx="' + i + '"><c:v>' + v + '</c:v></c:pt>').join('') + '</c:numCache>'; }
function serXML(kind, i, s){
  const fill = kind === 'line' ? '<c:spPr><a:ln w="22225" cap="rnd"><a:solidFill><a:srgbClr val="' + s.color + '"/></a:solidFill><a:round/></a:ln></c:spPr><c:marker><c:symbol val="none"/></c:marker>' : '<c:spPr><a:solidFill><a:srgbClr val="' + s.color + '"/></a:solidFill></c:spPr><c:invertIfNegative val="0"/>';
  const lbl = s.labels ? '<c:dLbls><c:numFmt formatCode="0%" sourceLinked="0"/><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr><c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1000" b="1"><a:solidFill><a:srgbClr val="' + (s.labelDark ? '1F2A44' : 'FFFFFF') + '"/></a:solidFill></a:defRPr></a:pPr><a:endParaRPr lang="en-US"/></a:p></c:txPr><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>' : '';
  return '<c:ser><c:idx val="' + i + '"/><c:order val="' + i + '"/><c:tx><c:strRef><c:f>' + s.nameRef + '</c:f>' + strCache([s.name]) + '</c:strRef></c:tx>' + fill + lbl +
    '<c:cat><c:strRef><c:f>' + s.catRef + '</c:f>' + strCache(s.cats) + '</c:strRef></c:cat><c:val><c:numRef><c:f>' + s.valRef + '</c:f>' + numCache(s.vals, s.fmt) + '</c:numRef></c:val>' + (kind === 'line' ? '<c:smooth val="0"/>' : '') + '</c:ser>';
}
function chartXML(o){
  const txt = (t, sz, b) => '<c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="' + sz + '" b="' + (b ? 1 : 0) + '"/></a:pPr><a:r><a:rPr lang="en-US" sz="' + sz + '" b="' + (b ? 1 : 0) + '"/><a:t>' + xq(t) + '</a:t></a:r></a:p></c:rich></c:tx>';
  const axTx = '<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="900"><a:solidFill><a:srgbClr val="64789A"/></a:solidFill></a:defRPr></a:pPr><a:endParaRPr lang="en-US"/></a:p></c:txPr>';
  const hair = '<c:spPr><a:ln w="6350"><a:solidFill><a:srgbClr val="DDE5EE"/></a:solidFill></a:ln></c:spPr>';
  const bar = '<c:barChart><c:barDir val="' + (o.barDir || 'col') + '"/><c:grouping val="' + (o.grouping || 'clustered') + '"/><c:varyColors val="0"/>' + o.series.map((s, i) => serXML('bar', i, s)).join('') + '<c:gapWidth val="' + (o.gap || 80) + '"/>' + (o.grouping === 'percentStacked' || o.grouping === 'stacked' ? '<c:overlap val="100"/>' : '') + '<c:axId val="5001"/><c:axId val="5002"/></c:barChart>';
  const line = o.line ? '<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>' + serXML('line', o.series.length, o.line) + '<c:marker val="1"/><c:axId val="5001"/><c:axId val="5002"/></c:lineChart>' : '';
  const horiz = o.barDir === 'bar';
  const cat = '<c:catAx><c:axId val="5001"/><c:scaling><c:orientation val="' + (horiz ? 'maxMin' : 'minMax') + '"/></c:scaling><c:delete val="' + (o.hideCat ? 1 : 0) + '"/><c:axPos val="' + (horiz ? 'l' : 'b') + '"/><c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>' + hair + axTx + '<c:crossAx val="5002"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>';
  const val = '<c:valAx><c:axId val="5002"/><c:scaling><c:orientation val="minMax"/>' + (o.max != null ? '<c:max val="' + o.max + '"/>' : '') + '<c:min val="0"/></c:scaling><c:delete val="' + (o.hideVal ? 1 : 0) + '"/><c:axPos val="' + (horiz ? 'b' : 'l') + '"/>' + (o.hideVal ? '' : '<c:majorGridlines>' + hair + '</c:majorGridlines>') + '<c:numFmt formatCode="' + xq(o.valFmt || '#,##0') + '" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln><a:noFill/></a:ln></c:spPr>' + axTx + '<c:crossAx val="5001"/><c:crosses val="' + (horiz ? 'max' : 'autoZero') + '"/><c:crossBetween val="between"/>' + (o.majorUnit ? '<c:majorUnit val="' + o.majorUnit + '"/>' : '') + '</c:valAx>';
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><c:roundedCorners val="0"/>' +
    '<c:chart><c:title>' + txt(o.title, 1200, true) + '<c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/><c:plotArea><c:layout/>' + bar + line + cat + val + '</c:plotArea>' +
    (o.legend ? '<c:legend><c:legendPos val="b"/><c:overlay val="0"/>' + axTx + '</c:legend>' : '') + '<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>' +
    '<c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln><a:noFill/></a:ln></c:spPr></c:chartSpace>';
}
function anchorXML(id, c1, r1, c2, r2){
  return '<xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>' + c1 + '</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>' + r1 + '</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>' + c2 + '</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>' + r2 + '</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>' +
    '<xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="' + (id + 1) + '" name="Chart ' + id + '"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="rId' + id + '"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>';
}
function buildWorkbook(R){
  const s = R.s; const n = R.days.length; const act = ACTIVITIES.find(x => x.id === s.activity) || ACTIVITIES[1];
  const H = t => ({ v: t, s: 1 }); const I = v => ({ v: v == null ? null : Math.round(v), s: 3 }); const D1 = v => ({ v: v == null ? null : Math.round(v * 10) / 10, s: 4 });
  const dayLabel = d => WEEKDAYS[parseDate(d).getDay()].slice(0, 3) + ' ' + shortDate(d);
  const mealName = m => (MEALS.find(x => x.id === m) || { name: m }).name;
  const groupNames = ids => Array.from(ids || []).map(g => (GROUPS.find(x => x.id === g) || { name: g }).name).join(', ');
  // Daily totals
  const daily = [[H('Date'), H('Day'), H('Foods logged'), H('Breakfast foods'), H('Lunch foods'), H('Dinner foods'), H('Snack foods'), H('Meals logged'), H('Energy kcal'), H('Protein g'), H('Carbohydrate g'), H('Fat g'), H('Fiber g'), H('Added sugar g'), H('Sodium mg'), H('Water cups'), H('Energy check-in (1 to 4)'), H('Food groups'), H('Reference kcal')]];
  R.days.forEach(x => {
    const ml = ['breakfast', 'lunch', 'dinner', 'snack'].filter(m => x.meals[m].length).length;
    daily.push([x.date, dayLabel(x.date), x.n, x.meals.breakfast.length, x.meals.lunch.length, x.meals.dinner.length, x.meals.snack.length, ml, I(x.t.kcal), D1(x.t.p), D1(x.t.c), D1(x.t.f), D1(x.t.fiber), D1(x.t.added), I(x.t.sodium), x.water, x.energy, groupNames(x.groups), I(R.r.kcal)]);
  });
  // Entries
  const entries = [[H('Date'), H('Day'), H('Meal'), H('Food'), H('Amount eaten'), H('Servings'), H('Serving size'), H('Energy kcal'), H('Protein g'), H('Carbohydrate g'), H('Fat g'), H('Fiber g'), H('Sugar g'), H('Added sugar g'), H('Sodium mg'), H('Food groups'), H('Processing level'), H('Source'), H('Logged at'), H('Logged on'), H('Note')]];
  R.days.forEach(x => ['breakfast', 'lunch', 'dinner', 'snack'].forEach(m => x.meals[m].forEach(e => {
    const t = entryTotals(e); const lv = LEVELS.find(l => l.id === e.level);
    entries.push([x.date, dayLabel(x.date), mealName(m), e.name, servingLabel(e), D1(e.qty), e.serving, I(t.kcal), D1(t.p), D1(t.c), D1(t.f), e.per.fiber == null ? null : D1(t.fiber), e.per.sugar == null ? null : D1(t.sugar), e.per.added == null ? null : D1(t.added), e.per.sodium == null ? null : I(t.sodium), groupNames(e.groups), lv ? lv.short + ', ' + lv.name : '', SRC_NAMES[e.src] || '', e.createdAt ? new Date(e.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '', e.by || '', e.note || '']);
  })));
  // Foods
  const foods = [[H('Food'), H('Times logged'), H('Energy kcal in all'), H('Food groups')]].concat(R.topFoods.map(f => [f.name, f.count, I(f.kcal), groupNames(f.groups)]));
  // Summary: rows 1 to 3 header, charts in rows 5 to 40, key figures from row 42
  const a = R.avg; const SUMROW = 42;
  const sum = [];
  sum[0] = [{ v: 'Food journal report' + (s.name ? ', ' + s.name : ''), s: 2 }];
  sum[1] = [{ v: rangeText(R.start, R.end) + ', age ' + s.age + ', ' + act.name.toLowerCase(), s: 7 }];
  sum[2] = [{ v: 'Generated ' + new Date().toLocaleString() + ' from Food Detective. Charts are built from the Daily totals sheet; every food is on the Entries sheet.', s: 6 }];
  const kf = [
    [H('Key figures'), H('Value'), H('Notes')],
    ['Days in the report', n, ''],
    ['Days with food logged', R.logged.length, ''],
    ['Foods logged', R.entriesN, ''],
    ['Energy, average logged day (kcal)', I(a.kcal), 'Reference about ' + fmtInt(R.r.kcal) + ' kcal for age and activity'],
    ['Protein, average logged day (g)', D1(a.p), ''],
    ['Carbohydrate, average logged day (g)', D1(a.c), ''],
    ['Fat, average logged day (g)', D1(a.f), ''],
    ['Fiber, average logged day (g)', D1(a.fiber), 'Only foods whose label lists it'],
    ['Added sugar, average logged day (g)', D1(a.added), 'Only foods whose label lists it'],
    ['Sodium, average logged day (mg)', I(a.sodium), 'Only foods whose label lists it'],
    ['Water, average logged day (cups)', D1(R.waterAvg), ''],
    ['Energy from protein', { v: Math.round(R.share.p * 1000) / 1000, s: 5 }, 'Share of calories, averaged over logged days'],
    ['Energy from carbohydrate', { v: Math.round(R.share.c * 1000) / 1000, s: 5 }, ''],
    ['Energy from fat', { v: Math.round(R.share.f * 1000) / 1000, s: 5 }, ''],
    ['Days with breakfast logged', R.mealDays.breakfast, ''],
    ['Days with lunch logged', R.mealDays.lunch, ''],
    ['Days with dinner logged', R.mealDays.dinner, '']
  ].concat(GROUPS.map(g => ['Days with ' + g.name.toLowerCase(), R.groupDays[g.id], '']));
  kf.forEach((row, i) => { sum[SUMROW - 1 + i] = row; });
  const shareRow = SUMROW - 1 + 12; // zero-based index of "Energy from protein"
  const DT = "'Daily totals'"; const last = n + 1;
  const cats = R.days.map(x => dayLabel(x.date));
  const charts = [
    chartXML({ title: 'Energy per day (kcal)', series: [{ name: 'Energy kcal', nameRef: DT + '!$I$1', catRef: DT + '!$B$2:$B$' + last, valRef: DT + '!$I$2:$I$' + last, cats, vals: R.days.map(x => Math.round(x.t.kcal)), color: '2F8FD6' }], line: { name: 'Reference kcal', nameRef: DT + '!$S$1', catRef: DT + '!$B$2:$B$' + last, valRef: DT + '!$S$2:$S$' + last, cats, vals: R.days.map(() => Math.round(R.r.kcal)), color: '9AA8BC' }, legend: true }),
    chartXML({ title: 'Where the energy came from', barDir: 'bar', grouping: 'percentStacked', gap: 40, hideCat: true, hideVal: true, valFmt: '0%', legend: true, series: [
      { name: 'Protein', nameRef: 'Summary!$A$' + (shareRow + 1), catRef: 'Summary!$A$' + (shareRow + 1), valRef: 'Summary!$B$' + (shareRow + 1), cats: ['Average day'], vals: [Math.round(R.share.p * 1000) / 1000], color: 'D4598F', fmt: '0%', labels: true },
      { name: 'Carbohydrate', nameRef: 'Summary!$A$' + (shareRow + 2), catRef: 'Summary!$A$' + (shareRow + 1), valRef: 'Summary!$B$' + (shareRow + 2), cats: ['Average day'], vals: [Math.round(R.share.c * 1000) / 1000], color: '8470C9', fmt: '0%', labels: true },
      { name: 'Fat', nameRef: 'Summary!$A$' + (shareRow + 3), catRef: 'Summary!$A$' + (shareRow + 1), valRef: 'Summary!$B$' + (shareRow + 3), cats: ['Average day'], vals: [Math.round(R.share.f * 1000) / 1000], color: 'C28B1C', fmt: '0%', labels: true, labelDark: true }] }),
    chartXML({ title: 'Meals logged per day (breakfast, lunch, dinner, snack)', max: 4, majorUnit: 1, series: [{ name: 'Meals logged', nameRef: DT + '!$H$1', catRef: DT + '!$B$2:$B$' + last, valRef: DT + '!$H$2:$H$' + last, cats, vals: R.days.map(x => ['breakfast', 'lunch', 'dinner', 'snack'].filter(m => x.meals[m].length).length), color: '2F8FD6' }] }),
    chartXML({ title: 'Fiber and added sugar per day (g)', legend: true, series: [
      { name: 'Fiber g', nameRef: DT + '!$M$1', catRef: DT + '!$B$2:$B$' + last, valRef: DT + '!$M$2:$M$' + last, cats, vals: R.days.map(x => Math.round(x.t.fiber * 10) / 10), color: '2A78D6' },
      { name: 'Added sugar g', nameRef: DT + '!$N$1', catRef: DT + '!$B$2:$B$' + last, valRef: DT + '!$N$2:$N$' + last, cats, vals: R.days.map(x => Math.round(x.t.added * 10) / 10), color: 'EB6834' }] })
  ];
  const drawing = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    anchorXML(1, 0, 4, 4, 21) + anchorXML(2, 4, 4, 8, 21) + anchorXML(3, 0, 22, 4, 39) + anchorXML(4, 4, 22, 8, 39) + '</xdr:wsDr>';
  const about = [[{ v: 'About this workbook', s: 2 }], [], ['Logged in Food Detective by the child and her parents on their own devices. Amounts are what was entered.'], ['Nutrition values come from food labels, barcode lookups (Open Food Facts) or the app’s food list, so treat them as estimates.'], ['Fiber, added sugar and sodium count only foods whose label lists them. Empty cells mean the value was not on the label.'], ['The reference energy is a general estimate for age and activity from the Dietary Guidelines for Americans, not a prescription.'], ['Product data from Open Food Facts is available under the Open Database License (openfoodfacts.org).']];
  const ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' + [1, 2, 3, 4, 5].map(i => '<Override PartName="/xl/worksheets/sheet' + i + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>' +
    [1, 2, 3, 4].map(i => '<Override PartName="/xl/charts/chart' + i + '.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>').join('') +
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>';
  const rel = (id, type, target) => '<Relationship Id="' + id + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/' + type + '" Target="' + target + '"/>';
  const rels = body => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + body + '</Relationships>';
  const names = ['Summary', 'Daily totals', 'Entries', 'Foods', 'About'];
  const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="0.0"/><numFmt numFmtId="165" formatCode="0%"/></numFmts>' +
    '<fonts count="4"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="16"/><name val="Calibri"/><family val="2"/></font><font><sz val="10"/><color rgb="FF64789A"/><name val="Calibri"/><family val="2"/></font></fonts>' +
    '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD5EAF9"/><bgColor indexed="64"/></patternFill></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="8"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  const files = [
    { name: '[Content_Types].xml', data: ct },
    { name: '_rels/.rels', data: rels(rel('rId1', 'officeDocument', 'xl/workbook.xml') + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' + rel('rId3', 'extended-properties', 'docProps/app.xml')) },
    { name: 'docProps/core.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>' + xq('Food journal report ' + R.start + ' to ' + R.end) + '</dc:title><dc:creator>Food Detective</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' + new Date().toISOString().replace(/\.\d+Z$/, 'Z') + '</dcterms:created></cp:coreProperties>' },
    { name: 'docProps/app.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Food Detective</Application></Properties>' },
    { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>' + names.map((nm, i) => '<sheet name="' + xq(nm) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets>' + (entries.length > 1 ? '<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="2" hidden="1">Entries!$A$1:$U$' + entries.length + '</definedName></definedNames>' : '') + '</workbook>' },
    { name: 'xl/_rels/workbook.xml.rels', data: rels(names.map((nm, i) => rel('rId' + (i + 1), 'worksheet', 'worksheets/sheet' + (i + 1) + '.xml')).join('') + rel('rId6', 'styles', 'styles.xml')) },
    { name: 'xl/styles.xml', data: styles },
    { name: 'xl/worksheets/sheet1.xml', data: sheetXML(sum, { widths: [38, 14, 50, 12, 12, 12, 12, 12], drawing: true, first: true, landscape: true }) },
    { name: 'xl/worksheets/_rels/sheet1.xml.rels', data: rels(rel('rId1', 'drawing', '../drawings/drawing1.xml')) },
    { name: 'xl/drawings/drawing1.xml', data: drawing },
    { name: 'xl/drawings/_rels/drawing1.xml.rels', data: rels([1, 2, 3, 4].map(i => rel('rId' + i, 'chart', '../charts/chart' + i + '.xml')).join('')) },
    { name: 'xl/charts/chart1.xml', data: charts[0] }, { name: 'xl/charts/chart2.xml', data: charts[1] }, { name: 'xl/charts/chart3.xml', data: charts[2] }, { name: 'xl/charts/chart4.xml', data: charts[3] },
    { name: 'xl/worksheets/sheet2.xml', data: sheetXML(daily, { widths: [12, 11, 8, 10, 8, 8, 8, 8, 10, 10, 13, 8, 8, 12, 10, 8, 12, 36, 12], freeze: 1, landscape: true }) },
    { name: 'xl/worksheets/sheet3.xml', data: sheetXML(entries, { widths: [12, 11, 11, 32, 18, 9, 16, 10, 10, 13, 8, 8, 8, 12, 10, 26, 30, 16, 18, 18, 30], freeze: 1, filter: entries.length > 1 ? 'A1:U' + entries.length : '', landscape: true }) },
    { name: 'xl/worksheets/sheet4.xml', data: sheetXML(foods, { widths: [36, 13, 16, 30], freeze: 1 }) },
    { name: 'xl/worksheets/sheet5.xml', data: sheetXML(about, { widths: [120] }) }
  ];
  return zipStore(files);
}
