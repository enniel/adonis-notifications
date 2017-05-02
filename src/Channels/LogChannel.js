'use strict'

const NE = require('node-exceptions')

/**
 * adonis-notifications
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

class LogChannel {

  static * send (notifiable, notification) {
    const data = LogChannel.getData(notifiable, notification)
    console.log(`Notification #${notification.id} is sended data: ${JSON.stringify(data)}`)
    return true
  }

  static getData (notifiable, notification) {
    if (typeof notification.toLog === 'function') {
      return notification.toLog(notifiable)
    }

    throw new NE.RuntimeException('Notification is missing toLog method.')
  }
}

module.exports = LogChannel
