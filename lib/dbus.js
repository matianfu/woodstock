const path = require('path')
const EventEmitter = require('events')
const net = require('net')

const xml2js = require('xml2js')
const debug = require('debug')('dbus')

const {
  LITTLE, BIG, TYPE,
  BYTE, BOOLEAN, INT16, UINT16, INT32, UINT32, INT64, UINT64, DOUBLE, UNIX_FD,
  STRING, OBJECT_PATH, SIGNATURE,
  STRUCT, ARRAY, VARIANT, DICT_ENTRY
} = require('./dbus-types')
const DBusDriver = require('./dbus-driver')
const DBusObject = require('./dbus-object')

const DBUS_SOCKET = '/run/dbus/system_bus_socket'

// DBus implements DBus Message Bus
class DBus extends EventEmitter {
  constructor (opts) {
    super()
    // context-specific class
    this.DBusObject = class extends DBusObject {}
    this.DBusObject.prototype.dbus = this

    this.driver = new DBusDriver()
    this.driver.on('connect', () => this.emit('connect'))
    this.driver.on('message', msg => {})
    this.driver.on('invocation', m => this.handleMethodCall(m))

    this.root = new this.DBusObject()  
  }

  handleMethodCall (m) {
    let namepath = m.path.split('/').filter(x => !!x)
    let obj = this.root.route(namepath)

    if (!obj) {
      this.driver.error({
        flags: { noReply: true },
        destination: m.sender,
        replySerial: m.serial,
        errorName: 'org.freedesktop.DBus.Error.UnknownObject',
      })
      console.log(`path ${m.path} not found, message dropped`)
      return // TODO
    }

    let iface = obj.ifaces.find(i => i.name === m.interface)
    if (!iface) {
      this.driver.error({
        flags: { noReply: true },
        destination: m.sender,
        replySerial: m.serial,
        errorName: 'org.freedesktop.DBus.Error.UnknownInterface',
        signature: 's',
        body: [new STRING(`${m.interface} not found`)],
      })
      console.log(`${m.interface} not implement at ${m.path}`)
      return // TODO
    }

    let ifaceDef = iface.definition
    let sigs = ifaceDef.method(m.member)
    if (!sigs) {
      return // TODO
    }
    
    if (typeof iface[m.member] !== 'function') {
      console.log(`${m.member} not implemented`)
      return // TODO
    }

    let isigs = sigs.filter(s => s.direction === 'in').map(s => s.type)
    let osigs = sigs.filter(s => s.direction === 'out').map(s => s.type)

    m.signature = m.signature || ''
    if (isigs.join('') !== m.signature) {
      console.log(`signature mismatch`)
      return 
    } 

    m.body = m.body || []
    iface[m.member](...m.body, (err, body) => {
      // console.log(err, body, body[0].signature())        
      if (err) {
        // TODO
      } else {
        let rep = {
          flags: { noReply: true }, 
          destination: m.sender,
          replySerial: m.serial,
          signature: body[0].signature(),
          body
        }
        console.log('rep', rep)
        this.driver.reply(rep)
      }
    })
  }

  createObject(dpath, obj) {
    if (path.normalize(dpath) !== dpath) throw new Error('not a normalized path')
    if (!path.isAbsolute(dpath)) throw new Error('not an absolute path')
    // dobj, TODO

    let dobj = new this.DBusObject(obj)

    // let dirname = path.dirname(dpath)
    let namepath = dpath.split('/').filter(x => !!x)
    this.root.install(namepath, dobj)
  }

  createDBusObject () {
    return new this.DBusObject()
  }

  attach (dpath, dobj) {
    if (path.normalize(dpath) !== dpath) throw new Error('not a normalized path')
    if (!path.isAbsolute(dpath)) throw new Error('not an absolute path')

    let namepath = dpath.split('/').filter(x => !!x)
    if (this.root.route(namepath)) throw new Error('dbus object exists')

    namepath.pop()
    let dir = this.root.route(namepath, true)
    dobj.name = path.basename(dpath)
    dir.children.push(dobj)
  }
}

module.exports = DBus

