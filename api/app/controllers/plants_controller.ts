import Plant from '#models/plant'
import PlantDetailTransformer from '#transformers/plant_detail_transformer'
import PlantTransformer from '#transformers/plant_transformer'
import { plantIndexValidator } from '#validators/plant'
import type { HttpContext } from '@adonisjs/core/http'

export default class PlantsController {
  async index({ request, serialize }: HttpContext) {
    const filters = await request.validateUsing(plantIndexValidator, { data: request.qs() })

    const query = Plant.visible().orderBy('commonName')

    if (filters.q) {
      const term = `%${filters.q.toLowerCase()}%`
      query.where((group) => {
        group
          .whereRaw('lower(common_name) like ?', [term])
          .orWhereRaw('lower(scientific_name) like ?', [term])
          .orWhereIn('id', (names) =>
            names.from('plant_names').select('plant_id').whereRaw('lower(name) like ?', [term])
          )
      })
    }
    if (filters.type) query.where('plantType', filters.type)
    if (filters.lifeCycle) query.where('lifeCycle', filters.lifeCycle)
    if (filters.sun) query.where('sun', filters.sun)
    if (filters.water) query.where('waterNeeds', filters.water)
    if (filters.frost) query.where('frostTolerance', filters.frost)
    if (filters.zone) {
      const zone = filters.zone
      // Plants without a zone range (annuals) can be grown anywhere.
      query.where((group) => {
        group
          .whereNull('hardinessZoneMin')
          .orWhere((range) =>
            range.where('hardinessZoneMin', '<=', zone).where('hardinessZoneMax', '>=', zone)
          )
      })
    }

    const plants = await query.paginate(filters.page ?? 1, filters.perPage ?? 20)
    // Page links point back at whichever route was called (public or account).
    plants.baseUrl(request.url()).queryString(request.qs())
    return serialize(PlantTransformer.paginate(plants.all(), plants.getMeta()))
  }

  async show({ params, serialize }: HttpContext) {
    const plant = await Plant.visible()
      .where('slug', params.slug)
      .preload('names')
      .preload('sources')
      .preload('amendments')
      .preload('companions', (companions) => companions.preload('companionPlant'))
      .firstOrFail()

    return serialize(PlantDetailTransformer.transform(plant))
  }
}
