'use strict'

const Lucid = use('Lucid')

class Notification extends Lucid {

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

module.exports = Notification
