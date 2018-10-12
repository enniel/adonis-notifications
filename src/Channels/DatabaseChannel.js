'use strict'

const NE = require('node-exceptions')

class DatabaseChannel {
  async send (notifiable, notification) {
    const data = await this.getData(notifiable, notification)
    return notifiable.routeNotificationFor('database').create({
      id: notification.id,
      type: notification.constructor.type || notification.constructor.name,
      data
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
