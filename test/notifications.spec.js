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
    // create folders
    yield setup.createStorageDir()
    yield setup.createMigrationsDir()

    const Lucid = fold.Ioc.use('Adonis/Src/Lucid')
    class User extends Lucid {
      static get traits () {
        return [
          'Adonis/Lucid/MorphTrait',
          'Adonis/Notifications/Notifiable',
          'Adonis/Notifications/HasDatabaseNotifications'
        ]
      }
    }
    fold.Ioc.bind('App/Model/User', function () {
      return User
    })
    const Schema = fold.Ioc.use('Adonis/Src/Schema')
    class UserSchema extends Schema {
      up () {
        this.create('users', function (table) {
          table.increments()
          table.string('username')
          table.string('email')
          table.string('password')
          table.timestamps()
        })
      }

      down () {
        this.drop('users')
      }
    }
    const Factory = fold.Ioc.use('Adonis/Src/Factory')
    Factory.blueprint('App/Model/User', function (fake) {
      return {
        username: fake.username(),
        email: fake.email(),
        password: fake.password()
      }
    })
    class UserSeed {
      * run () {
        yield Factory.model('App/Model/User').create(5)
      }
    }
    this.migrations = {}
    this.migrations[new Date().getTime() + '_create_users_table'] = UserSchema
    // run migration for users table
    yield setup.migrate(this.migrations, 'down')
    yield setup.migrate(this.migrations, 'up')
    // create notifications table
    yield setup.invokeCommand('notifications:setup')
    // run migration for notifications table
    yield setup.invokeCommand('migration:run')
    // seed users table
    yield setup.seed([UserSeed])

    this.User = User

    this.database = fold.Ioc.use('Adonis/Src/Database')
    this.manager = fold.Ioc.use('Adonis/Notifications/Manager')
  })

  after(function * () {
    yield this.database.schema.dropTableIfExists('users')
    yield this.database.schema.dropTableIfExists('notifications')
    yield this.database.schema.dropTableIfExists('adonis_migrations')
    // remove folders
    yield setup.removeMigrationsDir()
    yield setup.removeStorageDir()
  })

  it('should create the notifications table using migrations', function * () {
    const notificationsTable = yield this.database.table('notifications').columnInfo()
    expect(notificationsTable).to.be.an('object')
    expect(Object.keys(notificationsTable))
      .deep
      .equal([
        'id', 'type', 'notifiable_id', 'notifiable_type', 'data', 'read_at', 'created_at', 'updated_at'
      ])
  })

  it('should send notification to one user', function * () {
    const User = fold.Ioc.use('App/Model/User')
    User.bootIfNotBooted()
    class TestNotification {
      static get type () {
        return 'test'
      }

      via () {
        return ['database']
      }

      toJSON () {
        return {
          foo: 'bar'
        }
      }
    }
    const user = yield User.first()
    yield user.notify(new TestNotification())
  })

  it('should send notification to many users', function * () {
    const User = fold.Ioc.use('App/Model/User')
    User.bootIfNotBooted()
    class TestNotification {
      static get type () {
        return 'test'
      }

      via () {
        return ['database']
      }

      toJSON () {
        return {
          foo: 'bar'
        }
      }
    }
    const users = yield User.all()
    yield this.manager.send(users, new TestNotification())
  })
})
