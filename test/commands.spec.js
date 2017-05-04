'use strict'

/**
 * adonis-notifications
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

/* global describe, it, after, before */
const expect = require('chai').expect
const fold = require('adonis-fold')
const setup = require('./setup')
require('co-mocha')

describe('Commands', function () {
  before(function * () {
    yield setup.loadProviders()

    setup.registerCommands()

    const Lucid = fold.Ioc.use('Adonis/Src/Lucid')
    class User extends Lucid {}
    fold.Ioc.bind('App/Model/User', function () {
      return User
    })

    // create folders
    yield setup.createStorageDir()
    yield setup.createMigrationsDir()
    yield setup.createModelDir()

    this.database = fold.Ioc.use('Adonis/Src/Database')
  })

  after(function * () {
    // remove folders
    yield setup.removeStorageDir()
    yield setup.removeMigrationsDir()
    yield setup.removeModelDir()
  })

  it('should create the notifications table using migrations', function * () {
    yield setup.invokeCommand('notifications:setup')
    yield setup.invokeCommand('migration:run')
    const notificationsTable = yield this.database.table('notifications').columnInfo()
    expect(notificationsTable).to.be.an('object')
    expect(Object.keys(notificationsTable))
      .deep
      .equal([
        'id', 'type', 'notifiable_id', 'notifiable_type', 'data', 'read_at', 'created_at', 'updated_at'
      ])
  })
})
