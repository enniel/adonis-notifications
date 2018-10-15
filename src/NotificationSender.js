'use strict'

const uuid = require('uuid/v4')
const _ = require('lodash')

class NotificationSender {
  constructor (manager, emitter) {
    this.manager = manager
    this.emitter = emitter
  }

  send (notifiables, notification) {
    return this.sendNow(notifiables, notification)
  }

  async sendNow (notifiables, notification, channels = []) {
    notifiables = this.formatNotifiables(notifiables)
    channels = Array.isArray(channels) ? channels : []

    const responses = []
    for (let notifiable of notifiables) {
      const viaChannels = channels.length ? channels : notification.via(notifiable)

      for (let channel of viaChannels) {
        const response = await this.sendToNotifiable(notifiable, notification, channel)
        responses.push(response)
      }
    }
    return responses
  }

  async sendToNotifiable (notifiable, notification, channel) {
    notification = _.clone(notification)
    if (!notification.id) {
      notification.id = uuid()
    }

    const response = await this.manager.channel(channel).send(notifiable, notification)

    this.emitter.fire('notification.sent', {
      notifiable, notification, channel, response
    })

    return response
  }

  formatNotifiables (notifiables) {
    if (Array.isArray(notifiables)) {
      return notifiables
    }
    if (Array.isArray(notifiables.rows)) {
      return notifiables.rows
    }
    return [notifiables]
  }
}

module.exports = NotificationSender
