# Adonis Notifications (WORK IN PROGRESS)

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

3. Register commnads

```js
const commands = [
  ...
  'Adonis/Commands/Notifications:Setup'
  ...
]
```

4. Notifications table

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
      'Adonis/Lucid/MorphTrait',
      'Adonis/Notifications/HasDatabaseNotifications',
      'Adonis/Notifications/Notifiable'
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

const Notification = use('Adonis/Notifications/Manager')

Route.post('test', function * (request, response) {
  // to one user
  const user = request.auth.user
  yield user.notify(user, new TestNotification())
  // to many users
  const users = yield User.query().fetch()
  yield Notification.send(users, new TestNotification())
})
```

## Custom Channels

```js
// app/providers/YourProvider.js

...

* boot () {
  const NotificationManager = this.app.use('Adonis/Notifications/Manager')
  NotificationManager.extend('custom', function (app) {
    const CustomChannel = app.use('App/Channels/CustomChannel')
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
