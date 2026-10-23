# Curated plant data review

Reviewed 2026-10-22. Covers the 138 plants, 376 companion pairs and 17 amendments in
`database/seeders/data/`.

## Added 2026-10-23: 81 more plants (not reviewed, not published)

The curated set grew from 138 to 219 plants (vegetables, herbs, fruit and nut trees, perennials and
annuals, shrubs and shade trees), with 106 more companion pairs. Everything below this heading in the
review (counts, extension cross-checks, corrections) describes the **first 138 plants only**.

- The new plants pass `plants:audit` (0 errors) and each has a USDA symbol and at least one companion.
- Their values come from general horticultural knowledge. **None are cross-checked** against an extension guide, and ornamental companion pairs rest mostly on garden practice and pollinator support rather than trials.
- They are seeded **unpublished**. `plants:publish --all` (and `data:setup --publish`) would publish them too; review first, or publish by slug.
- Cucamelon was dropped because it has no USDA PLANTS entry, which every plant needs.

## USDA second opinion (2026-10-23)

`node ace import:usda-traits` also stores USDA PLANTS characteristics (shade and drought tolerance, soil pH,
minimum temperature, mature height, toxicity and more) for plants where USDA has them: 51 of the 219.
`plants:audit --warnings` compares them with our values and prints `USDA:` warnings. They never block publishing:
USDA describes the species in the wild, so a difference is a prompt to look, not proof we are wrong.

Flagged now (14), worth a look: California poppy and Southern magnolia hardiness zones (we claim colder than USDA),
black-eyed Susan, blazing star, lanceleaf coreopsis, foxglove, ninebark and oakleaf hydrangea zones (smaller gaps),
and low-water ratings that USDA rates as low or no drought tolerance (coneflower, coreopsis, bergamot, forsythia,
red oak, pomegranate). Garden practice often differs from range ecology, so several of these are probably fine.

Left out on purpose: height for vegetables and herbs (USDA gives the bolting height) and annuals that USDA lists
as perennial (potato, eggplant: tender perennials grown as annuals).

## Summary

| Check | Result |
|---|---|
| Internal consistency (`node ace plants:audit`) | 0 errors, 4 known-gap warnings |
| Planting windows and days to harvest checked against university extension guides | 43 of 138 plants |
| Every plant detail matches the OpenAPI spec | 138 of 138 |
| Calendar works for every plant in a cold, a temperate and a warm climate | yes, no logical errors |
| Published (visible in the API when `SERVE_UNPUBLISHED=false`) | none yet |

## What was checked and how

**1. Consistency audit.** `plants:audit` (`app/services/plant_audit.ts`) checks every plant and
every companion pair for contradictions: ranges in order, perennials have zones and annuals do not,
frost-tender plants are not planted out before the last frost, sow-indoors ends before transplant
starts, watering interval agrees with water needs, companions are stored in both directions, no pair
is both beneficial and antagonistic, every relationship has a real reason. `plants:publish` refuses
to run while it reports errors.

**2. Cross-check against extension guides.** Planting windows (weeks relative to the last spring
frost) and days to harvest for 43 plants were compared with:

- Montana State University Extension, MontGuide MT199308AG (vegetable table)
- UNH Cooperative Extension, "When to Plant Your Vegetable Garden" (2016)
- University extension herb and seed-starting guides (UMN, WVU, UMD, Utah State)
- Individual guides for sorrel, lemon balm, Jerusalem artichoke and radicchio

The values are our own curation, not copied. Each checked plant carries an `extension_crosscheck`
entry in its `sources` naming what it was checked against.

## Corrections made

| Plant | Was | Now | Why |
|---|---|---|---|
| Rutabaga | direct sow 8 to 12 weeks after frost | 2 to 7 weeks after | UNH: mid-June to mid-July |
| Celery | transplant 0 to 2 weeks after frost | 2 weeks before to frost | MSU 3 weeks before, UNH 2 weeks before; start indoors 10 weeks ahead |
| Bell and chili pepper | start indoors 8 to 10 weeks before frost | 6 to 8 weeks | UNH: 8 to 10 weeks old at set-out, 2 weeks after frost |
| Parsley | no transplant window | start 10 to 12 weeks before, set out 1 to 3 weeks before frost | UNH |
| Potato | direct 0 to 4 weeks before frost | 0 to 2 weeks before | UNH and MSU: 1 to 2 weeks before |
| Swiss chard | direct 2 weeks before to 2 after | 4 weeks before to frost | MSU and UNH |
| Parsnip, pea | narrower windows | widened per MSU | MSU |
| Sweet potato | transplant 2 to 4 weeks after | 1 to 3 weeks after | UNH |
| Days to harvest | cabbage 70-100, carrot 70-80, beet 50-70, spinach 40-50, Brussels sprouts 90-110, cauliflower 70-100, pea 55-70, cantaloupe 70-90, radicchio 60-100 | 60-90, 60-80, 50-80, 40-60, 80-100, 50-95, 55-90, 80-100, 75-90 | MSU, UMN, UC Davis |
| Perennial herbs | thyme, sage, oregano, marjoram, chives, lemon balm, sorrel, lovage, catnip, tarragon, mints, rosemary, fennel, lemongrass, Jerusalem artichoke had no planting window | windows added | extension seed-starting guides; those without a published week count are marked below |
| French marigold | low water but watered every 4 days | medium | internal contradiction |
| Cabbage-carrot culinary reason | "Coleslaw." | full sentence | too thin to publish |

## Not independently verified

These values come from general horticultural knowledge and were only checked for internal
consistency:

- spacing, height, soil pH, watering interval, germination days
- hardiness zone ranges for perennials, trees and shrubs
- frost tolerance class (tender, half-hardy, hardy)
- all companion relationships. Reasons say whether a pair is a documented effect or traditional
  advice, but none were checked against a source
- amendment effects and warnings

Windows filled from general principles, with no source stating a week count: lovage, catnip,
tarragon, spearmint, peppermint, rosemary, fennel, lemongrass, marjoram (frost class only). Treat
these as reasonable defaults.

## Known gaps

- **Fall planting is not modelled.** Garlic, radicchio, foxglove and hollyhock are planted in late
  summer or fall, and extension guides give those dates relative to the first fall frost. They have
  no planting windows. Spring bulbs (tulip, daffodil, crocus, hyacinth, lily) and fall crops
  generally need the same feature.
- **51 of 138 plants have no calendar windows** (trees, shrubs, most perennial flowers, bulbs, fall-planted
  plants). The calendar says so in a warning instead of guessing.
- Moon-phase gardening is folklore and is labelled `"basis": "traditional"`.

## Operating

```bash
node ace db:seed --files database/seeders/plant_seeder.ts   # reload plants (publish state is kept)
node ace db:seed --files database/seeders/companion_seeder.ts
node ace db:seed --files database/seeders/amendment_seeder.ts
node ace plants:audit --warnings      # consistency checks
node ace plants:publish --all         # publish (runs the audit first)
node ace plants:publish tomato basil  # publish specific plants
node ace plants:publish --unpublish --all
```

Re-seeding rewrites each plant's values and provenance but leaves `is_published` unchanged.
After editing the seed data, run the audit before publishing.
