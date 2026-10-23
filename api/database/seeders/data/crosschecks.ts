/**
 * Plants whose planting windows and days to harvest were cross-checked against
 * published university extension guides on 2026-10-22. "Cross-checked" means
 * the curated values were compared with the guide and corrected where they
 * differed; the values are our own curation, not copied from the guides.
 *
 * Plants not listed here have not been checked against an outside source.
 */

export const CROSSCHECK_DATE = '2026-10-22'

/** Plants checked on a later day than the first batch. */
export const CROSSCHECK_DATE_BY_PLANT: Record<string, string> = {
  'lima-bean': '2026-10-23',
  scallion: '2026-10-23',
  'napa-cabbage': '2026-10-23',
  'daikon-radish': '2026-10-23',
  'acorn-squash': '2026-10-23',
  celosia: '2026-10-23',
  ageratum: '2026-10-23',
  'globe-amaranth': '2026-10-23',
}

export const SOURCES = {
  harvestToTable:
    'Harvest to Table, "When to Seed Start Annual Flowers" (a gardening publisher, not an extension service; weeks before last frost only)',
  msu: 'Montana State University Extension, MontGuide MT199308AG, "Can I Grow That Here? Vegetable Seed and Transplant Schedules"',
  unh: 'UNH Cooperative Extension, "Growing Vegetables: When to Plant Your Vegetable Garden" (2016)',
  herbs:
    'University extension herb and seed-starting guides (University of Minnesota, West Virginia University, University of Maryland, Utah State)',
  sorrel: 'University of Minnesota Extension, "Growing sorrel in home gardens"',
  lemonBalm: 'Utah State University Extension, "How to Grow Lemon Balm in Your Garden"',
  jerusalemArtichoke: 'Ohio State University Extension, factsheet ANR-0167, and other university extension guides',
  radicchio: 'University of Minnesota Extension and UC Davis Postharvest Center (days to maturity only)',
} as const

type Source = keyof typeof SOURCES

export const crosschecks: Record<string, Source[]> = {
  // Vegetables checked against both tables
  tomato: ['msu', 'unh'],
  'bell-pepper': ['msu', 'unh'],
  'chili-pepper': ['msu', 'unh'],
  eggplant: ['msu', 'unh'],
  potato: ['msu', 'unh'],
  pumpkin: ['msu', 'unh'],
  zucchini: ['msu', 'unh'],
  'butternut-squash': ['msu', 'unh'],
  'bush-bean': ['msu', 'unh'],
  cucumber: ['msu', 'unh'],
  'sweet-potato': ['unh'],
  parsley: ['unh'],
  basil: ['unh'],
  rutabaga: ['msu', 'unh'],

  // Vegetables checked against the Montana State table
  beet: ['msu'],
  broccoli: ['msu'],
  'brussels-sprouts': ['msu'],
  cabbage: ['msu'],
  carrot: ['msu'],
  cauliflower: ['msu'],
  celery: ['msu'],
  'swiss-chard': ['msu'],
  'collard-greens': ['msu'],
  'sweet-corn': ['msu'],
  kale: ['msu'],
  kohlrabi: ['msu'],
  lettuce: ['msu'],
  cantaloupe: ['msu'],
  okra: ['msu'],
  onion: ['msu'],
  parsnip: ['msu'],
  pea: ['msu'],
  radish: ['msu'],
  spinach: ['msu'],

  // Herbs and others
  thyme: ['herbs'],
  sage: ['herbs'],
  oregano: ['herbs'],
  marjoram: ['herbs'],
  chives: ['herbs'],
  'lemon-balm': ['lemonBalm'],
  sorrel: ['sorrel'],
  'jerusalem-artichoke': ['jerusalemArtichoke'],
  radicchio: ['radicchio'],
  // Checked 2026-10-23 against the MSU table. Napa cabbage uses its "Chinese cabbage" row,
  // scallion and daikon the onion and radish rows (windows only), acorn squash the winter squash row.
  'lima-bean': ['msu'],
  scallion: ['msu'],
  'napa-cabbage': ['msu'],
  'daikon-radish': ['msu'],
  'acorn-squash': ['msu'],
  celosia: ['harvestToTable'],
  ageratum: ['harvestToTable'],
  'globe-amaranth': ['harvestToTable'],
}
