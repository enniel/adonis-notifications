'use strict'

const NE = require('node-exceptions')
const NotificationSender = require('./NotificationSender')
const AnonymousNotifiable = require('./AnonymousNotifiable')

class ChannelManager {
  constructor (app) {
    this.app = app
    this.channels = {}
  }

  get sender () {
    return new NotificationSender(this, this.app.use('Event'))
  }

  get notifiable () {
    if (!this._notifiable) {
      this._notifiable = new AnonymousNotifiable()
    }

    return this._notifiable
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

  route (channel, data) {
    this.notifiable.route(channel, data)

    return this
  }

  notify (notification) {
    const notifiable = this.notifiable
    delete this._notifiable

    return notifiable.notify(notification)
  }
}

module.exports = ChannelManager
