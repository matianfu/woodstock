const EventEmitter = require('events')

const DBusObject = require('../lib/dbus-object')
const DBusProperties = require('../lib/dbus-properties')
const DBusObjectManager = require('../lib/dbus-object-manager')
const GattService1 = require('./gatt-service1')
const GattCharacteristic1 = require('./gatt-characteristic1-2')
const { OBJECT_PATH, ARRAY } = require('../lib/dbus-types')

class Char0 extends GattCharacteristic1(EventEmitter) {

  constructor () {
    super ()
    this.UUID = '80000001-0182-406c-9221-0a6680bd0943'
    this.Flags = ['write', 'indicate']
  }

  StartNotify (m) {
    this.emit('startNotify')
  }

  StopNotify (m) {
    this.emit('stopNotify')
  }

  Confirm (m) {
    this.emit('confirm')
  }

  WriteValue (m, value) {
    this.emit('writeValue', m, value)
  } 
}

class GattSerialService extends DBusObject {

  constructor (name, primary) {
    super (name)
    this.sessionId = 0
    this.started = false
    this.pending = false
    this.incoming = ''
    this.outgoing = ''

    this.addInterface(new DBusProperties())
    this.addInterface(new DBusObjectManager())
    this.addInterface(new GattService1({
      UUID: '80000000-0182-406c-9221-0a6680bd0943',
      Primary: !!primary
    }))

    let pipeIface = new Char0()
      .on('startNotify', () => this.start())
      .on('stopNotify', () => this.stop())
      .on('confirm', () => this.handleConfirm())
      .on('writeValue', value => this.receive(value))

    let pipeObj = new DBusObject('char0')
      .addInterface(new DBusProperties())
      .addInterface(pipeIface)

    this.addChild(pipeObj)
  }

  start () {
    this.started = true
    this.pending = false
    this.incoming = ''
    this.outgoing = ''
    this.emit('start', this.sessionId++)
  }

  stop () {
    this.started = false
    this.emit('stop', this.sessionId) 
  }

  receive (value) {
    if (!this.started) return
    this.incoming += value 

    while (this.incoming.indexOf('\n')) {
      let idx = this.incomming.indexOf('\n')
      let line = this.incomming.slice(0, idx)
      this.incomming = this.incoming.slice(idx + 1)
      try {
        this.emit('data', JSON.parse(line))
      } catch (e) {
        // silent
      }
    }
  }

  handleConfirm () {
    if (!this.started) return
    this.pending = false
    this.send()
  }

  _send (string) {
    if (string) this.outgoing += string
    if (this.waitingForConfirm) return
    let payload = this.outgoing.slice(0, 20)
    this.outgoing = this.outgoing.slice(20)
    // TODO
  }

  // no callback ???
  send (obj) {
    if (!this.started) return
    if (obj.sessionId !== this.sessionId) return
    try {
      let string = JSON.stringify(obj)
      this.send(string)
    } catch (e) {
      console.log(e)
    }
  }

  register () {

    console.log(' ====================== ')
    console.log(this.objectPath())

    this.dbus.driver.invoke({
      destination: 'org.bluez',
      path: '/org/bluez/hci0',
      'interface': 'org.bluez.GattManager1',
      member: 'RegisterApplication',
      signature: 'oa{sv}',
      body: [
        new OBJECT_PATH(this.objectPath()),
        new ARRAY('a{sv}')
      ]
    }, (err, data) => {
      console.log('register application', err, data)
    }) 
  }

  mounted () {
    super.mounted()
    console.log('hello ======================== world')
    this.register()
  }
}

module.exports = GattSerialService
