
// ---------- lessons ----------
const S = html => ({ html });
const Q = (q, opts, a, why) => ({ q, opts, a, why });
const LESSONS = [
  { id: 'calories', icon: '\u{1F525}', title: 'What is a calorie?', blurb: 'Energy, fuel, and a body that builds itself',
    slides: [
      S('<div class="big-em">\u{1F525}</div><h3>A calorie is a unit of energy</h3><p>Like a mile measures distance, a calorie measures energy. Food has energy stored inside it. When you eat, your body unlocks that energy to run, think, grow, and even sleep.</p>'),
      S('<div class="big-em">\u{1F697}\u{1F3D7}️</div><h3>A car that builds itself</h3><p>Your body is like a car that is also building itself bigger and stronger every day. Calories are the fuel.</p><p>Some fuel runs the engine (playing, thinking, breathing, keeping warm). Some becomes new building material (taller bones, stronger muscles, longer hair).</p>'),
      S('<div class="big-em">⚽</div><h3>How much fuel does a kid use?</h3><p>For a girl your age who plays and moves a lot, a typical day uses somewhere around 1,600 to 2,000 calories. A big soccer day uses more. A rainy movie day uses less.</p><div class="note">Your body is the boss of how hungry you are, and that is a good thing. Hunger is your fuel light.</div>'),
      S('<div class="big-em">\u{1F4D0}</div><h3>Numbers are for learning, not limits</h3><p>Nobody wins by eating the fewest calories or the most protein. The goal is enough of everything your body needs to grow, learn, and feel good.</p><p>In this app, the little marker on the fuel gauge shows a typical day. Going past it on a busy day is normal. So is landing under it on a quiet one.</p>')
    ],
    quiz: [
      Q('What is a calorie?', ['A unit of energy', 'A type of vitamin', 'A kind of sugar'], 0, 'Calories measure the energy stored in food.'),
      Q('What happens to your fuel use on a big soccer day?', ['Your body uses more', 'Your body uses less', 'It stays exactly the same'], 0, 'Moving more uses more fuel, so you usually get hungrier too.'),
      Q('What is the goal of counting calories in this app?', ['To learn how food works', 'To eat as little as possible', 'To win a contest'], 0, 'The numbers are a science tool for learning, never a limit.')
    ] },
  { id: 'macros', icon: '\u{1F9F1}', title: 'The Big Three', blurb: 'Protein, carbs, and fat each have a job',
    slides: [
      S('<div class="big-em">\u{1F9F1}</div><h3>Three big building blocks</h3><p>Almost all food is made from three big nutrients called macronutrients. Macro means big. They are protein, carbohydrates, and fat. Each one has a job.</p>'),
      S('<div class="big-em">⚡</div><h3>Carbs are quick energy</h3><p>Carbohydrates power running, playing, and thinking at school. Find them in fruit, bread, rice, pasta, oats, beans, corn, and milk.</p><div class="note carb">Whole grains and fruit bring fiber along for the ride. Fiber keeps the energy steady instead of spiky.</div>'),
      S('<div class="big-em">\u{1F4AA}</div><h3>Protein is building material</h3><p>Protein builds muscles, skin, hair, and even the tiny soldiers of your immune system. Find it in eggs, chicken, fish, beef, beans, yogurt, cheese, nuts, and tofu.</p><p>Kids your age need at least about 34 grams a day, and most kids get that easily. More is fine too. Your body uses what it needs.</p>'),
      S('<div class="big-em">\u{1F9E0}</div><h3>Fat is brain food</h3><p>Your brain is mostly fat! Fat also helps your body use vitamins A, D, E, and K, and it keeps you feeling satisfied after a meal.</p><p>Find it in nuts, seeds, avocado, olive oil, cheese, fish, and eggs.</p>'),
      S('<div class="big-em">\u{1F37D}️</div><h3>A balanced day</h3><p>Over a whole day, about half of your energy usually comes from carbs, and the rest is split between protein and fat. You never have to measure it.</p><div class="note">A plate with a grain, a protein, some fruit or veggies, and a little fat usually gets you there without any math.</div>')
    ],
    quiz: [
      Q('Which nutrient is your brain mostly made of?', ['Fat', 'Carbs', 'Protein'], 0, 'The brain is about 60 percent fat, so fat is real brain food.'),
      Q('Which one is your quick energy?', ['Carbohydrates', 'Protein', 'Vitamins'], 0, 'Carbs are the fastest fuel for playing and thinking.'),
      Q('Which pair has lots of protein?', ['Eggs and beans', 'Apples and grapes', 'Olive oil and butter'], 0, 'Eggs, beans, chicken, fish, yogurt, and nuts are all protein foods.')
    ] },
  { id: 'helpers', icon: '\u{1F308}', title: 'Tiny helpers', blurb: 'Vitamins, minerals, fiber, and eating the rainbow',
    slides: [
      S('<div class="big-em">\u{1F52C}</div><h3>Helpers you cannot see</h3><p>Besides the Big Three, food carries tiny helpers. Vitamins and minerals are needed in small amounts, but they do huge jobs.</p>'),
      S('<div class="big-em">\u{1F9B4}</div><h3>Meet a few</h3><ul><li><b>Calcium</b> builds bones and teeth. Milk, yogurt, cheese, tofu, leafy greens.</li><li><b>Iron</b> carries oxygen in your blood. Meat, beans, spinach, fortified cereal.</li><li><b>Vitamin C</b> helps you heal and fight germs. Oranges, strawberries, peppers.</li><li><b>Vitamin D</b> helps calcium do its job. Sunshine, milk, fish, eggs.</li></ul>'),
      S('<div class="big-em">\u{1F33F}</div><h3>Fiber, the friendly leftover</h3><p>Fiber is the part of plants your body cannot digest, and that is the point. It keeps your tummy and your gut buddies (the good bacteria) happy, helps you feel satisfied, and keeps things moving.</p><p>Kids your age do well with about 26 grams a day.</p>'),
      S('<div class="big-em">\u{1F34E}\u{1F9C3}</div><h3>Whole fruit wins</h3><p>Fiber lives in fruit (with the skin!), veggies, beans, whole grains, nuts, and seeds.</p><p>Juice has almost no fiber, because the fiber gets left behind when the fruit is squeezed. A whole orange keeps all of it.</p>'),
      S('<div class="big-em">\u{1F308}</div><h3>Eat the rainbow</h3><p>Different colors of fruit and veggies carry different helpers. Red, orange, yellow, green, blue, purple. Try to collect a few colors each day.</p><div class="note">Log a fruit and a veggie on the same day to earn the Rainbow Day badge.</div>')
    ],
    quiz: [
      Q('Which helper builds bones and teeth?', ['Calcium', 'Vitamin C', 'Iron'], 0, 'Calcium (with help from vitamin D) builds strong bones.'),
      Q('Where does fiber come from?', ['Plants', 'Meat', 'Water'], 0, 'Fiber is only found in plant foods like fruit, veggies, beans, and grains.'),
      Q('Which has more fiber?', ['A whole apple', 'A cup of apple juice', 'They are the same'], 0, 'Squeezing fruit into juice leaves most of the fiber behind.')
    ] },
  { id: 'label', icon: '\u{1F50D}', title: 'Reading a Nutrition Facts label', blurb: 'Tap every line and decode the box',
    slides: [
      S('<div class="big-em">\u{1F50D}</div><h3>The label tells the truth in numbers</h3><p>Every packaged food in the U.S. has a Nutrition Facts label. The front of the box is an advertisement. The label is the real story. Here is how to read it like a detective.</p>'),
      { type: 'label' },
      S('<div class="big-em">\u{1F575}️</div><h3>Detective moves</h3><ul><li>Check the <b>serving size</b> first. Everything below it is for one serving.</li><li>Use the <b>5 and 20 rule</b>. 5% Daily Value or less is low, 20% or more is high.</li><li>Look at <b>fiber</b> and <b>added sugars</b>. More fiber and less added sugar usually means a food that fuels you longer.</li><li>Read the <b>first three ingredients</b>. That is mostly what the food is.</li></ul>')
    ],
    quiz: [
      Q('What should you check first on a label?', ['Serving size', 'The brand name', 'The picture on the front'], 0, 'Every number on the label is for one serving, so serving size comes first.'),
      Q('20% Daily Value of a nutrient means...', ['A high amount', 'A low amount', 'A medium amount'], 0, '20% or more is high. 5% or less is low.'),
      Q('Ingredients are listed...', ['From most to least by weight', 'Alphabetically', 'In random order'], 0, 'The first ingredient is the biggest part of the food.')
    ] },
  { id: 'portions', icon: '\u{1F91A}', title: 'How much is a serving?', blurb: 'Hand guides and your own hunger signals',
    slides: [
      S('<div class="big-em">\u{1F944}</div><h3>A serving is a measuring tool</h3><p>Serving sizes on labels help you compare foods and log them. They are not a rule about how much you should eat. Your hunger is the best guide for that.</p>'),
      S('<h3>Hand guide</h3><div class="hands"><div class="hand"><span class="em">✊</span>Your fist<br><span class="eq">about 1 cup</span><br><span class="muted small">rice, pasta, fruit, cereal</span></div><div class="hand"><span class="em">\u{1F590}️</span>Your palm<br><span class="eq">about 3 oz</span><br><span class="muted small">meat, fish, chicken</span></div><div class="hand"><span class="em">\u{1F932}</span>Cupped hand<br><span class="eq">about 1/2 cup</span><br><span class="muted small">nuts, beans, snacks</span></div><div class="hand"><span class="em">\u{1F44D}</span>Your thumb<br><span class="eq">about 1 tbsp</span><br><span class="muted small">peanut butter, butter, oil</span></div></div><p class="hint">These are based on grown-up hands, so yours give slightly smaller amounts. It is an estimate, and estimates are great for logging.</p>'),
      S('<div class="big-em">\u{1F4E1}</div><h3>Your body sends signals</h3><p>A growling tummy, low energy, and grumpiness can mean fuel me. A comfortable, satisfied tummy means thanks, that is enough for now.</p><div class="note">Eating slowly and without screens makes the signals easier to hear.</div>')
    ],
    quiz: [
      Q('About how much is your fist?', ['1 cup', '1 tablespoon', '3 ounces'], 0, 'A fist is about a cup, which is handy for rice, pasta, and fruit.'),
      Q('What is the best guide for how much to eat?', ['Your hunger and fullness signals', 'The clock', 'The size of the plate'], 0, 'Your body knows. The label and the clock are just helpers.')
    ] },
  { id: 'processing', icon: '\u{1F3ED}', title: 'How processed is it?', blurb: 'Three levels, a sorting game, and no bad foods',
    slides: [
      S('<div class="big-em">\u{1F3ED}</div><h3>Processing means changing food</h3><p>Processing means changing food from how it grows. Almost everything is processed a little. Cooking is processing! The real question is how much.</p>'),
      S('<div class="big-em">\u{1F34E}\u{1F95A}\u{1F35A}</div><h3>Level 1. Whole or barely changed</h3><p>Apples, eggs, rice, oats, milk, frozen peas, plain nuts, chicken, fish. Washed, chopped, cooked, frozen, or dried, but still basically the food.</p>'),
      S('<div class="big-em">\u{1F9C0}\u{1F35E}\u{1FAD8}</div><h3>Level 2. Changed a little</h3><p>Cheese, bakery bread, canned beans, yogurt, peanut butter, olive oil, pasta. A few ingredients added, like salt, oil, or sugar, to make the food last or taste better.</p>'),
      S('<div class="big-em">\u{1F36C}\u{1F964}\u{1F35F}</div><h3>Level 3. Changed a lot</h3><p>Chips, candy, soda, fruit snacks, frozen nuggets, many cereals, packaged cookies. Scientists call these ultra-processed. They are made in factories with long ingredient lists, including things you would not find in a kitchen, like flavorings, emulsifiers, and colors.</p>'),
      S('<div class="big-em">⚖️</div><h3>Why it matters</h3><p>Level 3 foods are often made to be super tasty and easy to eat a lot of, with less fiber and more salt, sugar, and oil. Eating mostly Level 1 and 2 foods gives your body the most helpers.</p><div class="note">Level 3 foods are not poison. Birthday cake at a party? Enjoy it! The pattern over weeks matters more than any one food.</div>'),
      { type: 'sort' }
    ],
    quiz: [
      Q('Frozen peas are...', ['Level 1, barely changed', 'Level 3, changed a lot', 'Not a real food'], 0, 'Freezing keeps peas fresh without changing what they are.'),
      Q('Which is usually Level 3?', ['Fruit snacks', 'Plain yogurt', 'Brown rice'], 0, 'Fruit snacks are mostly sugar with flavors and colors added in a factory.'),
      Q('True or false. All processed foods are bad.', ['False', 'True'], 0, 'Cheese, yogurt, canned beans, and whole grain bread are processed and great for you.')
    ] },
  { id: 'fats', icon: '\u{1FAD2}', title: 'Fats and oils, the real story', blurb: 'Saturated, unsaturated, and what the science says about seed oils',
    slides: [
      S('<div class="big-em">\u{1FAD2}</div><h3>Fat is a nutrient you need</h3><p>There are different kinds of fat, and the mix matters more than any single one.</p>'),
      S('<div class="big-em">\u{1F9C8}</div><h3>Saturated fat</h3><p>Solid at room temperature. Butter, the fat on meat, coconut oil, cheese. A little is fine and tasty. Lots and lots every day is not the best for your heart over a lifetime, so it is smart to mix in other kinds too.</p>'),
      S('<div class="big-em">\u{1F951}\u{1F41F}</div><h3>Unsaturated fat</h3><p>Liquid at room temperature. Olive oil, avocado oil, canola oil, sunflower oil, nuts, seeds, avocado, and fish. Heart doctors say these are the kinds to use most. Fish and walnuts also carry omega-3s, which your brain loves.</p>'),
      S('<div class="big-em">\u{1F33B}</div><h3>What about seed oils?</h3><p>Seed oils are oils pressed from seeds, like canola, soybean, sunflower, and corn oil. You might hear online that they are toxic or cause inflammation.</p><p>Careful studies, where scientists actually measured people, have not found that. Seed oils are mostly unsaturated fat, the kind doctors recommend. Scientists keep studying, like they study everything.</p>'),
      S('<div class="big-em">\u{1F35F}</div><h3>So why the bad reputation?</h3><p>Because seed oils are in lots of Level 3 foods. Chips, fries, cookies, fast food. Those foods have a lot of oil plus salt and sugar and not much fiber. The problem is the whole package, not the oil by itself.</p><div class="note">A salad with sunflower oil dressing is a great food. The oil is not the villain.</div>'),
      S('<div class="big-em">\u{1F9EA}</div><h3>Detective rule for big claims</h3><p>When someone online says a food is toxic or poison, ask three questions. What is the evidence? Who measured it? Would a doctor or scientist agree?</p><p>Big claims need big evidence.</p>'),
      S('<div class="big-em">✅</div><h3>Easy wins</h3><ul><li>Cook with olive, avocado, or canola oil at home.</li><li>Eat nuts and seeds.</li><li>Have fish sometimes.</li><li>Enjoy butter and cheese in normal amounts.</li></ul><p>Variety is the secret.</p>')
    ],
    quiz: [
      Q('Which kind of fat is solid at room temperature?', ['Saturated fat', 'Unsaturated fat', 'Omega-3'], 0, 'Butter and coconut oil are saturated fats, solid when cool.'),
      Q('Canola oil is mostly...', ['Unsaturated fat', 'Saturated fat', 'Sugar'], 0, 'Canola, olive, and sunflower oils are mostly unsaturated.'),
      Q('What have careful studies found about seed oils and inflammation?', ['They have not found that seed oils cause it', 'They prove seed oils are poison', 'Nobody has ever studied it'], 0, 'Studies that measured people did not find seed oils causing inflammation.'),
      Q('Why are seed oils in so many chips and fries?', ['Those foods are fried or made with lots of oil', 'Oil makes food healthier', 'It is a secret'], 0, 'The whole package of oil, salt, sugar, and low fiber is the issue, not the oil alone.')
    ] },
  { id: 'sugar', icon: '\u{1F36D}', title: 'Sugar, natural and added', blurb: 'Where sugar hides and the 25 gram idea',
    slides: [
      S('<div class="big-em">\u{1F36D}</div><h3>Sugar is a carb</h3><p>Your body uses sugar for energy. The question is where it comes from and what comes along with it.</p>'),
      S('<div class="big-em">\u{1F34E}\u{1F95B}</div><h3>Natural vs added</h3><p><b>Natural sugar</b> comes packaged inside foods. Fruit brings fiber and water. Milk brings protein and calcium.</p><p><b>Added sugar</b> is sugar a company or a cook put in. Soda, candy, cookies, many cereals, flavored yogurt, and lots of drinks.</p>'),
      S('<div class="big-em">\u{1F944}</div><h3>The 25 gram idea</h3><p>Heart doctors suggest kids keep added sugar to about 25 grams a day, which is about 6 teaspoons. Many days will be under. Some days (birthday!) will be over. That is normal.</p><div class="note sun">Quick math. 4 grams of sugar is about 1 teaspoon.</div>'),
      S('<div class="big-em">\u{1F964}</div><h3>The sneaky source is drinks</h3><p>One can of cola has about 39 grams of added sugar, more than a whole day of the 25 gram idea. Many juice drinks and sports drinks have 20 or more.</p><p>Water and milk are everyday drinks. Sweet drinks are sometimes drinks.</p>'),
      S('<div class="big-em">\u{1F3AD}</div><h3>Sugar wears disguises</h3><p>On ingredient lists, sugar has many names. Cane sugar, corn syrup, high fructose corn syrup, honey, dextrose, brown rice syrup, fruit juice concentrate.</p><p>The Added Sugars line on the label adds them all up for you.</p>'),
      { type: 'sugar' }
    ],
    quiz: [
      Q('Which one has added sugar?', ['Soda', 'Plain milk', 'A banana'], 0, 'Milk and bananas have natural sugar. Soda has sugar that was added.'),
      Q('4 grams of sugar is about...', ['1 teaspoon', '1 cup', '1 tablespoon'], 0, 'Four grams is about one teaspoon, so 24 grams is about 6 teaspoons.'),
      Q('Everyday drinks are...', ['Water and milk', 'Soda and lemonade', 'Sports drinks'], 0, 'Water and milk fuel you without a sugar rush.')
    ] },
  { id: 'additives', icon: '\u{1F9EA}', title: 'Salt, dyes, and preservatives', blurb: 'Decoding the long words on the ingredient list',
    slides: [
      S('<div class="big-em">\u{1F9EA}</div><h3>Ingredient lists can look like a science test</h3><p>Let us decode the common ones.</p>'),
      S('<div class="big-em">\u{1F9C2}</div><h3>Salt (sodium)</h3><p>Salt makes food tasty and keeps it from spoiling. Your body needs some. Most of it comes from packaged food and restaurant food, not the salt shaker.</p><p>For kids your age, staying under about 1,800 mg a day is the guideline. Level 3 foods often have a lot.</p>'),
      S('<div class="big-em">\u{1F6E1}️</div><h3>Preservatives</h3><p>Preservatives keep food safe from mold and bacteria so it lasts longer. Some are old friends, like salt, vinegar, sugar, and lemon juice (citric acid). Some are made in labs.</p><p>In the U.S., additives are reviewed for safety before they are allowed, and scientists keep checking.</p>'),
      S('<div class="big-em">\u{1F3A8}</div><h3>Food dyes</h3><p>Dyes make food colorful. Some come from plants, like beet juice and turmeric. Some are made in labs and have names like Red 40 or Blue 1.</p><p>Some kids seem to react to certain dyes, and some countries limit them, so scientists keep studying. Dyes mostly show up in Level 3 foods anyway.</p>'),
      S('<div class="big-em">\u{1F33F}</div><h3>Natural is not a magic word</h3><p>Natural does not always mean safer, and artificial does not always mean dangerous. Poison ivy is natural! What matters is the evidence and the amount.</p>')
    ],
    quiz: [
      Q('Where does most sodium come from?', ['Packaged and restaurant food', 'The salt shaker at home', 'Fruit'], 0, 'Most salt is already inside packaged and restaurant foods.'),
      Q('What do preservatives do?', ['Keep food from spoiling', 'Add vitamins', 'Make food sweeter'], 0, 'Preservatives slow down mold and bacteria so food stays safe longer.'),
      Q('Natural always means safer.', ['False', 'True'], 0, 'Poison ivy is natural. Evidence and amount matter more than the word.')
    ] },
  { id: 'caffeine', icon: '☕', title: 'Caffeine, the sneaky one', blurb: 'Why kids skip it and where it hides',
    slides: [
      S('<div class="big-em">☕</div><h3>What caffeine is</h3><p>Caffeine is a natural chemical in coffee beans, tea leaves, cacao (chocolate), and yerba mate. It makes people feel more awake by blocking the I am sleepy signal in the brain.</p>'),
      S('<div class="big-em">\u{1F9D2}</div><h3>Why kids skip it</h3><p>Kids bodies are smaller, so the same amount hits harder. It can cause jitters, a racing heart, tummy aches, and trouble sleeping.</p><div class="note">The American Academy of Pediatrics says kids under 12 should skip caffeine, and nobody under 18 should drink energy drinks.</div>'),
      S('<div class="big-em">\u{1F575}️</div><h3>Where it hides</h3><p>Cola and some other sodas, iced tea, coffee drinks, energy drinks, chocolate (a little), and some juices that add green tea or yerba mate extract.</p><p>Check the ingredients for caffeine, guarana, yerba mate, green tea extract, or coffee.</p>'),
      S('<div class="big-em">\u{1F9C3}</div><h3>Even organic juice can have it</h3><p>Organic and natural do not mean caffeine free. One juice label might say it has as much caffeine as a quarter shot of espresso, which is about 15 to 20 mg. Small, but your body notices, especially before bed.</p>')
    ],
    quiz: [
      Q('Where can caffeine hide?', ['Some juices with green tea extract', 'Plain milk', 'Apples'], 0, 'Some juices add green tea or yerba mate extract, and both carry caffeine.'),
      Q('What do pediatricians say about caffeine for kids under 12?', ['Skip it', 'One soda a day is fine', 'Only at night'], 0, 'The American Academy of Pediatrics recommends no caffeine under age 12.')
    ] },
  { id: 'claims', icon: '\u{1F4E3}', title: 'Front-of-box claims', blurb: 'Made with real fruit! All natural! Flip it over.',
    slides: [
      S('<div class="big-em">\u{1F4E3}</div><h3>The front of the box is an ad</h3><p>Made with real fruit! All natural! Low fat! Good source of vitamin C! These claims are allowed, but they do not tell the whole story.</p>'),
      S('<h3>Decoder ring</h3><ul><li><b>Made with real fruit</b> can mean a tiny bit of fruit juice concentrate plus lots of sugar.</li><li><b>Low fat</b> means fat was removed, and sugar was often added to make it taste good.</li><li><b>Multigrain</b> means several grains, not always whole grains. Look for the word whole first.</li></ul>'),
      S('<h3>More decoder ring</h3><ul><li><b>No added sugar</b> can still mean lots of natural sugar, like juice.</li><li><b>Natural</b> has no strict rule for most foods in the U.S.</li><li><b>Organic</b> is about how the food was grown, not how much sugar or salt it has.</li></ul>'),
      S('<div class="big-em">\u{1F504}</div><h3>The detective move</h3><p>Flip it over. Serving size, added sugars, fiber, sodium, and the first three ingredients tell the truth.</p>')
    ],
    quiz: [
      Q('Multigrain means...', ['Several grains, not always whole', 'Always whole grains', 'No grains'], 0, 'Look for the word whole as the first word in the grain ingredient.'),
      Q('What is the detective move?', ['Flip it over and read the label', 'Trust the front of the box', 'Buy the brightest box'], 0, 'The Nutrition Facts label and the ingredients list tell the real story.')
    ] },
  { id: 'feelgood', icon: '\u{1F31E}', title: 'Feeling good', blurb: 'Breakfast, water, sleep, and no bad foods',
    slides: [
      S('<div class="big-em">\u{1F31E}</div><h3>Food is one part of feeling great</h3><p>Sleep, water, moving your body, and having fun matter just as much.</p>'),
      S('<div class="big-em">\u{1F373}</div><h3>Breakfast wakes up your brain</h3><p>A mix of carbs plus protein keeps energy steady until lunch. Eggs and toast. Oatmeal with milk. Yogurt with fruit. Peanut butter on a banana.</p>'),
      S('<div class="big-em">\u{1F4A7}</div><h3>Water</h3><p>Your body is about 60 percent water. When you feel thirsty, you have already lost some. Drink water with meals and when you play.</p><div class="note carb">Pale yellow pee means you are doing great.</div>'),
      S('<div class="big-em">\u{1F382}</div><h3>All foods fit</h3><p>There are everyday foods (fruit, veggies, grains, protein, dairy) and sometimes foods (candy, chips, soda). Enjoying a sometimes food is not bad.</p><p>There is no such thing as a bad food, and no such thing as a bad kid for eating one.</p>'),
      S('<div class="big-em">\u{1F9EC}</div><h3>You are the scientist of you</h3><p>The energy check-in on the Today page helps you notice patterns. Sleepy after a sugary lunch? Super after a breakfast with protein? Those are your own discoveries.</p>')
    ],
    quiz: [
      Q('A good breakfast mix is...', ['Carbs plus protein', 'Only sugar', 'Skipping it'], 0, 'Carbs for quick energy and protein to keep it steady.'),
      Q('Pale yellow pee means...', ['You are well hydrated', 'You need more sugar', 'You ate too much'], 0, 'Pale yellow is the sign of plenty of water.'),
      Q('Is there such a thing as a bad food?', ['No, there are everyday foods and sometimes foods', 'Yes, candy is bad', 'Yes, fat is bad'], 0, 'All foods fit. Everyday foods most of the time, sometimes foods sometimes.')
    ] }
];
const LABEL_TIPS = {
  servings: 'Servings per container. This box holds about 10 servings. If you eat the whole box, multiply everything by 10.',
  serving: 'Serving size. Start here. Every number below is for ONE serving, one cup of cereal. Eat two cups and everything doubles.',
  calories: 'Calories. The energy in one serving. 100 calories is about what a banana has.',
  dv: 'Percent Daily Value. How much of a day this serving covers, based on a grown-up day of 2,000 calories. 5% or less is low. 20% or more is high. For kids it is a rough guide.',
  fat: 'Total fat. All the fat in one serving. 2 grams is low. The kinds of fat are listed underneath.',
  satfat: 'Saturated fat. The kind that is solid at room temperature. A little is fine.',
  trans: 'Trans fat. A kind made in factories that is mostly gone from food now. Zero is what you want to see.',
  sodium: 'Sodium is salt. 140 mg is 6% of a grown-up day. Soups, chips, and frozen meals often have a lot more.',
  carbs: 'Total carbohydrate. Your quick energy. Fiber and sugars are both part of this number.',
  fiber: 'Dietary fiber. The friendly leftover. 3 grams is a good start for a cereal. Kids your age do well with about 26 grams a day.',
  sugars: 'Total sugars. Natural and added sugars together. This cereal has 1 gram.',
  added: 'Added sugars. Sugar a company put in. This line is the detective line. Sweet cereals can have 12 grams or more here.',
  protein: 'Protein. The building material. 3 grams here, plus 8 more if you pour on a cup of milk.',
  vitamins: 'Helpers to look for more of. Vitamin D, calcium, iron, and potassium. This cereal has iron added to it.',
  ingredients: 'Ingredients are listed from most to least by weight. Whole grain oats come first, so this cereal is mostly oats. Sugar is third, and there is only 1 gram of it.'
};
const SORT_ITEMS = [
  { name: 'Apple', em: '\u{1F34E}', level: 1, why: 'Grows on a tree. Washing it does not change what it is.' },
  { name: 'Frozen peas', em: '\u{1FADB}', level: 1, why: 'Freezing keeps them fresh. Still just peas.' },
  { name: 'Cheddar cheese', em: '\u{1F9C0}', level: 2, why: 'Milk plus salt and cultures. Changed a little.' },
  { name: 'Canned black beans', em: '\u{1FAD8}', level: 2, why: 'Cooked beans with some salt in a can.' },
  { name: 'Potato chips', em: '\u{1F954}', level: 3, why: 'Fried, salted, flavored, and bagged in a factory.' },
  { name: 'Soda', em: '\u{1F964}', level: 3, why: 'Sugar, flavorings, colors, and bubbles.' },
  { name: 'Plain oatmeal', em: '\u{1F963}', level: 1, why: 'Oats that were rolled flat. That is it.' },
  { name: 'Fruit snacks', em: '\u{1F36C}', level: 3, why: 'Mostly sugar with flavors and colors added.' },
  { name: 'Peanut butter', em: '\u{1F95C}', level: 2, why: 'Ground peanuts, usually with a little salt or oil.' },
  { name: 'Frozen chicken nuggets', em: '\u{1F357}', level: 3, why: 'Ground chicken, breading, oils, and lots of extras.' }
];
const SUGAR_DRINKS = [
  { name: 'Milk, 2%', em: '\u{1F95B}', sub: '1 cup', total: 12, added: 0, why: '12 g of natural milk sugar, 0 g added, plus protein and calcium.' },
  { name: 'Orange juice, 100%', em: '\u{1F9C3}', sub: '1 cup', total: 21, added: 0, why: '21 g of natural fruit sugar, 0 g added, but almost no fiber.' },
  { name: 'Cola', em: '\u{1F964}', sub: '12 oz can', total: 39, added: 39, why: '39 g added, about 10 teaspoons. More than a whole day of the 25 gram idea.' },
  { name: 'Sports drink', em: '\u{1F964}', sub: '12 oz', total: 21, added: 21, why: '21 g added, about 5 teaspoons.' }
];
// ---------- game layer: quests, ranks, facts ----------
const QUESTS = [
  { id: 'fruit', em: '\u{1F34E}', text: 'Log a fruit', check: (d) => groupsOf(d).has('fruit') },
  { id: 'veg', em: '\u{1F966}', text: 'Log a veggie', check: (d) => groupsOf(d).has('veg') },
  { id: 'water4', em: '\u{1F4A7}', text: 'Drink 4 cups of water', check: (d) => (d.water || 0) >= 4 },
  { id: 'energy', em: '⚡', text: 'Do an energy check-in', check: (d) => !!d.energy },
  { id: 'meals3', em: '\u{1F37D}️', text: 'Log breakfast, lunch, and dinner', check: (d) => ['breakfast','lunch','dinner'].every(m => d.entries.some(e => e.meal === m)) },
  { id: 'groups3', em: '\u{1F308}', text: 'Visit 3 food groups', check: (d) => GROUPS.filter(g => groupsOf(d).has(g.id)).length >= 3 },
  { id: 'lesson', em: '\u{1F4D6}', text: 'Finish a lesson today', check: (d, date) => Object.values(state.meta.progress.lessons).some(ts => dateStr(new Date(ts)) === date) },
  { id: 'newfood', em: '\u{1F9ED}', text: 'Log a food you have never logged before', check: (d, date) => d.entries.some(e => isNewFood(e, date)) },
  { id: 'dairy', em: '\u{1F95B}', text: 'Log a dairy food', check: (d) => groupsOf(d).has('dairy') },
  { id: 'protein', em: '\u{1F357}', text: 'Log a protein food', check: (d) => groupsOf(d).has('protein') },
  { id: 'label', em: '\u{1F50D}', text: 'Type in a food from its label', check: (d) => d.entries.some(e => e.src === 'label') },
  { id: 'breakfast', em: '\u{1F305}', text: 'Log your breakfast', check: (d) => d.entries.some(e => e.meal === 'breakfast') },
  { id: 'quiz', em: '\u{1F3DF}️', text: 'Play a Quiz Arena round', check: (d, date) => !!(state.meta.progress.arenaDays || {})[date] },
  { id: 'swap', em: '\u{1F504}', text: 'Try a swap idea from this week', check: (d, date) => swapTried(d, date) },
  { id: 'scan', em: '\u{1F4F7}', text: 'Scan a barcode or snap a label', check: (d) => d.entries.some(e => e.src === 'scan' || e.src === 'ocr') }
];
const RANKS = [
  { min: 0, em: '\u{1F331}', name: 'Rookie' },
  { min: 30, em: '\u{1F575}\uFE0F', name: 'Junior Detective' },
  { min: 80, em: '\u{1F50D}', name: 'Detective' },
  { min: 160, em: '\u{1F9ED}', name: 'Senior Detective' },
  { min: 280, em: '\u{1F3A9}', name: 'Inspector' },
  { min: 450, em: '\u{1F3C5}', name: 'Chief Inspector' },
  { min: 700, em: '\u{1F9E0}', name: 'Master Sleuth' },
  { min: 1000, em: '\u{1F31F}', name: 'Legend' },
  { min: 1500, em: '\u{1F3C6}', name: 'Hall of Famer' }
];
// Weekly challenges rotate by week (Monday to Sunday) and pay 10 stars plus a trophy
const WEEKLY = [
  { id: 'rainbow5', em: '\u{1F308}', name: 'The Rainbow Case', text: 'Log a fruit and a veggie on 5 days', target: 5, count: days => days.filter(d => { const g = groupsOf(d); return g.has('fruit') && g.has('veg'); }).length },
  { id: 'water5', em: '\u{1F4A7}', name: 'The Hydration Case', text: 'Log 4 or more cups of water on 5 days', target: 5, count: days => days.filter(d => (d.water || 0) >= 4).length },
  { id: 'breakfast5', em: '\u{1F305}', name: 'The Breakfast Case', text: 'Log breakfast on 5 days', target: 5, count: days => days.filter(d => d.entries.some(e => e.meal === 'breakfast')).length },
  { id: 'new3', em: '\u{1F9ED}', name: 'The Discovery Case', text: 'Log 3 foods you have never logged before', target: 3, count: (days, ws) => { const names = new Set(); days.forEach(d => d.entries.forEach(e => names.add(e.name.trim().toLowerCase()))); let n = 0; names.forEach(k => { if (!Object.keys(state.days).some(dt => dt < ws && state.days[dt].entries.some(x => x.name.trim().toLowerCase() === k))) n++; }); return n; } },
  { id: 'groups4', em: '\u{1F590}️', name: 'The Variety Case', text: 'Visit 4 or more food groups on 4 days', target: 4, count: days => days.filter(d => GROUPS.filter(g => groupsOf(d).has(g.id)).length >= 4).length },
  { id: 'energy6', em: '⚡', name: 'The Energy Case', text: 'Do an energy check-in on 6 days', target: 6, count: days => days.filter(d => d.energy).length },
  { id: 'quests10', em: '✅', name: 'The Mission Case', text: 'Finish 10 daily missions', target: 10, count: days => days.reduce((a, d) => a + questStatus(d.date).filter(x => x.done).length, 0) },
  { id: 'log6', em: '\u{1F4D3}', name: 'The Logbook Case', text: 'Log food on 6 days', target: 6, count: days => days.filter(d => d.entries.length).length }
];
// Habit Lab. She picks up to two habits to practice. Auto habits are detected from the journal, the others are a daily tap.
const HABITS = [
  { id: 'fruit-breakfast', em: '\u{1F353}', name: 'Fruit with breakfast', auto: d => d.entries.some(e => e.meal === 'breakfast' && (e.groups || []).indexOf('fruit') >= 0) },
  { id: 'veg-dinner', em: '\u{1F966}', name: 'A veggie at dinner', auto: d => d.entries.some(e => e.meal === 'dinner' && (e.groups || []).indexOf('veg') >= 0) },
  { id: 'water-6', em: '\u{1F4A7}', name: '6 cups of water', auto: d => (d.water || 0) >= 6 },
  { id: 'breakfast-daily', em: '\u{1F305}', name: 'Eat breakfast', auto: d => d.entries.some(e => e.meal === 'breakfast') },
  { id: 'water-meals', em: '\u{1F964}', name: 'Water with every meal', auto: null },
  { id: 'slow-meal', em: '\u{1F422}', name: 'One slow meal, no screens', auto: null },
  { id: 'label-read', em: '\u{1F50D}', name: 'Read the label before a packaged snack', auto: null },
  { id: 'move-30', em: '\u{1F938}', name: 'Move and play for 30 minutes', auto: null },
  { id: 'lights-out', em: '\u{1F319}', name: 'Lights out on time', auto: null },
  { id: 'try-bite', em: '\u{1F445}', name: 'Try one bite of something new', auto: null }
];
// Swap ideas. Curious, no-shame notes that appear on foods with a notable trait, with everyday options to try next time.
const SWAP_FOOTER = 'All foods fit. Everyday foods most of the time, sometimes foods sometimes. This is about discovering options, never about being good or bad.';
const TRAITS = [
  { id: 'sugary-drink', em: '\u{1F964}', label: 'Sweet drink', why: 'Drinks are the sneakiest place for added sugar, and they do not fill you up the way food does.', swaps: ['Water', 'Milk, 2%', 'Sparkling water with a splash of juice', 'Orange'], addon: 'Keep a water bottle next to it.', test: e => isDrink(e) && addedOf(e) >= 10 },
  { id: 'caffeine', em: '☕', label: 'Has caffeine', why: 'Kids under 12 do best without caffeine. It can mess with sleep and make you jittery.', swaps: ['Water', 'Milk, 2%', 'Orange juice, 100%', 'Fruit smoothie (banana, strawberries, milk)'], addon: 'Check the ingredients for green tea or yerba mate extract next time.', test: e => /caffeine|yerba|guarana|green tea|coffee|energy drink|\bcola\b/i.test((e.note || '') + ' ' + e.name) },
  { id: 'added-sugar', em: '\u{1F36C}', label: 'Lots of added sugar', why: 'A sometimes food. Tasty, with a lot of added sugar packed into one serving.', swaps: ['Strawberries', 'Greek yogurt, plain', 'Dark chocolate (70%)', 'Apple'], addon: 'Pair it with a protein, like milk or nuts, for steadier energy.', test: e => !isDrink(e) && addedOf(e) >= 12 },
  { id: 'level3-snack', em: '\u{1F3ED}', label: 'Level 3 snack', why: 'Changed a lot in a factory, with salt, oil, or sugar and not much fiber.', swaps: ['Popcorn, air-popped', 'Almonds', 'Apple', 'String cheese', 'Baby carrots'], addon: 'Add a fruit or veggie next to it.', test: e => e.level === 3 && isSnacky(e) && addedOf(e) < 12 },
  { id: 'fried', em: '\u{1F35F}', label: 'Fried', why: 'Fried foods soak up a lot of oil. Fine sometimes. Baked or grilled is the everyday version.', swaps: ['Sweet potato, baked', 'Chicken breast, grilled', 'Salmon, baked', 'Popcorn, air-popped'], addon: 'Ask for the baked or grilled version when there is one.', test: e => /fries|nuggets|fish sticks/i.test(e.name) },
  { id: 'salty', em: '\u{1F9C2}', label: 'Salty one', why: 'More than a third of a day of sodium in one go.', swaps: ['Chicken breast, grilled', 'Cheese quesadilla', 'Turkey sandwich (whole wheat)', 'Cucumber'], addon: 'Drink water with it and go lighter on salt later today.', test: e => sodiumOf(e) >= 600 },
  { id: 'refined-grain', em: '\u{1F33E}', label: 'White grain', why: 'The fiber got milled out. Whole grains keep your energy steadier.', swaps: ['Whole wheat bread', 'Brown rice, cooked', 'Oatmeal, cooked', "Toasted oat O's cereal"], addon: 'Look for the word whole as the first ingredient.', test: e => /white bread|white rice|corn flakes|bagel|saltine|flour tortilla|toaster pastry|waffle/i.test(e.name) && fiberOf(e) < 1.5 }
];
const HABIT_LEVELS = [{ days: 7, name: 'Bronze', em: '\u{1F949}' }, { days: 14, name: 'Silver', em: '\u{1F948}' }, { days: 21, name: 'Gold', em: '\u{1F947}' }];
const HABIT_GOAL = 21;
const FACTS = [
  'Your brain uses about 20% of your energy, even while you sleep.',
  'A banana is a berry. A strawberry is not. Botanists are funny that way.',
  'Carrots were purple before farmers bred orange ones in the 1600s.',
  'Your stomach makes a new lining every few days so it does not digest itself.',
  'Honey never spoils. Edible honey has been found in ancient Egyptian tombs.',
  'Popcorn pops because a tiny drop of water inside each kernel turns to steam.',
  'Broccoli has more vitamin C per bite than an orange.',
  'The crunch sound of an apple is partly what makes it taste fresh to your brain.',
  'Your body is about 60% water. Your brain is closer to 75%.',
  'Peanuts are not nuts. They grow underground and are cousins of beans.',
  'A single teaspoon of soil can hold more living things than there are people on Earth. Plants grow out of that.',
  'Your taste buds get replaced about every two weeks, so a food you disliked last year might taste different now.',
  'Eggs can stand up on their end a little better on the equinox. Actually, no. That is a myth, and testing myths is what scientists do.',
  'Chewing slowly gives your tummy about 20 minutes to tell your brain it is satisfied.'
];
const BADGES = [
  { id: 'first-bite', em: '\u{1F37D}️', name: 'First Bite', how: 'Log your first food' },
  { id: 'label-reader', em: '\u{1F50D}', name: 'Label Reader', how: 'Finish the Nutrition Facts lesson' },
  { id: 'detective', em: '\u{1F393}', name: 'Academy Graduate', how: 'Finish all 12 lessons' },
  { id: 'quiz-whiz', em: '\u{1F9E0}', name: 'Quiz Whiz', how: 'Score 8 of 8 in the Quiz Arena' },
  { id: 'rainbow', em: '\u{1F308}', name: 'Rainbow Day', how: 'Log a fruit and a veggie on one day' },
  { id: 'high-five', em: '\u{1F590}️', name: 'High Five', how: 'Visit all 5 food groups in one day' },
  { id: 'explorer-10', em: '\u{1F9ED}', name: 'Taste Scout', how: 'Log 10 different foods' },
  { id: 'explorer-25', em: '\u{1F5FA}️', name: 'Master Taster', how: 'Log 25 different foods' },
  { id: 'hydration', em: '\u{1F4A7}', name: 'Hydration Hero', how: 'Log 6 cups of water in a day' },
  { id: 'streak-3', em: '\u{1F525}', name: '3-Day Streak', how: 'Log food 3 days in a row' },
  { id: 'streak-7', em: '⭐', name: '7-Day Streak', how: 'Log food 7 days in a row' },
  { id: 'energy-5', em: '⚡', name: 'Energy Scientist', how: 'Do 5 energy check-ins' },
  { id: 'breakfast-5', em: '\u{1F305}', name: 'Breakfast Club', how: 'Log breakfast on 5 days' },
  { id: 'swap-star', em: '\u{1F504}', name: 'Swap Star', how: 'Try swap ideas on 5 days' },
  { id: 'scanner', em: '\u{1F4F7}', name: 'Barcode Buster', how: 'Add 5 foods by scanning or snapping' }
];
