'use strict'

const ace = require('@adonisjs/ace')
const { ServiceProvider } = require('@adonisjs/fold')

class CommandsProvider extends ServiceProvider {
  register () {
    this.app.bind('Adonis/Commands/Notifications:Setup', () => {
      return require('../src/Commands/Setup')
    })
  }

  boot () {
    ace.addCommand('Adonis/Commands/Notifications:Setup')
  }
}

module.exports = CommandsProvider
