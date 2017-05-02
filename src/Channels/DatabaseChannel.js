'use strict'

const NE = require('node-exceptions')

/**
 * adonis-notifications
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

class DatabaseChannel {

  static * send (notifiable, notification) {
    return yield notifiable.routeNotificationFor('database').create({
      id: notification.id,
      type: notification.constructor.name,
      data: DatabaseChannel.getData(notifiable, notification),
      read_at: null
    })
  }

  static getData (notifiable, notification) {
    if (typeof notification.toDatabase === 'function') {
      const data = notification.toDatabase(notifiable)
      return data ? data : data.data
    }

    if (typeof notification.toJSON === 'function') {
      return notification.toJSON(notifiable)
    }

    throw new NE.RuntimeException('Notification is missing toDatabase / toJSON method.')
  }
}

module.exports = DatabaseChannel
