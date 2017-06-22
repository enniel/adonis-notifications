'use strict'

/**
 * adonis-notifications
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

const use = require('adonis-fold').Ioc.use
const capitalize = require('lodash/capitalize')

class Notifiable {
  static register (Model) {
    Model.prototype.notify = function * (instance) {
      return yield use('Adonis/Notifications/Manager').send(this, instance)
    }

    Model.prototype.routeNotificationFor = function (channel) {
      const method = `routeNotificationFor${capitalize(channel)}`
      if (typeof this[method] === 'function') {
        return this[method]()
      }
      switch (channel) {
        case 'database':
          return this.notifications()
      }
    }
  }
}

module.exports = Notifiable
