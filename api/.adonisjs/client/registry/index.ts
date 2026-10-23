/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'docs.spec': {
    methods: ["GET","HEAD"],
    pattern: '/openapi.json',
    tokens: [[0,"openapi.json"]],
    types: placeholder as Registry['docs.spec']['types'],
  },
  'docs.ui': {
    methods: ["GET","HEAD"],
    pattern: '/docs',
    tokens: [[0,"docs"]],
    types: placeholder as Registry['docs.ui']['types'],
  },
  'auth.new_account.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/signup',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"signup"]],
    types: placeholder as Registry['auth.new_account.store']['types'],
  },
  'auth.access_tokens.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/login',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"login"]],
    types: placeholder as Registry['auth.access_tokens.store']['types'],
  },
  'auth.email_verification.verify': {
    methods: ["POST"],
    pattern: '/api/v1/auth/verify-email',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"verify-email"]],
    types: placeholder as Registry['auth.email_verification.verify']['types'],
  },
  'auth.password_reset.forgot': {
    methods: ["POST"],
    pattern: '/api/v1/auth/forgot-password',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"forgot-password"]],
    types: placeholder as Registry['auth.password_reset.forgot']['types'],
  },
  'auth.password_reset.reset': {
    methods: ["POST"],
    pattern: '/api/v1/auth/reset-password',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"reset-password"]],
    types: placeholder as Registry['auth.password_reset.reset']['types'],
  },
  'profile.profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/profile',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"profile"]],
    types: placeholder as Registry['profile.profile.show']['types'],
  },
  'profile.access_tokens.destroy': {
    methods: ["POST"],
    pattern: '/api/v1/account/logout',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"logout"]],
    types: placeholder as Registry['profile.access_tokens.destroy']['types'],
  },
  'profile.email_verification.resend': {
    methods: ["POST"],
    pattern: '/api/v1/account/resend-verification',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"resend-verification"]],
    types: placeholder as Registry['profile.email_verification.resend']['types'],
  },
  'profile.api_keys.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/api-keys',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"api-keys"]],
    types: placeholder as Registry['profile.api_keys.index']['types'],
  },
  'profile.api_keys.store': {
    methods: ["POST"],
    pattern: '/api/v1/account/api-keys',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"api-keys"]],
    types: placeholder as Registry['profile.api_keys.store']['types'],
  },
  'profile.api_keys.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/account/api-keys/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"api-keys"],[1,"id"]],
    types: placeholder as Registry['profile.api_keys.destroy']['types'],
  },
  'profile.api_keys.usage': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/api-keys/:id/usage',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"api-keys"],[1,"id"],[0,"usage"]],
    types: placeholder as Registry['profile.api_keys.usage']['types'],
  },
  'health.live': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/health',
    tokens: [[0,"api"],[0,"v1"],[0,"health"]],
    types: placeholder as Registry['health.live']['types'],
  },
  'health.ready': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/health/ready',
    tokens: [[0,"api"],[0,"v1"],[0,"health"],[0,"ready"]],
    types: placeholder as Registry['health.ready']['types'],
  },
  'status.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/status',
    tokens: [[0,"api"],[0,"v1"],[0,"status"]],
    types: placeholder as Registry['status.show']['types'],
  },
  'explorer.plants.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/plants',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"plants"]],
    types: placeholder as Registry['explorer.plants.index']['types'],
  },
  'explorer.plants.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/plants/:slug',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"plants"],[1,"slug"]],
    types: placeholder as Registry['explorer.plants.show']['types'],
  },
  'explorer.calendar.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/calendar',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"calendar"]],
    types: placeholder as Registry['explorer.calendar.show']['types'],
  },
  'plants.plants.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/plants',
    tokens: [[0,"api"],[0,"v1"],[0,"plants"]],
    types: placeholder as Registry['plants.plants.index']['types'],
  },
  'plants.plants.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/plants/:slug',
    tokens: [[0,"api"],[0,"v1"],[0,"plants"],[1,"slug"]],
    types: placeholder as Registry['plants.plants.show']['types'],
  },
  'climate.moon.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/moon',
    tokens: [[0,"api"],[0,"v1"],[0,"moon"]],
    types: placeholder as Registry['climate.moon.show']['types'],
  },
  'climate.moon.phases': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/moon/phases',
    tokens: [[0,"api"],[0,"v1"],[0,"moon"],[0,"phases"]],
    types: placeholder as Registry['climate.moon.phases']['types'],
  },
  'climate.frost.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/frost',
    tokens: [[0,"api"],[0,"v1"],[0,"frost"]],
    types: placeholder as Registry['climate.frost.show']['types'],
  },
  'climate.climate.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/climate',
    tokens: [[0,"api"],[0,"v1"],[0,"climate"]],
    types: placeholder as Registry['climate.climate.show']['types'],
  },
  'climate.hardiness.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/hardiness',
    tokens: [[0,"api"],[0,"v1"],[0,"hardiness"]],
    types: placeholder as Registry['climate.hardiness.show']['types'],
  },
  'climate.calendar.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/calendar',
    tokens: [[0,"api"],[0,"v1"],[0,"calendar"]],
    types: placeholder as Registry['climate.calendar.show']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
