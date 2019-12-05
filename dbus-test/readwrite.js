const path = require('path')

const chai = require('chai')
const expect = chai.expect

const { STRING, VARIANT } = require('src/types')
const DBus = require('src/dbus')
const Properties = require('src/interfaces/org.freedesktop.DBus.Properties')
const PropertiesImpl = require('src/impls/org.freedesktop.DBus.Properties')
const ReadWrite = require('src/interfaces/com.example.readwrite')

/**
 * There are three props on readwrite interface
 * Get Read should succeed
 * Get Write should fail
 * Get ReadWrite should succeed
 * GetAll should have Read and ReadWrite but no Write
 * Set Read should fail
 * Set Write should succeed with internal signal but no dbus signal
 * Set ReadWrite should succeed with both internal signal and dbus signal
 */
describe(path.basename(__filename), () => {
  it ('Get Read should succeed', done => {
    const next = () => client.connected && server.connected && nextNext()

    const server = new DBus()
    server.addInterface(Properties)
    server.addInterface(ReadWrite)
    server.addImplementation(PropertiesImpl)

    server.addNode({
      path: '/',
      implementations: [
        'org.freedesktop.DBus.Properties',
        {
          interface: 'com.example.readwrite',
          Read: new STRING('hello'),
          Write: new STRING('world'),
          ReadWrite: new STRING('foobar')
        }
      ]
    })
    server.on('connect', next)

    const client = new DBus()
    client.on('connect', next)

    const nextNext = () => 
      client.GetProp(server.myName, '/', 'com.example.readwrite', 'Read', 
        (err, body) => {
          if (err) {
            done(err)
          } else {
            const actual = body
            const expected = new VARIANT(new STRING('hello'))

            console.dir(body[0], { depth: 5 })
            console.dir(expected, { depth: 5 })
            
            expect(actual).to.deep.equal(expected)
          }
          console.log(err, body)
          done()
        })
  }) 

/**
  it ('GetAll on readwrite', done => {
    const server = new DBus() 
    server.addInterface(Properties)
    server.addInterface(ReadWrite)
    server.addImplementation(PropertiesImpl)

    server.addNode({
      path: '/',
      implementations: [
        'org.freedesktop.DBus.Properties',
        {
          interface: 'com.example.readwrite',
          Read: new STRING('hello'),
          Write: new STRING('world'),
          ReadWrite: new STRING('foobar')
        }
      ]
    })

    server.on('connect', () => {
      if (client.connected) next()
    })

    const client = new DBus()

    client.on('connect', () => {
      if (server.connected) next()
    })

    next = () => 
      client.methodCall({
        destination: server.myName,
        path: '/',
        interface: 'org.freedesktop.DBus.Properties',
        member: 'GetAll',
        signature: 's',
        body: [
          new STRING('com.example.readwrite')
        ]
      }, (err, body) => {
        expect(err).to.equal(null)
        expect(body[0].signature()).to.equal('a{sv}')

        const de0 = body[0].elems[0]
        const de1 = body[0].elems[1]
        const m = {}

        m[de0.elems[0].value] = de0.elems[1].elems[1].value
        m[de1.elems[0].value] = de1.elems[1].elems[1].value

        expect(m).to.deep.equal({
          Read: 'hello',
          ReadWrite: 'foobar'
        })

        done()
      })
  })
*/
})
