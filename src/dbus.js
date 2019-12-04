const EventEmitter = require('events')
const net = require('net')

const debug = require('debug')('dbus-driver')

const parseXml = require('./parse-xml')
const { STRING } = require('./types')
const { encode, decode } = require('./wire')
const normalizeInterface = require('./interface')
const validateImplementation = require('./implementation')
const Node = require('./node')

const print = buf => {
  while (buf.length) {
    console.log(buf.slice(0, 16))
    buf = buf.slice(16)
  }
}

const ERR_UNKNOWN_OBJECT = 'org.freedesktop.DBus.Error.UnknownObject'

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
 * DBus has a compact and versatile design to allow the user to
 * communicate with other dbus services as well as exposing custom
 * services to the bus.
 *
 * ### Providing a service
 *
 * Providing a service includes the following steps:
 * - add interfaces by constructor or `addInterface` method.
 * - add implementations by constructor or `addImplementation` method.
 * - add node, each node contains an object path and an implementation.
 *
 * DBus client stores a list of interface definitions internally. They
 * are used to verify an implentation and check the signature
 * when invoking a method or emitting signal.
 * 
 * An Implementation is an object implementing a specific interface,
 * providing:
 * 1. (async) functions implement interface methods.
 * 2. properties implements interface properties. They must be TYPE object.
 * 3. (async) functions implement interface signal, usually converting a JS object to TYPE
 * 
 * An interface definition must be added first, before adding
 * an implementation or a node referring to it.
 *
 * Commonly used standard interfaces, such as Peer, Properties, 
 * ObjectManager, and Introspectable, have no states (properties). 
 * They are recommended to be implemented as JavaScript object literal, 
 * eliminating unneccessary class inheritance, and added to dbus client
 * via constructor.
 *
 * For application-specific interfaces holding states (properties),
 *  
 *
 * ```
 * async Method (m) {} -> TYPE object or undefined
 * ```
 *
 * invoking a method on another interface:
 *
 * ```
 * this["org.freedesktop.DBus.Properties.Set"](m) 
 * ```
 *
 * `org.freedesktop.DBus.Properties.PropertiesChange'
 *
 *
 * Second, all (provided) interfaces must be understood by this container
 * class, including the schema and default implementations of all methods
 * and signal.
 *
 * First, each DBus object (node) is build by the container, not a `new`
 * or a factory method. The container can construct all required properties
 * in a literal way.
 *
 * @module DBus
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
   * @param {object[]} opts.interfaces - interfaces
   * @param {object[]} opts.implementations - default implementations
   */
  constructor (opts = {}) {
    super()

    /**
     *
     */
    this.role = opts.role

    /**
     *
     */
    this.interfaces = []
    if (opts.interfaces) {
      if (!Array.isArray(opts.interfaces)) {
        throw new TypeError('interfaces not an array')
      } 
      opts.interfaces.forEach(iface => this.addInterface(iface))
    }


    /**
     *
     */
    this.implementations = []
    if (opts.implementations) {
      if (!Array.isArray(opts.implementations)) {
        throw new TypeError('implementations not an array')
      }
      opts.implementations.forEach(impl => this.addImplementation(impl))
    }

    /**
     *
     */
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
     *
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
   * send a method call
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

  onSignal (m) {
    console.log(m)
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
    const e = {
      type: 'ERROR',
      flags: { noReply: true },
      destination: m.sender,
      errorName: opts.errorName,
      replySerial: m.serial,
      signature: 's',
      body: [new STRING(opts.msg)]
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

  /**
   * Handle an incoming METHOD_CALL
   *
   * - find object by path
   * - check whether the object has the interface
   * - check whether the interface has the member (method)
   * - verify the input signature
   * - retrieve the implementation and invoke it
   * - reply an METHOD_RETURN or an ERROR
   */
  handleMethodCall (m) {
    // console.log(this.role || this.myName, 'handleMethodCall', m)

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
      return
    }

    node.Method(m)
      .then(o => {

        console.log('o:', o)

        if (o) {

          console.log(o)

          this.methodReturn(m, {
            signature: o.signature(),
            body: [o] 
          })
        } else {
          this.methodReturn(m)
        }
/**
      this.methodReturn(m, o && {
        signature: o.signature(),
        body: [o]
      })
*/
      })
      .catch(e => {
        console.log(e)
      })
/**

    node.Method()
      .then(data => {
      })
      .catch(e) => {
      })
    return

    const impl = node.implementations.find(i => i.interface === m.interface)
    if (!impl) {
      this.send({
        type: 'ERROR',
        flags: { noReply: true },
        destination: m.sender,
        errorName: 'org.freedesktop.DBus.Error.UnknownMethod',
        replySerial: m.serial,
        signature: 's',
        body: [new STRING(`${m.interface} not found on this object`)]
      })
      return
    }

    const intf = this.interfaces.find(i => i.name)

    const methods = intf.methods
    const { args } = intf.methods.find(method => method.name === m.member)

    const isig = args
      ? args.filter(a => a.direction === 'in').map(a => a.type).join('')
      : ''

    const osig = args
      ? args.filter(a => a.direction === 'out').map(a => a.type).join('')
      : ''

    // const impl = this.implementations.find(i => i.interface === m.interface)
    const method = impl[m.member]

    method.call(node, m)
      .then(data => {
        if (osig) {
          this.methodReturn(m, { signature: osig, body: [data] })
        } else {
          this.methodReturn(m)
        }
      })
      .catch(e => {
        // TODO
        console.log(e)
      })

*/
  }

  /**
   * Adds an interface definition
   *
   * @param {Interface} iface 
   */
  addInterface (iface) {
    const ni = normalizeInterface(iface) 
    if (this.interfaces.find(n => n.name === ni.name)) {
      throw new Error(`interface ${iface.name} already exists`)
    }

    this.interfaces.push(ni)
  }

  /**
   * 
   */
  addImplementation (implementation) {
    if (typeof implementation !== 'object' || !implementation) {
      throw new TypeError('implementation not an object')
    }

    if (typeof implementation.interface !== 'string' || 
      !implementation.interface) {
      throw new TypeError('implementation name not a string')
    } 
  
    const iface = this.interfaces.find(i => i.name === implementation.interface) 
    if (!iface) {
      throw new Error(`interface not found`)
    }
    
    validateImplementation(iface, implementation)

    this.implementations.push(Object.assign({}, implementation, {
      interface: iface
    }))
  }

  /**
   * @param {Array<string|number>} interfaces - an array of interfaces, 
   *                                            if only used
   * default iface implementation, the object could be a string
   */
  addNode (opts) {
    const node = new Node(this, opts.path)
    
    opts.implementations.forEach(impl => {
      if (typeof impl === 'string') {
        impl = this.implementations.find(i => i.interface.name === impl) 
        if (!impl) {
          throw new Error('implementation not found')
        }
        node.addImplementation(impl)
      } else {
        node.addImplementation(impl)
      }
    })

    console.log('======')
    console.log(node)
    console.log('======')

    this.nodes.push(node)
  }

  /**
   *
   */
  removeNode (path) {
  }

  /**
   * Invokes org.freedesktop.DBus.Peer.Ping
   * 
   * @param {string} destination
   * @param {string} [objectPath]
   * @param {function} callback - `err => {}`
   */
  Ping (destination, objectPath, callback) {
    if (typeof objectPath === 'function') {
      callback = objectPath
      objectPath = '/'
    }

    this.methodCall({
      destination,
      path: objectPath,
      interface: 'org.freedesktop.DBus.Peer',
      member: 'Ping'
    }, err => callback(err))
  }

  /**
   * Invokes org.freedesktop.DBus.GetMachineId 
   * 
   * @param {string} destination
   * @param {string} [objectPath] - defaults to '/'
   * @param {function} callback - `(err, machineId) => {}`, machindId is a string
   */
  GetMachineId (destination, objectPath, callback) {
    if (typeof objectPath === 'function') {
      callback = objectPath
      objectPath = '/'
    }

    this.methodCall({
      destination,
      path: objectPath,
      interface: 'org.freedesktop.DBus.Peer',
      member: 'GetMachineId'
    }, (err, body) => {
      if (err) {
        callback(err)
      } else {
        callback(null, body[0].value)
      }
    })
  }
}

module.exports = DBus
