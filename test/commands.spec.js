'use strict'

/**
 * adonis-notifications
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

/* global describe, it, after, before */
const chai = require('chai')
const expect = chai.expect
const fold = require('adonis-fold')
const Ioc = fold.Ioc
const setup = require('./setup')
const path = require('path')
const fs = require('co-fs-extra')
require('co-mocha')

describe('Commands', function () {
  before(function * () {
    yield setup.loadProviders()
    yield setup.createStorageDir()

    setup.registerCommands()

    const Lucid = Ioc.use('Adonis/Src/Lucid')
    class User extends Lucid {}
    Ioc.bind('App/Model/User', function () {
      return User
    })

    this.database = Ioc.use('Adonis/Src/Database')
  })

  after(function * () {
    yield setup.cleanStorageDir()
    yield fs.remove(path.join(__dirname, './Model'))
    yield fs.emptyDir(path.join(__dirname, './database/migrations'))
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
