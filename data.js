export const OFFICIAL_RECIPES = [
  {
    id: "off-ice-beast",
    kind: "official",
    name: "Ice Beast",
    price: 2.99,
    tags: ["ice", "beast", "mini"],
    preview: "A frosty snack that crunches like a beast.",
    need: ["yogurt", "berries", "honey", "popsicle molds", "sprinkles (optional)"],
    stepsLocked: [
      "Mix 1 cup yogurt with 2 tbsp honey in a bowl.",
      "Stir in 1/2 cup chopped berries.",
      "Spoon into popsicle molds.",
      "Freeze 3–4 hours.",
      "Unleash the Ice Beast: add sprinkles and ROAR."
    ],
    keywords: ["7 millimeters", "7mm", "millimeters", "ice beast", "ice", "beast", "mini"]
  },
  {
    id: "off-crumbzilla",
    kind: "official",
    name: "Crumbzilla Bars",
    price: 2.99,
    tags: ["snack", "crunchy"],
    preview: "Crunchy bars of doom (but actually yummy).",
    need: ["cereal", "peanut butter (or sunflower butter)", "honey", "chocolate chips"],
    stepsLocked: [
      "Warm 1/2 cup peanut butter with 1/3 cup honey (adult help).",
      "Stir in 3 cups cereal until coated.",
      "Press into a pan and sprinkle chocolate chips on top.",
      "Chill 30 minutes, then cut into bars.",
      "Bonus: crush extra cereal on top for MAX CRUNCH."
    ],
    keywords: ["crumbzilla", "crumb", "bars", "crunchy", "snack"]
  },
  {
    id: "off-mega-smoothie",
    kind: "official",
    name: "Mega Smoothie Beast",
    price: 2.99,
    tags: ["drink", "mega"],
    preview: "Big drink for big teams. Slurp power activated.",
    need: ["bananas", "milk", "ice", "strawberries", "honey"],
    stepsLocked: [
      "Add 2 bananas, 1 cup strawberries, 1 cup milk, and 1 cup ice to a blender.",
      "Blend until smooth.",
      "Taste and add honey if you want it sweeter.",
      "Pour into cups.",
      "Mega move: top with fruit ‘fangs’ (sliced strawberries)."
    ],
    keywords: ["mega", "smoothie", "beast", "drink"]
  },
  {
    id: "off-pixel-pudding",
    kind: "official",
    name: "Pixel Pudding",
    price: 2.99,
    tags: ["sweet", "tiny"],
    preview: "Tiny pudding. Huge power. Add ‘pixels’ on top.",
    need: ["pudding", "whipped cream", "cookies", "sprinkles"],
    stepsLocked: [
      "Spoon pudding into small cups.",
      "Add whipped cream.",
      "Sprinkle crushed cookies like ‘pixel dust’.",
      "Top with sprinkles.",
      "Eat one ‘pixel’ at a time (or… not)."
    ],
    keywords: ["pixel", "pixels", "tiny", "sweet"]
  }
];

export const PACKS = [
  { id: "pack-ice", name: "Ice Pack (10 recipes)", price: 6.99, includes: ["Ice Beast", "Blizzard Bites", "Rainbow Freeze Stack"] },
  { id: "pack-snack", name: "Snack Pack (10 recipes)", price: 6.99, includes: ["Crumbzilla Bars", "Snackasaurus Mix", "Choco Roar Cookies"] },
  { id: "pack-mega", name: "Mega Pack (10 recipes)", price: 6.99, includes: ["Mega Smoothie Beast", "Mega Trail Mix", "Gigantic Nachos"] }
];

export const TRENDING = ["7 millimeters", "ice beast", "crumbzilla", "mega smoothie", "pixel pudding"];
