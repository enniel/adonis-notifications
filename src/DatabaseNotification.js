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

  getTimestampKey (fieldName) {
    super.getTimestampKey(fieldName)
    if (fieldName === this.constructor.readTimestamp) {
      return 'readTimestamp'
    }
  }

  static get incrementing () {
    return false
  }

  static get readTimestamp () {
    return 'read_at'
  }

  getReadTimestamp (date) {
    return this.formatDate(date)
  }

  * markAsRead () {
    if (!this[this.constructor.readTimestamp]) {
      this[this.constructor.readTimestamp] = this.formatDate(Date.now())
      yield this.save()
    }
  }

  setData (data) {
    return JSON.stringify(data)
  }

  getData (data) {
    return JSON.parse(data)
  }

  read () {
    return this[this.constructor.readTimestamp] !== null
  }

  unread () {
    return this[this.constructor.readTimestamp] === null
  }
}

module.exports = DatabaseNotification
