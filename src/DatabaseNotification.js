'use strict'

/**
 * adonis-notifications
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

const use = require('adonis-fold').Ioc.use
const Lucid = use('Adonis/Src/Lucid')

class DatabaseNotification extends Lucid {
  static get table () {
    return 'notifications'
  }

  static get incrementing () {
    return false
  }

  static get readTimestamp () {
    return 'read_at'
  }

  * markAsRead () {
    if (!this.read_at) {
      yield this
        .set('read_at', Date.now())
        .save()
    }
  }

  read () {
    return this.read_at !== null
  }

  unread () {
    return this.read_at === null
  }
}

module.exports = DatabaseNotification
