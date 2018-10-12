'use strict'

class HasDatabaseNotifications {
  register (Model) {
    /**
     * Get the entity's notifications.
     */
    Model.prototype.notifications = function () {
      return this
        .morphMany('DatabaseNotification', 'id', 'notifiable_id', 'notifiable_type')
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
