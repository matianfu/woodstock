const path = require('path')

const chai = require('chai')
const expect = chai.expect

const { 
  BYTE, STRING, OBJECT_PATH, ARRAY, DICT_ENTRY, VARIANT 
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

    server.addNode({
      path: '/',
      implementations: [
        'org.freedesktop.DBus.Properties',
        'org.freedesktop.DBus.ObjectManager'
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

  afterEach(() => {
    server.end()
    client.end()
  })

  it('empty dict if no children', done => {
    client.GetManagedObjects(server.myName, '/', (err, body) => {
      expect(err).to.equal(null)
      expect(body).to.deep.equal([new ARRAY('a{oa{sa{sv}}}')])
      done()
    })
  })

  it('server add /hello should emit internal signal', done => {
    server.on('signal', s => {
      expect(s.origin).to.equal(null)
      expect(s.path).to.equal('/')
      expect(s.interface).to.equal('org.freedesktop.DBus.ObjectManager')
      expect(s.member).to.equal('InterfacesAdded')
      expect(s.body).to.deep.equal([
        new OBJECT_PATH('/hello'),
        new ARRAY([
          new DICT_ENTRY([
            new STRING('org.freedesktop.DBus.Properties'),
            new ARRAY('a{sv}')
          ]),
          new DICT_ENTRY([
            new STRING('com.example.readwrite'),
            new ARRAY('a{sv}', [
              new DICT_ENTRY([
                new STRING('Read'),
                new VARIANT(new STRING('hello'))
              ]),
              new DICT_ENTRY([
                new STRING('ReadWrite'),
                new VARIANT(new STRING('foo'))
              ])
            ])
          ])
        ])  
      ])
      done()
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
  })

  it('server add /hello should emit DBus signal', done => {
    client.AddMatch({
      type: 'signal',
      sender: server.myName,
      interface: 'org.freedesktop.DBus.ObjectManager',
      path_namespace: '/' 
    }, err => {
      if (err) return done(err)

      client.on('signal', s => {
        expect(s.sender).to.equal(server.myName)
        expect(s.path).to.equal('/')
        expect(s.interface).to.equal('org.freedesktop.DBus.ObjectManager')
        expect(s.member).to.equal('InterfacesAdded')
        expect(s.signature).to.equal('oa{sa{sv}}')
        expect(s.body).to.deep.equal([
          new OBJECT_PATH('/hello'),
          new ARRAY([
            new DICT_ENTRY([
              new STRING('org.freedesktop.DBus.Properties'),
              new ARRAY('a{sv}')
            ]),
            new DICT_ENTRY([
              new STRING('com.example.readwrite'),
              new ARRAY('a{sv}', [
                new DICT_ENTRY([
                  new STRING('Read'),
                  new VARIANT(new STRING('hello'))
                ]),
                new DICT_ENTRY([
                  new STRING('ReadWrite'),
                  new VARIANT(new STRING('foo'))
                ])
              ])
            ])
          ])  
        ])
        done()
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
    })
  })
})
