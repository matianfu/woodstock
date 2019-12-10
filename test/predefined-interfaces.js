const path = require('path')

const chai = require('chai')
const expect = chai.expect

const normalize = require('src/interface') 
const ifaces = require('src/interfaces')
const validate = require('src/impls')

describe(path.basename(__filename), () => {
  it('normalize org.freedesktop.DBus.Peer', done => {
    const ni = normalize(ifaces['org.freedesktop.DBus.Peer'])
    done()
  })

  it('normalize org.freedesktop.DBus.Properties', done => {
    const ni = normalize(ifaces['org.freedesktop.DBus.Properties'])
    done()
  })

  it('normalize org.bluez.GattCharacteristic1', done => {
    const ni = normalize(ifaces['org.bluez.GattCharacteristic1'])
    done()
  })

  it('normalize org.bluez.LEAdvertisement1', done => {
    const ni = normalize(ifaces['org.bluez.LEAdvertisement1'])
    done()
  })
})

