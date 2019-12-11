const path = require('path')

const DBus = require('../src/dbus')

const client = new DBus()

/**
client.on('connect', () =>
  client.AddMatch({
    type: 'signal',
    sender: ':
  }, err => {
  }))
*/
