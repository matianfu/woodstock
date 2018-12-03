const path = require('path')
const EventEmitter = require('events')
const net = require('net')

const xml2js = require('xml2js')
const debug = require('debug')('dbus')

const {
  LITTLE, BIG,
  BYTE, BOOLEAN, INT16, UINT16, INT32, UINT32, INT64, UINT64, DOUBLE, UNIX_FD,
  STRING, OBJECT_PATH, SIGNATURE,
  STRUCT, ARRAY, VARIANT, DICT_ENTRY
} = require('./types')
const DBusInterfaces = require('./dbus-interface')
const DBusDriver = require('./dbus-driver')
const { DBusObject, DBusDir, DBusNode } = require('./dbus-object')

const DBUS_SOCKET = '/run/dbus/system_bus_socket'

// DBus implements DBus Message Bus
class DBus extends EventEmitter {
  constructor (opts) {
    super()

    this.ifaceMap = new Map()

    this.root = new DBusDir()  
    this.root.dbus = this

    this.driver = new DBusDriver()
    this.driver.on('connect', () => this.emit('connect'))
    this.driver.on('message', msg => {})
    this.driver.on('invocation', m => {
      console.log('[invocation]', m)

      let namepath = m.path.split('/').filter(x => !!x)
      let obj = this.root.route(namepath)
      if (!obj) {
        console.log(`path ${m.path} not found, message dropped`)
        return // TODO
      }

      let iface = obj.ifaces.find(i => i.name === m.interface)
      if (!iface) {
        console.log(`${m.interface} not implement at ${m.path}, message dropped`)
        return // TODO
      }

      let ifaceDef = DBusInterfaces.find(i => i.name() === m.interface)
      if (!ifaceDef) {
        console.log(`${m.interface} definition not found, message dropped`) 
        return // TODO error
      }

      let sigs = ifaceDef.method(m.member)
      if (!sigs) {
        return // TODO
      }
      
      if (typeof iface[m.member] !== 'function') {
        console.log(`${m.member} not implemented`)
        return
      }

      let isigs = sigs.filter(s => s.direction === 'in').map(s => s.type)
      let osigs = sigs.filter(s => s.direction === 'out').map(s => s.type)

      m.signature = m.signature || ''
      if (isigs.join('') !== m.signature) {
        console.log(`signature mismatch`)
        return 
      } 

      let bf
      if (m.signature) {
        bf = iface[m.member].bind(iface, ...m.body)
      } else {
        bf = iface[m.member].bind(iface)
      }

      bf((err, body) => {
        console.log(err, body, body[0].signature())        
        if (err) {
          // TODO
        } else {
          let rep = {
            flags: { noReply: true }, 
            // path: m.path,
            // interface: m.interface,
            // member: m.member,
            destination: m.sender,
            replySerial: m.serial,
            signature: body[0].signature(),
            body
          }

          console.log('rep', rep)

          this.driver.reply(rep)
        }
      })

/**
{ type: 'ERROR',
  flags: { noReply: true },
  version: 1,
  serial: 3,
  destination: ':1.258',
  errorName: 'org.freedesktop.DBus.Error.UnknownInterface',
  replySerial: 2,
  signature: 's',
  sender: 'org.freedesktop.DBus',
  body:
   [ STRING {
       value:
        'org.freedesktop.DBus does not understand message GetManagedObjects' } ] }
*/      



/**
        this.driver.error({
          destination: m.sender,
          errorName: 'org.freedesktop.DBus.Error.UnknownInterface',
          replySerial: m.serial,
          signature: 's',
          body: [
            new STRING(`unknown interface and message ${m.member}`)
          ]
        })
*/
        


    })
  }

  createObject(dpath, obj) {
    if (path.normalize(dpath) !== dpath) throw new Error('not a normalized path')
    if (!path.isAbsolute(dpath)) throw new Error('not an absolute path')
    // dobj, TODO

    let dobj = new DBusObject(obj)

    let dirname = path.dirname(dpath)
    let namepath = dirname.split('/').filter(x => !!x)
    let basename = path.basename(dpath)
    let dir = this.root.mkdir(namepath)

    dir.attach(basename, dobj) 
  }

  _request (arg, callback) {
  }

  request (arg, callback) {
    let { destination, path, member } = arg
    let svc = this.services[destination]
    if (svc && svc[path]) {
      this._request(arg, callback)      
    } else {
      this.driver.invoke({
        destination, 
        path, 
        interface: 'org.freedesktop.DBus.Introspectable',
        member: 'Introspect',
      }, (err, xmlString) => {
        console.log(err, xmlString)
      })
    }
  }

}

module.exports = DBus
