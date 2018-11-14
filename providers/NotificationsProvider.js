'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

class NotificationsProvider extends ServiceProvider {
  register () {
    this.app.singleton('Adonis/Notifications/Manager', app => {
      const ChannelManager = require('../src/ChannelManager')
      return new ChannelManager(app)
    })
    this.app.alias('Adonis/Notifications/Manager', 'Notifications')
    this.app.bind('Adonis/Notifications/Notifiable', () => {
      const Notifiable = require('../src/Notifiable')
      return new Notifiable()
    })
    this.app.alias('Adonis/Notifications/Notifiable', 'Notifiable')
    this.app.bind('Adonis/Notifications/HasDatabaseNotifications', () => {
      const HasDatabaseNotifications = require('../src/HasDatabaseNotifications')
      return new HasDatabaseNotifications()
    })
    this.app.alias('Adonis/Notifications/HasDatabaseNotifications', 'HasDatabaseNotifications')
    this.app.bind('Adonis/Notifications/DatabaseNotification', () => {
      const DatabaseNotification = require('../src/DatabaseNotification')
      DatabaseNotification._bootIfNotBooted()
      return DatabaseNotification
    })
    this.app.alias('Adonis/Notifications/DatabaseNotification', 'DatabaseNotification')
    this.app.bind('Adonis/Notifications/DatabaseMessage', () => {
      return require('../src/Messages/DatabaseMessage')
    })
    this.app.alias('Adonis/Notifications/DatabaseMessage', 'DatabaseMessage')
  }

  boot () {
    const NotificationManager = this.app.use('Notifications')
    NotificationManager.extend('database', () => {
      const DatabaseChannel = require('../src/Channels/DatabaseChannel')
      return new DatabaseChannel()
    })
  }
}

module.exports = NotificationsProvider
