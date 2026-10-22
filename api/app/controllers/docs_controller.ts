import { buildOpenApiSpec } from '#services/openapi_spec'
import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'

// Pinned so the docs page does not change under us.
const SCALAR_VERSION = '1.59.3'

const baseUrl = () => env.get('APP_URL').replace(/\/$/, '')

export default class DocsController {
  spec({ response }: HttpContext) {
    return response.json(buildOpenApiSpec(baseUrl()))
  }

  ui({ response }: HttpContext) {
    return response.type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Plants API Reference</title>
  </head>
  <body>
    <script id="api-reference" data-url="/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@${SCALAR_VERSION}"></script>
  </body>
</html>
`)
  }
}
