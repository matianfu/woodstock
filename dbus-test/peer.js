const path = require('path')

const chai = require('chai')
const expect = chai.expect

const DBus = require('src/dbus')

const DEST = 'org.freedesktop.DBus'
const ROOT = '/'
const PATH = '/org/freedesktop/DBus'

describe(path.basename(__filename), () => {
  let client

  beforeEach(done => {
    client = new DBus()
    client.on('connect', done)
  })

  afterEach(() => client.end())

  it(`Ping ${DEST} should succeed`, done => {
    client.Ping(DEST, err => {
      expect(err).to.equal(null)
      done()
    })
  })

  it(`Ping ${DEST} with ${ROOT} should succeed`, done => {
    client.Ping(DEST, ROOT, err => {
      expect(err).to.equal(null)
      done()
    })
  })

  it(`Ping ${DEST} with ${PATH} should succeed`, done => {
    client.Ping(DEST, PATH, err => {
      expect(err).to.equal(null)
      done()
    })
  })

  it(`GetMachineId ${DEST} should succeed`, done => {
    client.GetMachineId(DEST, (err, machineId) => {
      expect(err).to.equal(null)
      expect(machineId).to.equal(client.machineId)
      done()
    })
  })

  it(`GetMachineId ${DEST} with ${ROOT} should succeed`, done =>
    client.GetMachineId(DEST, ROOT, (err, machineId) => {
      expect(err).to.equal(null)
      expect(machineId).to.equal(client.machineId)
      done()
    }))

  it(`GetMachineId ${DEST} with ${PATH} should succeed`, done =>
    client.GetMachineId(DEST, PATH, (err, machineId) => {
      expect(err).to.equal(null)
      expect(machineId).to.equal(client.machineId)
      done()
    }))
})
