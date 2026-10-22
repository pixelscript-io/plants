import { HardinessZoneSchema } from '#database/schema'

/**
 * Rows are verbatim from the OSU PRISM Group's USDA Plant Hardiness Zone ZIP
 * listing and must not be altered. See the import:hardiness-zones command.
 */
export default class HardinessZone extends HardinessZoneSchema {}
