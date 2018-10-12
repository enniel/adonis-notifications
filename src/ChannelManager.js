'use strict'

const NE = require('node-exceptions')
const NotificationSender = require('./NotificationSender')

class ChannelManager {
  constructor (app) {
    this.app = app
    this.channels = {}
  }

  get sender () {
    return new NotificationSender(this, this.app.use('Event'))
  }

  extend (channel, callback) {
    if (typeof callback !== 'function') {
      throw new NE.InvalidArgumentException('Argument callback must be function.')
    }
    this.channels[channel] = callback
    return this
  }

  channel (channel) {
    if (!this.channels[channel]) {
      throw new NE.InvalidArgumentException(`Channel [${channel}] not supported.`)
    }

    return this.channels[channel](this.app)
  }

  send (notifiables, notification) {
    return this.sender.send(notifiables, notification)
  }

  sendNow (notifiables, notification, channels = []) {
    return this.sender.sendNow(notifiables, notification, channels)
  }
}

module.exports = ChannelManager
