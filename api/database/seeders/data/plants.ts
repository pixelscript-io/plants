/**
 * Hand-curated starter set of common garden plants.
 *
 * Values are approximate, drawn from general horticultural knowledge and are
 * NOT yet verified against an authoritative source. Seeded rows stay
 * unpublished until reviewed.
 *
 * Units: spacing/height in cm, days for germination/harvest (days from sowing
 * or transplant to first harvest), planting windows in weeks relative to the
 * average last spring frost (negative = before). `zones` is USDA hardiness
 * range and is only given for perennials.
 */

export type PlantType = 'vegetable' | 'herb' | 'fruit' | 'flower' | 'shrub' | 'tree'
export type LifeCycle = 'annual' | 'biennial' | 'perennial'
export type Range = [number, number]

export interface SeedPlant {
  name: string
  sci: string
  type: PlantType
  life: LifeCycle
  sun: 'full' | 'partial' | 'shade'
  water: 'low' | 'medium' | 'high'
  /** Typical days between waterings in average conditions. */
  wi?: number
  ph?: Range
  zones?: Range
  frost?: 'tender' | 'half_hardy' | 'hardy'
  germ?: Range
  harvest?: Range
  spacing?: number
  height?: number
  indoors?: Range
  direct?: Range
  transplant?: Range
  aka?: string[]
}

const p = (
  name: string,
  sci: string,
  type: PlantType,
  life: LifeCycle,
  sun: SeedPlant['sun'],
  water: SeedPlant['water'],
  rest: Partial<SeedPlant> = {}
): SeedPlant => ({ name, sci, type, life, sun, water, ...rest })

export const plants: SeedPlant[] = [
  // ---- Vegetables ----
  p('Tomato', 'Solanum lycopersicum', 'vegetable', 'annual', 'full', 'medium', { wi: 3, ph: [6, 6.8], frost: 'tender', germ: [5, 10], harvest: [60, 85], spacing: 60, height: 150, indoors: [-8, -6], transplant: [1, 2], aka: ['Love apple'] }),
  p('Bell Pepper', 'Capsicum annuum', 'vegetable', 'annual', 'full', 'medium', { wi: 3, ph: [6, 6.8], frost: 'tender', germ: [7, 14], harvest: [60, 90], spacing: 45, height: 75, indoors: [-8, -6], transplant: [2, 3], aka: ['Sweet pepper'] }),
  p('Chili Pepper', 'Capsicum annuum', 'vegetable', 'annual', 'full', 'medium', { wi: 3, ph: [6, 6.8], frost: 'tender', germ: [7, 14], harvest: [70, 100], spacing: 45, height: 90, indoors: [-8, -6], transplant: [2, 3], aka: ['Hot pepper'] }),
  p('Eggplant', 'Solanum melongena', 'vegetable', 'annual', 'full', 'medium', { wi: 3, ph: [6, 6.8], frost: 'tender', germ: [7, 14], harvest: [65, 85], spacing: 60, height: 90, indoors: [-8, -6], transplant: [2, 3], aka: ['Aubergine'] }),
  p('Potato', 'Solanum tuberosum', 'vegetable', 'annual', 'full', 'medium', { wi: 4, ph: [5, 6.5], frost: 'half_hardy', germ: [14, 21], harvest: [70, 120], spacing: 30, height: 60, direct: [-2, 0] }),
  p('Tomatillo', 'Physalis philadelphica', 'vegetable', 'annual', 'full', 'medium', { wi: 3, ph: [6, 7], frost: 'tender', germ: [7, 14], harvest: [75, 100], spacing: 60, height: 120, indoors: [-6, -4], transplant: [1, 2] }),
  p('Cucumber', 'Cucumis sativus', 'vegetable', 'annual', 'full', 'high', { wi: 2, ph: [6, 7], frost: 'tender', germ: [3, 10], harvest: [50, 70], spacing: 45, height: 180, direct: [1, 3], indoors: [-3, -2] }),
  p('Zucchini', 'Cucurbita pepo', 'vegetable', 'annual', 'full', 'high', { wi: 2, ph: [6, 7], frost: 'tender', germ: [5, 10], harvest: [45, 60], spacing: 90, height: 60, direct: [1, 3], aka: ['Courgette', 'Summer squash'] }),
  p('Pumpkin', 'Cucurbita pepo', 'vegetable', 'annual', 'full', 'medium', { wi: 3, ph: [6, 6.8], frost: 'tender', germ: [5, 10], harvest: [90, 120], spacing: 120, height: 40, direct: [1, 3] }),
  p('Butternut Squash', 'Cucurbita moschata', 'vegetable', 'annual', 'full', 'medium', { wi: 3, ph: [6, 6.8], frost: 'tender', germ: [5, 10], harvest: [90, 110], spacing: 90, height: 40, direct: [1, 3], aka: ['Winter squash'] }),
  p('Watermelon', 'Citrullus lanatus', 'vegetable', 'annual', 'full', 'medium', { wi: 3, ph: [6, 6.8], frost: 'tender', germ: [4, 10], harvest: [80, 100], spacing: 120, height: 30, direct: [2, 3], indoors: [-3, -2] }),
  p('Cantaloupe', 'Cucumis melo', 'vegetable', 'annual', 'full', 'medium', { wi: 3, ph: [6, 6.8], frost: 'tender', germ: [4, 10], harvest: [80, 100], spacing: 90, height: 30, direct: [2, 3], indoors: [-3, -2], aka: ['Muskmelon', 'Melon'] }),
  p('Bush Bean', 'Phaseolus vulgaris', 'vegetable', 'annual', 'full', 'medium', { wi: 3, ph: [6, 7], frost: 'tender', germ: [6, 10], harvest: [50, 65], spacing: 10, height: 45, direct: [1, 2], aka: ['Green bean', 'Snap bean'] }),
  p('Pole Bean', 'Phaseolus vulgaris', 'vegetable', 'annual', 'full', 'medium', { wi: 3, ph: [6, 7], frost: 'tender', germ: [6, 10], harvest: [60, 80], spacing: 15, height: 200, direct: [1, 2] }),
  p('Runner Bean', 'Phaseolus coccineus', 'vegetable', 'annual', 'full', 'medium', { wi: 3, ph: [6, 7], frost: 'tender', germ: [7, 12], harvest: [60, 90], spacing: 20, height: 250, direct: [1, 2] }),
  p('Pea', 'Pisum sativum', 'vegetable', 'annual', 'full', 'medium', { wi: 3, ph: [6, 7.5], frost: 'hardy', germ: [7, 14], harvest: [55, 90], spacing: 5, height: 150, direct: [-6, 2], aka: ['Garden pea', 'Snap pea'] }),
  p('Soybean', 'Glycine max', 'vegetable', 'annual', 'full', 'medium', { wi: 4, ph: [6, 7], frost: 'tender', germ: [5, 10], harvest: [75, 100], spacing: 8, height: 75, direct: [1, 3], aka: ['Edamame'] }),
  p('Peanut', 'Arachis hypogaea', 'vegetable', 'annual', 'full', 'medium', { wi: 4, ph: [5.9, 7], frost: 'tender', germ: [7, 14], harvest: [120, 150], spacing: 15, height: 45, direct: [2, 4] }),
  p('Carrot', 'Daucus carota', 'vegetable', 'biennial', 'full', 'medium', { wi: 3, ph: [6, 6.8], frost: 'half_hardy', germ: [10, 21], harvest: [60, 80], spacing: 5, height: 30, direct: [-4, 0] }),
  p('Beet', 'Beta vulgaris', 'vegetable', 'biennial', 'full', 'medium', { wi: 3, ph: [6, 7], frost: 'half_hardy', germ: [5, 10], harvest: [50, 80], spacing: 10, height: 40, direct: [-4, 0], aka: ['Beetroot'] }),
  p('Radish', 'Raphanus sativus', 'vegetable', 'annual', 'full', 'medium', { wi: 2, ph: [6, 7], frost: 'hardy', germ: [3, 7], harvest: [25, 30], spacing: 5, height: 25, direct: [-6, 0] }),
  p('Turnip', 'Brassica rapa', 'vegetable', 'biennial', 'full', 'medium', { wi: 3, ph: [6, 7], frost: 'hardy', germ: [5, 10], harvest: [40, 60], spacing: 10, height: 30, direct: [-6, 0] }),
  p('Rutabaga', 'Brassica napus', 'vegetable', 'biennial', 'full', 'medium', { wi: 3, ph: [6, 7], frost: 'hardy', germ: [5, 10], harvest: [90, 110], spacing: 20, height: 40, direct: [2, 7], aka: ['Swede'] }),
  p('Parsnip', 'Pastinaca sativa', 'vegetable', 'biennial', 'full', 'medium', { wi: 3, ph: [6, 7], frost: 'hardy', germ: [14, 28], harvest: [100, 130], spacing: 8, height: 45, direct: [-4, 2] }),
  p('Onion', 'Allium cepa', 'vegetable', 'biennial', 'full', 'medium', { wi: 4, ph: [6, 7], frost: 'hardy', germ: [7, 14], harvest: [90, 120], spacing: 10, height: 45, indoors: [-10, -8], transplant: [-4, -2] }),
  p('Garlic', 'Allium sativum', 'vegetable', 'perennial', 'full', 'low', { wi: 7, ph: [6, 7], zones: [3, 9], frost: 'hardy', harvest: [240, 270], spacing: 15, height: 60 }),
  p('Leek', 'Allium porrum', 'vegetable', 'biennial', 'full', 'medium', { wi: 4, ph: [6, 7], frost: 'hardy', germ: [7, 14], harvest: [100, 120], spacing: 15, height: 60, indoors: [-10, -8], transplant: [-4, -2] }),
  p('Lettuce', 'Lactuca sativa', 'vegetable', 'annual', 'partial', 'high', { wi: 2, ph: [6, 7], frost: 'half_hardy', germ: [2, 8], harvest: [45, 60], spacing: 20, height: 25, direct: [-4, 0] }),
  p('Spinach', 'Spinacia oleracea', 'vegetable', 'annual', 'partial', 'medium', { wi: 3, ph: [6.5, 7.5], frost: 'hardy', germ: [5, 10], harvest: [40, 60], spacing: 10, height: 20, direct: [-6, -2] }),
  p('Kale', 'Brassica oleracea', 'vegetable', 'biennial', 'full', 'medium', { wi: 3, ph: [6, 7.5], frost: 'hardy', germ: [5, 10], harvest: [55, 75], spacing: 45, height: 60, indoors: [-8, -6], direct: [-4, 0], transplant: [-4, -2] }),
  p('Collard Greens', 'Brassica oleracea', 'vegetable', 'biennial', 'full', 'medium', { wi: 3, ph: [6, 7.5], frost: 'hardy', germ: [5, 10], harvest: [60, 80], spacing: 45, height: 90, direct: [-4, 0] }),
  p('Cabbage', 'Brassica oleracea', 'vegetable', 'biennial', 'full', 'medium', { wi: 3, ph: [6, 7.5], frost: 'hardy', germ: [5, 10], harvest: [60, 90], spacing: 45, height: 30, indoors: [-8, -6], transplant: [-4, -2] }),
  p('Broccoli', 'Brassica oleracea', 'vegetable', 'biennial', 'full', 'medium', { wi: 3, ph: [6, 7], frost: 'hardy', germ: [5, 10], harvest: [60, 90], spacing: 45, height: 60, indoors: [-8, -6], transplant: [-4, -2] }),
  p('Cauliflower', 'Brassica oleracea', 'vegetable', 'biennial', 'full', 'medium', { wi: 3, ph: [6, 7], frost: 'half_hardy', germ: [5, 10], harvest: [50, 95], spacing: 50, height: 60, indoors: [-8, -6], transplant: [-2, 0] }),
  p('Brussels Sprouts', 'Brassica oleracea', 'vegetable', 'biennial', 'full', 'medium', { wi: 3, ph: [6, 7], frost: 'hardy', germ: [5, 10], harvest: [80, 100], spacing: 60, height: 90, indoors: [-8, -6], transplant: [-4, -2] }),
  p('Kohlrabi', 'Brassica oleracea', 'vegetable', 'biennial', 'full', 'medium', { wi: 3, ph: [6, 7], frost: 'hardy', germ: [5, 10], harvest: [45, 60], spacing: 15, height: 30, direct: [-4, 0] }),
  p('Bok Choy', 'Brassica rapa', 'vegetable', 'annual', 'partial', 'high', { wi: 2, ph: [6, 7], frost: 'hardy', germ: [4, 7], harvest: [45, 55], spacing: 20, height: 30, direct: [-4, 0], aka: ['Pak choi'] }),
  p('Mustard Greens', 'Brassica juncea', 'vegetable', 'annual', 'full', 'medium', { wi: 3, ph: [6, 7], frost: 'hardy', germ: [3, 7], harvest: [30, 45], spacing: 15, height: 40, direct: [-4, 0] }),
  p('Arugula', 'Eruca vesicaria', 'vegetable', 'annual', 'partial', 'medium', { wi: 2, ph: [6, 7], frost: 'hardy', germ: [3, 7], harvest: [30, 40], spacing: 10, height: 30, direct: [-4, 0], aka: ['Rocket'] }),
  p('Swiss Chard', 'Beta vulgaris', 'vegetable', 'biennial', 'full', 'medium', { wi: 3, ph: [6, 7], frost: 'half_hardy', germ: [5, 10], harvest: [50, 60], spacing: 20, height: 50, direct: [-4, 0] }),
  p('Endive', 'Cichorium endivia', 'vegetable', 'annual', 'full', 'medium', { wi: 3, ph: [6, 7], frost: 'half_hardy', germ: [5, 10], harvest: [85, 100], spacing: 25, height: 30, direct: [-2, 2], aka: ['Escarole'] }),
  p('Radicchio', 'Cichorium intybus', 'vegetable', 'perennial', 'full', 'medium', { wi: 3, ph: [6, 7], zones: [3, 9], frost: 'hardy', germ: [5, 10], harvest: [75, 90], spacing: 25, height: 30 }),
  p('Celery', 'Apium graveolens', 'vegetable', 'biennial', 'partial', 'high', { wi: 2, ph: [6, 7], frost: 'half_hardy', germ: [10, 21], harvest: [100, 130], spacing: 20, height: 60, indoors: [-12, -10], transplant: [-2, 0] }),
  p('Sweet Corn', 'Zea mays', 'vegetable', 'annual', 'full', 'medium', { wi: 3, ph: [5.8, 7], frost: 'tender', germ: [5, 10], harvest: [60, 100], spacing: 30, height: 200, direct: [1, 2], aka: ['Corn', 'Maize'] }),
  p('Sweet Potato', 'Ipomoea batatas', 'vegetable', 'perennial', 'full', 'medium', { wi: 4, ph: [5.5, 6.5], zones: [9, 11], frost: 'tender', harvest: [90, 120], spacing: 30, height: 30, transplant: [1, 3] }),
  p('Okra', 'Abelmoschus esculentus', 'vegetable', 'annual', 'full', 'medium', { wi: 4, ph: [6, 7], frost: 'tender', germ: [5, 10], harvest: [50, 65], spacing: 30, height: 150, direct: [2, 3] }),
  p('Asparagus', 'Asparagus officinalis', 'vegetable', 'perennial', 'full', 'medium', { wi: 5, ph: [6.5, 7.5], zones: [3, 8], frost: 'hardy', spacing: 30, height: 150 }),
  p('Rhubarb', 'Rheum rhabarbarum', 'vegetable', 'perennial', 'full', 'medium', { wi: 4, ph: [6, 6.8], zones: [3, 8], frost: 'hardy', spacing: 90, height: 90 }),
  p('Globe Artichoke', 'Cynara cardunculus', 'vegetable', 'perennial', 'full', 'medium', { wi: 4, ph: [6.5, 7.5], zones: [7, 11], frost: 'half_hardy', spacing: 90, height: 120 }),
  p('Jerusalem Artichoke', 'Helianthus tuberosus', 'vegetable', 'perennial', 'full', 'low', { wi: 7, ph: [6, 7.5], zones: [3, 9], frost: 'hardy', harvest: [120, 150], direct: [-2, 2], spacing: 40, height: 250, aka: ['Sunchoke'] }),
  p('Horseradish', 'Armoracia rusticana', 'vegetable', 'perennial', 'full', 'medium', { wi: 5, ph: [6, 7], zones: [3, 9], frost: 'hardy', spacing: 45, height: 90 }),

  // ---- Herbs ----
  p('Basil', 'Ocimum basilicum', 'herb', 'annual', 'full', 'medium', { wi: 2, ph: [6, 7], frost: 'tender', germ: [5, 10], harvest: [25, 40], spacing: 25, height: 50, indoors: [-6, -4], transplant: [1, 2], aka: ['Sweet basil'] }),
  p('Spearmint', 'Mentha spicata', 'herb', 'perennial', 'partial', 'high', { wi: 2, ph: [6, 7], zones: [3, 8], frost: 'hardy', harvest: [60, 90], transplant: [0, 2], spacing: 45, height: 60, aka: ['Mint'] }),
  p('Peppermint', 'Mentha piperita', 'herb', 'perennial', 'partial', 'high', { wi: 2, ph: [6, 7], zones: [3, 8], frost: 'hardy', harvest: [60, 90], transplant: [0, 2], spacing: 45, height: 70 }),
  p('Parsley', 'Petroselinum crispum', 'herb', 'biennial', 'partial', 'medium', { wi: 3, ph: [6, 7], frost: 'hardy', germ: [14, 28], harvest: [70, 90], transplant: [-3, -1], spacing: 20, height: 40, indoors: [-12, -10], direct: [-4, 0] }),
  p('Cilantro', 'Coriandrum sativum', 'herb', 'annual', 'partial', 'medium', { wi: 3, ph: [6, 7], frost: 'half_hardy', germ: [7, 10], harvest: [45, 70], spacing: 15, height: 50, direct: [-2, 2], aka: ['Coriander'] }),
  p('Dill', 'Anethum graveolens', 'herb', 'annual', 'full', 'medium', { wi: 3, ph: [5.5, 6.5], frost: 'half_hardy', germ: [7, 14], harvest: [40, 60], spacing: 20, height: 100, direct: [-2, 2] }),
  p('Chives', 'Allium schoenoprasum', 'herb', 'perennial', 'full', 'medium', { wi: 3, ph: [6, 7], zones: [3, 9], frost: 'hardy', germ: [7, 14], harvest: [60, 90], indoors: [-8, -6], transplant: [0, 2], spacing: 20, height: 40 }),
  p('Thyme', 'Thymus vulgaris', 'herb', 'perennial', 'full', 'low', { wi: 7, ph: [6, 8], zones: [5, 9], frost: 'hardy', germ: [14, 28], harvest: [60, 90], indoors: [-10, -8], transplant: [0, 2], spacing: 25, height: 25 }),
  p('Rosemary', 'Rosmarinus officinalis', 'herb', 'perennial', 'full', 'low', { wi: 7, ph: [6, 7.5], zones: [7, 10], frost: 'half_hardy', germ: [14, 28], harvest: [90, 180], transplant: [1, 2], spacing: 60, height: 120 }),
  p('Sage', 'Salvia officinalis', 'herb', 'perennial', 'full', 'low', { wi: 7, ph: [6, 7], zones: [4, 8], frost: 'hardy', germ: [10, 21], harvest: [75, 90], indoors: [-8, -6], transplant: [0, 2], spacing: 45, height: 60 }),
  p('Oregano', 'Origanum vulgare', 'herb', 'perennial', 'full', 'low', { wi: 7, ph: [6, 8], zones: [4, 9], frost: 'hardy', germ: [7, 14], harvest: [80, 90], indoors: [-10, -8], transplant: [0, 2], spacing: 30, height: 45 }),
  p('Marjoram', 'Origanum majorana', 'herb', 'perennial', 'full', 'low', { wi: 5, ph: [6, 8], zones: [9, 10], frost: 'tender', germ: [7, 14], harvest: [70, 90], indoors: [-8, -6], transplant: [1, 2], spacing: 25, height: 40 }),
  p('Lavender', 'Lavandula angustifolia', 'herb', 'perennial', 'full', 'low', { wi: 10, ph: [6.5, 8], zones: [5, 9], frost: 'hardy', germ: [14, 28], spacing: 45, height: 60, aka: ['English lavender'] }),
  p('Lemon Balm', 'Melissa officinalis', 'herb', 'perennial', 'partial', 'medium', { wi: 3, ph: [6, 7.5], zones: [4, 9], frost: 'hardy', germ: [7, 14], harvest: [60, 90], indoors: [-6, -4], transplant: [0, 2], spacing: 45, height: 70 }),
  p('Tarragon', 'Artemisia dracunculus', 'herb', 'perennial', 'full', 'low', { wi: 7, ph: [6.5, 7.5], zones: [4, 8], frost: 'hardy', harvest: [60, 90], transplant: [0, 2], spacing: 45, height: 70, aka: ['French tarragon'] }),
  p('German Chamomile', 'Matricaria chamomilla', 'herb', 'annual', 'full', 'medium', { wi: 4, ph: [5.6, 7.5], frost: 'hardy', germ: [7, 14], harvest: [60, 70], spacing: 20, height: 60, direct: [-4, 0], aka: ['Chamomile'] }),
  p('Fennel', 'Foeniculum vulgare', 'herb', 'perennial', 'full', 'medium', { wi: 4, ph: [6, 7], zones: [4, 9], frost: 'half_hardy', germ: [7, 14], harvest: [90, 115], direct: [-2, 2], spacing: 30, height: 150 }),
  p('Lovage', 'Levisticum officinale', 'herb', 'perennial', 'partial', 'medium', { wi: 3, ph: [6, 7], zones: [3, 9], frost: 'hardy', germ: [10, 21], harvest: [90, 120], indoors: [-8, -6], transplant: [0, 2], spacing: 60, height: 180 }),
  p('Borage', 'Borago officinalis', 'herb', 'annual', 'full', 'medium', { wi: 4, ph: [6, 7], frost: 'half_hardy', germ: [5, 10], harvest: [50, 60], spacing: 30, height: 70, direct: [-2, 2] }),
  p('Catnip', 'Nepeta cataria', 'herb', 'perennial', 'full', 'low', { wi: 5, ph: [6, 7], zones: [3, 9], frost: 'hardy', germ: [7, 14], harvest: [80, 90], indoors: [-8, -6], transplant: [0, 2], spacing: 45, height: 90 }),
  p('Stevia', 'Stevia rebaudiana', 'herb', 'perennial', 'full', 'medium', { wi: 3, ph: [6.7, 7.2], zones: [9, 11], frost: 'tender', germ: [7, 21], harvest: [90, 120], spacing: 30, height: 60, indoors: [-8, -6], transplant: [2, 3] }),
  p('Lemongrass', 'Cymbopogon citratus', 'herb', 'perennial', 'full', 'high', { wi: 2, ph: [6, 7.5], zones: [9, 11], frost: 'tender', harvest: [90, 120], transplant: [2, 4], spacing: 60, height: 120 }),
  p('Bay Laurel', 'Laurus nobilis', 'herb', 'perennial', 'full', 'low', { wi: 7, ph: [6, 7.5], zones: [8, 10], frost: 'half_hardy', spacing: 200, height: 600, aka: ['Bay leaf'] }),
  p('Summer Savory', 'Satureja hortensis', 'herb', 'annual', 'full', 'low', { wi: 5, ph: [6, 7.5], frost: 'tender', germ: [10, 14], harvest: [60, 70], spacing: 15, height: 40, direct: [0, 2] }),
  p('Sorrel', 'Rumex acetosa', 'herb', 'perennial', 'partial', 'medium', { wi: 3, ph: [5.5, 6.8], zones: [3, 9], frost: 'hardy', germ: [7, 14], harvest: [60, 90], indoors: [-4, -2], direct: [-4, 0], spacing: 30, height: 60 }),

  // ---- Fruit and berries ----
  p('Strawberry', 'Fragaria ananassa', 'fruit', 'perennial', 'full', 'medium', { wi: 3, ph: [5.5, 6.8], zones: [5, 9], frost: 'hardy', spacing: 30, height: 25, transplant: [-4, -2] }),
  p('Blueberry', 'Vaccinium corymbosum', 'fruit', 'perennial', 'full', 'medium', { wi: 3, ph: [4.5, 5.5], zones: [4, 8], frost: 'hardy', spacing: 150, height: 180 }),
  p('Raspberry', 'Rubus idaeus', 'fruit', 'perennial', 'full', 'medium', { wi: 4, ph: [5.6, 6.5], zones: [3, 9], frost: 'hardy', spacing: 60, height: 150 }),
  p('Blackberry', 'Rubus fruticosus', 'fruit', 'perennial', 'full', 'medium', { wi: 4, ph: [5.5, 6.5], zones: [5, 9], frost: 'hardy', spacing: 90, height: 180 }),
  p('Grape', 'Vitis vinifera', 'fruit', 'perennial', 'full', 'medium', { wi: 7, ph: [5.5, 6.5], zones: [5, 9], frost: 'hardy', spacing: 240, height: 300 }),
  p('Currant', 'Ribes rubrum', 'fruit', 'perennial', 'partial', 'medium', { wi: 5, ph: [6, 7], zones: [3, 8], frost: 'hardy', spacing: 120, height: 150, aka: ['Red currant'] }),
  p('Gooseberry', 'Ribes uva-crispa', 'fruit', 'perennial', 'partial', 'medium', { wi: 5, ph: [6, 7], zones: [3, 8], frost: 'hardy', spacing: 120, height: 120 }),
  p('Cranberry', 'Vaccinium macrocarpon', 'fruit', 'perennial', 'full', 'high', { wi: 2, ph: [4, 5.5], zones: [2, 6], frost: 'hardy', spacing: 30, height: 20 }),
  p('Elderberry', 'Sambucus canadensis', 'fruit', 'perennial', 'full', 'medium', { wi: 4, ph: [5.5, 6.5], zones: [3, 9], frost: 'hardy', spacing: 240, height: 360 }),
  p('Kiwi', 'Actinidia chinensis', 'fruit', 'perennial', 'full', 'high', { wi: 3, ph: [5.5, 6.5], zones: [7, 9], frost: 'half_hardy', spacing: 450, height: 600 }),
  p('Apple', 'Malus domestica', 'tree', 'perennial', 'full', 'medium', { wi: 7, ph: [6, 7], zones: [3, 8], frost: 'hardy', spacing: 450, height: 450 }),
  p('Pear', 'Pyrus communis', 'tree', 'perennial', 'full', 'medium', { wi: 7, ph: [6, 7], zones: [4, 9], frost: 'hardy', spacing: 450, height: 600 }),
  p('Peach', 'Prunus persica', 'tree', 'perennial', 'full', 'medium', { wi: 7, ph: [6, 7], zones: [5, 9], frost: 'hardy', spacing: 450, height: 450 }),
  p('Sweet Cherry', 'Prunus avium', 'tree', 'perennial', 'full', 'medium', { wi: 7, ph: [6, 7], zones: [5, 8], frost: 'hardy', spacing: 600, height: 800 }),
  p('Plum', 'Prunus domestica', 'tree', 'perennial', 'full', 'medium', { wi: 7, ph: [6, 7], zones: [5, 9], frost: 'hardy', spacing: 450, height: 500 }),
  p('Apricot', 'Prunus armeniaca', 'tree', 'perennial', 'full', 'medium', { wi: 7, ph: [6, 7], zones: [5, 8], frost: 'hardy', spacing: 450, height: 500 }),
  p('Fig', 'Ficus carica', 'tree', 'perennial', 'full', 'medium', { wi: 7, ph: [6, 7.5], zones: [7, 10], frost: 'half_hardy', spacing: 360, height: 450 }),
  p('Lemon', 'Citrus limon', 'tree', 'perennial', 'full', 'medium', { wi: 5, ph: [6, 7], zones: [9, 11], frost: 'tender', spacing: 360, height: 400 }),
  p('Pomegranate', 'Punica granatum', 'tree', 'perennial', 'full', 'low', { wi: 10, ph: [5.5, 7.2], zones: [7, 10], frost: 'half_hardy', spacing: 300, height: 400 }),
  p('Pawpaw', 'Asimina triloba', 'tree', 'perennial', 'partial', 'medium', { wi: 5, ph: [5.5, 7], zones: [5, 9], frost: 'hardy', spacing: 300, height: 600 }),

  // ---- Flowers ----
  p('Sunflower', 'Helianthus annuus', 'flower', 'annual', 'full', 'low', { wi: 5, ph: [6, 7.5], frost: 'half_hardy', germ: [7, 10], harvest: [70, 100], spacing: 30, height: 200, direct: [0, 2] }),
  p('French Marigold', 'Tagetes patula', 'flower', 'annual', 'full', 'medium', { wi: 4, ph: [6, 7], frost: 'tender', germ: [4, 14], harvest: [50, 60], spacing: 20, height: 30, direct: [1, 2], indoors: [-6, -4], aka: ['Marigold'] }),
  p('Zinnia', 'Zinnia elegans', 'flower', 'annual', 'full', 'medium', { wi: 4, ph: [5.5, 7.5], frost: 'tender', germ: [4, 7], harvest: [60, 70], spacing: 25, height: 75, direct: [1, 2], indoors: [-6, -4] }),
  p('Cosmos', 'Cosmos bipinnatus', 'flower', 'annual', 'full', 'low', { wi: 5, ph: [6, 7.5], frost: 'tender', germ: [7, 10], harvest: [60, 90], spacing: 30, height: 120, direct: [0, 2] }),
  p('Nasturtium', 'Tropaeolum majus', 'flower', 'annual', 'full', 'low', { wi: 5, ph: [6, 7], frost: 'tender', germ: [7, 14], harvest: [35, 52], spacing: 25, height: 30, direct: [0, 2] }),
  p('Sweet Pea', 'Lathyrus odoratus', 'flower', 'annual', 'full', 'medium', { wi: 3, ph: [6.5, 7.5], frost: 'hardy', germ: [10, 21], harvest: [75, 100], spacing: 15, height: 180, direct: [-6, -4] }),
  p('Petunia', 'Petunia hybrida', 'flower', 'annual', 'full', 'medium', { wi: 3, ph: [5.5, 6.5], frost: 'tender', germ: [7, 14], harvest: [70, 85], spacing: 25, height: 30, indoors: [-10, -8], transplant: [0, 2] }),
  p('Snapdragon', 'Antirrhinum majus', 'flower', 'perennial', 'full', 'medium', { wi: 4, ph: [6, 7], zones: [7, 11], frost: 'half_hardy', germ: [7, 14], harvest: [90, 110], spacing: 25, height: 60, indoors: [-10, -8], transplant: [-2, 0] }),
  p('Calendula', 'Calendula officinalis', 'flower', 'annual', 'full', 'medium', { wi: 4, ph: [6, 7], frost: 'hardy', germ: [7, 14], harvest: [50, 60], spacing: 25, height: 45, direct: [-4, 0], aka: ['Pot marigold'] }),
  p('Pansy', 'Viola wittrockiana', 'flower', 'biennial', 'partial', 'medium', { wi: 3, ph: [5.4, 5.8], frost: 'hardy', germ: [10, 21], spacing: 20, height: 20, indoors: [-12, -10], transplant: [-4, -2] }),
  p('Impatiens', 'Impatiens walleriana', 'flower', 'annual', 'shade', 'high', { wi: 2, ph: [5.5, 6.5], frost: 'tender', germ: [14, 21], spacing: 25, height: 30, indoors: [-10, -8], transplant: [1, 2] }),
  p('Geranium', 'Pelargonium hortorum', 'flower', 'perennial', 'full', 'low', { wi: 5, ph: [6, 7], zones: [10, 11], frost: 'tender', spacing: 30, height: 45, transplant: [1, 2] }),
  p('Morning Glory', 'Ipomoea purpurea', 'flower', 'annual', 'full', 'medium', { wi: 4, ph: [6, 7.5], frost: 'tender', germ: [5, 10], harvest: [60, 90], spacing: 20, height: 300, direct: [1, 2] }),
  p('California Poppy', 'Eschscholzia californica', 'flower', 'perennial', 'full', 'low', { wi: 7, ph: [6, 7.5], zones: [6, 10], frost: 'hardy', germ: [10, 15], harvest: [60, 90], spacing: 20, height: 40, direct: [-4, 0] }),
  p('Cornflower', 'Centaurea cyanus', 'flower', 'annual', 'full', 'low', { wi: 5, ph: [6, 7.5], frost: 'hardy', germ: [7, 14], harvest: [70, 90], spacing: 20, height: 75, direct: [-4, 0], aka: ['Bachelor\'s button'] }),
  p('Sweet Alyssum', 'Lobularia maritima', 'flower', 'annual', 'full', 'medium', { wi: 4, ph: [6, 7.5], frost: 'half_hardy', germ: [5, 10], harvest: [40, 60], spacing: 15, height: 15, direct: [-4, 0] }),
  p('Cleome', 'Cleome hassleriana', 'flower', 'annual', 'full', 'low', { wi: 5, ph: [6, 7.5], frost: 'tender', germ: [10, 14], harvest: [70, 90], spacing: 45, height: 120, direct: [0, 2], aka: ['Spider flower'] }),
  p('Verbena', 'Verbena bonariensis', 'flower', 'perennial', 'full', 'low', { wi: 5, ph: [6, 7.5], zones: [7, 11], frost: 'half_hardy', germ: [14, 21], spacing: 30, height: 150 }),
  p('Dahlia', 'Dahlia pinnata', 'flower', 'perennial', 'full', 'medium', { wi: 3, ph: [6.5, 7], zones: [8, 11], frost: 'tender', spacing: 45, height: 100, transplant: [1, 3] }),
  p('Hydrangea', 'Hydrangea macrophylla', 'shrub', 'perennial', 'partial', 'high', { wi: 2, ph: [5.2, 6.2], zones: [5, 9], frost: 'hardy', spacing: 120, height: 150, aka: ['Bigleaf hydrangea'] }),
  p('Rose', 'Rosa', 'shrub', 'perennial', 'full', 'medium', { wi: 5, ph: [6, 6.8], zones: [3, 9], frost: 'hardy', spacing: 100, height: 120 }),
  p('Lilac', 'Syringa vulgaris', 'shrub', 'perennial', 'full', 'medium', { wi: 7, ph: [6.5, 7.5], zones: [3, 7], frost: 'hardy', spacing: 300, height: 360 }),
  p('Azalea', 'Rhododendron', 'shrub', 'perennial', 'partial', 'medium', { wi: 4, ph: [4.5, 6], zones: [5, 9], frost: 'hardy', spacing: 120, height: 150 }),
  p('Hibiscus', 'Hibiscus syriacus', 'shrub', 'perennial', 'full', 'medium', { wi: 4, ph: [5.5, 7], zones: [5, 9], frost: 'hardy', spacing: 180, height: 270, aka: ['Rose of Sharon'] }),
  p('Tulip', 'Tulipa gesneriana', 'flower', 'perennial', 'full', 'low', { wi: 7, ph: [6, 7], zones: [3, 8], frost: 'hardy', spacing: 12, height: 45 }),
  p('Daffodil', 'Narcissus pseudonarcissus', 'flower', 'perennial', 'full', 'low', { wi: 7, ph: [6, 7], zones: [3, 9], frost: 'hardy', spacing: 12, height: 40 }),
  p('Hyacinth', 'Hyacinthus orientalis', 'flower', 'perennial', 'full', 'low', { wi: 7, ph: [6, 7.5], zones: [4, 8], frost: 'hardy', spacing: 12, height: 25 }),
  p('Crocus', 'Crocus vernus', 'flower', 'perennial', 'full', 'low', { wi: 10, ph: [6, 7], zones: [3, 8], frost: 'hardy', spacing: 8, height: 12 }),
  p('Lily', 'Lilium', 'flower', 'perennial', 'full', 'medium', { wi: 5, ph: [6, 7], zones: [3, 9], frost: 'hardy', spacing: 25, height: 100 }),
  p('Peony', 'Paeonia lactiflora', 'flower', 'perennial', 'full', 'medium', { wi: 7, ph: [6.5, 7], zones: [3, 8], frost: 'hardy', spacing: 90, height: 90 }),
  p('Purple Coneflower', 'Echinacea purpurea', 'flower', 'perennial', 'full', 'low', { wi: 7, ph: [6, 7], zones: [3, 9], frost: 'hardy', germ: [14, 28], spacing: 45, height: 100, aka: ['Echinacea'] }),
  p('Black-eyed Susan', 'Rudbeckia hirta', 'flower', 'perennial', 'full', 'low', { wi: 7, ph: [6, 7], zones: [3, 9], frost: 'hardy', germ: [7, 14], spacing: 40, height: 75 }),
  p('Daylily', 'Hemerocallis fulva', 'flower', 'perennial', 'full', 'medium', { wi: 7, ph: [6, 7], zones: [3, 9], frost: 'hardy', spacing: 45, height: 90 }),
  p('Hosta', 'Hosta', 'flower', 'perennial', 'shade', 'medium', { wi: 4, ph: [6, 7], zones: [3, 9], frost: 'hardy', spacing: 60, height: 60 }),
  p('Bearded Iris', 'Iris germanica', 'flower', 'perennial', 'full', 'low', { wi: 10, ph: [6.8, 7.2], zones: [3, 10], frost: 'hardy', spacing: 40, height: 75 }),
  p('Meadow Sage', 'Salvia nemorosa', 'flower', 'perennial', 'full', 'low', { wi: 7, ph: [6, 7.5], zones: [4, 9], frost: 'hardy', germ: [10, 21], spacing: 40, height: 60 }),
  p('Lupine', 'Lupinus polyphyllus', 'flower', 'perennial', 'full', 'medium', { wi: 5, ph: [5.5, 6.5], zones: [4, 8], frost: 'hardy', germ: [14, 28], spacing: 45, height: 100 }),
  p('Hollyhock', 'Alcea rosea', 'flower', 'biennial', 'full', 'medium', { wi: 5, ph: [6, 8], zones: [3, 8], frost: 'hardy', germ: [10, 14], spacing: 45, height: 200 }),
  p('Foxglove', 'Digitalis purpurea', 'flower', 'biennial', 'partial', 'medium', { wi: 4, ph: [6, 7], zones: [4, 9], frost: 'hardy', germ: [14, 21], spacing: 40, height: 120 }),
  p('Delphinium', 'Delphinium elatum', 'flower', 'perennial', 'full', 'medium', { wi: 4, ph: [6.5, 7.5], zones: [3, 7], frost: 'hardy', germ: [14, 28], spacing: 60, height: 150 }),
  p('Garden Phlox', 'Phlox paniculata', 'flower', 'perennial', 'full', 'medium', { wi: 4, ph: [6, 7], zones: [3, 8], frost: 'hardy', spacing: 60, height: 100 }),
  p('Bee Balm', 'Monarda didyma', 'flower', 'perennial', 'full', 'medium', { wi: 4, ph: [6, 7], zones: [4, 9], frost: 'hardy', germ: [10, 21], spacing: 45, height: 100, aka: ['Bergamot'] }),
]
