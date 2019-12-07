const path = require('path')

const chai = require('chai')
const expect = chai.expect

const { 
  BYTE, STRING, ARRAY, DICT_ENTRY, VARIANT 
} = require('src/types')

const DBus = require('src/dbus')
const Properties = require('src/interfaces/org.freedesktop.DBus.Properties')
const PropertiesImpl = require('src/impls/org.freedesktop.DBus.Properties')
const Om = require('src/interfaces/org.freedesktop.DBus.ObjectManager')
const OmImpl = require('src/impls/org.freedesktop.DBus.ObjectManager')

const ReadWrite = require('src/interfaces/com.example.readwrite')

describe(path.basename(__filename) +
  ', test org.freedesktop.DBus.ObjectManager implementation' +
  ' using custom readwrite interface', () => {

  let client, server

  // set up client and server
  beforeEach(done => {
    server = new DBus()
    server.addInterface(Properties)
    server.addInterface(Om)
    server.addInterface(ReadWrite)
    server.addImplementation(PropertiesImpl)
    server.addImplementation(OmImpl)
/**
    server.addNode({
      path: '/',
      implementations: [
        'org.freedesktop.DBus.Properties',
        {
          interface: 'com.example.readwrite',
          Read: new STRING('hello'),
          ReadWrite: new STRING('foo')
        }
      ]
    })
*/

    server.addNode({
      path: '/',
      implementations: [
        'org.freedesktop.DBus.Properties',
        'org.freedesktop.DBus.ObjectManager'
      ]
    })

    server.addNode({
      path: '/hello',
      implementations: [
        'org.freedesktop.DBus.Properties',
        {
          interface: 'com.example.readwrite',
          Read: new STRING('hello'),
          ReadWrite: new STRING('foo')
        }
      ]
    })

    server.on('connect', () => {
      if (client.connected) done()
    })

    client = new DBus()
    client.on('connect', () => {
      if (server.connected) done()
    })
  })

  it('do something', done => {
    client.GetManagedObjects(server.myName, '/', (err, body) => {
      // console.log(err, body)
      done()
    })
  })
})
