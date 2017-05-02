'use strict'

const each = require('co-eachseries')
const uuid = require('uuid/v4')
const clone = require('lodash/clone')

/**
 * adonis-notifications
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

class NotificationSender {
  constructor (manager, emitter) {
    this.manager = manager
    this.emitter = emitter
  }

  * send (notifiables, notification) {
    notifiables = this.formatNotifiables(notifiables)

    return yield this.sendNow(notifiables, notification)
  }

  * sendNow (notifiables, notification, channels = []) {
    notifiables = this.formatNotifiables(notifiables)
    channels = Array.isArray(channels) ? channels : []

    const _this = this

    yield each (notifiables, function * (notifiable) {
      const notificationId = uuid()
      const viaChannels = channels.length ? channels : notification.via(notifiable)

      yield each (viaChannels, function * (channel) {
        yield _this.sendToNotifiable(notifiable, notificationId, clone(notification), channel)
      })
    })
  }

  * sendToNotifiable (notifiable, id, notification, channel) {
    if (!notification.id) {
      notification.id = id
    }

    const response = yield this.manager.channel(channel).send(notifiable, notification)

    this.emitter.fire('notification.sent', notifiable, notification, channel, response)
  }

  formatNotifiables (notifiables) {
    if (!Array.isArray(notifiables)) {
      return [
        notifiables
      ]
    }
    return notifiables
  }
}

module.exports = NotificationSender
