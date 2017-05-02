'use strict'

/**
 * adonis-notifications
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
*/

const fold = require('adonis-fold')
const Ace = require('adonis-ace')
const path = require('path')
const co = require('co')
require('dotenv').config({ path: path.join(__dirname, '../../.env') })
const Env = process.env

const Config = {
  get (key) {
    return this[key] || null
  }
}

class TestNotification {

  via () {
    return [
      'log'
    ]
  }

  toLog () {
    return 'test'
  }
}

class User {

}

module.exports = () => {
  fold.Ioc.bind('Adonis/Src/Helpers', function () {
    return {}
  })
  fold.Ioc.bind('Adonis/Src/Config', function () {
    return Config
  })
  fold.Ioc.on('providers:booted', () => {
    const Event = fold.Ioc.use('Adonis/Src/Event')
    Event.when('notification.sent', function () {
      console.log(...arguments)
    })
    co (function * () {
      const Notification = fold.Ioc.use('Adonis/Notifications/Manager')
      yield Notification.send(new User(), new TestNotification())
    })
    .catch((error) => console.error(error.stack))
  })
  fold.Registrar
    .register([
      'adonis-ace/providers/CommandProvider',
      'adonis-framework/providers/EventProvider',
      path.join(__dirname, '../../providers/NotificationsProvider')
    ])
    .catch((error) => console.error(error.stack))
}
