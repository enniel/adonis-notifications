'use strict'

module.exports = {
  setupTables (knex) {
    const tables = [
      knex.schema.createTable('users', function (table) {
        table.increments()
        table.timestamps()
        table.string('username')
        table.string('email')
        table.string('password')
      }),
      knex.schema.createTable('notifications', function (table) {
        table.uuid('id').primary()
        table.string('type')
        table.integer('notifiable_id').unsigned().nullable()
        table.string('notifiable_type').nullable()
        table.jsonb('data')
        table.timestamp('read_at').nullable()
        table.timestamps()
      })
    ]
    return Promise.all(tables)
  },
  dropTables (knex) {
    const tables = [
      knex.schema.dropTable('users'),
      knex.schema.dropTable('notifications')
    ]
    return Promise.all(tables)
  },
  createRecords (knex, table, values) {
    return knex.table(table).insert(values).returning('id')
  },
  truncate (knex, table) {
    return knex.table(table).truncate()
  },
  up (knex) {
    return this.setupTables(knex)
  },
  down (knex) {
    return this.dropTables(knex)
  }
}
