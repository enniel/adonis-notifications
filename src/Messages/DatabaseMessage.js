'use strict'

const _ = require('lodash')
const NE = require('node-exceptions')

class DatabaseMessage {
  constructor (data = {}) {
    this.data = data
  }

  get data () {
    return this._data
  }

  set data (data) {
    if (!Array.isArray(data) && !_.isObject(data)) {
      throw new NE.InvalidArgumentException('Argument data must me object or array.')
    }
    this._data = data
  }
}

module.exports = DatabaseMessage
