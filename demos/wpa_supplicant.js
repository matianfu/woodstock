const path = require('path')

const DBus = require('../src/dbus')

const client = new DBus()

client.on('connect', () => {
  client.AddMatch({
    type: 'signal',
    sender: 'fi.w1.wpa_supplicant1',
    interface: 'org.freedesktop.DBus.Properties',
    member: 'PropertiesChanged',
    'path_namespace': '/fi/w1/wpa_supplicant1'
  }, err => {
    console.log(err)
  })
})


