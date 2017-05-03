'use strict'

/**
 * adonis-notifications
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

const Ioc = require('adonis-fold').Ioc
const path = require('path')
const Command = Ioc.use('Adonis/Src/Command')

class Setup extends Command {
  get signature () {
    return 'notifications:setup'
  }

  get description () {
    return 'Setup migrations and models for notifications'
  }

  * handle () {
    this.run('make:migration', 'create_notifications_table', {
      template: path.join(__dirname, './templates/notificationsSchema.mustache')
    })
    this.run('make:model', 'Notification', {
      template: path.join(__dirname, './templates/notificationModel.mustache')
    })
  }
}

module.exports = Setup
