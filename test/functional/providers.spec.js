'use strict'

const path = require('path')
const { ioc, registrar } = require('@adonisjs/fold')
const test = require('japa')

test.group('Providers', (group) => {
  test('NotificationsProvider', async (assert) => {
    await registrar
      .providers([path.join(__dirname, '../../providers/NotificationsProvider')])
      .registerAndBoot()

    assert.isDefined(ioc.use('Adonis/Notifications/Manager'))
    assert.isTrue(ioc._bindings['Adonis/Notifications/Manager'].singleton)
    assert.equal(ioc._aliases['Notifications'], 'Adonis/Notifications/Manager')

    assert.isDefined(ioc.use('Adonis/Notifications/Notifiable'))
    assert.isFalse(ioc._bindings['Adonis/Notifications/Notifiable'].singleton)
    assert.equal(ioc._aliases['Notifiable'], 'Adonis/Notifications/Notifiable')

    assert.isDefined(ioc.use('Adonis/Notifications/HasDatabaseNotifications'))
    assert.isFalse(ioc._bindings['Adonis/Notifications/HasDatabaseNotifications'].singleton)
    assert.equal(ioc._aliases['HasDatabaseNotifications'], 'Adonis/Notifications/HasDatabaseNotifications')

    assert.isDefined(ioc.use('Adonis/Notifications/DatabaseNotification'))
    assert.isFalse(ioc._bindings['Adonis/Notifications/DatabaseNotification'].singleton)
    assert.equal(ioc._aliases['DatabaseNotification'], 'Adonis/Notifications/DatabaseNotification')
    assert.isTrue(ioc.use('Adonis/Notifications/DatabaseNotification').$booted)

    assert.isDefined(ioc.use('Adonis/Notifications/DatabaseMessage'))
    assert.isFalse(ioc._bindings['Adonis/Notifications/DatabaseMessage'].singleton)
    assert.equal(ioc._aliases['DatabaseMessage'], 'Adonis/Notifications/DatabaseMessage')
  })

  test('CommandsProvider', async (assert) => {
    await registrar
      .providers([path.join(__dirname, '../../providers/CommandsProvider')])
      .registerAndBoot()

    assert.isDefined(ioc.use('Adonis/Commands/Notifications:Setup'))
    assert.isFalse(ioc._bindings['Adonis/Commands/Notifications:Setup'].singleton)
  })
})
