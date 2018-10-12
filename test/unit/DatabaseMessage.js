'use strict'

const test = require('japa')
const DatabaseMessage = require('../../src/Messages/DatabaseMessage')

test.group('DatabaseMessage', () => {
  test('should set data from constructor', assert => {
    const message = new DatabaseMessage({
      foo: 'bar'
    })
    assert.equal(message.data.foo, 'bar')
  })

  test('should be able set data from setter', assert => {
    const message = new DatabaseMessage()
    message.data = {
      foo: 'bar'
    }
    assert.equal(message.data.foo, 'bar')
  })

  test('should throw an invalid argument exception when set data from constructor', assert => {
    assert.plan(1)
    const fn = () => {
      return new DatabaseMessage('bar')
    }
    try {
      fn()
    } catch ({ message }) {
      assert.equal(message, 'Argument data must me object or array.')
    }
  })

  test('should throw an invalid argument exception when set data from setter', assert => {
    assert.plan(1)
    const fn = () => {
      (new DatabaseMessage()).data = 'bar'
    }
    try {
      fn()
    } catch ({ message }) {
      assert.equal(message, 'Argument data must me object or array.')
    }
  })
})
