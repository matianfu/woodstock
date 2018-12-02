const EventEmitter = require('events')
const net = require('net')

const debug = require('debug')('dbus')

const {
  LITTLE, BIG,
  BYTE, BOOLEAN, INT16, UINT16, INT32, UINT32, INT64, UINT64, DOUBLE, UNIX_FD,
  STRING, OBJECT_PATH, SIGNATURE,
  STRUCT, ARRAY, VARIANT, DICT_ENTRY
} = require('./types')
const DBusDriver = require('./dbus-driver')
const connect = require('./connect')

const DBUS_SOCKET = '/run/dbus/system_bus_socket'

class DBus extends EventEmitter {
  constructor (opts) {
    super()
    this.services = {}

    this.driver = new DBusDriver()
    this.driver.on('connect', () => this.emit('connect'))
    this.driver.on('message', msg => {})
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
