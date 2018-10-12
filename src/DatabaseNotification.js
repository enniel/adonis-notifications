'use strict'

const { ioc } = require('@adonisjs/fold')
const Model = ioc.use('Model')
const _ = require('lodash')

const formatHook = (instance) => {
  if (typeof instance.format === 'function') {
    instance.$attributes = instance.format(instance.$attributes)
    instance.$originalAttributes = instance.format(instance.$originalAttributes)
  }
}

const parseHook = (instance) => {
  if (typeof instance.parse === 'function') {
    instance.$attributes = instance.parse(instance.$attributes)
    instance.$originalAttributes = instance.parse(instance.$originalAttributes)
  }
}

const parseEvents = [
  'beforeCreate',
  'beforeUpdate',
  'beforeSave'
]

const formatEvents = [
  'afterCreate',
  'afterUpdate',
  'afterSave',
  'afterFind'
]

class DatabaseNotification extends Model {
  static get table () {
    return 'notifications'
  }

  static get incrementing () {
    return false
  }

  static get dates () {
    return [
      'read_at',
      'created_at',
      'updated_at'
    ]
  }

  parse (attrs) {
    return _.mapValues(attrs, (value, key) => {
      if (key === 'data' && typeof value === 'object') {
        return JSON.stringify(value)
      }
      return value
    })
  }

  format (attrs) {
    return _.mapValues(attrs, (value, key) => {
      if (key === 'data' && typeof value === 'string') {
        return JSON.parse(value)
      }
      return value
    })
  }

  static boot () {
    super.boot()

    formatEvents.forEach(eventName => {
      this.addHook(eventName, formatHook)
    })

    parseEvents.forEach(eventName => {
      this.addHook(eventName, parseHook)
    })

    this.addHook('afterFetch', (instances) => {
      for (let instance of instances) {
        formatHook(instance)
      }
    })

    this.addHook('afterPaginate', (instances) => {
      for (let instance of instances) {
        formatHook(instance)
      }
    })
  }

  markAsRead () {
    this['read_at'] = Date.now()
    return this.save()
  }

  read () {
    return this['read_at'] !== null
  }

  unread () {
    return this['read_at'] === null
  }
}

module.exports = DatabaseNotification
