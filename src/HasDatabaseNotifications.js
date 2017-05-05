'use strict'

/**
 * adonis-notifications
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

class HasDatabaseNotifications {
  static register (Model) {
    /**
     * Get the entity's notifications.
     */
    Model.prototype.notifications = function () {
      return this
        .morphMany('Adonis/Notifications/DatabaseNotification', 'notifiable')
        .orderBy('created_at', 'desc')
    }

    /**
     * Get the entity's read notifications.
     */
    Model.prototype.readNotifications = function () {
      return this
        .notifications()
        .whereNotNull('read_at')
    }

    /**
     * Get the entity's unread notifications.
     */
    Model.prototype.unreadNotifications = function () {
      return this
        .notifications()
        .whereNull('read_at')
    }
  }
}

module.exports = HasDatabaseNotifications
