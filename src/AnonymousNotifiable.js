'use strict'

class AnonymousNotifiable {
  constructor () {
    this.routes = {}
  }

  route (channel, route) {
    this.routes[channel] = route

    return this
  }

  notify (notification) {
    return use('Notifications').send(this, notification)
  }

  routeNotificationFor (channel) {
    return this.routes[channel] || null
  }
}

module.exports = AnonymousNotifiable
