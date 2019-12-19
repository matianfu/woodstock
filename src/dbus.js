const path = require('path')
const EventEmitter = require('events')
const net = require('net')

const debug = require('debug')('dbus-driver')

const { TYPE, STRING, VARIANT } = require('./types')
const { encode, decode } = require('./wire')
const normalizeInterface = require('./interface')
const validateImplementation = require('./implementation')
const Node = require('./node')
const Nodes = require('./nodes')

const print = buf => {
  while (buf.length) {
    console.log(buf.slice(0, 16))
    buf = buf.slice(16)
  }
}

const ERR_UNKNOWN_OBJECT = 'org.freedesktop.DBus.Error.UnknownObject'

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
 *   - do a simple auth
 *   - say hello to org.freedesktop.DBus
 *   - handle hello replied from org.freedesktop.DBus
 *   - emit connect or error if authentication or hello failed
 * - provides methods on org.freedesktop.DBus interface
 * - provides methods for invoking methods
 * - emit signals
 * - buffer operations before connection established
 *
 * @emits {object} m - signals from remote or local dbus objects
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

    this.opts = opts

    /**
     *
     */
    this.role = opts.role

    /**
     * interfaces stores interface definition
     * @type {object[]}
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
    this.templates = []
    if (opts.implementations) {
      if (!Array.isArray(opts.implementations)) {
        throw new TypeError('implementations not an array')
      }
      opts.implementations.forEach(impl => this.addImplementation(impl))
    }

    /**
     *
     */
    this.nodes = new Nodes()

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
    this.on('signal', s => this.relaySignal(s))
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
    socket.on('close', () => {
      // console.log('unexpected close')
    })

    socket.on('data', data => {
      if (!auth) {
        const s = data.toString().trim()
        if (/^OK\s[a-f0-9]{32}$/.test(s)) {
          socket.write('BEGIN\r\n')
          this.socket = socket
          auth = true

          this.invoke({
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
              this.invoke({
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

  /**
   * TODO
   */
  end () {
    this.socket.end()
  }

  /**
   * Low level send message to dbus
   *
   * @private
   * @param {object} m
   * @param {string} m.type - message type
   * @param {object} [m.flags] - flags
   * @param {string} m.path - required for method call/signal
   * @param {string} m.interface - required for method
   * @param {string} m.member - required for method call/signal
   * @param {string} m.errorName - 
   * @param {number} m.replySerial -
   * @param {string} m.destination -
   * @param {string} [m.signature] -
   * @param {TYPE[]} [m.body] -
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

  // TODO too small?
  // TODO slice data in packet

  /**
   * @private
   */
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
   *
   * @private
   * @param {object} m - decoded message
   */
  handleMessage (m) {
    if (m.type === 'METHOD_CALL') {
      this.invoke(m, (err, result) => {
        if (err) {
          this.errorReturn(m, err)
        } else {
          this.methodReturn(m, result)
        }
      })
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
          const msg = (m.body && m.body[0] instanceof STRING)
            ? m.body[0].value : 'dbus error'
          const err = new Error(msg)
          err.code = 'ERR_DBUS_ERROR'
          err.name = m.errorName
          callback(err)
        }
      }
    } else if (m.type === 'SIGNAL') {
      const s = {
        path: m.path,
        interface: m.interface,
        member: m.member,
        signature: m.signature,
        body: m.body,
        sender: m.sender
      } 
      this.emit('signal', s)
    }
  }


  /**
   * Listens on 'signal' event. Sends internal signal to dbus
   * and dispatch dbus message to registered handlers
   * 
   * @private
   * @param {object} s - signal
   */
  relaySignal (s) {
    if (!s.sender) {
      const m = {
        type: 'SIGNAL',
        flags: { noReply: true },
        path: s.path,
        interface: s.interface,
        member: s.member,
      }

      if (s.body) {
        m.signature = s.body.map(elem => elem.signature()).join('')
        m.body = s.body 
      }

      this.send(m)
    }
  }

  /**
   * Invokes a method on remote or local DBus object.
   *
   * For invoking method on remote object, callback must be provided.
   * For invoking method on local object, if the method is synchronous, this function
   * returns result synchronously.
   *
   * @param {object} m
   * @param {string} m.destination - service name. 
   * @param {string} m.path - object path.
   * @param {string} m.interface - interface name
   * @param {string} m.member - method name
   * @param {string} m.signature -
   * @param {TYPE[]} m.body - argument list, in TYPE format
   * @param {function} callback - callback for remote or asynchronous methods.
   */ 
  invoke (m, callback) {
    const unwrap = r => (r === undefined || r instanceof TYPE) ? r : r.result

    if (!m.destination) m.destination = this.myName
    if (!m.sender) m.sender = this.myName

    if (m.destination === this.myName) {
      const node = this.nodes.find(m.path) 
      if (!node) {
        const e = new Error('object not found')
        e.name = 'org.freedesktop.DBus.Error.UnknownObject'
        if (callback) {
          return process.nextTick(() => callback(e))
        } else {
          throw e
        }
      }

      if (callback) {
        node.invokeAsync(m)
          .then(result => callback(null, m.sender ? result : unwrap(result)))
          .catch(e => callback(e))
      } else {
        return unwrap(node.invoke(m))
      }
    } else {
      if (!callback) callback = () => {}
      const serial = this.send(Object.assign({}, m, { type: 'METHOD_CALL' })) 
      this.callMap.set(serial, [m, callback])
    }
  }

  /**
   * Formats method call result to a METHOD_RETURN message
   *
   * If result is unwrapped, it is either undefined or a TYPE object.
   * If it is wrapped, the wrapped object has a prop named 'result'.
   * It is permissive to allow other props passed to lower layer, except
   * the `signature`, `body`, and `result` to avoid confusion.
   *
   * This function is only used in `handleMethodCall'.
   *
   * @private
   * @param {object} m - METHOD_CALL message
   * @param {undefined|TYPE|object} result - unwrapped or wrapped result
   * @param {TYPE} [wrapped.result] - wrapped result
   * @param {boolean} [result.debug] - debug print
   * @param {boolean} [result.decode] - decode the encoded message again
   */
  methodReturn (m, result) {
    const o = {
      type: 'METHOD_RETURN',
      flags: { noReply: true },
      destination: m.sender,
      replySerial: m.serial,
    } 

    if (result === undefined) {
      this.send(o)
      return
    }

    if (result instanceof TYPE) {
      this.send(Object.assign(o, { signature: result.signature(), body: [result] }))
      return
    }

    if (typeof result === 'object') {
      if (result.result === undefined) {
        return this.send(Object.assign({}, result, o, {
          signature: undefined,
          body: undefined,
          result: undefined
        }))
      }

      if (result.result instanceof TYPE) {
        return this.send(Object.assign({}, result, o, {
          signature: result.result.signature(),
          body: [result.result],
          result: undefined
        }))
      }
    }

    throw new Error('invalid method result')
  }

  /**
   * @private
   * @param {object} m - original method invocation message
   * @param {Error} e - error
   */
  errorReturn (m, e) {
    const r = {
      type: 'ERROR',
      flags: { noRepy: true },
      destination: m.sender,

      // e.name must be a dot separated string, otherwise 
      // DBus daemon disconnects.
      errorName: (typeof e.name === 'string' && 
        e.name.includes('.') &&
        e.name.split('.').length &&
        e.name.split('.').every(x => x.length)) 
          ? e.name : 'org.freedesktop.DBus.Error.Failed',

      replySerial: m.serial,
      signature: 's',
      body: [new STRING(e.message || 'internal error')],
    }

    this.send(r)
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
   * Adds an implementation template
   */
  addTemplate (implementation) {
    if (typeof implementation !== 'object' || !implementation) {
      throw new TypeError('implementation not an object')
    }

    if (typeof implementation.interface !== 'string' ||
      !implementation.interface) {
      throw new TypeError('implementation name not a string')
    }

    const iface = this.interfaces.find(i => i.name === implementation.interface)
    if (!iface) {
      throw new Error('interface not found')
    }

    validateImplementation(iface, implementation)

    // workaround for non-string interface TODO
    const tmpl = Object.create(implementation)
    tmpl.interface = iface
    this.templates.push(tmpl)
  }

  /**
   * Creates a DBus object
   *
   * If the implementation is a string, it is an interface name.
   * If the implementation is an object. 
   * ```
   * {
   *   interface: 'interface name', // replace by a reference to interface
   *   [methods],
   *   [properties],
   *   [signals]
   * }
   * ```
   * 
   * @param {object} opts 
   * @param {string} opts.path - object path
   * @param {Array<string|object>} - an array of implementations
   */
  addNode ({ path, implementations }) {
    const node = new Node(implementations, this.interfaces, this.templates)
    this.nodes.add(path, node)
    Object.defineProperty(node, 'machineId', { get: () => this.machineId })
    Object.defineProperty(node, 'myName', { get: () => this.myName })
    node.emit = m => this.emit('signal', m)
  }

  /**
   * @param {string} path - object path
   * @throws Error if object not found
   */
  removeNode (path) {
    const index = this.nodes.findIndex(n => n.path === path)
    if (index === -1) throw new Error('object path not found')
    const [node] = this.nodes.splice(index, 1)
    this.emit('nodeRemoved', node)
  }


  /**
   * Add a match rules.
   *
   * ```
   * type='signal'
   * sender='service you want to observer'
   * interface='org.freedesktop.DBus.Properties'
   * member='PropertiesChanged' 
   * path_namespace='a high level path'
   * ```
   *
   * @param {object} rule
   * @param {string} rule.type - 'signal', 'method_call', 'method_return', 'error'
   * @param {string} rule.sender - eg. 'fi.w1.wpa_supplicant1'
   * @param {string} rule.interface - eg. 'org.freedesktop.DBus.Properties'
   * @param {string} rule.member - eg. 'PropertiesChanged'
   * @param {string} rule.path - eg. '/fi/w1/wpa_supplicant1'
   * @param {string} rule.path_namespace - eg.'/fi/w1/wpa_supplicant1'
   */
  AddMatch (rule, callback) {
    if (typeof rule !== 'object' || !rule) {
      throw new TypeError('rule not an object')
    }

    const keys = ['type', 'sender', 'interface', 'member', 'path', 'path_namespace']

    const s = keys
      .reduce((arr, key) => rule[key] 
        ? [...arr, `${key}='${rule[key]}'`] 
        : arr, [])
      .join(',')

    this.invoke({
      destination: 'org.freedesktop.DBus',
      path: '/org/freedesktop/DBus',
      interface: 'org.freedesktop.DBus',
      member: 'AddMatch',
      signature: 's',
      body: [new STRING(s)]
    }, err => callback(err))
  }
  
  /**
   * Implements org.freedesktop.DBus.Properties.Get
   * 
   * @param {object} m - message
   * @param {string} [m.destination]
   * @param {string} m.path - object path
   * @param {string} m.interfaceName - interface name
   * @param {string} m.propertyName - property name
   */
  Get ({ destination, path, interfaceName, propertyName }, callback) {
    return this.invoke({
      destination,
      path, 
      interface: 'org.freedesktop.DBus.Properties',
      member: 'Get',
      signature: 'ss',
      body: [
        new STRING(interfaceName),
        new STRING(propertyName)
      ]
    }, callback)
  }

  /**
   * Implements org.freedesktop.DBus.Properties.GetAll
   * 
   * @param {object} m
   * @param {string} [m.destination]
   * @param {string} m.path
   * @param {string} m.interfacename
   * @parma {function} [callback]
   */
  GetAll ({ destination, path, interfaceName }, callback) {
    return this.invoke({
      destination,
      path,
      interface: 'org.freedesktop.DBus.Properties',
      member: 'GetAll',
      signature: 's',
      body: [new STRING(interfaceName)]
    }, callback)
  }

  /**
   * Implements org.freedesktop.DBus.Properties.Set
   * 
   * @param {object} m - message
   * @param {string} [m.destination]
   * @param {string} m.path
   * @param {string} m.interfaceName
   * @param {string} m.propertyName
   * @param {TYPE} m.value
   */
  Set ({ destination, path, interfaceName, propertyName, value }, callback) {
    return this.invoke({
      destination,
      path,
      interface: 'org.freedesktop.DBus.Properties',
      member: 'Set',
      signature: 'ssv',
      body: [
        new STRING(interfaceName),
        new STRING(propertyName),
        new VARIANT(value)
      ]
    }, callback)
  }

  /**
   * Implements org.freedesktop.DBus.ObjectManager.GetManagedObjects
   * 
   * @param {object} m
   * @param {string} [m.destination]
   * @param {string} m.path
   */
  GetManagedObjects ({ destination, path }, callback) {
    return this.invoke({
      destination,
      path,
      interface: 'org.freedesktop.DBus.ObjectManager',
      member: 'GetManagedObjects'
    }, callback)
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

    this.invoke({
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

    return this.invoke({
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
