# Adonis Notifications

A provider for easy sending notifications (Inspired [Laravel Notifications](https://laravel.com/docs/5.7/notifications))

[![Build Status](https://travis-ci.org/enniel/adonis-notifications.svg?branch=master)](https://travis-ci.org/enniel/adonis-notifications)
[![Coverage Status](https://coveralls.io/repos/github/enniel/adonis-notifications/badge.svg?branch=master)](https://coveralls.io/github/enniel/adonis-notifications?branch=master)

## Installation

1. Add package:

```bash
$ npm i adonis-notifications --save
```
or

```bash
$ yarn add adonis-notifications
```

2. Register providers inside the your start/app.js file.

```js
const providers = [
  ...
  'adonis-notifications/providers/NotificationsProvider',
  ...
]
```

```js
const aceProviders = [
  ...
  'adonis-notifications/providers/CommandsProvider',
  ...
]
```

3. Notifications table

```sh
./ace run notifications:setup
```

## Examples

```js
// app/Model/User.js

...
class User extends Lucid {
  static get traits () {
    return [
      '@provider:Morphable',
      '@provider:HasDatabaseNotifications',
      '@provider:Notifiable'
    ]
  }
}
...
```

This package used [adonis-lucid-polymorphic](https://github.com/enniel/adonis-lucid-polymorphic) for `database` channel.

```js
// app/Notifications/TestNotification.js

...
class TestNotification {
  static get type () {
    return 'test'
  }

  via () {
    return ['database']
  }

  toJSON () {
    return {
      foo: 'bar'
    }
  }
}
...

```

```js
// app/Http/routes.js

const Notifications = use('Notifications')

...

  // from model instance
  const user = await User.find(1)
  await user.notify(user, new TestNotification())
  // to one user
  const user = await User.find(1)
  await Notifications.send(user, new TestNotification())
  // to many users
  const users = await User.query().fetch()
  await Notifications.send(users, new TestNotification())

...

```

## Custom Channels

```js
// app/providers/YourProvider.js

...

boot () {
  const NotificationManager = this.app.use('Notifications')
  NotificationManager.extend('custom', () => {
    return new CustomChannel()
  })
}

...
```

## On-Demand Notifications

```js
const FcmMessage = use('FcmMessage')
const Notifications = use('Notifications')

class PushTestNotification {
  constructor (animal) {
    this.animal = animal
  }

  static get type () {
    return 'pushtest'
  }

  via () {
    return ['fcm']
  }

  toFcm () {
    const message = new FcmMessage()
    switch (this.animal) {
      case 'cat':
        message.addNotification('title', 'Cat')
        message.addNotification('body', 'Meow!')
        message.addNotification('icon', 'cat_black')
        message.addNotification('color', '#ffab00')
        message.addNotification('sound', 'default')
        message.addData('animal', 'cat')
        break

      case 'cow':
        message.addNotification('title', 'Cow')
        message.addNotification('body', 'Moo!')
        message.addNotification('icon', 'cow_black')
        message.addNotification('color', '#aeaeaf')
        message.addNotification('sound', 'default')
        message.addData('animal', 'cow')
        break

      case 'dog':
        message.addNotification('title', 'Dog')
        message.addNotification('body', 'Woof!')
        message.addNotification('icon', 'dog_black')
        message.addNotification('color', '#b19267')
        message.addNotification('sound', 'default')
        message.addData('animal', 'dog')
        break

      case 'duck':
        message.addNotification('title', 'Duck')
        message.addNotification('body', 'Quack!')
        message.addNotification('icon', 'duck_black')
        message.addNotification('color', '#bd7f00')
        message.addNotification('sound', 'default')
        message.addData('animal', 'duck')
        break

      case 'pig':
        message.addNotification('title', 'Pig')
        message.addNotification('body', 'Oink!')
        message.addNotification('icon', 'pig_black')
        message.addNotification('color', '#d37b93')
        message.addNotification('sound', 'default')
        message.addData('animal', 'pig')
        break

      default:
        message.addNotification('title', 'Animal')
        message.addNotification('body', 'A wild animal has appeared!')
        message.addNotification('sound', 'default')
        break
    }
    return message
  }
}

Notifications
  .route('fcm', '<DEVICE_TOKEN>')
  .notify(new PushTestNotification('cat'))
```

## Channels

- [adonis-fcm-notification-channel](https://github.com/enniel/adonis-fcm-notification-channel)
- [adonis-mail-notification-channel](https://github.com/enniel/adonis-mail-notification-channel)

## Credits

- [Evgeni Razumov](https://github.com/enniel)

## Support

Having trouble? [Open an issue](https://github.com/enniel/adonis-notifications/issues/new)!

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
