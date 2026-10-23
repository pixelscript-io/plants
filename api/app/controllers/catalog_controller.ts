import CatalogSpecies from '#models/catalog_species'
import CatalogSpeciesTransformer, { CatalogSpeciesSummaryTransformer } from '#transformers/catalog_species_transformer'
import { catalogIndexValidator } from '#validators/plant'
import type { HttpContext } from '@adonisjs/core/http'

export default class CatalogController {
  async index({ request, serialize }: HttpContext) {
    const filters = await request.validateUsing(catalogIndexValidator, { data: request.qs() })

    const query = CatalogSpecies.served().orderBy('commonName')

    if (filters.q) {
      const term = `%${filters.q.toLowerCase()}%`
      query.where((group) => {
        group.whereRaw('lower(common_name) like ?', [term]).orWhereRaw('lower(scientific_name) like ?', [term])
      })
    }
    // growth_habits and durations are JSON arrays of plain words, so a quoted match is exact.
    if (filters.growthHabit) query.whereRaw('growth_habits like ?', [`%"${filters.growthHabit}"%`])
    if (filters.duration) query.whereRaw('durations like ?', [`%"${filters.duration}"%`])
    if (filters.nativeStatus === 'native') query.where('nativeStatusContiguous', 'like', '%Native%')
    if (filters.nativeStatus === 'introduced') query.where('nativeStatusContiguous', 'like', '%Introduced%')
    if (filters.shadeTolerance) {
      query.whereRaw('characteristics like ?', [`%"Shade Tolerance":"${filters.shadeTolerance}"%`])
    }
    if (filters.droughtTolerance) {
      query.whereRaw('characteristics like ?', [`%"Drought Tolerance":"${filters.droughtTolerance}"%`])
    }

    const page = await query.paginate(filters.page ?? 1, filters.perPage ?? 20)
    page.baseUrl(request.url()).queryString(request.qs())
    return serialize(CatalogSpeciesSummaryTransformer.paginate(page.all(), page.getMeta()))
  }

  async show({ params, serialize }: HttpContext) {
    const species = await CatalogSpecies.served()
      .where('usdaSymbol', params.symbol.toUpperCase())
      .firstOrFail()
    return serialize(CatalogSpeciesTransformer.transform(species))
  }
}
