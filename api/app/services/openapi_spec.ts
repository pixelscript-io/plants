import { tiers } from '#config/api_tiers'
import { HARDINESS_ATTRIBUTION } from '#services/hardiness_attribution'

const nullable = <T extends string>(type: T) => ({ type: [type, 'null'] as [T, 'null'] })

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })

const jsonContent = (schema: unknown, example?: unknown) => ({
  'application/json': { schema, ...(example === undefined ? {} : { example }) },
})

const errorResponse = (description: string, example?: unknown) => ({
  description,
  content: jsonContent(ref('Error'), example),
})

const rateLimitHeaders = {
  'X-RateLimit-Limit': { $ref: '#/components/headers/RateLimitLimit' },
  'X-RateLimit-Remaining': { $ref: '#/components/headers/RateLimitRemaining' },
  'X-RateLimit-Reset': { $ref: '#/components/headers/RateLimitReset' },
  'X-RateLimit-Daily-Limit': { $ref: '#/components/headers/RateLimitDailyLimit' },
  'X-RateLimit-Daily-Remaining': { $ref: '#/components/headers/RateLimitDailyRemaining' },
}

const keyedErrors = {
  '401': errorResponse('Missing, invalid or revoked API key.', {
    errors: [{ message: 'Invalid or revoked API key.' }],
  }),
  '429': {
    description: 'A per-minute or per-day limit was reached. Wait `Retry-After` seconds.',
    headers: { 'Retry-After': { $ref: '#/components/headers/RetryAfter' } },
    content: jsonContent(ref('Error'), {
      errors: [{ message: 'Rate limit of 30 requests per minute reached.', retryAfterSeconds: 60 }],
    }),
  },
}

const bearerErrors = {
  '401': errorResponse('Missing or invalid account token.'),
}

const range = {
  oneOf: [
    {
      type: 'object',
      required: ['min', 'max'],
      properties: { min: nullable('number'), max: nullable('number') },
    },
    { type: 'null' },
  ],
}

const description = `
A REST API of garden plant data: growing needs, planting windows, **companion plants** and **soil amendments**,
built for hobby and indie garden apps.

## Getting started

1. **Create an account:** \`POST /auth/signup\` returns an account \`token\` and emails you a confirmation link. Confirm your address (\`POST /auth/verify-email\`) to be able to create keys.
2. **Create an API key:** \`POST /account/api-keys\` with \`Authorization: Bearer <token>\`. The key is shown **once**.
3. **Call the data endpoints** with your key in the \`X-API-Key\` header:

\`\`\`bash
curl -H "X-API-Key: pk_live_..." "{{baseUrl}}/plants?q=tomato"
\`\`\`

## Rate limits

Every key has a burst limit (per minute) and a daily quota (UTC day). Responses include
\`X-RateLimit-*\` headers; when you go over, you get a \`429\` with a \`Retry-After\` header.

| Tier | Requests / minute | Requests / day | Active keys |
|------|------------------:|---------------:|------------:|
| free | ${tiers.free.perMinute} | ${tiers.free.perDay.toLocaleString('en-US')} | ${tiers.free.maxKeys} |
| pro  | ${tiers.pro.perMinute} | ${tiers.pro.perDay.toLocaleString('en-US')} | ${tiers.pro.maxKeys} |

## About the data

- Plant data is a **curated starter set**. Planting windows and days to harvest for common crops are
  cross-checked against university extension guides (each plant's \`sources\` says which); other values such as
  spacing, height, soil pH and watering interval are general horticultural guidance. Treat all of it as
  guidance, not agronomic advice.
- Garlic, radicchio, foxglove and hollyhock are planted in late summer or fall, and bulbs generally in fall.
  The calendar does not model fall planting yet, so those plants have no planting windows.
- \`planting\` windows are in **weeks relative to the average last spring frost**: negative is before,
  positive is after.
- Companion planting evidence varies. Each pair carries a \`reason\` that says whether it is a documented
  effect or traditional advice.
- Names, symbols and families come from the USDA PLANTS Database (public domain). Each plant lists its
  \`sources\` and their licenses.
- **Frost dates** come from the nearest NOAA weather station (1991-2020 Climate Normals, public domain), up to
  100 km away, for a 32°F freeze. The response names the station and its distance. Elevation and local
  terrain can shift real frost dates by a week or more, so treat them as a guide.
- ZIP codes are resolved to the centre of the Census ZIP Code Tabulation Area (public domain). For large rural
  ZIP areas the centre can be far from where people live; use \`lat\` and \`lon\` for precision.
- **Hardiness zones** (\`/hardiness\`) are the USDA Plant Hardiness Zone Map (2023) ZIP code listing, prepared by
  the PRISM Group at **Oregon State University**, which owns the data. They are served **exactly as published,
  unaltered**, and every response carries an \`attribution\` object. See the
  [OSU terms of use](${HARDINESS_ATTRIBUTION.termsUrl}) and the
  [official USDA map](${HARDINESS_ATTRIBUTION.officialMapUrl}). The data covers ZIP codes only.
- **Moon phases** are computed, not looked up. Gardening guidance by moon phase is **traditional folklore**:
  it is labelled \`"basis": "traditional"\` because controlled studies have not shown a consistent effect.

## Conventions

- All responses are JSON with camelCase keys. Data is wrapped in a \`data\` property.
- Errors have the shape \`{ "errors": [{ "message": "..." }] }\`.
`.trim()

export function buildOpenApiSpec(baseUrl: string) {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Plants API',
      version: '1.0.0',
      description: description.replace('{{baseUrl}}', `${baseUrl}/api/v1`),
    },
    servers: [{ url: `${baseUrl}/api/v1` }],
    tags: [
      { name: 'Plants', description: 'Search plants and read growing data. Requires an API key.' },
      { name: 'Frost & calendar', description: 'Frost dates and hardiness zones for a location, and a planting calendar built from frost dates. Requires an API key.' },
      { name: 'Status', description: 'Health checks and the data behind the public status page. No API key needed.' },
      { name: 'Moon', description: 'Moon phase for a date and the phases in a month or year. Requires an API key.' },
      { name: 'API keys', description: 'Create, list, revoke and monitor your API keys. Requires an account token.' },
      { name: 'Auth', description: 'Create an account and get a token for managing keys.' },
    ],
    paths: {
      '/plants': {
        get: {
          tags: ['Plants'],
          operationId: 'searchPlants',
          summary: 'Search plants',
          description:
            'Returns a page of plants sorted by common name. `q` matches common names, alternate names and scientific names. Filters combine with AND.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'q', in: 'query', description: 'Text to search for (case-insensitive).', schema: { type: 'string', minLength: 1, maxLength: 100 }, example: 'tomato' },
            { name: 'type', in: 'query', schema: { $ref: '#/components/schemas/PlantType' } },
            { name: 'lifeCycle', in: 'query', schema: { $ref: '#/components/schemas/LifeCycle' } },
            { name: 'sun', in: 'query', schema: { $ref: '#/components/schemas/Sun' } },
            { name: 'water', in: 'query', description: 'Water needs.', schema: { $ref: '#/components/schemas/WaterNeeds' } },
            { name: 'frost', in: 'query', description: 'Frost tolerance.', schema: { $ref: '#/components/schemas/FrostTolerance' } },
            {
              name: 'zone',
              in: 'query',
              description: 'USDA hardiness zone. Returns plants that survive that zone; annuals and plants without a zone range are always included.',
              schema: { type: 'integer', minimum: 1, maximum: 13 },
              example: 6,
            },
            { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
            { name: 'perPage', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
          ],
          responses: {
            '200': {
              description: 'A page of plants.',
              headers: rateLimitHeaders,
              content: jsonContent(ref('PlantPage')),
            },
            '422': errorResponse('A query parameter is invalid.', {
              errors: [
                {
                  message: 'The selected type is invalid',
                  rule: 'enum',
                  field: 'type',
                  meta: { choices: ['vegetable', 'herb', 'fruit', 'flower', 'shrub', 'tree'] },
                },
              ],
            }),
            ...keyedErrors,
          },
        },
      },
      '/plants/{slug}': {
        get: {
          tags: ['Plants'],
          operationId: 'getPlant',
          summary: 'Get a plant',
          description:
            'Returns the full record: growing needs, planting windows, alternate names, companion plants grouped by relationship, soil amendments and data sources.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'slug', in: 'path', required: true, schema: { type: 'string' }, example: 'tomato' },
          ],
          responses: {
            '200': {
              description: 'The plant.',
              headers: rateLimitHeaders,
              content: jsonContent({ type: 'object', required: ['data'], properties: { data: ref('PlantDetail') } }),
            },
            '404': errorResponse('No plant with that slug.'),
            ...keyedErrors,
          },
        },
      },
      '/frost': {
        get: {
          tags: ['Frost & calendar'],
          operationId: 'getFrostDates',
          summary: 'Get frost dates for a location',
          description:
            'Average last spring and first fall freeze (32°F) for the nearest weather station, with an early and a late date for each. Give either `zip` or both `lat` and `lon`.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/Zip' },
            { $ref: '#/components/parameters/Lat' },
            { $ref: '#/components/parameters/Lon' },
            { $ref: '#/components/parameters/Year' },
          ],
          responses: {
            '200': {
              description: 'Frost dates and the station they come from.',
              headers: rateLimitHeaders,
              content: jsonContent({ type: 'object', required: ['data'], properties: { data: ref('FrostResponse') } }),
            },
            '404': errorResponse('The ZIP code is unknown, or no weather station with frost data is within 100 km.'),
            '422': errorResponse('The location is missing or a parameter is invalid.'),
            ...keyedErrors,
          },
        },
      },
      '/climate': {
        get: {
          tags: ['Frost & calendar'],
          operationId: 'getClimateNormals',
          summary: 'Get climate normals for a location',
          description:
            'Annual temperature, precipitation, snowfall and growing degree days (NOAA 1991-2020 normals) for the nearest weather station. Give either `zip` or both `lat` and `lon`. A value is null where the station does not report it.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/Zip' },
            { $ref: '#/components/parameters/Lat' },
            { $ref: '#/components/parameters/Lon' },
          ],
          responses: {
            '200': {
              description: 'Climate normals and the station they come from.',
              headers: rateLimitHeaders,
              content: jsonContent({ type: 'object', required: ['data'], properties: { data: ref('ClimateResponse') } }),
            },
            '404': errorResponse('The ZIP code is unknown, or no weather station is within 100 km.'),
            '422': errorResponse('The location is missing or a parameter is invalid.'),
            ...keyedErrors,
          },
        },
      },
      '/hardiness': {
        get: {
          tags: ['Frost & calendar'],
          operationId: 'getHardinessZone',
          summary: 'Get the USDA hardiness zone for a ZIP code',
          description:
            'The zone and temperature range exactly as published in the USDA Plant Hardiness Zone Map (2023) by the PRISM Group at Oregon State University. The data is not altered, and the response includes the required attribution. Plants have a numeric `hardinessZones` range; the zone number is the digits of `zone` (for example `6b` is zone 6), which you can pass as the `zone` filter on `/plants`.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'zip', in: 'query', required: true, description: 'US ZIP code (5 digits).', schema: { type: 'string', pattern: '^\\d{5}$' }, example: '02134' },
          ],
          responses: {
            '200': {
              description: 'The hardiness zone.',
              headers: rateLimitHeaders,
              content: jsonContent({ type: 'object', required: ['data'], properties: { data: ref('HardinessResponse') } }),
            },
            '404': errorResponse('No hardiness zone is published for that ZIP code.'),
            '422': errorResponse('The ZIP code is missing or not 5 digits.'),
            ...keyedErrors,
          },
        },
      },
      '/calendar': {
        get: {
          tags: ['Frost & calendar'],
          operationId: 'getPlantingCalendar',
          summary: 'Get a planting calendar',
          description:
            'Planting windows and harvest estimates for up to 25 plants, calculated from the location\'s frost dates. Plants are listed in the order requested. Plants without planting windows on file (for example some perennials) come back with null windows and a warning.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/Zip' },
            { $ref: '#/components/parameters/Lat' },
            { $ref: '#/components/parameters/Lon' },
            { $ref: '#/components/parameters/Year' },
            {
              name: 'plants',
              in: 'query',
              required: true,
              description: 'Plant slugs, comma-separated (`tomato,basil`) or repeated (`plants=tomato&plants=basil`). Maximum 25.',
              schema: { type: 'string' },
              example: 'tomato,basil,kale',
            },
            {
              name: 'risk',
              in: 'query',
              description:
                'How cautious the dates are. `conservative` uses the late spring and early fall frost dates (a 10% chance of frost after or before them), `average` the median dates, `optimistic` the early spring and late fall dates.',
              schema: { type: 'string', enum: ['conservative', 'average', 'optimistic'], default: 'average' },
            },
          ],
          responses: {
            '200': {
              description: 'The calendar.',
              headers: rateLimitHeaders,
              content: jsonContent({ type: 'object', required: ['data'], properties: { data: ref('CalendarResponse') } }),
            },
            '404': errorResponse('The ZIP code is unknown, or no weather station with frost data is within 100 km.'),
            '422': errorResponse('A plant slug is unknown, too many plants were requested, or a parameter is invalid.', {
              errors: [{ message: 'Unknown plants: notaplant.' }],
            }),
            ...keyedErrors,
          },
        },
      },
      '/moon': {
        get: {
          tags: ['Moon'],
          operationId: 'getMoon',
          summary: 'Get the moon phase for a date',
          description:
            'Phase, illumination, age and the next new and full moons, computed for noon UTC on the date. Includes traditional (folklore) gardening guidance.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'date',
              in: 'query',
              description: 'A date between 1900 and 2100. Defaults to today (UTC).',
              schema: { type: 'string', format: 'date' },
              example: '2026-10-22',
            },
          ],
          responses: {
            '200': {
              description: 'The moon on that date.',
              headers: rateLimitHeaders,
              content: jsonContent({ type: 'object', required: ['data'], properties: { data: ref('MoonDay') } }),
            },
            '422': errorResponse('The date is invalid or out of range.'),
            ...keyedErrors,
          },
        },
      },
      '/moon/phases': {
        get: {
          tags: ['Moon'],
          operationId: 'getMoonPhases',
          summary: 'List the principal moon phases',
          description:
            'New moon, first quarter, full moon and last quarter in a year or a single month, with exact UTC times. Full moons carry their traditional name; the full moon nearest the September equinox is the Harvest Moon and a second full moon in a month is a Blue Moon.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'year', in: 'query', required: true, schema: { type: 'integer', minimum: 1900, maximum: 2100 }, example: 2026 },
            { name: 'month', in: 'query', description: 'Limit to one month.', schema: { type: 'integer', minimum: 1, maximum: 12 } },
          ],
          responses: {
            '200': {
              description: 'The phases in time order.',
              headers: rateLimitHeaders,
              content: jsonContent({ type: 'object', required: ['data'], properties: { data: ref('MoonPhases') } }),
            },
            '422': errorResponse('A parameter is invalid.'),
            ...keyedErrors,
          },
        },
      },
      '/health': {
        get: {
          tags: ['Status'],
          operationId: 'getHealth',
          summary: 'Liveness check',
          description:
            'Answers if the API process is up. Cheap and unthrottled, so it suits load balancers and uptime monitors. It checks nothing else; use `/health/ready` for that. No API key needed.',
          responses: {
            '200': {
              description: 'The API is up.',
              content: jsonContent({
                type: 'object',
                required: ['status', 'time', 'uptimeSeconds'],
                properties: {
                  status: { type: 'string', enum: ['ok'] },
                  time: { type: 'string', format: 'date-time' },
                  uptimeSeconds: { type: 'integer' },
                },
              }),
            },
          },
        },
      },
      '/health/ready': {
        get: {
          tags: ['Status'],
          operationId: 'getReadiness',
          summary: 'Readiness check',
          description:
            'Runs the API\'s own component checks (database, plant data, frost and hardiness data, moon calculations, rate limiter). Answers `503` if any component is down, with the details in the body. Limited to 60 requests per minute per IP address. No API key needed.',
          responses: {
            '200': { description: 'Everything is operational or degraded.', content: jsonContent(ref('Readiness')) },
            '503': { description: 'At least one component is down.', content: jsonContent(ref('Readiness')) },
            '429': { description: 'Too many requests from this IP address.', content: jsonContent(ref('Error')) },
          },
        },
      },
      '/status': {
        get: {
          tags: ['Status'],
          operationId: 'getStatus',
          summary: 'Current status and history',
          description:
            'What the public status page shows: the state of each component, 90 days of daily uptime, 24 hours of response times, and incidents. Built from heartbeats recorded every minute by an external monitor; `monitoring.stale` is true if the monitor has stopped reporting. Cached for 15 seconds and limited to 60 requests per minute per IP address. No API key needed.',
          responses: {
            '200': {
              description: 'The status snapshot.',
              content: jsonContent({ type: 'object', required: ['data'], properties: { data: ref('StatusSnapshot') } }),
            },
            '429': { description: 'Too many requests from this IP address.', content: jsonContent(ref('Error')) },
          },
        },
      },
      '/auth/signup': {
        post: {
          tags: ['Auth'],
          operationId: 'signup',
          summary: 'Create an account',
          requestBody: {
            required: true,
            content: jsonContent({
              type: 'object',
              required: ['fullName', 'email', 'password', 'passwordConfirmation'],
              properties: {
                fullName: { ...nullable('string'), description: 'Required, but may be `null`.' },
                email: { type: 'string', format: 'email', maxLength: 254 },
                password: { type: 'string', minLength: 8, maxLength: 32 },
                passwordConfirmation: { type: 'string', description: 'Must equal `password`.' },
              },
            }),
          },
          responses: {
            '200': { description: 'The new account and its token.', content: jsonContent(ref('AuthResponse')) },
            '422': errorResponse('Validation failed, for example the email is already taken.'),
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          operationId: 'login',
          summary: 'Log in',
          requestBody: {
            required: true,
            content: jsonContent({
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string' },
              },
            }),
          },
          responses: {
            '200': { description: 'The account and a new token.', content: jsonContent(ref('AuthResponse')) },
            '400': errorResponse('Invalid credentials.'),
            '422': errorResponse('Validation failed.'),
            '429': {
              description:
                'Too many failed logins for this email address (10 in 15 minutes). Wait `Retry-After` seconds. A successful login resets the count.',
              headers: { 'Retry-After': { $ref: '#/components/headers/RetryAfter' } },
              content: jsonContent(ref('Error'), {
                errors: [{ message: 'Too many failed login attempts. Try again in 15 minutes.', retryAfterSeconds: 900 }],
              }),
            },
          },
        },
      },
      '/auth/verify-email': {
        post: {
          tags: ['Auth'],
          operationId: 'verifyEmail',
          summary: 'Confirm an email address',
          description:
            'Uses the single-use token from the confirmation email. It works whether or not you are signed in. Links expire after 24 hours, and requesting a new email invalidates older links.',
          requestBody: {
            required: true,
            content: jsonContent({
              type: 'object',
              required: ['token'],
              properties: { token: { type: 'string', description: 'The `token` from the emailed link.' } },
            }),
          },
          responses: {
            '200': {
              description: 'The address is confirmed.',
              content: jsonContent({
                type: 'object',
                required: ['data'],
                properties: { data: { type: 'object', required: ['verified'], properties: { verified: { type: 'boolean', enum: [true] } } } },
              }),
            },
            '400': errorResponse('The link is invalid, expired or already used.'),
            '422': errorResponse('The token is missing or malformed.'),
          },
        },
      },
      '/auth/forgot-password': {
        post: {
          tags: ['Auth'],
          operationId: 'forgotPassword',
          summary: 'Request a password reset email',
          description:
            'Always answers `200` with the same message, whether or not an account exists for the address, so it cannot be used to discover who has an account. If one does, a reset link is emailed (valid for 1 hour, single use). At most 3 emails per address per hour are sent; further requests are answered the same way but send nothing.',
          requestBody: {
            required: true,
            content: jsonContent({
              type: 'object',
              required: ['email'],
              properties: { email: { type: 'string', format: 'email' } },
            }),
          },
          responses: {
            '200': {
              description: 'The request was accepted.',
              content: jsonContent({
                type: 'object',
                required: ['data'],
                properties: { data: { type: 'object', required: ['message'], properties: { message: { type: 'string' } } } },
              }),
            },
            '422': errorResponse('The email address is malformed.'),
          },
        },
      },
      '/auth/reset-password': {
        post: {
          tags: ['Auth'],
          operationId: 'resetPassword',
          summary: 'Set a new password',
          description:
            'Uses the single-use token from the reset email. On success the password changes, **every session and token on the account is revoked** (sign in again afterwards), and any failed-login lockout is cleared. Completing a reset also confirms the email address.',
          requestBody: {
            required: true,
            content: jsonContent({
              type: 'object',
              required: ['token', 'password', 'passwordConfirmation'],
              properties: {
                token: { type: 'string' },
                password: { type: 'string', minLength: 8, maxLength: 32 },
                passwordConfirmation: { type: 'string', description: 'Must equal `password`.' },
              },
            }),
          },
          responses: {
            '200': {
              description: 'The password was changed.',
              content: jsonContent({
                type: 'object',
                required: ['data'],
                properties: { data: { type: 'object', required: ['reset'], properties: { reset: { type: 'boolean', enum: [true] } } } },
              }),
            },
            '400': errorResponse('The link is invalid, expired or already used.'),
            '422': errorResponse('The password is too short or the confirmation does not match. The link is not used up by a validation error.'),
          },
        },
      },
      '/account/resend-verification': {
        post: {
          tags: ['API keys'],
          operationId: 'resendVerification',
          summary: 'Resend the confirmation email',
          description: 'Sends the signed-in user a new confirmation email, at most 3 times an hour.',
          security: [{ BearerAuth: [] }],
          responses: {
            '200': {
              description: 'The email was queued, or the address was already confirmed.',
              content: jsonContent({
                type: 'object',
                required: ['data'],
                properties: {
                  data: {
                    type: 'object',
                    properties: { sent: { type: 'boolean' }, alreadyVerified: { type: 'boolean' } },
                  },
                },
              }),
            },
            '429': {
              description: 'Too many resends. Wait `Retry-After` seconds.',
              headers: { 'Retry-After': { $ref: '#/components/headers/RetryAfter' } },
              content: jsonContent(ref('Error')),
            },
            ...bearerErrors,
          },
        },
      },
      '/account/api-keys': {
        get: {
          tags: ['API keys'],
          operationId: 'listApiKeys',
          summary: 'List your API keys',
          description: 'Returns your active (not revoked) keys. The key values themselves are never returned.',
          security: [{ BearerAuth: [] }],
          responses: {
            '200': {
              description: 'Your active keys.',
              content: jsonContent({ type: 'object', required: ['data'], properties: { data: { type: 'array', items: ref('ApiKey') } } }),
            },
            ...bearerErrors,
          },
        },
        post: {
          tags: ['API keys'],
          operationId: 'createApiKey',
          summary: 'Create an API key',
          description:
            'The `key` in the response is shown **once**. Only a hash is stored, so a lost key cannot be recovered; revoke it and create a new one.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: jsonContent({
              type: 'object',
              required: ['name'],
              properties: { name: { type: 'string', minLength: 1, maxLength: 60, example: 'My garden app' } },
            }),
          },
          responses: {
            '200': {
              description: 'The new key.',
              content: jsonContent({
                type: 'object',
                required: ['data'],
                properties: {
                  data: {
                    type: 'object',
                    required: ['apiKey', 'key'],
                    properties: {
                      apiKey: ref('ApiKey'),
                      key: { type: 'string', description: 'The full API key. Shown only once.', example: 'pk_live_v3ryS3cr3tV4lu3...' },
                    },
                  },
                },
              }),
            },
            '403': errorResponse('The email address is not confirmed yet.', {
              errors: [{ message: 'Confirm your email address to create API keys.', code: 'EMAIL_NOT_VERIFIED' }],
            }),
            '422': errorResponse('The name is invalid, or you already have the maximum number of active keys for your tier.', {
              errors: [{ message: `You can have at most ${tiers.free.maxKeys} active API keys. Revoke one first.` }],
            }),
            ...bearerErrors,
          },
        },
      },
      '/account/api-keys/{id}': {
        delete: {
          tags: ['API keys'],
          operationId: 'revokeApiKey',
          summary: 'Revoke an API key',
          description: 'The key stops working immediately. Its usage history is kept.',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            '204': { description: 'Revoked.' },
            '404': errorResponse('No active key with that id on your account.'),
            ...bearerErrors,
          },
        },
      },
      '/account/api-keys/{id}/usage': {
        get: {
          tags: ['API keys'],
          operationId: 'getApiKeyUsage',
          summary: 'Get usage for an API key',
          description: 'Daily request counts (UTC days), including days with no traffic.',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
            { name: 'days', in: 'query', description: 'How many days to return, ending today.', schema: { type: 'integer', minimum: 1, maximum: 90, default: 30 } },
          ],
          responses: {
            '200': {
              description: 'Usage series and totals.',
              content: jsonContent({ type: 'object', required: ['data'], properties: { data: ref('ApiKeyUsage') } }),
            },
            '404': errorResponse('No key with that id on your account.'),
            '422': errorResponse('`days` is invalid.'),
            ...bearerErrors,
          },
        },
      },
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Your API key, for example `pk_live_...`. Create one with `POST /account/api-keys`.',
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'The account `token` from `POST /auth/signup` or `POST /auth/login`.',
        },
      },
      parameters: {
        Zip: {
          name: 'zip',
          in: 'query',
          description: 'US ZIP code (5 digits). Use this or `lat` and `lon`.',
          schema: { type: 'string', pattern: '^\\d{5}$' },
          example: '02134',
        },
        Lat: { name: 'lat', in: 'query', description: 'Latitude. Use with `lon`.', schema: { type: 'number', minimum: -90, maximum: 90 } },
        Lon: { name: 'lon', in: 'query', description: 'Longitude. Use with `lat`.', schema: { type: 'number', minimum: -180, maximum: 180 } },
        Year: { name: 'year', in: 'query', description: 'Year for the dates. Defaults to the current year.', schema: { type: 'integer', minimum: 1900, maximum: 2100 } },
      },
      headers: {
        RateLimitLimit: { description: 'Requests allowed per minute.', schema: { type: 'integer' } },
        RateLimitRemaining: { description: 'Requests left in the current minute.', schema: { type: 'integer' } },
        RateLimitReset: { description: 'Seconds until the per-minute window resets.', schema: { type: 'integer' } },
        RateLimitDailyLimit: { description: 'Requests allowed per UTC day.', schema: { type: 'integer' } },
        RateLimitDailyRemaining: { description: 'Requests left today (UTC).', schema: { type: 'integer' } },
        RetryAfter: { description: 'Seconds to wait before retrying.', schema: { type: 'integer' } },
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['errors'],
          properties: {
            errors: {
              type: 'array',
              items: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string' },
                  code: { type: 'string', description: 'A stable machine-readable code on some errors, for example `EMAIL_NOT_VERIFIED`.' },
                  rule: { type: 'string', description: 'Validation rule that failed.' },
                  field: { type: 'string', description: 'The invalid input field.' },
                  meta: { type: 'object', additionalProperties: true },
                  retryAfterSeconds: { type: 'integer', description: 'Only on 429 responses.' },
                },
              },
            },
          },
        },
        PlantType: { type: 'string', enum: ['vegetable', 'herb', 'fruit', 'flower', 'shrub', 'tree'] },
        LifeCycle: { type: 'string', enum: ['annual', 'biennial', 'perennial'] },
        Sun: { type: 'string', enum: ['full', 'partial', 'shade'] },
        WaterNeeds: { type: 'string', enum: ['low', 'medium', 'high'] },
        FrostTolerance: {
          type: 'string',
          enum: ['tender', 'half_hardy', 'hardy'],
          description: '`tender` plants die in frost, `half_hardy` survive light frost, `hardy` survive hard frost.',
        },
        PlantSummary: {
          type: 'object',
          required: ['id', 'slug', 'commonName'],
          properties: {
            id: { type: 'integer' },
            slug: { type: 'string', example: 'tomato' },
            commonName: { type: 'string', example: 'Tomato' },
            scientificName: nullable('string'),
            family: nullable('string'),
            plantType: { oneOf: [ref('PlantType'), { type: 'null' }] },
            lifeCycle: { oneOf: [ref('LifeCycle'), { type: 'null' }] },
            imageUrl: nullable('string'),
            sun: { oneOf: [ref('Sun'), { type: 'null' }] },
            waterNeeds: { oneOf: [ref('WaterNeeds'), { type: 'null' }] },
            frostTolerance: { oneOf: [ref('FrostTolerance'), { type: 'null' }] },
          },
        },
        PageMetadata: {
          type: 'object',
          required: ['total', 'perPage', 'currentPage', 'lastPage'],
          properties: {
            total: { type: 'integer' },
            perPage: { type: 'integer' },
            currentPage: { type: 'integer' },
            lastPage: { type: 'integer' },
            firstPage: { type: 'integer' },
            firstPageUrl: { type: 'string' },
            lastPageUrl: { type: 'string' },
            nextPageUrl: nullable('string'),
            previousPageUrl: nullable('string'),
          },
        },
        PlantPage: {
          type: 'object',
          required: ['data', 'metadata'],
          properties: {
            data: { type: 'array', items: ref('PlantSummary') },
            metadata: ref('PageMetadata'),
          },
        },
        Range: range,
        PlantName: {
          type: 'object',
          required: ['name', 'language'],
          properties: { name: { type: 'string' }, language: { type: 'string', example: 'en' } },
        },
        CompanionPlant: {
          type: 'object',
          required: ['slug', 'commonName'],
          properties: {
            slug: { type: 'string' },
            commonName: { type: 'string' },
            reason: { ...nullable('string'), description: 'Why the pair works or fails, and how well documented that is.' },
          },
        },
        Companions: {
          type: 'object',
          required: ['beneficial', 'antagonistic', 'culinary'],
          description: 'Companion plants grouped by relationship. Relationships are symmetric.',
          properties: {
            beneficial: { type: 'array', items: ref('CompanionPlant'), description: 'Plants that grow well together.' },
            antagonistic: { type: 'array', items: ref('CompanionPlant'), description: 'Plants to keep apart.' },
            culinary: { type: 'array', items: ref('CompanionPlant'), description: 'Plants that are used together in cooking.' },
          },
        },
        PlantAmendment: {
          type: 'object',
          required: ['slug', 'name'],
          properties: {
            slug: { type: 'string', example: 'coffee-grounds' },
            name: { type: 'string', example: 'Coffee grounds' },
            effect: { ...nullable('string'), description: 'What it does for this plant, including when to avoid it.' },
          },
        },
        PlantSource: {
          type: 'object',
          required: ['source', 'license'],
          properties: {
            source: { type: 'string', example: 'usda_plants' },
            license: { type: 'string', example: 'US-Government-Public-Domain' },
            attribution: nullable('string'),
          },
        },
        PlantDetail: {
          allOf: [
            {
              type: 'object',
              required: ['id', 'slug', 'commonName', 'usda', 'names', 'care', 'growth', 'planting', 'companions', 'amendments', 'sources'],
              properties: {
                id: { type: 'integer' },
                slug: { type: 'string' },
                commonName: { type: 'string' },
                scientificName: nullable('string'),
                family: nullable('string'),
                genus: nullable('string'),
                plantType: { oneOf: [ref('PlantType'), { type: 'null' }] },
                lifeCycle: { oneOf: [ref('LifeCycle'), { type: 'null' }] },
                description: nullable('string'),
                imageUrl: nullable('string'),
                usdaSymbol: { ...nullable('string'), description: 'Symbol in the USDA PLANTS Database.', example: 'SOLY2' },
                wikidataId: nullable('string'),
                gbifId: nullable('string'),
                usda: {
                  type: 'object',
                  description: 'Traits from the USDA PLANTS profile. Null where USDA has no entry.',
                  properties: {
                    durations: { ...nullable('array'), items: { type: 'string', example: 'Perennial' }, description: 'Annual, Biennial and/or Perennial. A plant can have several because it varies with climate.' },
                    growthHabits: { ...nullable('array'), items: { type: 'string', example: 'Forb/herb' }, description: 'For example Forb/herb, Graminoid, Shrub, Subshrub, Tree or Vine.' },
                    nativeStatus: { type: ['string', 'null'], enum: ['native', 'introduced', 'native_and_introduced', null], description: 'Whether the plant is native to the lower 48 US states.' },
                  },
                },
                names: { type: 'array', items: ref('PlantName') },
                care: {
                  type: 'object',
                  properties: {
                    sun: { oneOf: [ref('Sun'), { type: 'null' }] },
                    waterNeeds: { oneOf: [ref('WaterNeeds'), { type: 'null' }] },
                    wateringIntervalDays: { ...nullable('integer'), description: 'Typical days between waterings in average conditions.' },
                    soilPh: ref('Range'),
                    soilTypes: { oneOf: [{ type: 'array', items: { type: 'string' } }, { type: 'null' }] },
                    hardinessZones: { ...ref('Range'), description: 'USDA hardiness zone range of the plant. `null` for annuals. Tender perennials that are usually grown as annuals (such as sweet potato) list the zones where they survive winter.' },
                    frostTolerance: { oneOf: [ref('FrostTolerance'), { type: 'null' }] },
                  },
                },
                growth: {
                  type: 'object',
                  properties: {
                    daysToGermination: ref('Range'),
                    daysToHarvest: { ...ref('Range'), description: 'Days from sowing or transplanting to first harvest.' },
                    spacingCm: nullable('integer'),
                    heightCm: nullable('integer'),
                  },
                },
                planting: {
                  type: 'object',
                  description: 'Planting windows in weeks relative to the average last spring frost. Negative is before the frost date.',
                  properties: {
                    sowIndoorsWeeks: ref('Range'),
                    directSowWeeks: ref('Range'),
                    transplantWeeks: ref('Range'),
                  },
                },
                companions: ref('Companions'),
                amendments: { type: 'array', items: ref('PlantAmendment') },
                sources: { type: 'array', items: ref('PlantSource') },
              },
            },
          ],
        },
        Location: {
          type: 'object',
          required: ['zip', 'latitude', 'longitude'],
          properties: {
            zip: { ...nullable('string'), description: '`null` when the location was given as coordinates.' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
          },
        },
        FrostStation: {
          type: 'object',
          required: ['id', 'name', 'latitude', 'longitude', 'distanceKm'],
          description: 'The NOAA weather station the frost dates come from.',
          properties: {
            id: { type: 'string', example: 'USC00193890' },
            name: { type: 'string', example: 'JAMAICA PLAIN, MA US' },
            state: nullable('string'),
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            elevationM: nullable('number'),
            distanceKm: { type: 'number', description: 'Distance from the requested location.' },
          },
        },
        FrostRisks: {
          type: 'object',
          required: ['conservative', 'average', 'optimistic'],
          description:
            'Three dates by risk. `conservative` is the cautious date: late in spring, early in fall (NOAA 10% probability). `average` is the median. `optimistic` is early in spring, late in fall (90% probability).',
          properties: {
            conservative: { type: 'string', format: 'date' },
            average: { type: 'string', format: 'date' },
            optimistic: { type: 'string', format: 'date' },
          },
        },
        FrostResponse: {
          type: 'object',
          required: ['location', 'station', 'year', 'lastSpringFrost', 'firstFallFrost', 'mildWinter', 'frostFreeDays', 'notes'],
          properties: {
            location: ref('Location'),
            station: ref('FrostStation'),
            year: { type: 'integer' },
            lastSpringFrost: ref('FrostRisks'),
            firstFallFrost: ref('FrostRisks'),
            mildWinter: {
              type: 'boolean',
              description: 'True where freezes are infrequent and mostly happen in mid-winter. The season then wraps around New Year: a "first fall" date can fall in the following January.',
            },
            frostFreeDays: { type: 'integer', description: 'Days between the average last spring and average first fall freeze.' },
            notes: { type: 'array', items: { type: 'string' } },
          },
        },
        ClimateResponse: {
          type: 'object',
          required: ['location', 'station', 'period', 'temperatureF', 'annualPrecipitationIn', 'annualSnowfallIn', 'growingDegreeDays'],
          properties: {
            location: ref('Location'),
            station: ref('FrostStation'),
            period: { type: 'string', example: '1991-2020' },
            temperatureF: {
              type: 'object',
              properties: {
                average: nullable('number'),
                averageLow: nullable('number'),
                averageHigh: nullable('number'),
              },
            },
            annualPrecipitationIn: { ...nullable('number'), description: 'Inches of precipitation in a normal year.' },
            annualSnowfallIn: { ...nullable('number'), description: 'Inches of snowfall in a normal year.' },
            precipitationStation: { oneOf: [ref('FrostStation'), { type: 'null' }], description: 'The station the precipitation comes from when it is not the main station (which does not report it).' },
            snowfallStation: { oneOf: [ref('FrostStation'), { type: 'null' }], description: 'The station the snowfall comes from when it is not the main station.' },
            growingDegreeDays: {
              type: 'object',
              description: 'Heat accumulated in a normal year, in degree-days F, counting only the days above each base temperature. Used to predict plant and insect development.',
              properties: {
                base40F: nullable('number'),
                base50F: nullable('number'),
                base60F: nullable('number'),
              },
            },
          },
        },
        Readiness: {
          type: 'object',
          required: ['status', 'time', 'checks'],
          properties: {
            status: { type: 'string', enum: ['operational', 'degraded', 'down'], description: 'The worst component status.' },
            time: { type: 'string', format: 'date-time' },
            checks: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'status', 'latencyMs', 'message'],
                properties: {
                  id: { type: 'string', enum: ['database', 'plants', 'climate', 'moon', 'rate_limiter'] },
                  status: { type: 'string', enum: ['operational', 'degraded', 'down'] },
                  latencyMs: { type: 'integer' },
                  message: nullable('string'),
                },
              },
            },
          },
        },
        StatusSnapshot: {
          type: 'object',
          required: ['status', 'updatedAt', 'monitoring', 'components', 'incidents'],
          properties: {
            status: {
              type: 'string',
              enum: ['operational', 'degraded', 'partial_outage', 'major_outage', 'unknown'],
              description:
                '`major_outage` if the API itself is down, `partial_outage` if any other component is down, `degraded` if any is slow, `unknown` if monitoring has stopped reporting.',
            },
            updatedAt: { type: 'string', format: 'date-time' },
            monitoring: {
              type: 'object',
              required: ['lastHeartbeatAt', 'stale'],
              properties: {
                lastHeartbeatAt: { type: ['string', 'null'], format: 'date-time' },
                stale: { type: 'boolean', description: 'True when no heartbeat has arrived for 3 minutes.' },
              },
            },
            components: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'name', 'description', 'status', 'latencyMs', 'message', 'checkedAt', 'uptime90d', 'days', 'latency'],
                properties: {
                  id: { type: 'string', enum: ['api', 'database', 'plants', 'climate', 'moon', 'rate_limiter'] },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  status: { type: 'string', enum: ['operational', 'degraded', 'down', 'unknown'] },
                  latencyMs: nullable('integer'),
                  message: nullable('string'),
                  checkedAt: { type: ['string', 'null'], format: 'date-time' },
                  uptime90d: { ...nullable('number'), description: 'Percent of probes in the last 90 days that were not down.' },
                  days: {
                    type: 'array',
                    description: 'Exactly 90 days, oldest first, ending today (UTC).',
                    items: {
                      type: 'object',
                      required: ['day', 'status', 'checks', 'uptime'],
                      properties: {
                        day: { type: 'string', format: 'date' },
                        status: { type: 'string', enum: ['operational', 'degraded', 'outage', 'no_data'] },
                        checks: { type: 'integer' },
                        uptime: nullable('number'),
                      },
                    },
                  },
                  latency: {
                    type: 'array',
                    description: 'Average response time per 30 minutes over the last 24 hours.',
                    items: {
                      type: 'object',
                      required: ['at', 'ms'],
                      properties: { at: { type: 'string', format: 'date-time' }, ms: { type: 'integer' } },
                    },
                  },
                },
              },
            },
            incidents: {
              type: 'object',
              required: ['active', 'recent'],
              properties: {
                active: { type: 'array', items: ref('Incident') },
                recent: { type: 'array', description: 'Resolved in the last 30 days, newest first.', items: ref('Incident') },
              },
            },
          },
        },
        Incident: {
          type: 'object',
          required: ['id', 'component', 'componentName', 'severity', 'title', 'message', 'startedAt', 'resolvedAt', 'durationMinutes'],
          properties: {
            id: { type: 'integer' },
            component: { type: 'string' },
            componentName: { type: 'string' },
            severity: { type: 'string', enum: ['degraded', 'down'] },
            title: { type: 'string' },
            message: nullable('string'),
            startedAt: { type: 'string', format: 'date-time' },
            resolvedAt: { type: ['string', 'null'], format: 'date-time' },
            durationMinutes: { type: 'integer' },
          },
        },
        HardinessResponse: {
          type: 'object',
          required: ['zip', 'zone', 'temperatureRangeF', 'title', 'attribution'],
          properties: {
            zip: { type: 'string' },
            zone: { type: 'string', description: 'USDA zone with half-zone letter, exactly as published.', example: '6b' },
            temperatureRangeF: {
              type: 'string',
              description: 'Average annual extreme minimum temperature range in °F, exactly as published.',
              example: '-5 to 0',
            },
            title: { type: 'string', description: 'The published zone title.', example: '6b: -5 to 0' },
            attribution: {
              type: 'object',
              required: ['dataset', 'source', 'owner', 'notice', 'url', 'termsUrl', 'officialMapUrl'],
              description: 'Credit that must accompany this data. Please show it wherever you display the zone.',
              properties: {
                dataset: { type: 'string' },
                source: { type: 'string' },
                owner: { type: 'string' },
                notice: { type: 'string' },
                url: { type: 'string', format: 'uri' },
                termsUrl: { type: 'string', format: 'uri' },
                officialMapUrl: { type: 'string', format: 'uri' },
              },
            },
          },
        },
        DateWindow: {
          oneOf: [
            {
              type: 'object',
              required: ['start', 'end'],
              properties: { start: { type: 'string', format: 'date' }, end: { type: 'string', format: 'date' } },
            },
            { type: 'null' },
          ],
        },
        PlantCalendar: {
          type: 'object',
          required: ['slug', 'commonName', 'windows', 'harvest', 'warnings'],
          properties: {
            slug: { type: 'string' },
            commonName: { type: 'string' },
            frostTolerance: { oneOf: [ref('FrostTolerance'), { type: 'null' }] },
            windows: {
              type: 'object',
              required: ['sowIndoors', 'directSow', 'transplant'],
              properties: {
                sowIndoors: ref('DateWindow'),
                directSow: ref('DateWindow'),
                transplant: ref('DateWindow'),
              },
            },
            harvest: {
              description:
                'Estimated first harvest, from the transplant window (or the direct sowing window when the plant is not transplanted) plus days to harvest. `null` when there is no planting window.',
              oneOf: [
                {
                  type: 'object',
                  required: ['earliest', 'latest'],
                  properties: { earliest: { type: 'string', format: 'date' }, latest: { type: 'string', format: 'date' } },
                },
                { type: 'null' },
              ],
            },
            warnings: {
              type: 'array',
              items: { type: 'string' },
              description: 'For example, that a frost-tender plant may not finish before the first fall frost.',
            },
          },
        },
        CalendarResponse: {
          type: 'object',
          required: ['location', 'station', 'year', 'risk', 'lastSpringFrost', 'firstFallFrost', 'mildWinter', 'notes', 'plants'],
          properties: {
            location: ref('Location'),
            station: ref('FrostStation'),
            year: { type: 'integer' },
            risk: { type: 'string', enum: ['conservative', 'average', 'optimistic'] },
            lastSpringFrost: { type: 'string', format: 'date', description: 'The last spring frost date used for the risk level chosen.' },
            firstFallFrost: { type: 'string', format: 'date', description: 'The first fall frost date used for the risk level chosen.' },
            mildWinter: { type: 'boolean' },
            notes: { type: 'array', items: { type: 'string' } },
            plants: { type: 'array', items: ref('PlantCalendar') },
          },
        },
        MoonDay: {
          type: 'object',
          required: ['date', 'computedFor', 'phase', 'phaseAngle', 'illumination', 'ageDays', 'waxing', 'nextNewMoon', 'nextFullMoon', 'traditionalGuidance'],
          properties: {
            date: { type: 'string', format: 'date' },
            computedFor: { type: 'string', format: 'date-time', description: 'The instant the values are calculated for: noon UTC on `date`.' },
            phase: {
              type: 'string',
              enum: ['new_moon', 'waxing_crescent', 'first_quarter', 'waxing_gibbous', 'full_moon', 'waning_gibbous', 'last_quarter', 'waning_crescent'],
              description: 'The nearest of eight 45-degree phase bins, so each named phase spans a few days.',
            },
            phaseAngle: { type: 'number', description: 'Degrees from the sun: 0 new, 90 first quarter, 180 full, 270 last quarter.' },
            illumination: { type: 'number', description: 'Percent of the visible disc lit, 0 to 100.' },
            ageDays: { type: 'number', description: 'Days since the last new moon.' },
            waxing: { type: 'boolean' },
            nextNewMoon: { type: 'string', format: 'date-time' },
            nextFullMoon: {
              type: 'object',
              required: ['at', 'name'],
              properties: { at: { type: 'string', format: 'date-time' }, name: { type: 'string', example: "Hunter's Moon" } },
            },
            traditionalGuidance: {
              type: 'object',
              required: ['basis', 'stage', 'suggests'],
              description: 'Folklore, not agronomy: moon-phase planting has no consistent support in controlled studies.',
              properties: {
                basis: { type: 'string', enum: ['traditional'] },
                stage: { type: 'string', enum: ['waxing', 'waning'] },
                suggests: { type: 'string' },
              },
            },
          },
        },
        MoonPhases: {
          type: 'object',
          required: ['year', 'month', 'phases'],
          properties: {
            year: { type: 'integer' },
            month: nullable('integer'),
            phases: {
              type: 'array',
              items: {
                type: 'object',
                required: ['phase', 'at'],
                properties: {
                  phase: { type: 'string', enum: ['new_moon', 'first_quarter', 'full_moon', 'last_quarter'] },
                  at: { type: 'string', format: 'date-time' },
                  name: { type: 'string', description: 'Only on full moons, for example "Harvest Moon" or "Blue Moon".' },
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          required: ['id', 'email', 'emailVerified'],
          properties: {
            id: { type: 'integer' },
            fullName: nullable('string'),
            email: { type: 'string', format: 'email' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: ['string', 'null'], format: 'date-time' },
            initials: { type: 'string' },
            emailVerified: { type: 'boolean', description: 'Whether the email address has been confirmed. Unconfirmed accounts cannot create API keys.' },
          },
        },
        AuthResponse: {
          type: 'object',
          required: ['data'],
          properties: {
            data: {
              type: 'object',
              required: ['user', 'token'],
              properties: {
                user: ref('User'),
                token: { type: 'string', description: 'Send as `Authorization: Bearer <token>`.' },
              },
            },
          },
        },
        ApiKey: {
          type: 'object',
          required: ['id', 'name', 'prefix', 'tier', 'limits'],
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            prefix: { type: 'string', description: 'First characters of the key, to tell keys apart.', example: 'pk_live_bmNq' },
            tier: { type: 'string', enum: Object.keys(tiers) },
            lastUsedAt: { type: ['string', 'null'], format: 'date-time' },
            revokedAt: { type: ['string', 'null'], format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            limits: {
              type: 'object',
              required: ['perMinute', 'perDay'],
              properties: { perMinute: { type: 'integer' }, perDay: { type: 'integer' } },
            },
          },
        },
        UsageCounts: {
          type: 'object',
          required: ['requests', 'errors', 'rateLimited'],
          properties: {
            requests: { type: 'integer', description: 'Requests that passed authentication and the rate limits.' },
            errors: { type: 'integer', description: 'Of those, requests that returned a 4xx or 5xx response.' },
            rateLimited: { type: 'integer', description: 'Requests rejected with 429.' },
          },
        },
        ApiKeyUsage: {
          type: 'object',
          required: ['apiKey', 'days', 'totals', 'series'],
          properties: {
            apiKey: ref('ApiKey'),
            days: { type: 'integer' },
            totals: ref('UsageCounts'),
            series: {
              type: 'array',
              items: {
                allOf: [
                  ref('UsageCounts'),
                  {
                    type: 'object',
                    required: ['day'],
                    properties: { day: { type: 'string', format: 'date', description: 'UTC day.' } },
                  },
                ],
              },
            },
          },
        },
      },
    },
  }
}
