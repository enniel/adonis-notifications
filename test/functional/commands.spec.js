'use strict'

const test = require('japa')
const ace = require('@adonisjs/ace')
const fs = require('fs-extra')
const path = require('path')
const walkSync = require('walk-sync')
const { ioc, registrar } = require('@adonisjs/fold')
const { Config, setupResolver, Helpers } = require('@adonisjs/sink')
const fixtures = require('../fixtures')

test.group('Commands', (group) => {
  group.before(async () => {
    ioc.bind('Adonis/Src/Config', () => {
      const config = new Config()
      config.set('database', require('../config'))
      return config
    })
    ioc.bind('Adonis/Src/Helpers', () => {
      return new Helpers(path.join(__dirname, '..'))
    })
    ioc.alias('Adonis/Src/Helpers', 'Helpers')

    await registrar
      .providers([
        '@adonisjs/lucid/providers/LucidProvider',
        path.join(__dirname, '../../providers/CommandsProvider')
      ]).registerAndBoot()
    await fs.ensureDir(path.join(__dirname, '../tmp'))
    const Database = use('Database')
    await fixtures.up(Database)
    setupResolver()
  })

  group.beforeEach(() => {
    ioc.restore()
  })

  group.after(async function () {
    const Database = use('Database')
    await fixtures.down(Database)
    Database.close()

    try {
      await fs.remove(path.join(__dirname, '../tmp'))
    } catch (error) {
      if (process.platform !== 'win32' || error.code !== 'EBUSY') {
        throw error
      }
    }
  }).timeout(0)

  test('notifications:setup', async (assert) => {
    await ace.call('notifications:setup')
    let paths = walkSync(ioc.use('Helpers').migrationsPath(), { directories: false })
    paths = paths.map(path => path.substring(14))
    assert.includeMembers(paths, [
      'create_notifications_table.js'
    ])
  })
})
