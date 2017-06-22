'use strict'

/**
 * adonis-lucid-polymorphic
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

const semver = require('semver')
const shell = require('shelljs')
const nodeJsVersion = process.version
let proxiesFlag = ''

if (semver.lt(nodeJsVersion, '6.0.0')) {
  proxiesFlag = '--harmony_proxies'
}

shell.exec(`DB=${process.env.DB || 'sqlite3'} node ${proxiesFlag} ./node_modules/.bin/istanbul cover _mocha --colors --report lcovonly -- -R spec test/unit && cat ./coverage/lcov.info | coveralls && rm -rf ./coverage`)
