'use strict'

/**
 * adonis-notifications
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

const Model = require('adonis-lucid/src/Lucid/Model')
const Database = require('adonis-lucid/src/Database')
const MorphTrait = require('adonis-lucid-polymorphic/src/Traits/MorphTrait')
const MorphMany = require('adonis-lucid-polymorphic/src/Relations/MorphMany')
const NotificationSender = require('../../src/NotificationSender')
const DatabaseChannel = require('../../src/Channels/DatabaseChannel')
const DatabaseMessage = require('../../src/Messages/DatabaseMessage')
const ChannelManager = require('../../src/ChannelManager')
const uuid = require('uuid/v4')
const chai = require('chai')
chai.use(require('dirty-chai'))
const Ioc = require('adonis-fold').Ioc
const expect = chai.expect
const filesFixtures = require('./fixtures/files')
const databaseFixtures = require('./fixtures/database')
const config = require('./helpers/config')
require('co-mocha')

describe('Notifications', function () {
  before(function * () {
    Database._setConfigProvider(config)
    Ioc.bind('Adonis/Src/Database', function () {
      return Database
    })
    Ioc.bind('Adonis/Src/Lucid', function () {
      return Model
    })
    Ioc.bind('Adonis/Src/Helpers', function () {
      return {
        makeNameSpace: function (hook) {
          return `App/${hook}`
        }
      }
    })
    Ioc.singleton('Adonis/Src/Event', function (app) {
      const Event = require('adonis-framework/src/Event')
      const Helpers = app.use('Adonis/Src/Helpers')
      return new Event(config, Helpers)
    })
    Ioc.bind('Adonis/Lucid/MorphTrait', function () {
      return new MorphTrait()
    })
    Ioc.bind('Adonis/Notifications/DatabaseNotification', function () {
      return require('../../src/DatabaseNotification')
    })
    Ioc.bind('Adonis/Notifications/Notifiable', function () {
      return require('../../src/Notifiable')
    })
    Ioc.bind('Adonis/Notifications/HasDatabaseNotifications', function () {
      return require('../../src/HasDatabaseNotifications')
    })
    Ioc.singleton('Adonis/Notifications/Manager', function (app) {
      const ChannelManager = require('../../src/ChannelManager')
      return new ChannelManager(app)
    })
    Ioc.use('Adonis/Notifications/Manager').extend('database', function () {
      const DatabaseChannel = require('../../src/Channels/DatabaseChannel')
      return new DatabaseChannel()
    })
    yield filesFixtures.createDir()
    yield databaseFixtures.up(Database)
  })

  after(function * () {
    yield databaseFixtures.down(Database)
    Database.close()
  })

  context('Traits', function () {
    it('should be able to assign HasDatabaseNotifications trait class to the model', function () {
      class User extends Model {
        static get traits () {
          return [
            'Adonis/Lucid/MorphTrait',
            'Adonis/Notifications/HasDatabaseNotifications'
          ]
        }
      }
      User.bootIfNotBooted()
      const user = new User()
      expect(user.notifications).to.be.a('function')
      expect(user.notifications() instanceof MorphMany).to.be.true()
      expect(user.readNotifications).to.be.a('function')
      expect(user.readNotifications() instanceof MorphMany).to.be.true()
      expect(user.unreadNotifications).to.be.a('function')
      expect(user.unreadNotifications() instanceof MorphMany).to.be.true()
    })

    it('should be able to assign Notifiable trait class to the model', function () {
      class User extends Model {
        static get traits () {
          return [
            'Adonis/Lucid/MorphTrait',
            'Adonis/Notifications/Notifiable'
          ]
        }
      }
      User.bootIfNotBooted()
      const user = new User()
      expect(typeof user.notify === 'function').to.be.true()
      expect(user.routeNotificationFor).to.be.a('function')
    })

    it('should be able send notification using notify method', function * () {
      class User extends Model {
        static get traits () {
          return [
            'Adonis/Lucid/MorphTrait',
            'Adonis/Notifications/HasDatabaseNotifications',
            'Adonis/Notifications/Notifiable'
          ]
        }
      }
      User.bootIfNotBooted()
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
      const user = yield User.create({
        email: 'foo@bar.baz',
        username: 'test',
        password: 'secret'
      })
      yield user.notify(new TestNotification())
      const notification = yield user.notifications().first()
      expect(notification.id).not.to.equal(undefined)
      expect(notification.data).to.be.a('object')
      expect(notification.data.foo).to.equal('bar')
      expect(notification.type).to.equal('TestNotification')
      expect(notification.notifiable_id).to.equal(user.id)
      expect(notification.notifiable_type).to.equal(User.table)
      expect(notification.read_at).to.be.null()
      yield databaseFixtures.truncate(Database, 'notifications')
      yield databaseFixtures.truncate(Database, 'users')
    })

    it('should be able send notification with custom type and custom id using notify method', function * () {
      class User extends Model {
        static get traits () {
          return [
            'Adonis/Lucid/MorphTrait',
            'Adonis/Notifications/HasDatabaseNotifications',
            'Adonis/Notifications/Notifiable'
          ]
        }
      }
      User.bootIfNotBooted()
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
      const user = yield User.create({
        email: 'foo@bar.baz',
        username: 'test',
        password: 'secret'
      })
      yield user.notify(new TestNotification())
      const notification = yield user.notifications().first()
      expect(notification.id).to.equal(id)
      expect(notification.data).to.be.a('object')
      expect(notification.data.foo).to.equal('bar')
      expect(notification.type).to.equal('test')
      expect(notification.notifiable_id).to.equal(user.id)
      expect(notification.notifiable_type).to.equal(User.table)
      expect(notification.read_at).to.be.null()
      yield databaseFixtures.truncate(Database, 'notifications')
      yield databaseFixtures.truncate(Database, 'users')
    })

    it('should throw an exception when notification does not have toDatabase / toJSON method', function * () {
      class User extends Model {
        static get traits () {
          return [
            'Adonis/Lucid/MorphTrait',
            'Adonis/Notifications/HasDatabaseNotifications',
            'Adonis/Notifications/Notifiable'
          ]
        }
      }
      User.bootIfNotBooted()
      class TestNotification {
        via () {
          return ['database']
        }
      }
      const user = yield User.create({
        email: 'foo@bar.baz',
        username: 'test',
        password: 'secret'
      })
      try {
        yield user.notify(new TestNotification())
        expect(true).to.equal(false)
      } catch (e) {
        expect(e.name).to.equal('RuntimeException')
        expect(e.message).to.equal('Notification is missing [toDatabase / toJSON] method.')
      }

      yield databaseFixtures.truncate(Database, 'users')
    })
  })

  context('NotificationSender', function () {
    it('should be able send notification to one user using sendNow method', function * () {
      class User extends Model {
        static get traits () {
          return [
            'Adonis/Lucid/MorphTrait',
            'Adonis/Notifications/HasDatabaseNotifications',
            'Adonis/Notifications/Notifiable'
          ]
        }
      }
      User.bootIfNotBooted()
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
      const user = yield User.create({
        email: 'foo@bar.baz',
        username: 'test',
        password: 'secret'
      })
      const manager = Ioc.use('Adonis/Notifications/Manager')
      const emitter = Ioc.use('Adonis/Src/Event')
      yield (new NotificationSender(manager, emitter)).sendNow(user, new TestNotification())
      const notification = yield user.notifications().first()
      expect(notification.id).not.to.equal(undefined)
      expect(notification.data).to.be.a('object')
      expect(notification.data.foo).to.equal('bar')
      expect(notification.type).to.equal('TestNotification')
      expect(notification.notifiable_id).to.equal(user.id)
      expect(notification.notifiable_type).to.equal(User.table)
      expect(notification.read_at).to.be.null()
      yield databaseFixtures.truncate(Database, 'notifications')
      yield databaseFixtures.truncate(Database, 'users')
    })

    it('should be able send notification to many users using sendNow method', function * () {
      class User extends Model {
        static get traits () {
          return [
            'Adonis/Lucid/MorphTrait',
            'Adonis/Notifications/HasDatabaseNotifications',
            'Adonis/Notifications/Notifiable'
          ]
        }
      }
      User.bootIfNotBooted()
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
      const user1 = yield User.create({
        email: 'foo@bar.baz',
        username: 'test1',
        password: 'secret'
      })
      const user2 = yield User.create({
        email: 'foo@bar.baz',
        username: 'test2',
        password: 'secret'
      })
      const user3 = yield User.create({
        email: 'foo@bar.baz',
        username: 'test3',
        password: 'secret'
      })
      const users = yield User.query().fetch()
      const manager = Ioc.use('Adonis/Notifications/Manager')
      const emitter = Ioc.use('Adonis/Src/Event')
      const DatabaseNotification = Ioc.use('Adonis/Notifications/DatabaseNotification')
      yield (new NotificationSender(manager, emitter)).sendNow(users, new TestNotification())
      const notifications = (yield DatabaseNotification.query().orderBy('notifiable_id', 'asc').fetch()).toJSON()
      // 1
      expect(notifications[0].id).not.to.equal(undefined)
      expect(notifications[0].data).to.be.a('object')
      expect(notifications[0].data.foo).to.equal('bar')
      expect(notifications[0].type).to.equal('TestNotification')
      expect(notifications[0].notifiable_id).to.equal(user1.id)
      expect(notifications[0].notifiable_type).to.equal(User.table)
      expect(notifications[0].read_at).to.be.null()
      // 2
      expect(notifications[1].id).not.to.equal(undefined)
      expect(notifications[1].data).to.be.a('object')
      expect(notifications[1].data.foo).to.equal('bar')
      expect(notifications[1].type).to.equal('TestNotification')
      expect(notifications[1].notifiable_id).to.equal(user2.id)
      expect(notifications[1].notifiable_type).to.equal(User.table)
      expect(notifications[1].read_at).to.be.null()
      // 3
      expect(notifications[1].id).not.to.equal(undefined)
      expect(notifications[2].data).to.be.a('object')
      expect(notifications[2].data.foo).to.equal('bar')
      expect(notifications[2].type).to.equal('TestNotification')
      expect(notifications[2].notifiable_id).to.equal(user3.id)
      expect(notifications[2].notifiable_type).to.equal(User.table)
      expect(notifications[2].read_at).to.be.null()
      yield databaseFixtures.truncate(Database, 'notifications')
      yield databaseFixtures.truncate(Database, 'users')
    })

    it('should be able send notification to one user using send method', function * () {
      class User extends Model {
        static get traits () {
          return [
            'Adonis/Lucid/MorphTrait',
            'Adonis/Notifications/HasDatabaseNotifications',
            'Adonis/Notifications/Notifiable'
          ]
        }
      }
      User.bootIfNotBooted()
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
      const user = yield User.create({
        email: 'foo@bar.baz',
        username: 'test',
        password: 'secret'
      })
      const manager = Ioc.use('Adonis/Notifications/Manager')
      const emitter = Ioc.use('Adonis/Src/Event')
      yield (new NotificationSender(manager, emitter)).send(user, new TestNotification())
      const notification = yield user.notifications().first()
      expect(notification.id).not.to.equal(undefined)
      expect(notification.data).to.be.a('object')
      expect(notification.data.foo).to.equal('bar')
      expect(notification.type).to.equal('TestNotification')
      expect(notification.notifiable_id).to.equal(user.id)
      expect(notification.notifiable_type).to.equal(User.table)
      expect(notification.read_at).to.be.null()
      yield databaseFixtures.truncate(Database, 'notifications')
      yield databaseFixtures.truncate(Database, 'users')
    })

    it('should be able send notification to many users using send method', function * () {
      class User extends Model {
        static get traits () {
          return [
            'Adonis/Lucid/MorphTrait',
            'Adonis/Notifications/HasDatabaseNotifications',
            'Adonis/Notifications/Notifiable'
          ]
        }
      }
      User.bootIfNotBooted()
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
      const user1 = yield User.create({
        email: 'foo@bar.baz',
        username: 'test1',
        password: 'secret'
      })
      const user2 = yield User.create({
        email: 'foo@bar.baz',
        username: 'test2',
        password: 'secret'
      })
      const user3 = yield User.create({
        email: 'foo@bar.baz',
        username: 'test3',
        password: 'secret'
      })
      const users = yield User.query().fetch()
      const manager = Ioc.use('Adonis/Notifications/Manager')
      const emitter = Ioc.use('Adonis/Src/Event')
      const DatabaseNotification = Ioc.use('Adonis/Notifications/DatabaseNotification')
      yield (new NotificationSender(manager, emitter)).send(users, new TestNotification())
      const notifications = (yield DatabaseNotification.query().orderBy('notifiable_id', 'asc').fetch()).toJSON()
      // 1
      expect(notifications[0].id).not.to.equal(undefined)
      expect(notifications[0].data).to.be.a('object')
      expect(notifications[0].data.foo).to.equal('bar')
      expect(notifications[0].type).to.equal('TestNotification')
      expect(notifications[0].notifiable_id).to.equal(user1.id)
      expect(notifications[0].notifiable_type).to.equal(User.table)
      expect(notifications[0].read_at).to.be.null()
      // 2
      expect(notifications[1].id).not.to.equal(undefined)
      expect(notifications[1].data).to.be.a('object')
      expect(notifications[1].data.foo).to.equal('bar')
      expect(notifications[1].type).to.equal('TestNotification')
      expect(notifications[1].notifiable_id).to.equal(user2.id)
      expect(notifications[1].notifiable_type).to.equal(User.table)
      expect(notifications[1].read_at).to.be.null()
      // 3
      expect(notifications[1].id).not.to.equal(undefined)
      expect(notifications[2].data).to.be.a('object')
      expect(notifications[2].data.foo).to.equal('bar')
      expect(notifications[2].type).to.equal('TestNotification')
      expect(notifications[2].notifiable_id).to.equal(user3.id)
      expect(notifications[2].notifiable_type).to.equal(User.table)
      expect(notifications[2].read_at).to.be.null()
      yield databaseFixtures.truncate(Database, 'notifications')
      yield databaseFixtures.truncate(Database, 'users')
    })

    it('should be able send notification to using sendToNotifiable method', function * () {
      class User extends Model {
        static get traits () {
          return [
            'Adonis/Lucid/MorphTrait',
            'Adonis/Notifications/HasDatabaseNotifications',
            'Adonis/Notifications/Notifiable'
          ]
        }
      }
      User.bootIfNotBooted()
      class TestNotification {
        toJSON () {
          return {
            foo: 'bar'
          }
        }
      }
      const user = yield User.create({
        email: 'foo@bar.baz',
        username: 'test',
        password: 'secret'
      })
      const manager = Ioc.use('Adonis/Notifications/Manager')
      const emitter = Ioc.use('Adonis/Src/Event')
      yield (new NotificationSender(manager, emitter)).sendToNotifiable(user, uuid(), new TestNotification(), 'database')
      const notification = yield user.notifications().first()
      expect(notification.id).not.to.equal(undefined)
      expect(notification.data).to.be.a('object')
      expect(notification.data.foo).to.equal('bar')
      expect(notification.type).to.equal('TestNotification')
      expect(notification.notifiable_id).to.equal(user.id)
      expect(notification.notifiable_type).to.equal(User.table)
      expect(notification.read_at).to.be.null()
      yield databaseFixtures.truncate(Database, 'notifications')
      yield databaseFixtures.truncate(Database, 'users')
    })
  })

  context('ChannelManager', function () {
    it('should return instance of DatabaseChannel when channel method has been called', function * () {
      const manager = Ioc.use('Adonis/Notifications/Manager')
      expect(manager.channel('database') instanceof DatabaseChannel).to.be.true()
    })

    it('should be able extend test channel', function * () {
      const manager = new ChannelManager()
      class TestChannel {}
      manager.extend('test', function () {
        return new TestChannel()
      })
      expect(manager.channel('test') instanceof TestChannel).to.be.true()
    })

    it('should be able send notification to one user using sendNow method', function * () {
      class User extends Model {
        static get traits () {
          return [
            'Adonis/Lucid/MorphTrait',
            'Adonis/Notifications/HasDatabaseNotifications',
            'Adonis/Notifications/Notifiable'
          ]
        }
      }
      User.bootIfNotBooted()
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
      const user = yield User.create({
        email: 'foo@bar.baz',
        username: 'test',
        password: 'secret'
      })
      const manager = Ioc.use('Adonis/Notifications/Manager')
      yield manager.sendNow(user, new TestNotification())
      const notification = yield user.notifications().first()
      expect(notification.id).not.to.equal(undefined)
      expect(notification.data).to.be.a('object')
      expect(notification.data.foo).to.equal('bar')
      expect(notification.type).to.equal('TestNotification')
      expect(notification.notifiable_id).to.equal(user.id)
      expect(notification.notifiable_type).to.equal(User.table)
      expect(notification.read_at).to.be.null()
      yield databaseFixtures.truncate(Database, 'notifications')
      yield databaseFixtures.truncate(Database, 'users')
    })

    it('should be able send notification to many users using sendNow method', function * () {
      class User extends Model {
        static get traits () {
          return [
            'Adonis/Lucid/MorphTrait',
            'Adonis/Notifications/HasDatabaseNotifications',
            'Adonis/Notifications/Notifiable'
          ]
        }
      }
      User.bootIfNotBooted()
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
      const user1 = yield User.create({
        email: 'foo@bar.baz',
        username: 'test1',
        password: 'secret'
      })
      const user2 = yield User.create({
        email: 'foo@bar.baz',
        username: 'test2',
        password: 'secret'
      })
      const user3 = yield User.create({
        email: 'foo@bar.baz',
        username: 'test3',
        password: 'secret'
      })
      const users = yield User.query().fetch()
      const manager = Ioc.use('Adonis/Notifications/Manager')
      const DatabaseNotification = Ioc.use('Adonis/Notifications/DatabaseNotification')
      yield manager.sendNow(users, new TestNotification())
      const notifications = (yield DatabaseNotification.query().orderBy('notifiable_id', 'asc').fetch()).toJSON()
      // 1
      expect(notifications[0].id).not.to.equal(undefined)
      expect(notifications[0].data).to.be.a('object')
      expect(notifications[0].data.foo).to.equal('bar')
      expect(notifications[0].type).to.equal('TestNotification')
      expect(notifications[0].notifiable_id).to.equal(user1.id)
      expect(notifications[0].notifiable_type).to.equal(User.table)
      expect(notifications[0].read_at).to.be.null()
      // 2
      expect(notifications[1].id).not.to.equal(undefined)
      expect(notifications[1].data).to.be.a('object')
      expect(notifications[1].data.foo).to.equal('bar')
      expect(notifications[1].type).to.equal('TestNotification')
      expect(notifications[1].notifiable_id).to.equal(user2.id)
      expect(notifications[1].notifiable_type).to.equal(User.table)
      expect(notifications[1].read_at).to.be.null()
      // 3
      expect(notifications[1].id).not.to.equal(undefined)
      expect(notifications[2].data).to.be.a('object')
      expect(notifications[2].data.foo).to.equal('bar')
      expect(notifications[2].type).to.equal('TestNotification')
      expect(notifications[2].notifiable_id).to.equal(user3.id)
      expect(notifications[2].notifiable_type).to.equal(User.table)
      expect(notifications[2].read_at).to.be.null()
      yield databaseFixtures.truncate(Database, 'notifications')
      yield databaseFixtures.truncate(Database, 'users')
    })

    it('should be able send notification to one user using send method', function * () {
      class User extends Model {
        static get traits () {
          return [
            'Adonis/Lucid/MorphTrait',
            'Adonis/Notifications/HasDatabaseNotifications',
            'Adonis/Notifications/Notifiable'
          ]
        }
      }
      User.bootIfNotBooted()
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
      const user = yield User.create({
        email: 'foo@bar.baz',
        username: 'test',
        password: 'secret'
      })
      const manager = Ioc.use('Adonis/Notifications/Manager')
      yield manager.send(user, new TestNotification())
      const notification = yield user.notifications().first()
      expect(notification.id).not.to.equal(undefined)
      expect(notification.data).to.be.a('object')
      expect(notification.data.foo).to.equal('bar')
      expect(notification.type).to.equal('TestNotification')
      expect(notification.notifiable_id).to.equal(user.id)
      expect(notification.notifiable_type).to.equal(User.table)
      expect(notification.read_at).to.be.null()
      yield databaseFixtures.truncate(Database, 'notifications')
      yield databaseFixtures.truncate(Database, 'users')
    })

    it('should be able send notification to many users using send method', function * () {
      class User extends Model {
        static get traits () {
          return [
            'Adonis/Lucid/MorphTrait',
            'Adonis/Notifications/HasDatabaseNotifications',
            'Adonis/Notifications/Notifiable'
          ]
        }
      }
      User.bootIfNotBooted()
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
      const user1 = yield User.create({
        email: 'foo@bar.baz',
        username: 'test1',
        password: 'secret'
      })
      const user2 = yield User.create({
        email: 'foo@bar.baz',
        username: 'test2',
        password: 'secret'
      })
      const user3 = yield User.create({
        email: 'foo@bar.baz',
        username: 'test3',
        password: 'secret'
      })
      const users = yield User.query().fetch()
      const manager = Ioc.use('Adonis/Notifications/Manager')
      const DatabaseNotification = Ioc.use('Adonis/Notifications/DatabaseNotification')
      yield manager.send(users, new TestNotification())
      const notifications = (yield DatabaseNotification.query().orderBy('notifiable_id', 'asc').fetch()).toJSON()
      // 1
      expect(notifications[0].id).not.to.equal(undefined)
      expect(notifications[0].data).to.be.a('object')
      expect(notifications[0].data.foo).to.equal('bar')
      expect(notifications[0].type).to.equal('TestNotification')
      expect(notifications[0].notifiable_id).to.equal(user1.id)
      expect(notifications[0].notifiable_type).to.equal(User.table)
      expect(notifications[0].read_at).to.be.null()
      // 2
      expect(notifications[1].id).not.to.equal(undefined)
      expect(notifications[1].data).to.be.a('object')
      expect(notifications[1].data.foo).to.equal('bar')
      expect(notifications[1].type).to.equal('TestNotification')
      expect(notifications[1].notifiable_id).to.equal(user2.id)
      expect(notifications[1].notifiable_type).to.equal(User.table)
      expect(notifications[1].read_at).to.be.null()
      // 3
      expect(notifications[1].id).not.to.equal(undefined)
      expect(notifications[2].data).to.be.a('object')
      expect(notifications[2].data.foo).to.equal('bar')
      expect(notifications[2].type).to.equal('TestNotification')
      expect(notifications[2].notifiable_id).to.equal(user3.id)
      expect(notifications[2].notifiable_type).to.equal(User.table)
      expect(notifications[2].read_at).to.be.null()
      yield databaseFixtures.truncate(Database, 'notifications')
      yield databaseFixtures.truncate(Database, 'users')
    })
  })

  context('DatabaseChannel', function () {
    it('should be able return data from toJSON method', function () {
      class TestNotification {
        toJSON () {
          return {
            foo: 'bar'
          }
        }
      }
      const data = (new DatabaseChannel().getData(null, new TestNotification()))
      expect(data.foo).to.be.equal('bar')
    })

    it('should be able return data from toDatabase method', function () {
      class TestNotification {
        toDatabase () {
          return new DatabaseMessage({
            foo: 'bar'
          })
        }
      }
      const data = (new DatabaseChannel().getData(null, new TestNotification()))
      expect(data.foo).to.be.equal('bar')
    })

    it('should be able send notification', function * () {
      class User extends Model {
        static get traits () {
          return [
            'Adonis/Lucid/MorphTrait',
            'Adonis/Notifications/HasDatabaseNotifications',
            'Adonis/Notifications/Notifiable'
          ]
        }
      }
      User.bootIfNotBooted()
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
      const user = yield User.create({
        email: 'foo@bar.baz',
        username: 'test',
        password: 'secret'
      })
      yield (new DatabaseChannel()).send(user, new TestNotification())
      const notification = yield user.notifications().first()
      expect(notification.id).not.to.equal(undefined)
      expect(notification.data).to.be.a('object')
      expect(notification.data.foo).to.equal('bar')
      expect(notification.type).to.equal('TestNotification')
      expect(notification.notifiable_id).to.equal(user.id)
      expect(notification.notifiable_type).to.equal(User.table)
      expect(notification.read_at).to.be.null()
      yield databaseFixtures.truncate(Database, 'notifications')
      yield databaseFixtures.truncate(Database, 'users')
    })
  })

  context('DatabaseMessage', function () {
    it('should be able set data from constructor', function () {
      const message = new DatabaseMessage({
        foo: 'bar'
      })
      expect(message.data.foo).to.be.equal('bar')
    })

    it('should be able set data from setter', function () {
      const message = new DatabaseMessage()
      message.data = {
        foo: 'bar'
      }
      expect(message.data.foo).to.be.equal('bar')
    })

    it('should throw an invalid argument exception when set data from constructor', function () {
      const fn = () => {
        return new DatabaseMessage('bar')
      }
      expect(fn).to.throw('Argument data must me object or array.')
    })

    it('should throw an invalid argument exception when set data from setter', function () {
      const fn = () => {
        (new DatabaseMessage()).data = 'bar'
      }
      expect(fn).to.throw('Argument data must me object or array')
    })
  })
})
