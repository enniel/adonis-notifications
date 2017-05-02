'use strict'

/**
 * adonis-notifications
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

const NE = require('node-exceptions')
const NotificationSender = require('./NotificationSender')

class ChannelManager {
  constructor (app) {
    this.app = app
    this.channels = {}
  }

  get sender () {
    return new NotificationSender(this, this.app.use('Adonis/Src/Event'))
  }

  extend (channel, callback) {
    if (typeof callback !== 'function') {
      throw new NE.InvalidArgumentException('Argument callback must be function.');
    }
    this.channels[channel] = callback
    return this
  }

  channel (channel) {
    if (!this.channels[channel]) {
      throw new NE.InvalidArgumentException(`Channel [${channel}] not supported.`);
    }

    return this.channels[channel](this.app)
  }

  * send (notifiables, notification) {
    return yield this.sender.send(notifiables, notification)
  }

  * sendNow (notifiables, notification, channels = []) {
    return yield this.sender.sendNow(notifiables, notification, channels)
  }
}

module.exports = ChannelManager
