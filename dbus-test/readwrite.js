const path = require('path')

const chai = require('chai')
const expect = chai.expect

const { BYTE, STRING, ARRAY, DICT_ENTRY, VARIANT } = require('src/types')
const DBus = require('src/dbus')
const Properties = require('src/interfaces/org.freedesktop.DBus.Properties')
const PropertiesImpl = require('src/templates/org.freedesktop.DBus.Properties')
const ReadWrite = require('src/interfaces/com.example.readwrite')

describe(path.basename(__filename) + ', local invoke', () => {
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
          ReadWrite: 'world',
          Update () { }
        }
      ]
    })

    server.on('connect', done)
  })

  afterEach(() => {
    server.end()
  })

  it('invoking Update synchronously with bad object path should throw UnkownObject',
    () => expect(() => server.invoke({
      path: '/home', // bad object path
      interface: 'com.example.readwrite',
      member: 'Update',
      body: [new STRING('ReadWrite'), new STRING('foo')]
    })).to.throw(Error).with
      .property('name', 'org.freedesktop.DBus.Error.UnknownObject'))

  it('invoking Update asynchronously with bad object path should throw UnkownObject',
    done => server.invoke({
      path: '/home', // bad object path
      interface: 'com.example.readwrite',
      member: 'Update',
      body: [new STRING('ReadWrite'), new STRING('foo')]
    }, err => {
      expect(err).to.be.an('Error').with
        .property('name', 'org.freedesktop.DBus.Error.UnknownObject')
      done()
    }))

  it('invoking Update synchronously with bad interface should throw UnknownInterface',
    () => expect(() => server.invoke({
      path: '/',
      interface: 'com.example.foo', // bad interface
      member: 'Update',
      body: [new STRING('ReadWrite'), new STRING('foo')]
    })).to.throw(Error).with
      .property('name', 'org.freedesktop.DBus.Error.UnknownInterface'))

  it('invoking Update asynchronously with bad interface should throw UnknownInterface',
    done => server.invoke({
      path: '/',
      interface: 'com.example.foo', // bad interface
      member: 'Update',
      body: [new STRING('ReadWrite'), new STRING('foo')]
    }, err => {
      expect(err).to.be.an('Error').with
        .property('name', 'org.freedesktop.DBus.Error.UnknownInterface')
      done()
    }))

  it('invoking Foo (bad method) synchronously should throw UnknownMethod',
    () => expect(() => server.invoke({
      path: '/',
      interface: 'com.example.readwrite',
      member: 'Foo', // bad method
      body: [new STRING('ReadWrite'), new STRING('foo')]
    })).to.throw(Error).with
      .property('name', 'org.freedesktop.DBus.Error.UnknownMethod'))

  it('invoking Foo (bad method) asynchronously should throw UnknownMethod',
    done => server.invoke({
      path: '/',
      interface: 'com.example.readwrite',
      member: 'Foo', // bad method
      body: [new STRING('ReadWrite'), new STRING('foo')]
    }, err => {
      expect(err).to.be.an('Error').with
        .property('name', 'org.freedesktop.DBus.Error.UnknownMethod')
      done()
    }))

  it('invoking Update synchronously with bad arg type should throw InvalidSignature',
    () => expect(() => server.invoke({
      path: '/',
      interface: 'com.example.readwrite',
      member: 'Update',
      body: [new STRING('ReadWrite'), new BYTE(1)] // bad sig
    })).to.throw(Error).with
      .property('name', 'org.freedesktop.DBus.Error.InvalidSignature'))

  it('invoking Update asynchronously with bad arg type should throw InvalidSignature',
    done => server.invoke({
      path: '/',
      interface: 'com.example.readwrite',
      member: 'Update',
      body: [new STRING('ReadWrite'), new BYTE(1)] // bad sig
    }, err => {
      expect(err).to.be.an('Error').with
        .property('name', 'org.freedesktop.DBus.Error.InvalidSignature')
      done()
    }))

  it('invoking Update synchronously with bad arg num should throw InvalidSignature',
    () => expect(() => server.invoke({
      path: '/',
      interface: 'com.example.readwrite',
      member: 'Update',
      body: [new STRING('ReadWrite')] // bad sig
    })).to.throw(Error).with
      .property('name', 'org.freedesktop.DBus.Error.InvalidSignature'))

  it('invoking Update asynchronously with bad arg num should throw InvalidSignature',
    done => server.invoke({
      path: '/',
      interface: 'com.example.readwrite',
      member: 'Update',
      body: [new STRING('ReadWrite')] // bad sig
    }, err => {
      expect(err).to.be.an('Error').with
        .property('name', 'org.freedesktop.DBus.Error.InvalidSignature')
      done()
    }))

  it('invoking Update synchronously should succeed', () => {
    const result = server.invoke({
      path: '/',
      interface: 'com.example.readwrite',
      member: 'Update',
      body: [new STRING('ReadWrite'), new STRING('foo')]
    })
    expect(result).to.equal(undefined)
  })

  it('invoking Update asynchronously should succeed', done =>
    server.invoke({
      path: '/',
      interface: 'com.example.readwrite',
      member: 'Update',
      body: [new STRING('ReadWrite'), new STRING('foo')]
    }, (err, result) => {
      expect(err).to.equal(null)
      expect(result).to.equal(undefined)
      done()
    }))

  it.skip('Set ReadWrite should succeed', () => {
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

  it.skip('Set ReadWrite should succeed', () => {
    server.on('signal', signal => {
      // console.log('signal', signal)
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

describe(path.basename(__filename) + ', remote invoke', () => {
  let client, server

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
          Read: new STRING('hello'),
          ReadWrite: new STRING('world'),
          Update () {}
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

  afterEach(() => {
    server.end()
    client.end()
  })

  it('invoking Update with bad service name should receive ServiceUnknown',
    done => client.invoke({
      destination: 'foo.bar', // bad service name
      path: '/',
      interface: 'com.example.readwrite',
      member: 'Update',
      body: [new STRING('ReadWrite'), new STRING('foo')]
    }, err => {
      expect(err).to.be.an('Error').with
        .property('name', 'org.freedesktop.DBus.Error.ServiceUnknown')
      done()
    }))

  it('invoking Update with bad object path should throw UnkownObject',
    done => client.invoke({
      destination: server.myName,
      path: '/home', // bad object path
      interface: 'com.example.readwrite',
      member: 'Update',
      body: [new STRING('ReadWrite'), new STRING('foo')]
    }, err => {
      expect(err).to.be.an('Error').with
        .property('name', 'org.freedesktop.DBus.Error.UnknownObject')
      done()
    }))

  it('invoking Update asynchronously with bad interface should throw UnknownInterface',
    done => server.invoke({
      destination: server.myName,
      path: '/',
      interface: 'com.example.foo', // bad interface
      member: 'Update',
      body: [new STRING('ReadWrite'), new STRING('foo')]
    }, err => {
      expect(err).to.be.an('Error').with
        .property('name', 'org.freedesktop.DBus.Error.UnknownInterface')
      done()
    }))

  it('invoking Foo (bad method) should throw UnknownMethod',
    done => server.invoke({
      destination: server.myName,
      path: '/',
      interface: 'com.example.readwrite',
      member: 'Foo', // bad method
      body: [new STRING('ReadWrite'), new STRING('foo')]
    }, err => {
      expect(err).to.be.an('Error').with
        .property('name', 'org.freedesktop.DBus.Error.UnknownMethod')
      done()
    }))

  it('invoking Update with bad arg type should throw InvalidSignature',
    done => server.invoke({
      destination: server.myName,
      path: '/',
      interface: 'com.example.readwrite',
      member: 'Update',
      body: [new STRING('ReadWrite'), new BYTE(1)] // bad sig
    }, err => {
      expect(err).to.be.an('Error').with
        .property('name', 'org.freedesktop.DBus.Error.InvalidSignature')
      done()
    }))

  it('invoking Update with bad arg num should throw InvalidSignature',
    done => server.invoke({
      destination: server.myName,
      path: '/',
      interface: 'com.example.readwrite',
      member: 'Update',
      body: [new STRING('ReadWrite')] // bad sig
    }, err => {
      expect(err).to.be.an('Error').with
        .property('name', 'org.freedesktop.DBus.Error.InvalidSignature')
      done()
    }))

  it('invoking Update should succeed', done =>
    server.invoke({
      destination: server.myName,
      path: '/',
      interface: 'com.example.readwrite',
      member: 'Update',
      body: [new STRING('ReadWrite'), new STRING('foo')]
    }, (err, result) => {
      expect(err).to.equal(null)
      expect(result).to.equal(undefined)
      done()
    }))
})

/**
 * There are two props on readwrite interface, Read and ReadWrite
 */
describe(path.basename(__filename) +
  ', test org.freedesktop.DBus.Properties implementation' +
  ' using custom readwrite interface', () => {
  let client, server

  // set up client and server
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
          Read: new STRING('hello'),
          ReadWrite: new STRING('foo'),
          Update () {}
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

  afterEach(() => {
    server.end()
    client.end()
  })

  it('Get Read should succeed', done =>
    client.GetProp(server.myName, '/', 'com.example.readwrite', 'Read',
      (err, body) => {
        if (err) return done(err)
        expect(body).to.deep.equal([new VARIANT(new STRING('hello'))])
        done()
      }))

  it('Get Write should fail with UnknownProperty', done =>
    client.GetProp(server.myName, '/', 'com.example.readwrite', 'Write',
      (err, body) => {
        expect(err).is.an('Error')
        expect(err.code).to.equal('ERR_DBUS_ERROR')
        expect(err.name).to.equal('org.freedesktop.DBus.Error.UnknownProperty')
        done()
      }))

  it('Get ReadWrite should succeed', done =>
    client.GetProp(server.myName, '/', 'com.example.readwrite', 'ReadWrite',
      (err, body) => {
        if (err) return done(err)
        expect(body).to.deep.equal([new VARIANT(new STRING('foo'))])
        done()
      }))

  it('GetAll should return Read and ReadWrite but no Write', done =>
    client.GetAllProps(server.myName, '/', 'com.example.readwrite',
      (err, body) => {
        if (err) return done(err)
        expect(body).to.deep.equal([
          new ARRAY([
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
        done()
      }))

  it('Set Read should fail with PropertyReadOnly', done =>
    client.SetProp(server.myName, '/', 'com.example.readwrite', 'Read',
      new STRING('bar'),
      (err, body) => {
        expect(err).to.be.an('Error')
        expect(err.name).to.equal('org.freedesktop.DBus.Error.PropertyReadOnly')
        expect(err.code).to.equal('ERR_DBUS_ERROR')
        done()
      }))

  it('Set Write to "bar" should failed with UnknownProperty', done =>
    client.SetProp(server.myName, '/', 'com.example.readwrite', 'Write',
      new STRING('bar'),
      (err, body) => {
        expect(err).to.be.an('Error')
        expect(err.name).to.equal('org.freedesktop.DBus.Error.UnknownProperty')
        expect(err.code).to.equal('ERR_DBUS_ERROR')
        done()
      }))

  it('Set ReadWrite to BYTE should fail with InvalidSignature', done => {
    client.SetProp(server.myName, '/', 'com.example.readwrite', 'ReadWrite',
      new BYTE(2),
      (err, body) => {
        expect(err).to.be.an('Error')
        expect(err.name).to.equal('org.freedesktop.DBus.Error.InvalidSignature')
        expect(err.code).to.equal('ERR_DBUS_ERROR')
        done()
      })
  })

  it('Set ReadWrite to "bar" should succeed', done =>
    client.SetProp(server.myName, '/', 'com.example.readwrite', 'ReadWrite',
      new STRING('bar'),
      (err, body) => {
        expect(err).to.equal(null)
        expect(body).to.equal(undefined)
        done()
      }))

  it('Set ReadWrite to "bar" and read back should be "bar"', done =>
    client.SetProp(server.myName, '/', 'com.example.readwrite', 'ReadWrite',
      new STRING('bar'),
      (err, body) => {
        if (err) return done(err)
        client.GetProp(server.myName, '/', 'com.example.readwrite', 'ReadWrite',
          (err, body) => {
            expect(err).to.equal(null)
            expect(body).to.deep.equal([new VARIANT(new STRING('bar'))])
            done()
          })
      }))

  it('Set ReadWrite to "bar" should emit signal on server', done => {
    client.SetProp(server.myName, '/', 'com.example.readwrite', 'ReadWrite',
      new STRING('bar'), (err, body) => {})

    server.on('signal', s => {
      expect(s.origin.sender).to.equal(client.myName)
      expect(s.path).to.equal('/')
      expect(s.interface).to.equal('org.freedesktop.DBus.Properties')
      expect(s.member).to.equal('PropertiesChanged')
      expect(s.body).to.deep.equal([
        new STRING('com.example.readwrite'),
        new ARRAY([
          new DICT_ENTRY([
            new STRING('ReadWrite'),
            new VARIANT(new STRING('bar'))
          ])
        ]),
        new ARRAY('as')
      ])
      done()
    })
  })

  it('Set ReadWrite should receive signal on client', done => {
    client.AddMatch({
      type: 'signal',
      sender: server.myName,
      interface: 'org.freedesktop.DBus.Properties',
      member: 'PropertiesChanged',
      path_namespace: '/'
    }, err => {
      if (err) return done(err)

      client.SetProp(server.myName, '/', 'com.example.readwrite', 'ReadWrite',
        new STRING('bar'), (err, body) => {})

      client.on('signal', s => {
        expect(s.sender).to.equal(server.myName)
        expect(s.path).to.equal('/')
        expect(s.interface).to.equal('org.freedesktop.DBus.Properties')
        expect(s.member).to.equal('PropertiesChanged')
        expect(s.body).to.deep.equal([
          new STRING('com.example.readwrite'),
          new ARRAY([
            new DICT_ENTRY([
              new STRING('ReadWrite'),
              new VARIANT(new STRING('bar'))
            ])
          ]),
          new ARRAY('as')
        ])
        done()
      })
    })
  })
})
