'use strict'

/**
 * adonis-notifications
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

const ServiceProvider = require('adonis-fold').ServiceProvider

class NotificationsProvider extends ServiceProvider {
  * register () {
    this.app.singleton('Adonis/Notifications/Manager', function (app) {
      const ChannelManager = require('../src/ChannelManager')
      return new ChannelManager(app)
    })
    this.app.bind('Adonis/Notifications/Notifiable', function () {
      return require('../src/Notifiable')
    })
  }

  * boot () {
    const NotificationManager = this.app.use('Adonis/Notifications/Manager')
    NotificationManager.extend('database', function (app) {
      const DatabaseChannel = require('../src/Channels/DatabaseChannel')
      return new DatabaseChannel(app)
    })
  }
}

module.exports = NotificationsProvider
