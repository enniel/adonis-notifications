'use strict'

require('@adonisjs/lucid/lib/iocResolver').setFold(require('@adonisjs/fold'))
const test = require('japa')
const fs = require('fs-extra')
const path = require('path')
const { ioc } = require('@adonisjs/fold')
const { Config, setupResolver } = require('@adonisjs/sink')
const Model = require('@adonisjs/lucid/src/Lucid/Model')
const DatabaseManager = require('@adonisjs/lucid/src/Database/Manager')
const Morphable = require('adonis-lucid-polymorphic/src/Traits/Morphable')
const NotificationSender = require('../../src/NotificationSender')
const DatabaseMessage = require('../../src/Messages/DatabaseMessage')

const fixtures = require('../fixtures')

test.group('NotificationSender', (group) => {
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

  test('should send notification to one user using sendNow method', async assert => {
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
    const manager = use('Notifications')
    const emitter = use('Event')
    await (new NotificationSender(manager, emitter)).sendNow(user, new TestNotification())
    const notification = await user.notifications().first()
    assert.notEqual(notification.id, undefined)
    assert.equal(typeof notification.data, 'object')
    assert.equal(notification.data.foo, 'bar')
    assert.equal(notification.type, 'TestNotification')
    assert.equal(notification.notifiable_id, user.id)
    assert.equal(notification.notifiable_type, User.table)
    assert.isNull(notification.read_at)
  })

  test('should send notification to many users using sendNow method', async assert => {
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
    const user1 = await User.create({
      email: 'foo@bar.baz',
      username: 'test1',
      password: 'secret'
    })
    const user2 = await User.create({
      email: 'foo@bar.baz',
      username: 'test2',
      password: 'secret'
    })
    const user3 = await User.create({
      email: 'foo@bar.baz',
      username: 'test3',
      password: 'secret'
    })
    const users = await User.query().fetch()
    const manager = use('Notifications')
    const emitter = use('Event')
    const DatabaseNotification = use('DatabaseNotification')
    await (new NotificationSender(manager, emitter)).sendNow(users, new TestNotification())
    const notifications = (await DatabaseNotification.query().orderBy('notifiable_id', 'asc').fetch()).toJSON()
    // 1
    assert.notEqual(notifications[0].id, undefined)
    assert.equal(typeof notifications[0].data, 'object')
    assert.equal(notifications[0].data.foo, 'bar')
    assert.equal(notifications[0].type, 'TestNotification')
    assert.equal(notifications[0].notifiable_id, user1.id)
    assert.equal(notifications[0].notifiable_type, User.table)
    assert.isNull(notifications[0].read_at)
    // 2
    assert.notEqual(notifications[1].id, undefined)
    assert.equal(typeof notifications[1].data, 'object')
    assert.equal(notifications[1].data.foo, 'bar')
    assert.equal(notifications[1].type, 'TestNotification')
    assert.equal(notifications[1].notifiable_id, user2.id)
    assert.equal(notifications[1].notifiable_type, User.table)
    assert.isNull(notifications[1].read_at)
    // 3
    assert.notEqual(notifications[2].id, undefined)
    assert.equal(typeof notifications[2].data, 'object')
    assert.equal(notifications[2].data.foo, 'bar')
    assert.equal(notifications[2].type, 'TestNotification')
    assert.equal(notifications[2].notifiable_id, user3.id)
    assert.equal(notifications[2].notifiable_type, User.table)
    assert.isNull(notifications[2].read_at)
  })

  test('should send notification to one user using send method', async assert => {
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

      toDatabase () {
        return new DatabaseMessage({ foo: 'bar' })
      }
    }
    const user = await User.create({
      email: 'foo@bar.baz',
      username: 'test',
      password: 'secret'
    })
    const manager = use('Notifications')
    const emitter = use('Event')
    await (new NotificationSender(manager, emitter)).send(user, new TestNotification())
    const notification = await user.notifications().first()
    assert.notEqual(notification.id, undefined)
    assert.equal(typeof notification.data, 'object')
    assert.equal(notification.data.foo, 'bar')
    assert.equal(notification.type, 'TestNotification')
    assert.equal(notification.notifiable_id, user.id)
    assert.equal(notification.notifiable_type, User.table)
    assert.isNull(notification.read_at)
  })

  test('should send notification to many users using send method', async assert => {
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
    const user1 = await User.create({
      email: 'foo@bar.baz',
      username: 'test1',
      password: 'secret'
    })
    const user2 = await User.create({
      email: 'foo@bar.baz',
      username: 'test2',
      password: 'secret'
    })
    const user3 = await User.create({
      email: 'foo@bar.baz',
      username: 'test3',
      password: 'secret'
    })
    const users = await User.query().fetch()
    const manager = use('Notifications')
    const emitter = use('Event')
    const DatabaseNotification = use('DatabaseNotification')
    await (new NotificationSender(manager, emitter)).send(users, new TestNotification())
    const notifications = (await DatabaseNotification.query().orderBy('notifiable_id', 'asc').fetch()).toJSON()
    // 1
    assert.notEqual(notifications[0].id, undefined)
    assert.equal(typeof notifications[0].data, 'object')
    assert.equal(notifications[0].data.foo, 'bar')
    assert.equal(notifications[0].type, 'TestNotification')
    assert.equal(notifications[0].notifiable_id, user1.id)
    assert.equal(notifications[0].notifiable_type, User.table)
    assert.isNull(notifications[0].read_at)
    // 2
    assert.notEqual(notifications[1].id, undefined)
    assert.equal(typeof notifications[1].data, 'object')
    assert.equal(notifications[1].data.foo, 'bar')
    assert.equal(notifications[1].type, 'TestNotification')
    assert.equal(notifications[1].notifiable_id, user2.id)
    assert.equal(notifications[1].notifiable_type, User.table)
    assert.isNull(notifications[1].read_at)
    // 3
    assert.notEqual(notifications[2].id, undefined)
    assert.equal(typeof notifications[2].data, 'object')
    assert.equal(notifications[2].data.foo, 'bar')
    assert.equal(notifications[2].type, 'TestNotification')
    assert.equal(notifications[2].notifiable_id, user3.id)
    assert.equal(notifications[2].notifiable_type, User.table)
    assert.isNull(notifications[2].read_at)
  })

  test('should send notification to using sendToNotifiable method', async assert => {
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
    const manager = use('Notifications')
    const emitter = use('Event')
    await (new NotificationSender(manager, emitter)).sendToNotifiable(user, new TestNotification(), 'database')
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
