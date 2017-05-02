'use strict'

/**
 * adonis-notifications
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

const NE = require('node-exceptions')

class LogChannel {
  * send (notifiable, notification) {
    const data = this.getData(notifiable, notification)
    console.log(`Notification #${notification.id} is sended with data: ${JSON.stringify(data)}`)
    return true
  }

  getData (notifiable, notification) {
    if (typeof notification.toLog === 'function') {
      return notification.toLog(notifiable)
    }

    throw new NE.RuntimeException('Notification is missing toLog method.')
  }
}

module.exports = LogChannel
