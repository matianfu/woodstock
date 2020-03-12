const path = require('path')

const chai = require('chai')
const expect = chai.expect

const { STRING } = require('src/types')
const DBus = require('src/dbus')
const Peer = require('src/interfaces/org.freedesktop.DBus.Peer.js')
const PeerImpl = require('src/templates/org.freedesktop.DBus.Peer.js')

describe(path.basename(__filename), () => {
  let server, client

  beforeEach(done => {
    server = new DBus()
    server.addInterface(Peer)
    server.addTemplate(PeerImpl)
    server.addNode('/', 'org.freedesktop.DBus.Peer')

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

  it.skip('Ping should return nothing', done =>
    client.Ping(server.myName, (err, body) => {
      expect(err).to.equal(null)
      expect(body).to.equal(undefined)
      done()
    }))

  it.skip('GetMachineId should return server.machineId', done =>
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
    }))
})
