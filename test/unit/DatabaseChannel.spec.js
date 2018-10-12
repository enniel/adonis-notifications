'use strict'

require('@adonisjs/lucid/lib/iocResolver').setFold(require('@adonisjs/fold'))
const test = require('japa')
const uuid = require('uuid/v4')
const fs = require('fs-extra')
const path = require('path')
const { ioc } = require('@adonisjs/fold')
const { Config, setupResolver } = require('@adonisjs/sink')
const Model = require('@adonisjs/lucid/src/Lucid/Model')
const DatabaseManager = require('@adonisjs/lucid/src/Database/Manager')
const Morphable = require('adonis-lucid-polymorphic/src/Traits/Morphable')
const DatabaseChannel = require('../../src/Channels/DatabaseChannel')
const DatabaseMessage = require('../../src/Messages/DatabaseMessage')

const fixtures = require('../fixtures')

test.group('DatabaseChannel', (group) => {
  group.before(async function () {
    ioc.singleton('Adonis/Src/Config', function () {
      const config = new Config()
      config.set('database', require('../config'))
      return config
    })
    ioc.alias('Adonis/Src/Config', 'Config')
    ioc.singleton('Adonis/Src/Database', function (app) {
      return new DatabaseManager(app.use('Config'))
    })
    ioc.alias('Adonis/Src/Database', 'Database')
    ioc.bind('Adonis/Src/Model', () => Model)
    ioc.alias('Adonis/Src/Model', 'Model')
    ioc.bind('Adonis/Traits/Morphable', () => {
      return new Morphable()
    })
    ioc.alias('Adonis/Traits/Morphable', 'Morphable')
    ioc.bind('Adonis/Notifications/Notifiable', () => {
      const Notifiable = require('../../src/Notifiable')
      return new Notifiable()
    })
    ioc.alias('Adonis/Notifications/Notifiable', 'Notifiable')
    ioc.bind('Adonis/Notifications/DatabaseNotification', () => {
      const DatabaseNotification = require('../../src/DatabaseNotification')
      DatabaseNotification._bootIfNotBooted()
      return DatabaseNotification
    })
    ioc.alias('Adonis/Notifications/DatabaseNotification', 'DatabaseNotification')
    ioc.bind('Adonis/Notifications/HasDatabaseNotifications', () => {
      const HasDatabaseNotifications = require('../../src/HasDatabaseNotifications')
      return new HasDatabaseNotifications()
    })
    ioc.alias('Adonis/Notifications/HasDatabaseNotifications', 'HasDatabaseNotifications')
    await fs.ensureDir(path.join(__dirname, '../tmp'))
    const Database = use('Database')
    await fixtures.up(Database)
    setupResolver()
  })

  group.beforeEach(() => {
    ioc.restore()
  })

  group.after(async function () {
    const Database = use('Database')
    await fixtures.down(Database)
    Database.close()

    try {
      await fs.remove(path.join(__dirname, '../tmp'))
    } catch (error) {
      if (process.platform !== 'win32' || error.code !== 'EBUSY') {
        throw error
      }
    }
  }).timeout(0)

  group.afterEach(async function () {
    const Database = use('Database')
    await fixtures.truncate(Database, 'users')
    await fixtures.truncate(Database, 'notifications')
  })

  test('should return data from toJSON method', assert => {
    class TestNotification {
      toJSON () {
        return {
          foo: 'bar'
        }
      }
    }
    const data = (new DatabaseChannel().getData(null, new TestNotification()))
    assert.equal(data.foo, 'bar')
  })

  test('should be able return data from toDatabase method', assert => {
    class TestNotification {
      toDatabase () {
        return new DatabaseMessage({
          foo: 'bar'
        })
      }
    }
    const data = (new DatabaseChannel().getData(null, new TestNotification()))
    assert.equal(data.foo, 'bar')
  })

  test('should be able send notification', async assert => {
    class User extends Model {
      static get traits () {
        return [
          '@provider:Morphable',
          '@provider:HasDatabaseNotifications',
          '@provider:Notifiable'
        ]
      }
    }
    User._bootIfNotBooted()
    class TestNotification {
      get id () {
        return uuid()
      }

      toJSON () {
        return {
          foo: 'bar'
        }
      }
    }
    const user = await User.create({
      email: 'foo@bar.baz',
      username: 'test',
      password: 'secret'
    })
    await (new DatabaseChannel()).send(user, new TestNotification())
    const notification = await user.notifications().first()
    assert.notEqual(notification.id, undefined)
    assert.equal(typeof notification.data, 'object')
    assert.equal(notification.data.foo, 'bar')
    assert.equal(notification.type, 'TestNotification')
    assert.equal(notification.notifiable_id, user.id)
    assert.equal(notification.notifiable_type, User.table)
    assert.isNull(notification.read_at)
  })
})
