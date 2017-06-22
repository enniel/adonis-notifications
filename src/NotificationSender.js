'use strict'

/**
 * adonis-notifications
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

const uuid = require('uuid/v4')
const _ = require('lodash')
const each = require('co-eachseries')

class NotificationSender {
  constructor (manager, emitter) {
    this.manager = manager
    this.emitter = emitter
  }

  * send (notifiables, notification) {
    notifiables = this.formatNotifiables(notifiables)

    yield this.sendNow(notifiables, notification)
  }

  * sendNow (notifiables, notification, channels = []) {
    notifiables = this.formatNotifiables(notifiables)

    channels = _.isArray(channels) ? channels : []

    const self = this
    yield each(notifiables, function * (notifiable) {
      const notificationId = uuid()
      const viaChannels = channels.length ? channels : notification.via(notifiable)

      yield each(viaChannels, function * (channel) {
        yield self.sendToNotifiable(notifiable, notificationId, _.clone(notification), channel)
      })
    })
  }

  * sendToNotifiable (notifiable, id, notification, channel) {
    if (!notification.id) {
      notification.id = id
    }

    const response = yield this.manager.channel(channel).send(notifiable, notification)

    this.emitter.fire('notification.sent', {
      notifiable, notification, channel, response
    })
  }

  formatNotifiables (notifiables) {
    if (typeof notifiables.forEach === 'function') {
      const items = []
      notifiables.forEach((notifiable) => {
        items.push(notifiable)
      })
      return items
    }
    return [notifiables]
  }
}

module.exports = NotificationSender
