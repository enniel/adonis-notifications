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
require('dotenv').config({ path: path.join(__dirname, '../.env') })
const Env = process.env

const Config = {
  get (key) {
    return get(this, key)
  },

  get database () {
    return {
      migrationsTable: 'adonis_migrations',

      connection: Env.DB_CONNECTION || 'sqlite',

      sqlite: {
        client: 'sqlite3',
        connection: {
          filename: path.join(__dirname, './storage/test.sqlite')
        },
        useNullAsDefault: true
      },

      mysql: {
        client: 'mysql',
        connection: {
          host: Env.DB_HOST || 'localhost',
          port: Env.DB_PORT || 3306,
          user: Env.DB_USER || 'root',
          password: Env.DB_PASSWORD || '',
          database: Env.DB_DATABASE || 'adonis'
        }
      },

      pg: {
        client: 'pg',
        connection: {
          host: Env.DB_HOST || 'localhost',
          port: Env.DB_PORT || 5432,
          user: Env.DB_USER || 'root',
          password: Env.DB_PASSWORD || '',
          database: Env.DB_DATABASE || 'adonis'
        }
      }
    }
  }
}

const Helpers = {
  appPath () {
    return __dirname
  },
  basePath () {
    return __dirname
  },
  migrationsPath (file = '') {
    return path.join(__dirname, './database/migrations', file)
  },
  seedsPath () {
    return path.join(__dirname, './database/seeds')
  },
  databasePath (file = '') {
    return path.join(__dirname, './database', file)
  }
}

const commands = [
  'Adonis/Commands/Make:Migration',
  'Adonis/Commands/Make:Model',
  'Adonis/Commands/Migration:Run',
  'Adonis/Commands/Notifications:Setup'
]

const providers = [
  'adonis-ace/providers/CommandProvider',
  'adonis-framework/providers/EventProvider',
  'adonis-lucid/providers/DatabaseProvider',
  'adonis-lucid/providers/LucidProvider',
  'adonis-lucid/providers/SchemaProvider',
  'adonis-lucid/providers/MigrationsProvider',
  'adonis-lucid/providers/CommandsProvider',
  'adonis-lucid/providers/FactoryProvider',
  'adonis-lucid/providers/SeederProvider',
  'adonis-commands/providers/GeneratorsProvider',
  'adonis-lucid-polymorphic/providers/PolymorphicProvider',
  path.join(__dirname, '../providers/NotificationsProvider'),
  path.join(__dirname, '../providers/CommandsProvider')
]

const aliases = {
  Lucid: 'Adonis/Src/Lucid',
  Schema: 'Adonis/Src/Schema'
}

const setup = exports = module.exports = {}

setup.loadProviders = function * () {
  Ioc.bind('Adonis/Src/Helpers', function () {
    return Helpers
  })
  Ioc.bind('Adonis/Src/Config', function () {
    return Config
  })
  yield Registrar.register(providers)
  Ioc.aliases(aliases)
}

setup.registerCommands = function () {
  Ace.register(commands)
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

setup.removeStorageDir = function * () {
  yield fs.remove(path.join(__dirname, './storage'))
}

setup.removeMigrationsDir = function * () {
  yield fs.remove(path.join(__dirname, './database/migrations'))
}

setup.createStorageDir = function * () {
  yield fs.ensureDir(path.join(__dirname, './storage'))
}

setup.createMigrationsDir = function * () {
  yield fs.ensureDir(path.join(__dirname, './database/migrations'))
}
