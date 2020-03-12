const path = require('path')

const chai = require('chai')
const expect = chai.expect

const { BYTE, STRING, ARRAY, DICT_ENTRY, VARIANT } = require('src/types')
const DBus = require('src/dbus')
const Properties = require('src/interfaces/org.freedesktop.DBus.Properties')
const PropertiesImpl = require('src/templates/org.freedesktop.DBus.Properties')
const ReadWrite = require('src/interfaces/com.example.readwrite')

describe(path.basename(__filename) + ', local invoke', () => {
  let server, client

  beforeEach(done => {
    server = new DBus()
    server.addInterface(Properties)
    server.addInterface(ReadWrite)
    server.addTemplate(PropertiesImpl)

    server.addNode('/', 'org.freedesktop.DBus.Properties', {
      interface: 'com.example.readwrite',
      Read: 'hello',
      ReadWrite: 'world',
      Update () { }
    })

    server.on('connect', () => client.connected && done())

    client = new DBus()
    client.on('connect', () => server.connected && done())
  })

  afterEach(() => {
    server.end()
    client.end()
  })

  it('Get Read (sync) should succeed', () =>
    expect(server.Get({
      path: '/',
      interfaceName: 'com.example.readwrite',
      propertyName: 'Read'
    })).to.deep.equal(new VARIANT(new STRING('hello'))))

  it('Get Read (async) should succeed', done =>
    server.Get({
      path: '/',
      interfaceName: 'com.example.readwrite',
      propertyName: 'Read'
    }, (err, result) => {
      expect(err).to.equal(null)
      expect(result).to.deep.equal(new VARIANT(new STRING('hello')))
      done()
    }))

  it('Get Read (sync) from bad interface should throw UnknownInterface', () =>
    expect(() => server.Get({
      path: '/',
      interfaceName: 'com.example.foo',
      propertyName: 'Read'
    })).to.throw(Error).with
      .property('name', 'org.freedesktop.DBus.Error.UnknownInterface'))

  it('Get Read (async) from bad interface should error UnknownInterface', done =>
    server.Get({
      path: '/',
      interfaceName: 'com.example.foo',
      propertyName: 'Read'
    }, (err, result) => {
      expect(err).to.be.an('Error').with
        .property('name', 'org.freedesktop.DBus.Error.UnknownInterface')
      done()
    }))

  it('Get Foo (sync) should throw UnknownProperty', () =>
    expect(() => server.Get({
      path: '/',
      interfaceName: 'com.example.readwrite',
      propertyName: 'Foo'
    })).to.throw(Error)
      .with.property('name', 'org.freedesktop.DBus.Error.UnknownProperty'))

  it('Get Foo (async) should error UnknownProperty', done =>
    server.Get({
      path: '/',
      interfaceName: 'com.example.readwrite',
      propertyName: 'Foo'
    }, (err, result) => {
      expect(err).to.be.an('Error')
        .with.property('name', 'org.freedesktop.DBus.Error.UnknownProperty')
      done()
    }))

  it('Set Read (sync) with non-TYPE value should throw', () =>
    expect(() => server.Set({
      path: '/',
      interfaceName: 'com.example.readwrite',
      propertyName: 'Read',
      value: 'foo'
    })).to.throw(Error))

  it('Set Read (sync) with BYTE should throw InvalidSignature', () =>
    expect(() => server.Set({
      path: '/',
      interfaceName: 'com.example.readwrite',
      propertyName: 'Read',
      value: new BYTE(1)
    })).to.throw(Error)
      .with.property('name', 'org.freedesktop.DBus.Error.InvalidSignature'))

  it('Set Read (sync) with STRING should succeed', () => {
    server.Set({
      path: '/',
      interfaceName: 'com.example.readwrite',
      propertyName: 'Read',
      value: new STRING('foo')
    })

    const r = server.Get({
      path: '/',
      interfaceName: 'com.example.readwrite',
      propertyName: 'Read'
    })

    expect(r).to.deep.equal(new VARIANT(new STRING('foo')))
  })

  it('Set Read (sync) with STRING should emit signal locally', done => {
    server.on('signal', s => {
      expect(s).to.deep.equal({
        path: '/',
        interface: 'org.freedesktop.DBus.Properties',
        member: 'PropertiesChanged',
        body: [
          new STRING('com.example.readwrite'),
          new ARRAY([
            new DICT_ENTRY([
              new STRING('Read'),
              new VARIANT(new STRING('foo'))
            ])
          ]),
          new ARRAY('as', [])
        ]
      })
      done()
    })

    server.Set({
      path: '/',
      interfaceName: 'com.example.readwrite',
      propertyName: 'Read',
      value: new STRING('foo')
    })
  })

  it('Set Read (sync) with STRING should emit signal remotely', done => {
    client.AddMatch({
      type: 'signal',
      sender: server.myName,
      interface: 'org.freedesktop.DBus.Properties',
      member: 'PropertiesChanged',
      path_namespace: '/'
    }, err => {
      expect(err).to.equal(null)
      server.Set({
        path: '/',
        interfaceName: 'com.example.readwrite',
        propertyName: 'Read',
        value: new STRING('foo')
      })
    })

    client.on('signal', signal => {
      expect(Object.assign({}, signal, { body: signal.body.map(x => x.eval()) }))
        .to.deep.equal({
          path: '/',
          interface: 'org.freedesktop.DBus.Properties',
          member: 'PropertiesChanged',
          signature: 'sa{sv}as',
          body: ['com.example.readwrite', { Read: 'foo' }, []],
          sender: server.myName
        })
      done()
    })
  })
})
