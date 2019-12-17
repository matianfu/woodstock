const path = require('path')

const chai = require('chai')
const expect = chai.expect

const DBus = require('src/dbus')

describe(path.basename(__filename), () => {

  let bus

  beforeEach(() => bus = new DBus())
  afterEach(() => bus.end())

  it.skip('should connect to dbus successfully', done =>
    bus.on('connect', () => done()))

  it.skip('Ping on Peer of org.freedesktop.DBus', done =>
    bus.on('connect', () => {
      bus.methodCall({
        destination: 'org.freedesktop.DBus',
        path: '/org/freedesktop/DBus',
        'interface': 'org.freedesktop.DBus.Peer',
        member: 'Ping',
      }, done)
    }))

  it.skip('GetMachineId on Peer of org.freedesktop.DBus', done =>
    bus.on('connect', () => {
      bus.methodCall({
        destination: 'org.freedesktop.DBus',
        path: '/org/freedesktop/DBus',
        'interface': 'org.freedesktop.DBus.Peer',
        member: 'GetMachineId'
      }, (err, body) => {
        expect(body[0].value).to.equal(bus.machineId)
        done()
      })
    }))
})
