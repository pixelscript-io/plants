/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  // Node
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  // App
  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),

  // Plants API: serve rows that have not been marked is_published yet
  SERVE_UNPUBLISHED: Env.schema.boolean.optional(),

  // Session
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory', 'database'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring the limiter package
  |----------------------------------------------------------
  */
  LIMITER_STORE: Env.schema.enum(['database', 'memory'] as const),

  // Email. "file" writes each message to tmp/mail for development; production
  // must use "smtp" (see app/services/mailer.ts).
  MAIL_TRANSPORT: Env.schema.enum.optional(['file', 'smtp'] as const),
  MAIL_FROM: Env.schema.string.optional(),
  SMTP_HOST: Env.schema.string.optional(),
  SMTP_PORT: Env.schema.number.optional(),
  SMTP_USER: Env.schema.string.optional(),
  SMTP_PASSWORD: Env.schema.string.optional(),
  SMTP_SECURE: Env.schema.boolean.optional(),

  // Where the SQLite database file lives (default: tmp/db.sqlite3).
  SQLITE_PATH: Env.schema.string.optional(),

  // Public address of the dashboard, used for links in emails.
  WEB_URL: Env.schema.string.optional(),
})
