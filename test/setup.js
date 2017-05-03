'use strict'

/**
 * adonis-notifications
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

const fold = require('adonis-fold')
const Ace = require('adonis-ace')
const Ioc = fold.Ioc
const Registrar = fold.Registrar
const path = require('path')
const get = require('lodash/get')
const fs = require('co-fs-extra')

const Config = {
  get (key) {
    return get(this, key)
  },

  get database () {
    return {
      connection: 'default',
      default: {
        client: 'sqlite3',
        connection: {
          filename: path.join(__dirname, './storage/test.sqlite3')
        },
        useNullAsDefault: true
      }
    }
  }
}

const Helpers = {
  migrationsPath () {
    return path.join(__dirname, './database/migrations')
  },
  seedsPath () {
    return path.join(__dirname, './database/seeds')
  },
  databasePath (file) {
    return path.join(__dirname, './database', file)
  }
}

const commands = [
  'Adonis/Commands/Migration:Run',
  'Adonis/Commands/Notifications:Setup'
]

const providers = [
  'adonis-ace/providers/CommandProvider',
  'adonis-lucid/providers/DatabaseProvider',
  'adonis-lucid/providers/LucidProvider',
  'adonis-lucid/providers/SchemaProvider',
  'adonis-lucid/providers/MigrationsProvider',
  'adonis-lucid/providers/CommandsProvider',
  'adonis-lucid/providers/FactoryProvider',
  'adonis-lucid/providers/SeederProvider',
  path.join(__dirname, '../providers/NotificationsProvider'),
  path.join(__dirname, '../providers/CommandsProvider')
]

const setup = exports = module.exports = {}

setup.loadProviders = function () {
  Ioc.bind('Adonis/Src/Helpers', function () {
    return Helpers
  })

  Ioc.bind('Adonis/Src/Config', function () {
    return Config
  })
  return Registrar.register(providers)
}

setup.start = function * () {
  yield filesFixtures.createDir()
}

setup.registerCommands = function () {
  Ace.register(commands)
}

setup.end = function * () {
}

setup.migrate = function * (schemas, direction) {
  const Migrations = Ioc.use('Adonis/Src/Migrations')
  yield new Migrations()[direction](schemas)
  if (direction === 'down') {
    yield new Migrations().database.schema.dropTable('adonis_migrations')
  }
}

setup.seed = function (seeds) {
  const Seeder = Ioc.use('Adonis/Src/Seeder')
  return Seeder.exec(seeds)
}

setup.invokeCommand = (command, args = [], options = {}) => {
  return Ace.call(command, args, options)
}

setup.cleanStorageDir = function * () {
  return yield fs.emptyDir(path.join(__dirname, './storage'))
}

setup.createStorageDir = function * () {
  return yield fs.ensureDir(path.join(__dirname, './storage'))
}
