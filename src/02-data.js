<script>
(function(){
'use strict';

// ---------- utilities ----------
const $ = (s, r) => (r || document).querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2, '0');
const dateStr = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const todayStr = () => dateStr(new Date());
const parseDate = s => { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
const addDays = (s, n) => { const d = parseDate(s); d.setDate(d.getDate() + n); return dateStr(d); };
const num = v => { const n = parseFloat(v); return isFinite(n) ? n : 0; };
const round1 = n => Math.round(n * 10) / 10;
const fmt = (n, dec) => {
  n = Number(n) || 0;
  if (dec == null) dec = (Math.abs(n) >= 100 || Number.isInteger(round1(n))) ? 0 : 1;
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: dec });
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const clone = o => JSON.parse(JSON.stringify(o));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pct = (v, scale) => scale > 0 ? Math.max(0, Math.min(100, v / scale * 100)) : 0;
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function niceDate(s){
  const d = parseDate(s), t = todayStr();
  if (s === t) return 'Today';
  if (s === addDays(t, -1)) return 'Yesterday';
  if (s === addDays(t, 1)) return 'Tomorrow';
  return WEEKDAYS[d.getDay()].slice(0, 3) + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate();
}
function greeting(){ const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
function mealByTime(){ const h = new Date().getHours() + new Date().getMinutes() / 60; return h < 10.5 ? 'breakfast' : h < 14.5 ? 'lunch' : h < 17 ? 'snack' : 'dinner'; }

// ---------- constants ----------
const MEALS = [
  { id: 'breakfast', name: 'Breakfast', icon: '\u{1F305}' },
  { id: 'lunch', name: 'Lunch', icon: '\u{1F96A}' },
  { id: 'dinner', name: 'Dinner', icon: '\u{1F37D}️' },
  { id: 'snack', name: 'Snacks', icon: '\u{1F34E}' }
];
const GROUPS = [
  { id: 'fruit', name: 'Fruits', icon: '\u{1F34E}' },
  { id: 'veg', name: 'Veggies', icon: '\u{1F966}' },
  { id: 'grain', name: 'Grains', icon: '\u{1F33E}' },
  { id: 'protein', name: 'Protein', icon: '\u{1F357}' },
  { id: 'dairy', name: 'Dairy', icon: '\u{1F95B}' }
];
const LEVELS = [
  { id: 1, short: 'Level 1', name: 'Whole or barely changed' },
  { id: 2, short: 'Level 2', name: 'Changed a little' },
  { id: 3, short: 'Level 3', name: 'Changed a lot' }
];
const FACES = [
  { id: 1, em: '\u{1F634}', name: 'Sleepy' },
  { id: 2, em: '\u{1F610}', name: 'Okay' },
  { id: 3, em: '\u{1F642}', name: 'Good' },
  { id: 4, em: '\u{1F929}', name: 'Super' }
];
// Typical daily calories for girls, from the Dietary Guidelines for Americans 2020-2025, by activity level [mostly sitting, moderately active, very active]
const KCAL_TABLE = { 9: [1400, 1600, 1800], 10: [1400, 1800, 2000], 11: [1600, 1800, 2000], 12: [1600, 2000, 2200], 13: [1600, 2000, 2200] };
const ACTIVITIES = [
  { id: 'low', name: 'Mostly sitting', idx: 0 },
  { id: 'mid', name: 'Moderately active', idx: 1 },
  { id: 'high', name: 'Very active', idx: 2 }
];

// ---------- starter foods (typical values; the package label wins) ----------
function F(name, serving, kcal, p, c, f, fiber, sugar, added, sodium, groups, level, icon, note){
  return { name, serving, per: { kcal, p, c, f, fiber, sugar, added, sodium }, groups, level, icon, note: note || '' };
}
const FOODS = [
  F('Apple', '1 medium', 95, 0.5, 25, 0.3, 4.4, 19, 0, 2, ['fruit'], 1, '\u{1F34E}'),
  F('Banana', '1 medium', 105, 1.3, 27, 0.4, 3.1, 14, 0, 1, ['fruit'], 1, '\u{1F34C}'),
  F('Orange', '1 medium', 62, 1.2, 15, 0.2, 3.1, 12, 0, 0, ['fruit'], 1, '\u{1F34A}'),
  F('Clementine', '1', 35, 0.6, 9, 0.1, 1.3, 6.8, 0, 1, ['fruit'], 1, '\u{1F34A}'),
  F('Strawberries', '1 cup', 49, 1, 12, 0.5, 3, 7, 0, 2, ['fruit'], 1, '\u{1F353}'),
  F('Blueberries', '1 cup', 84, 1.1, 21, 0.5, 3.6, 15, 0, 1, ['fruit'], 1, '\u{1FAD0}'),
  F('Grapes', '1 cup', 104, 1.1, 27, 0.2, 1.4, 23, 0, 3, ['fruit'], 1, '\u{1F347}'),
  F('Watermelon', '1 cup diced', 46, 0.9, 11.5, 0.2, 0.6, 9.4, 0, 2, ['fruit'], 1, '\u{1F349}'),
  F('Mango', '1 cup pieces', 99, 1.4, 25, 0.6, 2.6, 23, 0, 2, ['fruit'], 1, '\u{1F96D}'),
  F('Pineapple', '1 cup chunks', 82, 0.9, 22, 0.2, 2.3, 16, 0, 2, ['fruit'], 1, '\u{1F34D}'),
  F('Peach', '1 medium', 59, 1.4, 14, 0.4, 2.3, 13, 0, 0, ['fruit'], 1, '\u{1F351}'),
  F('Cherries', '1 cup', 87, 1.5, 22, 0.3, 2.9, 18, 0, 0, ['fruit'], 1, '\u{1F352}'),
  F('Kiwi', '1 medium', 42, 0.8, 10, 0.4, 2.1, 6, 0, 2, ['fruit'], 1, '\u{1F95D}'),
  F('Avocado', '1/2 medium', 114, 1.3, 6, 10.5, 4.6, 0.5, 0, 5, ['fruit'], 1, '\u{1F951}'),
  F('Raisins', '1 small box (1.5 oz)', 129, 1.3, 34, 0.2, 1.6, 25, 0, 5, ['fruit'], 1, '\u{1F347}'),
  F('Applesauce, unsweetened', '1/2 cup', 51, 0.2, 14, 0.1, 1.3, 11, 0, 2, ['fruit'], 2, '\u{1F34E}'),
  F('Orange juice, 100%', '1 cup', 112, 1.7, 26, 0.5, 0.5, 21, 0, 2, ['fruit'], 2, '\u{1F9C3}'),
  F('Apple juice, 100%', '1 cup', 114, 0.2, 28, 0.3, 0.5, 24, 0, 10, ['fruit'], 2, '\u{1F9C3}'),
  F('Fruit smoothie (banana, strawberries, milk)', '12 fl oz', 220, 8, 40, 3, 4, 28, 0, 100, ['fruit','dairy'], 1, '\u{1F964}'),
  F('Sambazon organic açaí juice', '8 fl oz', 140, 1, 29, 2.5, 1, 28, 22, null, ['fruit'], 3, '\u{1F9C3}', 'Has caffeine from yerba mate and green tea extracts, about a quarter shot of espresso.'),

  F('Baby carrots', '10 pieces', 35, 0.6, 8, 0.1, 2.9, 4.8, 0, 78, ['veg'], 1, '\u{1F955}'),
  F('Broccoli, cooked', '1/2 cup', 27, 1.9, 5.6, 0.3, 2.6, 1, 0, 32, ['veg'], 1, '\u{1F966}'),
  F('Corn', '1/2 cup kernels', 70, 2.5, 16, 1, 1.8, 3, 0, 1, ['veg'], 1, '\u{1F33D}'),
  F('Cucumber', '1 cup sliced', 16, 0.7, 3.8, 0.1, 0.5, 1.7, 0, 2, ['veg'], 1, '\u{1F952}'),
  F('Cherry tomatoes', '1 cup', 27, 1.3, 5.8, 0.3, 1.8, 3.9, 0, 7, ['veg'], 1, '\u{1F345}'),
  F('Green beans, cooked', '1/2 cup', 22, 1.2, 4.9, 0.2, 2, 1.1, 0, 1, ['veg'], 1, '\u{1FADB}'),
  F('Peas, cooked', '1/2 cup', 67, 4.3, 12.5, 0.2, 4.4, 4.7, 0, 2, ['veg'], 1, '\u{1FADB}'),
  F('Edamame, shelled', '1/2 cup', 95, 9, 8, 4, 4, 1.5, 0, 5, ['veg','protein'], 1, '\u{1FADB}'),
  F('Bell pepper strips', '1 cup', 30, 1, 7, 0.3, 2.5, 4, 0, 4, ['veg'], 1, '\u{1FAD1}'),
  F('Celery sticks', '4 medium', 23, 1, 5, 0.2, 2.5, 2, 0, 128, ['veg'], 1, '\u{1F96C}'),
  F('Spinach, raw', '1 cup', 7, 0.9, 1.1, 0.1, 0.7, 0.1, 0, 24, ['veg'], 1, '\u{1F96C}'),
  F('Sweet potato, baked', '1 medium', 103, 2.3, 24, 0.2, 3.8, 7.4, 0, 41, ['veg'], 1, '\u{1F360}'),
  F('Mashed potatoes', '1/2 cup', 120, 2, 18, 4.5, 1.6, 1.5, 0, 330, ['veg'], 1, '\u{1F954}'),
  F('Garden salad with ranch', '2 cups + 2 tbsp dressing', 155, 1.5, 7, 13, 2, 3, 1, 300, ['veg'], 2, '\u{1F957}'),
  F('French fries', 'small', 220, 3, 29, 10, 3, 0, 0, 180, ['veg'], 3, '\u{1F35F}'),

  F('White rice, cooked', '1/2 cup', 103, 2, 22, 0.2, 0.3, 0, 0, 1, ['grain'], 2, '\u{1F35A}'),
  F('Brown rice, cooked', '1/2 cup', 109, 2.5, 23, 0.9, 1.6, 0.2, 0, 2, ['grain'], 1, '\u{1F35A}'),
  F('Whole wheat bread', '1 slice', 80, 4, 14, 1, 2, 1.5, 1, 150, ['grain'], 2, '\u{1F35E}'),
  F('White bread', '1 slice', 75, 2.5, 14, 1, 0.8, 1.5, 1, 140, ['grain'], 3, '\u{1F35E}'),
  F('Oatmeal, cooked', '1 cup', 166, 5.9, 28, 3.6, 4, 0.6, 0, 9, ['grain'], 1, '\u{1F963}'),
  F("Toasted oat O's cereal", '1 cup', 100, 3, 20, 2, 3, 1, 1, 140, ['grain'], 3, '\u{1F963}'),
  F('Sweetened corn flakes cereal', '1 cup', 110, 1, 27, 0, 0.5, 12, 12, 140, ['grain'], 3, '\u{1F963}'),
  F('Pasta, cooked', '1 cup', 220, 8, 43, 1.3, 2.5, 0.8, 0, 1, ['grain'], 2, '\u{1F35D}'),
  F('Spaghetti with tomato sauce', '1 cup', 290, 10, 53, 3.8, 4.5, 7, 1, 400, ['grain','veg'], 2, '\u{1F35D}'),
  F('Mac and cheese (boxed)', '1 cup', 350, 10, 47, 13, 2, 6, 3, 700, ['grain','dairy'], 3, '\u{1F9C0}'),
  F('Ramen noodles (instant)', '1 package', 380, 8, 52, 14, 2, 1, 0, 1760, ['grain'], 3, '\u{1F35C}'),
  F('Pancake', '1 (4 inch)', 86, 2.4, 11, 3.7, 0.4, 2, 1, 167, ['grain'], 2, '\u{1F95E}'),
  F('Waffle, frozen', '1', 95, 2.2, 15, 3, 0.8, 1.5, 1, 260, ['grain'], 3, '\u{1F9C7}'),
  F('Toaster pastry', '1', 200, 2, 37, 5, 0.5, 16, 15, 170, ['grain'], 3, '\u{1F36A}'),
  F('Flour tortilla', '1 (8 inch)', 146, 3.8, 24, 3.7, 1.4, 1, 0, 364, ['grain'], 3, '\u{1FAD3}'),
  F('Saltine crackers', '5', 62, 1.4, 11, 1.3, 0.4, 0, 0, 140, ['grain'], 3, '\u{1F358}'),
  F('Granola bar, chewy', '1', 100, 1.5, 17, 3, 1, 7, 6, 80, ['grain'], 3, '\u{1F36B}'),
  F('Popcorn, air-popped', '3 cups', 93, 3, 19, 1, 3.5, 0.2, 0, 2, ['grain'], 1, '\u{1F37F}'),
  F('Bagel, plain', '1', 245, 10, 48, 1.5, 2, 5, 3, 430, ['grain'], 3, '\u{1F96F}'),
  F('Rice cake, plain', '1', 35, 0.7, 7, 0.3, 0.4, 0, 0, 30, ['grain'], 2, '\u{1F358}'),
  F('Pretzels', '1 oz', 108, 2.9, 23, 0.8, 1, 0.7, 0, 380, ['grain'], 3, '\u{1F968}'),
  F('Cheese crackers (fish shaped)', '55 pieces', 140, 3, 20, 5, 1, 0, 0, 250, ['grain'], 3, '\u{1F41F}'),

  F('Egg whites', '1 cup', 126, 26.5, 1.8, 0.4, 0, 1.7, 0, 403, ['protein'], 1, '\u{1F95A}'),
  F('Egg', '1 large', 72, 6.3, 0.4, 4.8, 0, 0.2, 0, 71, ['protein'], 1, '\u{1F95A}'),
  F('Scrambled eggs', '2 large', 180, 12, 2, 13, 0, 1, 0, 340, ['protein'], 1, '\u{1F373}'),
  F('Chicken breast, grilled', '3 oz', 140, 26, 0, 3, 0, 0, 0, 65, ['protein'], 1, '\u{1F357}'),
  F('Chicken nuggets', '6 pieces', 280, 13, 18, 17, 1, 0, 0, 540, ['protein'], 3, '\u{1F357}'),
  F('Sirloin steak, fat trimmed', '3 oz cooked', 170, 25, 0, 7, 0, 0, 0, 55, ['protein'], 1, '\u{1F969}'),
  F('Ground beef patty (85% lean)', '3 oz', 213, 22, 0, 13, 0, 0, 0, 75, ['protein'], 1, '\u{1F354}'),
  F('Turkey deli slices', '2 oz', 60, 10, 2, 1, 0, 1, 0, 500, ['protein'], 3, '\u{1F983}'),
  F('Ham slices', '2 oz', 60, 10, 1, 2, 0, 1, 0, 520, ['protein'], 3, '\u{1F356}'),
  F('Bacon', '2 slices', 86, 6, 0.2, 7, 0, 0, 0, 370, ['protein'], 3, '\u{1F953}'),
  F('Salmon, baked', '3 oz', 175, 19, 0, 10.5, 0, 0, 0, 50, ['protein'], 1, '\u{1F41F}'),
  F('Tuna, canned in water', '3 oz', 99, 22, 0, 0.7, 0, 0, 0, 290, ['protein'], 2, '\u{1F41F}'),
  F('Fish sticks', '4', 230, 9, 20, 12, 1, 1, 0, 400, ['protein'], 3, '\u{1F41F}'),
  F('Shrimp, cooked', '3 oz', 84, 20, 0.2, 0.2, 0, 0, 0, 94, ['protein'], 1, '\u{1F364}'),
  F('Meatballs', '3 small', 220, 15, 6, 15, 0.5, 1, 0, 400, ['protein'], 3, '\u{1F356}'),
  F('Hot dog with bun', '1', 290, 10, 24, 17, 1, 4, 2, 800, ['protein','grain'], 3, '\u{1F32D}'),
  F('Hamburger, kid size', '1', 250, 12, 31, 9, 1, 6, 5, 510, ['protein','grain'], 3, '\u{1F354}'),
  F('Cheese pizza', '1 slice', 285, 12, 36, 10, 2.5, 3.8, 1, 640, ['grain','dairy'], 3, '\u{1F355}'),
  F('Beef taco, hard shell', '1', 180, 8, 13, 10, 2, 1, 0, 300, ['protein','grain'], 3, '\u{1F32E}'),
  F('Bean and cheese burrito', '1', 350, 14, 48, 11, 7, 2, 0, 800, ['grain','protein','dairy'], 3, '\u{1F32F}'),
  F('California roll', '6 pieces', 255, 9, 38, 7, 3, 7, 2, 430, ['grain','protein'], 2, '\u{1F363}'),
  F('Turkey sandwich (whole wheat)', '1', 250, 18, 30, 5, 4.5, 4, 1, 800, ['protein','grain','veg'], 3, '\u{1F96A}'),
  F('PB&J sandwich', '1', 390, 12, 50, 18, 3.5, 17, 12, 420, ['protein','grain'], 3, '\u{1F96A}'),
  F('Grilled cheese sandwich', '1', 370, 12, 30, 22, 2, 4, 1, 650, ['grain','dairy'], 3, '\u{1F96A}'),
  F('Cheese quesadilla', '1', 260, 11, 25, 13, 1.5, 1, 0, 550, ['grain','dairy'], 2, '\u{1FAD3}'),
  F('Chicken noodle soup, canned', '1 cup', 60, 3, 8, 2, 1, 1, 0, 890, ['protein','grain'], 3, '\u{1F35C}'),
  F('Black beans', '1/2 cup', 114, 7.6, 20, 0.5, 7.5, 0.3, 0, 1, ['protein','veg'], 2, '\u{1FAD8}'),
  F('Peanut butter', '2 tbsp', 190, 7, 7, 16, 2, 3, 1, 140, ['protein'], 2, '\u{1F95C}'),
  F('Almonds', '1 oz (about 23)', 164, 6, 6, 14, 3.5, 1.2, 0, 0, ['protein'], 1, '\u{1F330}'),
  F('Tofu, firm', '1/2 cup', 181, 22, 3.5, 11, 2.9, 0.5, 0, 18, ['protein'], 2, '\u{1F372}'),
  F('Hummus', '2 tbsp', 70, 2, 6, 5, 1.5, 0.1, 0, 110, ['protein'], 2, '\u{1F963}'),
  F('Trail mix', '1/4 cup', 175, 5, 17, 11, 2, 10, 5, 60, ['protein','fruit'], 2, '\u{1F95C}'),

  F('Milk, 2%', '1 cup', 122, 8, 12, 4.8, 0, 12, 0, 115, ['dairy'], 2, '\u{1F95B}'),
  F('Milk, whole', '1 cup', 149, 7.7, 12, 8, 0, 12, 0, 105, ['dairy'], 2, '\u{1F95B}'),
  F('Chocolate milk', '1 cup', 190, 8, 30, 5, 1, 24, 12, 150, ['dairy'], 3, '\u{1F95B}'),
  F('Greek yogurt, plain', '3/4 cup', 100, 17, 6, 0.7, 0, 6, 0, 61, ['dairy'], 2, '\u{1F963}'),
  F('Fruit yogurt, kids cup', '1 (4 oz)', 100, 3, 17, 1.5, 0, 14, 9, 55, ['dairy'], 3, '\u{1F963}'),
  F('String cheese', '1 stick', 80, 7, 1, 6, 0, 0, 0, 200, ['dairy'], 2, '\u{1F9C0}'),
  F('Cheddar cheese', '1 oz', 114, 7, 0.4, 9.4, 0, 0.1, 0, 185, ['dairy'], 2, '\u{1F9C0}'),
  F('Gayo Azul Gouda cheese', '1 slice (21 g)', 70, 5, 0, 6, 0, 0, 0, 140, ['dairy'], 2, '\u{1F9C0}', '160 mg calcium and 4 g saturated fat per slice.'),
  F('Cottage cheese, 2%', '1/2 cup', 92, 12, 5, 2.5, 0, 4.5, 0, 350, ['dairy'], 2, '\u{1F963}'),
  F('Vanilla ice cream', '1/2 cup', 137, 2.3, 16, 7.3, 0.5, 14, 12, 53, ['dairy'], 3, '\u{1F368}'),

  F('Water', '1 cup', 0, 0, 0, 0, 0, 0, 0, 0, ['other'], 1, '\u{1F4A7}'),
  F('Cola', '12 fl oz can', 140, 0, 39, 0, 0, 39, 39, 45, ['other'], 3, '\u{1F964}', 'Has about 34 mg of caffeine.'),
  F('Sports drink', '12 fl oz', 80, 0, 21, 0, 0, 21, 21, 160, ['other'], 3, '\u{1F964}'),
  F('Lemonade', '1 cup', 100, 0, 26, 0, 0, 24, 23, 10, ['other'], 3, '\u{1F34B}'),
  F('Potato chips', '1 oz (about 15)', 152, 2, 15, 10, 1, 0.1, 0, 150, ['other'], 3, '\u{1F954}'),
  F('Fruit snacks', '1 pouch', 90, 0, 21, 0, 0, 12, 12, 30, ['other'], 3, '\u{1F36C}'),
  F('Chocolate chip cookie', '1 medium', 140, 1.5, 20, 7, 0.5, 10, 9, 100, ['other'], 3, '\u{1F36A}'),
  F('Milk chocolate bar', '1.55 oz', 235, 3.4, 26, 13, 1.5, 22, 21, 35, ['other'], 3, '\u{1F36B}'),
  F('Dark chocolate (70%)', '1 oz', 170, 2, 13, 12, 3, 7, 7, 6, ['other'], 3, '\u{1F36B}'),
  F('Butter', '1 tsp', 34, 0, 0, 3.8, 0, 0, 0, 27, ['other'], 2, '\u{1F9C8}'),
  F('Olive oil', '1 tsp', 40, 0, 0, 4.5, 0, 0, 0, 0, ['other'], 2, '\u{1FAD2}'),
  F('Ketchup', '1 tbsp', 17, 0.2, 4.5, 0, 0, 3.6, 3, 154, ['other'], 3, '\u{1F345}'),
  F('Honey', '1 tsp', 21, 0, 5.8, 0, 0, 5.8, 5.8, 0, ['other'], 2, '\u{1F36F}'),
  F('Jelly or jam', '1 tbsp', 56, 0.1, 14, 0, 0.2, 10, 8, 6, ['other'], 3, '\u{1F353}'),
  F('Maple syrup', '1 tbsp', 52, 0, 13.4, 0, 0, 12, 12, 2, ['other'], 2, '\u{1F341}')
];
const POPULAR = ['Apple','Banana','Egg','Milk, 2%','Whole wheat bread','Chicken breast, grilled','White rice, cooked','Cheddar cheese','Baby carrots','Greek yogurt, plain','Peanut butter','Oatmeal, cooked'];

// ---------- serving sizes and amounts ----------
const UNITS = {
  g: { kind: 'weight', f: 1, label: 'g', names: ['g','gram','grams'] },
  oz: { kind: 'weight', f: 28.3495, label: 'oz', names: ['oz','ounce','ounces'] },
  lb: { kind: 'weight', f: 453.592, label: 'lb', names: ['lb','lbs','pound','pounds'] },
  kg: { kind: 'weight', f: 1000, label: 'kg', names: ['kg','kilogram','kilograms'] },
  ml: { kind: 'volume', f: 1, label: 'ml', names: ['ml','milliliter','milliliters','millilitre','millilitres'] },
  floz: { kind: 'volume', f: 29.5735, label: 'fl oz', names: ['fl oz','fl. oz','floz','fluid ounce','fluid ounces'] },
  cup: { kind: 'volume', f: 236.588, label: 'cup', names: ['cup','cups','c'] },
  tbsp: { kind: 'volume', f: 14.7868, label: 'tbsp', names: ['tbsp','tablespoon','tablespoons','tbs'] },
  tsp: { kind: 'volume', f: 4.92892, label: 'tsp', names: ['tsp','teaspoon','teaspoons'] },
  l: { kind: 'volume', f: 1000, label: 'L', names: ['l','liter','liters','litre','litres'] }
};
function unitByName(name){ name = String(name || '').toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim(); for (const k in UNITS) if (UNITS[k].names.indexOf(name) >= 0) return k; return null; }
function parseQty(str){
  const m = String(str || '').trim().match(/^(\d+)\s+(\d+)\/(\d+)$|^(\d+)\/(\d+)$|^(\d*\.?\d+)$/);
  if (!m) return null;
  if (m[1]) return num(m[1]) + num(m[2]) / num(m[3]);
  if (m[4]) return num(m[4]) / num(m[5]);
  return num(m[6]);
}
// "3 oz cooked" -> {amount:3, unit:'oz', kind:'weight'}; "1 slice (21 g)" -> {amount:1, noun:'slice', kind:'count', alt:{amount:21, unit:'g'}}
function parseServing(serving){
  const s = String(serving || '').toLowerCase().replace(/½/g, '1/2').replace(/¼/g, '1/4').replace(/¾/g, '3/4').trim();
  const m = s.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+)\s*(fl\.?\s*oz|[a-z]+)?/);
  if (!m) return null;
  const amount = parseQty(m[1]); if (!amount || amount <= 0) return null;
  const word = (m[2] || '').replace(/\./g, '').replace(/\s+/g, ' ');
  const unit = unitByName(word);
  let alt = null; const pm = s.match(/\((\d*\.?\d+)\s*(g|ml|oz|fl oz)\)/); if (pm) { const u = unitByName(pm[2]); if (u) alt = { amount: num(pm[1]), unit: u }; }
  if (unit) return { amount, unit, kind: UNITS[unit].kind, alt };
  if (!word) return alt ? { amount, noun: '', kind: 'count', alt } : null;
  if (/^(small|medium|large|xl|x-large|jumbo|regular|serving|servings|package|pkg|can|bottle|box)$/.test(word)) return alt ? { amount, noun: word, kind: 'size', alt } : { amount, noun: word, kind: 'size', alt: null };
  return { amount, noun: word, kind: 'count', alt };
}
function convertUnits(value, from, to){ const a = UNITS[from], b = UNITS[to]; if (!a || !b || a.kind !== b.kind) return null; return value * a.f / b.f; }
// Units she can type an amount in for this serving, each mapped to how many servings one of that unit is
function amountOptions(serving){
  const ps = parseServing(serving); if (!ps) return [];
  const out = [];
  const addUnit = (u, perServing) => { if (UNITS[u] && !out.some(o => o.unit === u)) out.push({ unit: u, label: UNITS[u].label, perServing }); };
  if (ps.unit) { addUnit(ps.unit, ps.amount); Object.keys(UNITS).forEach(u => { if (UNITS[u].kind === UNITS[ps.unit].kind && u !== ps.unit) addUnit(u, convertUnits(ps.amount, ps.unit, u)); }); }
  else if (ps.kind === 'count' && ps.noun) out.push({ unit: 'count', label: ps.amount === 1 ? ps.noun : ps.noun, perServing: ps.amount, noun: ps.noun });
  if (ps.alt) { addUnit(ps.alt.unit, ps.alt.amount); Object.keys(UNITS).forEach(u => { if (UNITS[u].kind === UNITS[ps.alt.unit].kind && u !== ps.alt.unit) addUnit(u, convertUnits(ps.alt.amount, ps.alt.unit, u)); }); }
  return out.filter(o => o.perServing > 0 && ['lb','kg','l'].indexOf(o.unit) < 0);
}
function fmtAmount(n){ n = Number(n) || 0; return n >= 100 ? String(Math.round(n)) : n >= 10 ? String(Math.round(n * 10) / 10) : String(Math.round(n * 100) / 100); }
function plural(noun, n){ if (!noun) return ''; if (n === 1) return noun; if (/s$/.test(noun)) return noun; if (/(ch|sh|x)$/.test(noun)) return noun + 'es'; return noun + 's'; }
// Readable amount for an entry, e.g. "2.3 oz", "2 slices (42 g)", "1.5 cups"
function servingLabel(e){
  const q = num(e.qty) || 1; const ps = parseServing(e.serving);
  if (!ps) return fmt(q) + ' × ' + e.serving;
  if (ps.kind === 'size' && Math.abs(q - 1) < 0.001) return e.serving;
  const total = q * ps.amount;
  if (ps.unit) return fmtAmount(total) + ' ' + (ps.unit === 'cup' ? plural('cup', total) : UNITS[ps.unit].label) + (ps.alt ? ' (' + fmtAmount(q * ps.alt.amount) + ' ' + UNITS[ps.alt.unit].label + ')' : '');
  if (ps.kind === 'count' && ps.noun && Math.abs(total - Math.round(total * 4) / 4) < 0.001) return fmtAmount(total) + ' ' + plural(ps.noun, total) + (ps.alt ? ' (' + fmtAmount(q * ps.alt.amount) + ' ' + UNITS[ps.alt.unit].label + ')' : '');
  if (ps.alt && ps.alt.unit) return fmtAmount(q * ps.alt.amount) + ' ' + UNITS[ps.alt.unit].label + ' (' + fmt(q) + ' × ' + e.serving + ')';
  return fmt(q) + ' × ' + e.serving;
}
