const EventEmitter = require('events')
const net = require('net')

const debug = require('debug')('dbus-driver')

const parseXml = require('./parse-xml')
const { STRING } = require('./types')
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
 * DBus communicates with system dbus.
 *
 * - connect to system dbus automatically
 * - do a simple auth
 * - say hello to org.freedesktop.DBus
 * - handle hello replied from org.freedesktop.DBus
 * - emit connect or error if authentication or hello failed
 * - provides methods on org.freedesktop.DBus interface
 * - provides methods for invoking methods
 * - emit events for signals
 * - buffer operations before connection established
 *
 * It is possible to have single DBus instance in an application.
 * But creating multiple instances for each components is more robust.
 *
 * @emits {object} m - emit DBus SIGNAL message
 */
class DBus extends EventEmitter {
  /**
   * Constructs a DBus connection
   *
   * @param {object} opts
   * @param {string} role - helper name for testing and debugging
   * @param {string} opts.address - socket address (path)
   */
  constructor (opts = {}) {
    super()

    this.role = opts.role

    /**
     *
     */
    this.interfaces = []

    this.nodes = []

    /**
     * Maps outgoing serial to [m, callback]
     * @type {map}
     */
    this.callMap = new Map()

    /**
     * DBus connection name of this instance, 
     * set by org.freedesktop.DBus in Hello
     * @type {string}
     */
    this.myName = ''

    /**
     * Machine id is provided by systemd (/etc/machine-id)
     * @type {string}
     */
    this.machineId = ''

    /**
     * Serial number of this DBus connection instance
     * @type {number}
     */
    this.serial = 1

    /**
     * Incoming data buffer
     * @type {Buffer}
     */
    this.data = Buffer.alloc(0)

    /**
     * Socket
     * @type {net.Socket}
     */
    this.socket = null

    /**
     *
     */
    this.connected = false

    this.on('connect', () => this.connected = true)

    this.connect((err, socket) => {})
  }

  /**
   *
   */
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
    socket.on('close', () => console.log('unexpected close'))
    socket.on('data', data => {
      if (!auth) {
        const s = data.toString().trim()
        if (/^OK\s[a-f0-9]{32}$/.test(s)) {
          socket.write('BEGIN\r\n')
          this.socket = socket
          auth = true

          this.methodCall({
            destination: 'org.freedesktop.DBus',
            path: '/org/freedesktop/DBus',
            interface: 'org.freedesktop.DBus',
            member: 'Hello'
          }, (err, body) => {
            if (err) {
              // TODO
              console.log(err)
            } else {
              this.myName = body[0].value
              this.methodCall({
                destination: 'org.freedesktop.DBus',
                path: '/org/freedesktop/DBus',
                interface: 'org.freedesktop.DBus.Peer',
                member: 'GetMachineId'
              }, (err, body) => {
                if (err) {
                  // TODO
                } else {
                  this.machineId = body[0].value
                  process.nextTick(() => this.emit('connect'))
                }
              })
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
    })

    const uid = process.getuid()
    const hex = Buffer.from(uid.toString()).toString('hex')
    socket.write(`\0AUTH EXTERNAL ${hex}\r\n`)
  }

  handleData (data) {
    this.data = Buffer.concat([this.data, data])
    while (1) {
      const m = decode(this.data)
      if (!m) return
      this.data = this.data.slice(m.bytesDecoded)
      this.handleMessage(m)
    }
  }

  /**
   * Low level send message to dbus
   *
   * @private
   */
  send (m) {
    const serial = this.serial++
    const wired = encode(m, serial, this.myName)
    this.socket.write(wired)
    if (m.debug) {
      console.log(m)
      print(wired)
    }

    if (m.decode) {
      const unwired = decode(wired)
      console.log(unwired)
    }

    return serial
  }

  /**
   *
   */
  methodCall (m, callback = () => {}) {
    if (typeof m !== 'object') {
      throw new TypeError('message not an object')
    }

    const serial = this.send(Object.assign({}, m, { type: 'METHOD_CALL' }))
    this.callMap.set(serial, [m, callback])
  }

  error (m) {
    this.send(Object.assign({}, m, { type: 'ERROR' }))
  }

  signal (m) {
    this.send(Object.assign({}, m, { type: 'SIGNAL' }))
  }

  /**
   *
   * @private
   * @param {object} m - decoded message
   */
  handleMessage (m) {
    if (m.type === 'METHOD_CALL') {
      this.handleMethodCall(m)
    } else if (m.type === 'METHOD_RETURN' || m.type === 'ERROR') {
      const pair = this.callMap.get(m.replySerial)
      if (pair) {
        this.callMap.delete(m.replySerial)

        const call = pair[0]
        const callback = pair[1]

        if (call.printReply) {
          console.log('=== call ===')
          console.log(call)
          console.log('--- reply ---')
          console.log(m)
          console.log('============')
        }

        if (m.type === 'METHOD_RETURN') {
          callback(null, m.body)
        } else {
          let msg = 'dbus error'
          if (m.body && m.body[0] instanceof STRING) {
            msg = m.body[0].value
          }
          const err = new Error(msg)
          err.code = 'EDBUS'
          err.name = m.errorName
          callback(err)
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

  /**
   * Sends a METHOD_RETURN message
   *
   * `signature` and `body` must be provided together if provided.
   *
   * @param {object} m - invocation message
   * @param {object} opts - options
   * @param {string} [opts.signature] - signature for returned data
   * @param {TYPE[]} [opts.body] - returned data
   * @param {boolean} [opts.debug] - debug print
   * @parma {boolean} [opts.decode] - debug
   */
  methodReturn (m, opts = {}) {
    // TODO validate
    const r = {
      debug: !!opts.debug,
      decode: !!opts.decode,
      type: 'METHOD_RETURN',
      flags: { noReply: true },
      destination: m.sender,
      replySerial: m.serial
    }

    if (opts.signature) {
      r.signature = opts.signature
      r.body = opts.body
    }

    this.send(r)
  }

  /**
   *
   */
  errorReturn (m, opts = {}) {
    // TODO validate
    const e = {
    }

    this.send(e)
  }

  /**
   * Invoke the 'Introspect' methods on standard 'Introspectable' interface
   * for given destination and object path
   *
   * @param {string} destination - bus name
   * @param {string} [object] - object path, defaults to '/'
   * @param {function} callback - `(err, data) => {}`
   */
  introspect (destination, object, callback) {
    if (typeof object === 'function') {
      callback = object
      object = '/'
    }

    const m = {
      destination,
      path: object,
      interface: 'org.freedesktop.DBus.Introspectable',
      member: 'Introspect'
    }

    this.methodCall(m, (err, body) => {
      if (err) {
        callback(err)
      } else {
        // TODO
        const xml = body[0].value
        callback(null, xml)

        const parsed = parseXml(xml)
        console.log(JSON.stringify(parsed, null, '  '))
      }
    })
  }

  handleMethodCall (m) {
    console.log(this.role || this.myName, 'handleMethodCall', m)
    const node = this.nodes.find(n => n.path === m.path) 
    if (!node) {
      // org.freedesktop.DBus.Error.UnknownObject
      this.send({
        type: 'ERROR',
        flags: { noReply: true },
        destination: m.sender,
        errorName: 'org.freedesktop.DBus.Error.UnknownObject',
        replySerial: m.serial,
        signature: 's',
        body: [new STRING('object not found')]
      })
    }

    const iface = this.interfaces.find(iface => iface.name === m.interface)
    const member = iface[m.member]

    member.apply(this, m.body)
  }
}

module.exports = DBus
