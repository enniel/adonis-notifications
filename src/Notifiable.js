'use strict'

/**
 * adonis-notifications
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

const capitalize = require('lodash/capitalize')

class Notifiable {
  * routeNotificationFor (channel) {
    const method = `routeNotificationFor${capitalize(channel)}`
    if (typeof this[method] === 'function') {
      return yield this[method]()
    }
    switch (channel) {
      case 'database':
        return this.notifications()
    }
  }
}

module.exports = Notifiable
