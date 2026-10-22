import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Monitoring data behind the public status page.
 *
 * - heartbeats: one row per component per probe. Kept for a couple of days to
 *   draw recent latency, then pruned.
 * - heartbeat_daily: per-day counters per component. Kept long term; this is
 *   what the 90-day uptime bars read.
 * - incidents: opened automatically after consecutive failed probes and
 *   resolved after consecutive good ones.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.createTable('heartbeats', (table) => {
      table.increments('id').notNullable()
      table.string('component', 32).notNullable()
      // operational | degraded | down
      table.string('status', 16).notNullable()
      table.integer('latency_ms').nullable()
      table.text('message').nullable()
      table.timestamp('checked_at').notNullable().index()

      table.index(['component', 'checked_at'])
    })

    this.schema.createTable('heartbeat_daily', (table) => {
      table.increments('id').notNullable()
      table.string('component', 32).notNullable()
      // UTC calendar day, YYYY-MM-DD.
      table.string('day', 10).notNullable()
      table.integer('checks').notNullable().defaultTo(0)
      table.integer('operational').notNullable().defaultTo(0)
      table.integer('degraded').notNullable().defaultTo(0)
      table.integer('down').notNullable().defaultTo(0)
      table.integer('latency_sum_ms').notNullable().defaultTo(0)
      table.integer('latency_samples').notNullable().defaultTo(0)

      table.unique(['component', 'day'])
    })

    this.schema.createTable('incidents', (table) => {
      table.increments('id').notNullable()
      table.string('component', 32).notNullable().index()
      // degraded | down
      table.string('severity', 16).notNullable()
      table.string('title').notNullable()
      table.text('message').nullable()
      table.timestamp('started_at').notNullable().index()
      table.timestamp('resolved_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable('incidents')
    this.schema.dropTable('heartbeat_daily')
    this.schema.dropTable('heartbeats')
  }
}
