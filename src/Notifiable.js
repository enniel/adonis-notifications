'use strict'

const { ioc } = require('@adonisjs/fold')
const capitalize = require('lodash/capitalize')

class Notifiable {
  register (Model) {
    Model.prototype.notify = function (instance) {
      return ioc.use('Notifications').send(this, instance)
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
