'use strict'

/**
 * adonis-notifications
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

const NE = require('node-exceptions')
const capitalize = require('lodash/capitalize')
const NotificationSender = require('./NotificationSender')

class ChannelManager {
  constructor (app) {
    this.app = app
    this.channels = {}
    this.customCreators = {}
  }

  get defaultDriver () {
    return 'log'
  }

  extend (channel, callback) {
    this.customCreators[channel] = callback
    return this
  }

  channel (channel) {
    channel = channel ? channel : this.defaultChannel

    if (!this.channels[channel]) {
      this.channels[channel] = this.createChannel(channel)
    }

    return this.channels[channel]
  }

  createChannel (channel) {
    if (this.customCreators[channel]) {
      return this.callCustomCreator(channel)
    } else {
      const method = `create${capitalize(channel)}Channel`;
      if (typeof this[method] === 'function') {
        return this[method]()
      }
    }
    throw new NE.InvalidArgumentException(`Channel [${channel}] not supported.`);
  }

  createDatabaseChannel () {
    return require('./Channels/DatabaseChannel')
  }

  createLogChannel () {
    return require('./Channels/LogChannel')
  }

  * send (notifiables, notification) {
    const sender = new NotificationSender(this, this.app.use('Adonis/Src/Event'))
    return yield sender.send(notifiables, notification)
  }

  * sendNow (notifiables, notification, channels = []) {
    const sender = new NotificationSender(this, this.app.use('Adonis/Src/Event'))
    return yield sender.sendNow(notifiables, notification, channels)
  }
}

module.exports = ChannelManager
