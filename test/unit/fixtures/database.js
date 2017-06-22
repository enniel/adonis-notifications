'use strict'

/**
 * adonis-notifications
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

const bluebird = require('bluebird')
const files = require('./files')

module.exports = {
  setupTables: function (knex) {
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
        table.text('data')
        table.timestamp('read_at').nullable()
        table.timestamps()
      })
    ]
    return bluebird.all(tables)
  },
  dropTables: function (knex) {
    const tables = [
      knex.schema.dropTable('users'),
      knex.schema.dropTable('notifications')
    ]
    return bluebird.all(tables)
  },
  createRecords: function * (knex, table, values) {
    return yield knex.table(table).insert(values).returning('id')
  },
  truncate: function * (knex, table) {
    yield knex.table(table).truncate()
  },
  up: function * (knex) {
    yield files.createDir()
    yield this.setupTables(knex)
  },
  down: function * (knex) {
    yield this.dropTables(knex)
  }
}
