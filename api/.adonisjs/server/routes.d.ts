import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'docs.spec': { paramsTuple?: []; params?: {} }
    'docs.ui': { paramsTuple?: []; params?: {} }
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'auth.email_verification.verify': { paramsTuple?: []; params?: {} }
    'auth.password_reset.forgot': { paramsTuple?: []; params?: {} }
    'auth.password_reset.reset': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'profile.email_verification.resend': { paramsTuple?: []; params?: {} }
    'profile.api_keys.index': { paramsTuple?: []; params?: {} }
    'profile.api_keys.store': { paramsTuple?: []; params?: {} }
    'profile.api_keys.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'profile.api_keys.usage': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'health.live': { paramsTuple?: []; params?: {} }
    'health.ready': { paramsTuple?: []; params?: {} }
    'status.show': { paramsTuple?: []; params?: {} }
    'explorer.plants.index': { paramsTuple?: []; params?: {} }
    'explorer.plants.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'explorer.calendar.show': { paramsTuple?: []; params?: {} }
    'plants.plants.index': { paramsTuple?: []; params?: {} }
    'plants.plants.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'climate.moon.show': { paramsTuple?: []; params?: {} }
    'climate.moon.phases': { paramsTuple?: []; params?: {} }
    'climate.frost.show': { paramsTuple?: []; params?: {} }
    'climate.climate.show': { paramsTuple?: []; params?: {} }
    'climate.hardiness.show': { paramsTuple?: []; params?: {} }
    'climate.catalog.index': { paramsTuple?: []; params?: {} }
    'climate.catalog.show': { paramsTuple: [ParamValue]; params: {'symbol': ParamValue} }
    'climate.calendar.show': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'docs.spec': { paramsTuple?: []; params?: {} }
    'docs.ui': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.api_keys.index': { paramsTuple?: []; params?: {} }
    'profile.api_keys.usage': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'health.live': { paramsTuple?: []; params?: {} }
    'health.ready': { paramsTuple?: []; params?: {} }
    'status.show': { paramsTuple?: []; params?: {} }
    'explorer.plants.index': { paramsTuple?: []; params?: {} }
    'explorer.plants.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'explorer.calendar.show': { paramsTuple?: []; params?: {} }
    'plants.plants.index': { paramsTuple?: []; params?: {} }
    'plants.plants.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'climate.moon.show': { paramsTuple?: []; params?: {} }
    'climate.moon.phases': { paramsTuple?: []; params?: {} }
    'climate.frost.show': { paramsTuple?: []; params?: {} }
    'climate.climate.show': { paramsTuple?: []; params?: {} }
    'climate.hardiness.show': { paramsTuple?: []; params?: {} }
    'climate.catalog.index': { paramsTuple?: []; params?: {} }
    'climate.catalog.show': { paramsTuple: [ParamValue]; params: {'symbol': ParamValue} }
    'climate.calendar.show': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'docs.spec': { paramsTuple?: []; params?: {} }
    'docs.ui': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.api_keys.index': { paramsTuple?: []; params?: {} }
    'profile.api_keys.usage': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'health.live': { paramsTuple?: []; params?: {} }
    'health.ready': { paramsTuple?: []; params?: {} }
    'status.show': { paramsTuple?: []; params?: {} }
    'explorer.plants.index': { paramsTuple?: []; params?: {} }
    'explorer.plants.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'explorer.calendar.show': { paramsTuple?: []; params?: {} }
    'plants.plants.index': { paramsTuple?: []; params?: {} }
    'plants.plants.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'climate.moon.show': { paramsTuple?: []; params?: {} }
    'climate.moon.phases': { paramsTuple?: []; params?: {} }
    'climate.frost.show': { paramsTuple?: []; params?: {} }
    'climate.climate.show': { paramsTuple?: []; params?: {} }
    'climate.hardiness.show': { paramsTuple?: []; params?: {} }
    'climate.catalog.index': { paramsTuple?: []; params?: {} }
    'climate.catalog.show': { paramsTuple: [ParamValue]; params: {'symbol': ParamValue} }
    'climate.calendar.show': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'auth.email_verification.verify': { paramsTuple?: []; params?: {} }
    'auth.password_reset.forgot': { paramsTuple?: []; params?: {} }
    'auth.password_reset.reset': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'profile.email_verification.resend': { paramsTuple?: []; params?: {} }
    'profile.api_keys.store': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'profile.api_keys.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}