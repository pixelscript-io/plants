/**
 * Hand-curated soil amendments and the plants they are commonly used for.
 *
 * `effect` explains what the amendment does for that plant, and where
 * relevant when NOT to use it. Unverified; review before publishing.
 */

export interface SeedAmendment {
  slug: string
  name: string
  description: string
  /** plant slug -> effect text */
  plants: Record<string, string>
}

export const amendments: SeedAmendment[] = [
  {
    slug: 'coffee-grounds',
    name: 'Coffee grounds',
    description:
      'Used grounds add organic matter and some nitrogen. Best composted or worked in thinly; thick layers can compact and repel water. Fresh grounds are only mildly acidic.',
    plants: {
      hydrangea:
        'Helps keep soil acidic, which favors blue flowers on bigleaf hydrangea. The effect is modest and depends on soil aluminum; do not expect pink flowers to turn blue from grounds alone.',
      blueberry: 'Supports acidic soil and adds organic matter; blueberries need a pH of 4.5 to 5.5.',
      azalea: 'Supports acidic soil and adds organic matter for acid-loving shrubs.',
      rose: 'Compost them in first; the organic matter and slow nitrogen suit roses.',
    },
  },
  {
    slug: 'eggshells',
    name: 'Crushed eggshells',
    description:
      'Calcium carbonate. Shells must be finely ground to break down; whole shells take years. Slow to act, so mix into soil well before planting.',
    plants: {
      tomato:
        'Added calcium may reduce blossom end rot, but rot is usually caused by uneven watering rather than a lack of calcium in soil. Treat eggshells as a slow supplement, not a cure.',
      'bell-pepper': 'Slow calcium source; blossom end rot in peppers is usually a watering problem.',
      eggplant: 'Slow calcium source for fruiting nightshades.',
      zucchini: 'Slow calcium source; blossom end rot can also affect squash.',
      broccoli: 'Calcium supports cell walls in brassicas; also raises pH slightly.',
    },
  },
  {
    slug: 'compost',
    name: 'Finished compost',
    description:
      'Fully decomposed organic matter. Improves structure, water holding and microbial life in nearly any soil. Dig in 2 to 5 cm before planting or use as a top dressing.',
    plants: {
      tomato: 'Heavy feeder; compost gives steady nutrients and holds moisture.',
      'bell-pepper': 'Heavy feeder; compost supports steady growth.',
      zucchini: 'Heavy feeder that benefits from a rich, moisture-holding bed.',
      pumpkin: 'Heavy feeder; mix compost into the planting hill.',
      'sweet-corn': 'Heavy feeder; compost supplies nitrogen over the season.',
      cabbage: 'Heavy feeder; benefits from rich soil.',
      broccoli: 'Heavy feeder; benefits from rich soil.',
      lettuce: 'Fine, crumbly compost helps shallow lettuce roots.',
      strawberry: 'Top dress after harvest to feed next year\'s crown growth.',
      rose: 'Mulch with compost each spring.',
    },
  },
  {
    slug: 'aged-manure',
    name: 'Aged manure',
    description:
      'Well-rotted animal manure (at least 6 months; never fresh). Adds nutrients and organic matter. Fresh manure can burn plants and carry pathogens, so keep it away from crops eaten raw within 90 to 120 days of harvest.',
    plants: {
      'sweet-corn': 'Nitrogen-hungry; work aged manure in before planting.',
      pumpkin: 'Heavy feeder that thrives in manure-enriched hills.',
      zucchini: 'Heavy feeder that thrives in manure-enriched beds.',
      cabbage: 'Heavy feeder; apply before planting.',
      carrot: 'Avoid: fresh or high-nitrogen manure can make carrots fork and hairy.',
      potato: 'Use only well-rotted manure; fresh manure can increase scab.',
    },
  },
  {
    slug: 'wood-ash',
    name: 'Wood ash',
    description:
      'Adds potassium and raises soil pH, acting like a fast, weak lime. Use sparingly (a light dusting) and test soil pH first. Only use ash from untreated wood.',
    plants: {
      tomato: 'Adds potassium, which supports fruiting, if soil pH is not already high.',
      lilac: 'Likes neutral to alkaline soil, so a light dusting is useful on acidic soils.',
      asparagus: 'Prefers pH above 6.5; a light dusting helps on acidic soil.',
      potato: 'Avoid: raising pH encourages common scab.',
      blueberry: 'Avoid: blueberries need acidic soil and ash raises pH.',
      hydrangea: 'Avoid on blue-flowered hydrangeas: raising pH turns blooms pink.',
      azalea: 'Avoid: azaleas need acidic soil.',
    },
  },
  {
    slug: 'elemental-sulfur',
    name: 'Elemental sulfur',
    description:
      'Slowly lowers soil pH as soil bacteria convert it to sulfuric acid. Takes months, so apply well ahead of planting. Test pH first and follow the label rate.',
    plants: {
      blueberry: 'Lowers pH toward the 4.5 to 5.5 blueberries need.',
      azalea: 'Lowers pH for acid-loving shrubs.',
      hydrangea: 'Lowering pH and freeing aluminum encourages blue blooms on bigleaf hydrangea.',
      cranberry: 'Cranberries need a pH of 4 to 5.5.',
    },
  },
  {
    slug: 'garden-lime',
    name: 'Garden lime',
    description:
      'Ground limestone raises soil pH and adds calcium (dolomitic lime also adds magnesium). Slow to act: apply in fall or several months before planting, based on a soil test.',
    plants: {
      cabbage: 'Raising pH to about 7 helps prevent clubroot in brassicas.',
      broccoli: 'Raising pH to about 7 helps prevent clubroot.',
      spinach: 'Prefers pH of 6.5 to 7.5; lime helps on acidic soil.',
      asparagus: 'Prefers pH of 6.5 to 7.5.',
      lilac: 'Prefers neutral to alkaline soil.',
      peony: 'Prefers a pH of 6.5 to 7.',
      potato: 'Avoid: higher pH encourages scab.',
    },
  },
  {
    slug: 'bone-meal',
    name: 'Bone meal',
    description:
      'A slow-release source of phosphorus and calcium. Best mixed into the planting hole; avoid if soil phosphorus is already high.',
    plants: {
      tulip: 'Phosphorus supports bulb and root development; mix into the planting hole.',
      daffodil: 'Phosphorus supports bulb and root development.',
      garlic: 'Phosphorus supports bulb size; mix in at fall planting.',
      onion: 'Phosphorus supports bulb and root development.',
      tomato: 'Phosphorus and calcium for flowering and fruiting; use in low-phosphorus soil.',
    },
  },
  {
    slug: 'blood-meal',
    name: 'Blood meal',
    description:
      'A fast nitrogen source (about 12 percent). Easily burns plants if over-applied, so use light side dressings. Raises acidity slightly over time.',
    plants: {
      spinach: 'Boosts leafy growth; use a light side dressing.',
      kale: 'Boosts leafy growth in nitrogen-hungry brassicas.',
      lettuce: 'Boosts leafy growth; use a light dressing.',
      'sweet-corn': 'Nitrogen-hungry; side dress when plants are knee high.',
      cabbage: 'Supports leaf and head growth.',
      tomato: 'Avoid heavy use: too much nitrogen gives leaves instead of fruit.',
    },
  },
  {
    slug: 'epsom-salt',
    name: 'Epsom salt',
    description:
      'Magnesium sulfate. Helps only where soil is magnesium deficient (yellowing between leaf veins); unnecessary and not helpful in soils that already have enough.',
    plants: {
      tomato: 'May correct magnesium deficiency; apply only if leaves yellow between the veins.',
      'bell-pepper': 'May correct magnesium deficiency, if present.',
      rose: 'May help in magnesium-poor soil.',
    },
  },
  {
    slug: 'worm-castings',
    name: 'Worm castings',
    description:
      'Mild, balanced, ready-to-use fertilizer. Safe near seedlings and roots and will not burn. Mix into potting mix or top dress.',
    plants: {
      tomato: 'Mix into the planting hole or top dress monthly.',
      basil: 'Gentle feeding for leafy herbs.',
      lettuce: 'Gentle feeding that will not burn shallow roots.',
      'bell-pepper': 'Mix into the planting hole.',
      strawberry: 'Top dress in spring.',
    },
  },
  {
    slug: 'fish-emulsion',
    name: 'Fish emulsion',
    description:
      'A liquid fertilizer high in nitrogen (often 5-1-1), diluted and watered on every 2 to 4 weeks. Smells strong but breaks down quickly.',
    plants: {
      lettuce: 'Quick nitrogen for leafy growth.',
      kale: 'Quick nitrogen for leafy growth.',
      spinach: 'Quick nitrogen for leafy growth.',
      basil: 'Quick nitrogen for leafy growth; reduces flower formation by keeping plants vegetative.',
      'sweet-corn': 'Nitrogen boost for tall, hungry plants.',
    },
  },
  {
    slug: 'kelp-meal',
    name: 'Kelp meal',
    description:
      'Seaweed provides potassium and trace minerals. Mixed into soil or used as a liquid. Low in nitrogen and phosphorus, so it supplements other fertilizers.',
    plants: {
      tomato: 'Trace minerals and potassium for fruiting.',
      'bell-pepper': 'Trace minerals and potassium for fruiting.',
      strawberry: 'Potassium supports fruit quality.',
      potato: 'Potassium supports tuber development.',
    },
  },
  {
    slug: 'pine-needle-mulch',
    name: 'Pine needle mulch',
    description:
      'Needles are an airy, slow-decomposing mulch. They have little effect on soil pH, despite the common belief, but their loose structure suits acid-loving plants and keeps fruit clean.',
    plants: {
      blueberry: 'Light, airy mulch that suits shallow-rooted blueberries.',
      strawberry: 'Keeps fruit off the soil and clean.',
      azalea: 'Light mulch that suits shallow-rooted shrubs.',
    },
  },
  {
    slug: 'leaf-mold',
    name: 'Leaf mold',
    description:
      'Shredded leaves left to break down for 1 to 2 years. Excellent at holding moisture and improving soil structure, with few nutrients.',
    plants: {
      hosta: 'Mimics the woodland floor hostas grow on.',
      foxglove: 'Mimics woodland conditions and holds moisture.',
      hydrangea: 'Holds moisture for thirsty shrubs.',
      azalea: 'Mulch with leaf mold to keep roots cool and moist.',
    },
  },
  {
    slug: 'straw-mulch',
    name: 'Straw mulch',
    description:
      'Clean straw (not hay, which carries weed seed) insulates soil, suppresses weeds and keeps moisture in. Pull back in spring to let soil warm.',
    plants: {
      strawberry: 'Keeps fruit clean and gives the crown winter protection.',
      garlic: 'Mulch after fall planting to protect through winter.',
      potato: 'Mulch over seed potatoes instead of hilling; also eases harvest.',
      tomato: 'Reduces soil splash that carries blight spores to leaves.',
    },
  },
  {
    slug: 'coarse-sand-grit',
    name: 'Coarse sand or grit',
    description:
      'Improves drainage in heavy soils and containers. Use coarse horticultural grit, not fine builders or play sand, which can make clay set harder.',
    plants: {
      lavender: 'Needs sharply drained, lean soil; wet roots kill it.',
      rosemary: 'Needs sharply drained soil, especially in winter.',
      thyme: 'Needs sharply drained soil.',
      sage: 'Needs sharply drained soil.',
      carrot: 'Loosens heavy soil so roots can grow straight.',
    },
  },
]
