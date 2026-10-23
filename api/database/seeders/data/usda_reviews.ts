/**
 * USDA warnings from `plants:audit` that were looked into on 2026-10-23 and
 * kept as they are. The audit skips USDA warnings for these plants. Plants
 * whose values were changed because of a warning are not listed here.
 */
export const USDA_REVIEWED: Record<string, string> = {
  'black-eyed-susan': 'Zones 3 to 9 in several extension and nursery references; USDA gives a range-wide minimum.',
  'blazing-star': 'Penn State Extension lists zones 3 to 9.',
  foxglove: 'University of Wisconsin Extension lists zones 4 to 9.',
  ninebark: 'Iowa State, Oregon State and UConn list zone 2 as the cold limit.',
  'oakleaf-hydrangea': 'University of Florida IFAS lists zones 5b to 9; it may die back to the ground in zone 5.',
  'purple-coneflower': 'Established plants handle dry spells; USDA rates the wild species by range conditions.',
  'wild-bergamot': 'Kept low water for established plants; not independently confirmed.',
  forsythia: 'Kept low water for established plants; not independently confirmed.',
  'northern-red-oak': 'Kept low water for established trees; not independently confirmed.',
  pomegranate: 'Kept low water for established trees; not independently confirmed.',
  'lanceleaf-coreopsis': 'Zones changed to 4 to 9 (Morton Arboretum). Low water kept for established plants; not independently confirmed.',
}
