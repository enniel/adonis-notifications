'use strict'

require('@adonisjs/lucid/lib/iocResolver').setFold(require('@adonisjs/fold'))
const uuid = require('uuid/v4')
const test = require('japa')
const fs = require('fs-extra')
const path = require('path')
const { ioc } = require('@adonisjs/fold')
const { Config, setupResolver } = require('@adonisjs/sink')
const Model = require('@adonisjs/lucid/src/Lucid/Model')
const DatabaseManager = require('@adonisjs/lucid/src/Database/Manager')
const Morphable = require('adonis-lucid-polymorphic/src/Traits/Morphable')
const MorphMany = require('adonis-lucid-polymorphic/src/Relations/MorphMany')

const fixtures = require('../fixtures')

test.group('Traits', (group) => {
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
    ioc.singleton('Adonis/Src/Event', app => {
      const Event = require('@adonisjs/framework/src/Event')
      return new Event(app.use('Config'))
    })
    ioc.alias('Adonis/Src/Event', 'Event')
    ioc.bind('Adonis/Notifications/DatabaseNotification', () => {
      const DatabaseNotification = require('../../src/DatabaseNotification')
      DatabaseNotification._bootIfNotBooted()
      return DatabaseNotification
    })
    ioc.alias('Adonis/Notifications/DatabaseNotification', 'DatabaseNotification')
    ioc.bind('Adonis/Notifications/Notifiable', () => {
      const Notifiable = require('../../src/Notifiable')
      return new Notifiable()
    })
    ioc.alias('Adonis/Notifications/Notifiable', 'Notifiable')
    ioc.bind('Adonis/Notifications/HasDatabaseNotifications', () => {
      const HasDatabaseNotifications = require('../../src/HasDatabaseNotifications')
      return new HasDatabaseNotifications()
    })
    ioc.alias('Adonis/Notifications/HasDatabaseNotifications', 'HasDatabaseNotifications')
    ioc.singleton('Adonis/Notifications/Manager', (app) => {
      const ChannelManager = require('../../src/ChannelManager')
      return new ChannelManager(app)
    })
    ioc.alias('Adonis/Notifications/Manager', 'Notifications')
    ioc.use('Notifications').extend('database', () => {
      const DatabaseChannel = require('../../src/Channels/DatabaseChannel')
      return new DatabaseChannel()
    })
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

  test('should assign HasDatabaseNotifications trait class to the model', assert => {
    class User extends Model {
      static get traits () {
        return [
          '@provider:Morphable',
          '@provider:HasDatabaseNotifications'
        ]
      }
    }
    User._bootIfNotBooted()
    const user = new User()
    assert.equal(typeof user.notifications, 'function')
    assert.instanceOf(user.notifications(), MorphMany)
    assert.equal(typeof user.readNotifications, 'function')
    assert.instanceOf(user.readNotifications(), MorphMany)
    assert.equal(typeof user.unreadNotifications, 'function')
    assert.instanceOf(user.unreadNotifications(), MorphMany)
  })

  test('should assign Notifiable trait class to the model', assert => {
    class User extends Model {
      static get traits () {
        return [
          '@provider:Morphable',
          '@provider:Notifiable'
        ]
      }
    }
    User._bootIfNotBooted()
    const user = new User()
    assert.equal(typeof user.notify, 'function')
    assert.equal(typeof user.routeNotificationFor, 'function')
  })

  test('should send notification using notify method', async assert => {
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
      via () {
        return ['database']
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
    await user.notify(new TestNotification())
    const notification = await user.notifications().first()
    assert.equal(notification.data.foo, 'bar')
    assert.equal(notification.type, 'TestNotification')
    assert.equal(notification.notifiable_id, user.id)
    assert.equal(notification.notifiable_type, User.table)
    assert.isNull(notification.read_at)
  })

  test('should send notification with custom type and custom id using notify method', async assert => {
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
    const id = uuid()
    class TestNotification {
      static get type () {
        return 'test'
      }

      get id () {
        return id
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
    const user = await User.create({
      email: 'foo@bar.baz',
      username: 'test',
      password: 'secret'
    })
    await user.notify(new TestNotification())
    const notification = await user.notifications().first()
    assert.equal(notification.id, id)
    assert.equal(notification.data.foo, 'bar')
    assert.equal(notification.type, 'test')
    assert.equal(notification.notifiable_id, user.id)
    assert.equal(notification.notifiable_type, User.table)
    assert.isNull(notification.read_at)
  })

  test('should throw an exception when notification does not have toDatabase / toJSON method', async assert => {
    assert.plan(1)
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
      via () {
        return ['database']
      }
    }
    const user = await User.create({
      email: 'foo@bar.baz',
      username: 'test',
      password: 'secret'
    })
    try {
      await user.notify(new TestNotification())
    } catch ({ message }) {
      assert.equal(message, 'Notification is missing [toDatabase / toJSON] method.')
    }
  })
})
