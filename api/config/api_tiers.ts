/**
 * Rate limits per API key tier. A key is limited both per minute (burst) and
 * per UTC day (quota). Change a key's `tier` column to move it between tiers.
 */
export const tiers = {
  free: { perMinute: 30, perDay: 1_000, maxKeys: 3 },
  pro: { perMinute: 120, perDay: 50_000, maxKeys: 10 },
} as const

export type TierName = keyof typeof tiers

export const tierFor = (name: string) => tiers[name as TierName] ?? tiers.free
