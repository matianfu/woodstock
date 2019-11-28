const EventEmitter = require('events')
const net = require('net')

const debug = require('debug')('dbus-driver')

const { STRING } = require('./dbus-types')
const { encode, decode } = require('./dbus-codec')

const print = buf => {
  while (buf.length) {
    console.log(buf.slice(0, 16))
    buf = buf.slice(16)
  }
}

/**
an example error
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
 * DBusDriver is a low level layer communicating with system dbus.
 *
 * - connect to system dbus
 * - do a simple auth
 * - say hello to org.freedesktop.DBus
 * - handle hello replied from org.freedesktop.DBus
 * - emit connect or error if authentication or hello failed
 * - provides methods on org.freedesktop.DBus interface
 * - provides methods for invoking methods
 * - emit events for signals
 * - buffer operations before connection established
 *
 * It is possible to have single DBusDriver instance in an application.
 * But creating multiple instances for each components is more robust.
 */
class DBusDriver extends EventEmitter {
  /**
   * Constructs a DBusDriver
   *
   * @param {object} opts
   * @param {string} opts.address - socket address (path)
   */
  constructor (opts) {
    super()
    /**
     * map serial to callback
     */
    this.callMap = new Map()

    /**
     * dbus name, set by org.freedesktop.DBus in hello response
     * @type {string}
     */
    this.myName = ''

    /**
     * serial number for each DBus session
     * @type {number}
     */
    this.serial = 1

    /**
     * incoming data buffer
     * @type {Buffer}
     */
    this.data = Buffer.alloc(0)

    /**
     * socket
     * @type {net.Socket}
     */
    this.socket = null

    this.auth = false
    this.helloDone = false
    this.connect((err, socket) => {})
  }

  connect (callback) {
    const socket = net.createConnection('/run/dbus/system_bus_socket')
    const handleError = err => {
      socket.removeAllListeners()
      socket.on('error', () => {})
      socket.end()
      if (err) {
        callback(err)
      } else {
        callback(new Error('socket closed unexpectedly'))
      }
    }

    const count = 0
    let auth = false

    socket.on('error', handleError)
    socket.on('close', handleError)
    socket.on('data', data => {
      if (!auth) {
        const s = data.toString().trim()
        if (/^OK\s[a-f0-9]{32}$/.test(s)) {
          this.auth = true
          socket.write('BEGIN\r\n')
          this.socket = socket
          auth = true

          this.invoke({
            destination: 'org.freedesktop.DBus',
            path: '/org/freedesktop/DBus',
            interface: 'org.freedesktop.DBus',
            member: 'Hello'
          }, (err, body) => {
            process.nextTick(() => console.log('next tick'))
            setTimeout(() => console.log('timeout'), 3000)
            if (err) {
            } else {
              this.myName = body[0].value
              process.nextTick(() => this.emit('connect'))
            }
          })
        } else {
          // TODO
          handleError(new Error(`handshake failed with message "${s}"`))
        }
      } else {
        try {
          this.handleData(data)
        } catch (e) {
          console.log(e)
        }
      }
      console.log('finish')
    })

    const uid = process.getuid()
    const hex = Buffer.from(uid.toString()).toString('hex')
    socket.write(`\0AUTH EXTERNAL ${hex}\r\n`)
  }

  handleError (err) {

  }

  handleData (data) {
    this.data = Buffer.concat([this.data, data])
    while (1) {
      const dec = decode(this.data)
      if (!dec) return
      this.data = this.data.slice(dec.length)
      this.handleMessage(dec.m)
    }
  }

  send (m) {
    const serial = this.serial++
    const wired = encode(m, serial, this.myName)
    this.socket.write(wired)
    if (m.debug) {
      console.log(m)
      print(wired)
    }
    return serial
  }

  invoke (m, callback = () => {}) {
    const serial = this.send(Object.assign({}, m, { type: 'METHOD_CALL' }))
    this.callMap.set(serial, callback)
  }

  reply (m) {
    this.send(Object.assign({}, m, { type: 'METHOD_RETURN' }))
  }

  error (m) {
    this.send(Object.assign({}, m, { type: 'ERROR' }))
  }

  signal (m) {
    this.send(Object.assign({}, m, { type: 'SIGNAL' }))
  }

  handleMessage (m) {
    console.log(m)

    if (m.type === 'METHOD_CALL') {
      this.emit('invocation', m)
    } else if (m.type === 'METHOD_RETURN' || m.type === 'ERROR') {
      const cb = this.callMap.get(m.replySerial)
      if (cb) {
        this.callMap.delete(m.replySerial)
        if (m.type === 'METHOD_RETURN') {
          cb(null, m.body)
        } else {
          let msg = 'dbus error'
          if (m.body && m.body[0] instanceof STRING) {
            msg = m.body[0].value
          }
          const err = new Error(msg)
          err.code = 'EDBUS'
          err.name = m.errorName
          cb(err)
        }
      }
    } else if (m.type === 'SIGNAL') {
      if (m.path === '/org/freedesktop/DBus' &&
        m.interface === 'org.freedesktop.DBus' &&
        m.sender === 'org.freedesktop.DBus' &&
        m.member === 'NameAcquired' &&
        Array.isArray(m.body) &&
        m.body[0] instanceof STRING &&
        m.body[0].value.length) {
        this.myName = m.body[0].value
      } else {
        this.emit('signal', m)
      }
    }
  }
}

module.exports = DBusDriver
