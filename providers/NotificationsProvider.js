'use strict'

/**
 * adonis-notifications
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

const ServiceProvider = require('adonis-fold').ServiceProvider

class NotificationsProvider extends ServiceProvider {
  * register () {
    this.app.bind('Adonis/Notifications/Manager', function (app) {
      const ChannelManager = require('../src/ChannelManager')
      return new ChannelManager(app)
    })
  }
}

module.exports = NotificationsProvider
