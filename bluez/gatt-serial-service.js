const EventEmitter = require('events')

const debug = require('debug')('gatt-serial')

const DBusObject = require('../lib/dbus-object')
const DBusProperties = require('../lib/dbus-properties')
const DBusObjectManager = require('../lib/dbus-object-manager')
const GattService1 = require('./gatt-service1')
const GattCharacteristic1 = require('./gatt-characteristic1-2')
const GattWriteCharacteristic = require('./gatt-write-characteristic')
const { OBJECT_PATH, ARRAY } = require('../lib/dbus-types')

class Char0 extends GattCharacteristic1(EventEmitter) {

  constructor () {
    super ()
    this.UUID = '80000001-0182-406c-9221-0a6680bd0943'
    this.Flags = ['indicate']
  }

  StartNotify () {
    this.emit('StartNotify')
  }

  StopNotify (m) {
    this.emit('StopNotify')
  }

  Confirm (m) {
    this.emit('Confirm')
  }
}

class Char1 extends GattCharacteristic1(EventEmitter) {

  constructor (opts) {
    super()
    this.UUID = '80000002-0182-406c-9221-0a6680bd0943'
    this.Flags = ['read', 'write']



/**
  cache {
    VAL: original TYPE-ed value
    opt: parsed
  }
*/
    
  }

  // convert TYPE opt to JS object
  parse (opt) {
    return opt.eval().reduce((o, [name, kv]) => Object.assign(o, { [name]: kv[1] }), {})
  }

  /*
  Possible options: 
    "offset": uint16 offset
    "device": Object Device (Server only)

  Possible Errors: org.bluez.Error.Failed
    org.bluez.Error.InProgress
    org.bluez.Error.NotPermitted
    org.bluez.Error.NotAuthorized
    org.bluez.Error.InvalidOffset
    org.bluez.Error.NotSupported
  */
  ReadValue (opt, callback) {
    opt = this.parse(opt)
    if (this.cache) {
      if (this.cache.opt.device === opt.device) {
        return callback(null, this.cache.VAL)
      } else {
        this.cache = null
      }
    }
    callback(null, new ARRAY('ay'))
  }

  // value byte array
  // option { offset, device, link }
  WriteValue (val, opt, callback) {
    val = val.eval()
    opt = opt.eval().reduce((o, [name, kv]) => Object.assign(o, { [name]: kv[1] }), {})

    console.log('WriteValue', val.length, Buffer.from(val).toString(), opt)
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

    this.rxIface = new Char0()
      .on('StartNotify', () => this.start())
      .on('StopNotify', () => this.stop())
      .on('Confirm', () => this.handleConfirm())

    this.rxObj = new DBusObject('char0')
      .addInterface(new DBusProperties())
      .addInterface(this.rxIface)

    this.addChild(this.rxObj)

    this.txIface = new GattWriteCharacteristic({
      UUID: '80000002-0182-406c-9221-0a6680bd0943',
      readable: true
    })

    this.txObj = new DBusObject('char1')
      .addInterface(new DBusProperties())
      .addInterface(this.txIface)

    this.addChild(this.txObj)

    this.listener = this.listen.bind(this)
  }

  start () {

    console.log('start')

    this.started = true
    this.pending = false
    this.incoming = ''
    this.outgoing = ''
    this.emit('Start', this.sessionId++)
  }

  stop () {

    console.log('stop')

    this.started = false
    this.emit('Stop', this.sessionId) 
  }

  receive (value) {

    console.log('receive', value)

    if (!this.started) return
    this.incoming += value 

    while (this.incoming.indexOf('\n')) {
      let idx = this.incoming.indexOf('\n')
      let line = this.incoming.slice(0, idx)
      this.incoming = this.incoming.slice(idx + 1)
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
    this.dbus.listen({ sender: 'org.bluez', path: '/org/bluez' }, this.listener)
    this.register()
  }

  listen (m) {
    if (m.path === '/org/bluez/hci0' &&
      m.interface === 'org.bluez.Adapter1' &&
      m.Powered === true) {
      this.register()
    }
  } 
}

module.exports = GattSerialService
