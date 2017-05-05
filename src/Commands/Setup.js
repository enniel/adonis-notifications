'use strict'

/**
 * adonis-notifications
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

const Ace = require('adonis-ace')
const Ioc = require('adonis-fold').Ioc
const path = require('path')
const Command = Ioc.use('Adonis/Src/Command')

class Setup extends Command {
  get signature () {
    return 'notifications:setup'
  }

  get description () {
    return 'Setup migration for notifications'
  }

  * handle () {
    yield Ace.call('make:migration', ['create_notifications_table'], {
      template: path.join(__dirname, './templates/notifications_schema.mustache')
    })
  }
}

module.exports = Setup
