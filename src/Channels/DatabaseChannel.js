'use strict'

/**
 * adonis-notifications
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

const NE = require('node-exceptions')

class DatabaseChannel {
  * send (notifiable, notification) {
    return yield notifiable.routeNotificationFor('database').create({
      id: notification.id,
      type: notification.constructor.type || notification.constructor.name,
      data: this.getData(notifiable, notification)
    })
  }

  getData (notifiable, notification) {
    if (typeof notification.toDatabase === 'function') {
      return notification.toDatabase(notifiable).data
    }

    if (typeof notification.toJSON === 'function') {
      return notification.toJSON(notifiable)
    }

    throw new NE.RuntimeException('Notification is missing [toDatabase / toJSON] method.')
  }
}

module.exports = DatabaseChannel
