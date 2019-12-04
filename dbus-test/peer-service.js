const path = require('path')

const chai = require('chai')
const expect = chai.expect

const { STRING } = require('src/types')
const DBus = require('src/dbus')
const Peer = require('src/interfaces/org.freedesktop.DBus.Peer.js')
const PeerImpl = require('src/impls/org.freedesktop.DBus.Peer.js')

describe(path.basename(__filename), () => {
  it('Ping should return nothing', done => {
    const server = new DBus()
    server.addInterface(Peer)
    server.addImplementation(PeerImpl)

    server.addNode({
      path: '/',
      implementations: ['org.freedesktop.DBus.Peer'],
    })

    server.on('connect', () => {
      if (client.connected) next()
    })

    const client = new DBus()

    client.on('connect', () => {
      if (server.connected) next()
    })

    const next = () => 
      client.Ping(server.myName, (err, body) => {
        expect(err).to.equal(null)  
        expect(body).to.equal(undefined)
        done()
      })
  })

  it('GetMachineId should return server.machineId', done => {
    const server = new DBus({
      interfaces: [Peer],
      implementations: [PeerImpl]
    })

    server.addNode({
      path: '/',
      implementations: ['org.freedesktop.DBus.Peer']
    })

    server.on('connect', () => {
      if (client.connected) next()
    })

    const client = new DBus()

    client.on('connect', () => {
      if (server.connected) next()
    })

    const next = () => {
      client.methodCall({
        destination: server.myName,
        path: '/',
        interface: 'org.freedesktop.DBus.Peer',
        member: 'GetMachineId'
      }, (err, body) => {
        expect(err).to.equal(null)
        expect(body).to.be.an('array')
        expect(body[0]).to.be.an.instanceof(STRING)
        expect(body[0].value).to.equal(server.machineId)
        done()
      })
    }
  })
})
