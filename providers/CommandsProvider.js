'use strict'

/**
 * adonis-notifications
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

const ServiceProvider = require('adonis-fold').ServiceProvider

class CommandsProvider extends ServiceProvider {
  * register () {
    this.app.bind('Adonis/Commands/Notifications:Setup', function () {
      const Setup = require('../src/Commands/Setup')
      return new Setup()
    })
  }
}

module.exports = CommandsProvider
