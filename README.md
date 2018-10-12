# Adonis Notifications

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

2. Register providers inside the your bootstrap/app.js file.

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

## Credits

- [Evgeni Razumov](https://github.com/enniel)

## Support

Having trouble? [Open an issue](https://github.com/enniel/adonis-notifications/issues/new)!

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
