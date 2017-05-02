# Adonis Asterisk AMI

Easy control via [asterisk](http://www.asterisk.org/) manager interface (AMI).

Installation and configuration
----------------

Using npm:

```sh
npm i adonis-asterisk-ami --save
```
Using yarn:

```sh
yarn add adonis-asterisk-ami
```

Once it's installed, you can register the service provider in `bootsrap/app.js` in the `aceProviders`:

```js
const aceProviders = [
  ...
  'adonis-asterisk-ami/providers/AsteriskAmiProvider',
  ...
]
```

And add commands in `commands`:

```js
const commands = [
  ...
  'Adonis/Commands/Ami:Listen',
  'Adonis/Commands/Ami:Action',
  'Adonis/Commands/Ami:Dongle:Sms',
  'Adonis/Commands/Ami:Dongle:Ussd'
  ...
]
```

Then add `ami.js` file in `config` folder with this code:

```js
'use strict'

const Env = use('Env')

module.exports = {
  // client's parameters
  reconnect: false,
  maxAttemptsCount: 30,
  attemptsDelay: 1000,
  keepAlive: false,
  keepAliveDelay: 1000,
  emitEventsByTypes: true,
  eventTypeToLowerCase: false,
  emitResponsesById: true,
  addTime: false,
  eventFilter: null,
  // connection parameters
  host: Env.get('ASTERISK_AMI_HOST', '127.0.0.1'),
  port: Env.get('ASTERISK_AMI_PORT', 5038),
  username: Env.get('ASTERISK_AMI_USERNAME', ''),
  secret: Env.get('ASTERISK_AMI_SECRET', ''),
  dongle: {
    sms: {
      device: Env.get('ASTERISK_AMI_SMS_DEVICE', 'dongle1')
    }
  }
}
```
For more information abount client's parameters see [documentation](https://github.com/BelirafoN/asterisk-ami-client#clients-parameters).

Usage
----------------
**Connection options**

You are can specify connection parameters for all commands.

| Option     | Description                  |
| ---------  | ---------------------------- |
| --host     | Asterisk AMI server host     |
| --port     | Asterisk AMI server port     |
| --username | Asterisk AMI server username |
| --secret   | Asterisk AMI server secret   |

**Listen ami events**

```sh
./ace ami:listen
```
```js
// app/Listeners/AsteriskAmi.js
'use strict'

const AsteriskAmi = exports = module.exports = {}

AsteriskAmi.onEvent = function * (event) {
  console.log(`${event.Event} handled`)
}

// bootsrap/events.js
...
Event.when('ami.events.*', 'AsteriskAmi.onEvent')
...
```
For more information about `event` property see [asterisk-ami-client](https://github.com/BelirafoN/asterisk-ami-client) documentation.

If would you like to see event log in the console use *debug* option
```sh
./ace ami:listen --debug
```

**Send ami action**

```sh
./ace ami:action <action> --props=<key1>:<value1>,<key2>:<value2> --id=<UNIQUE_ID?>
```

```js
const props = _.reduce({
  <key>: <value>,
  <key2>: <value2>
}, (result, value, key) => {
  if (result.length) {
    result = `${result},`
  }
  result += `${key}:${value}`
  return result
}, '')

// Foo:Bar,ActionID:<UNIQUE_ID?>
Ace.call('ami:action', [<action>], {
  props,
  id: <UNIQUE_ID?>
});
```
Options `props` and `id` is not required.

**Send sms messages using chan dongle**

```sh
./ace ami:dongle:sms <phone> <message> <device?> --id=<UNIQUE_ID?>
```

```js
Ace.call('ami:dongle:sms', [
  <phone>,
  <message>,
  <device?>,
], {
  id: <UNIQUE_ID?>
});
```
For sending long messages use *pdu* mode.
```sh
./ace ami:dongle:sms <phone> <message> <device?> --pdu --id=<UNIQUE_ID?>
```

```js
Ace.call('ami:dongle:sms', [
  <phone>,
  <message>,
  <device?>,
], {
  pdu: true,
  id: <UNIQUE_ID?>
});
```

Argument `device` and option `id` is not required.

**Send ussd commands using chan dongle**

```sh
./ace ami:dongle:ussd <device> <ussd> --id=<UNIQUE_ID>
```

```js
Ace.call('ami:dongle:ussd', [
  <ussd>,
  <device>
], {
  id: <UNIQUE_ID>
});
```

Option `id` is not required.

**Without Adonis App**

See [bin folder](https://github.com/enniel/adonis-asterisk-ami/tree/master/bin)

## Credits

- [Evgeni Razumov](https://github.com/enniel)

## Support

Having trouble? [Open an issue](https://github.com/enniel/adonis-asterisk-ami/issues/new)!

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
