const path = require('path')

const chai = require('chai')
const expect = chai.expect

const { BYTE, STRING, ARRAY, DICT_ENTRY, VARIANT } = require('src/types')
const DBus = require('src/dbus')
const Properties = require('src/interfaces/org.freedesktop.DBus.Properties')
const PropertiesImpl = require('src/templates/org.freedesktop.DBus.Properties')
const ReadWrite = require('src/interfaces/com.example.readwrite')

describe(path.basename(__filename), () => {
  let server

  beforeEach(done => {
    server = new DBus()
    server.addInterface(Properties)
    server.addInterface(ReadWrite)
    server.addTemplate(PropertiesImpl)

    server.addNode({
      path: '/',
      implementations: [
        'org.freedesktop.DBus.Properties',
        {
          interface: 'com.example.readwrite',
          Read: 'hello',
          ReadWrite: 'foo'
        }
      ]
    })

    server.on('connect', done)
  })

  it('Get Read should succeed', () => {
    const read = server.invoke({
      path: '/',
      interface: 'org.freedesktop.DBus.Properties',
      member: 'Get',
      body: [ 
        new STRING('com.example.readwrite'), 
        new STRING('Read')
      ]
    })

    expect(read.eval()).to.equal('hello')
  })

  it('Set ReadWrite should succeed', () => {
    server.invoke({
      path: '/',
      interface: 'org.freedesktop.DBus.Properties',
      member: 'Set',
      body: [
        new STRING('com.example.readwrite'),
        new STRING('ReadWrite'),
        new VARIANT(new STRING('slash'))
      ]
    })

    const read = server.invoke({
      path: '/',
      interface: 'org.freedesktop.DBus.Properties',
      member: 'Get',
      body: [ 
        new STRING('com.example.readwrite'), 
        new STRING('ReadWrite')
      ]
    })

    expect(read.eval()).to.equal('slash')
  })

  it('Set ReadWrite should succeed', () => {
    server.on('signal', signal => {
      console.log(signal)
    })

    server.invoke({
      path: '/',
      interface: 'org.freedesktop.DBus.Properties',
      member: 'Set',
      body: [
        new STRING('com.example.readwrite'),
        new STRING('ReadWrite'),
        new VARIANT(new STRING('slash'))
      ]
    })

    const read = server.invoke({
      path: '/',
      interface: 'org.freedesktop.DBus.Properties',
      member: 'Get',
      body: [ 
        new STRING('com.example.readwrite'), 
        new STRING('ReadWrite')
      ]
    })

    expect(read.eval()).to.equal('slash')
  })



})
