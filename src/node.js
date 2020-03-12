const path = require('path')
const { TYPE } = require('./types')

const validateImpl = require('./implementation')

const PropertiesImpl = require('./templates/org.freedesktop.DBus.Properties')
const OmImpl = require('./templates/org.freedesktop.DBus.ObjectManager')

/**
 * A DBus method may returns `undefined` or a TYPE object. For debugging,
 * the result could also be wrapped into a JavaScript object with debug options
 *
 * @typedef {undefined|TYPE|object} MethodResult
 */

/**
 * Node represents a DBus object with object path.
 *
 * This class is used internally by dbus client. The user should
 * not construct a Node object directly. It should use
 * `addNode` method on DBus instead and provide an object path
 * and a list of implementations.
 *
 * This class encapsulates a set of methods to be used by DBus object.
 */
class Node {
  /**
   * Constructs a Node object with given implemenations.
   *
   * @param {object[]} implementations
   * @param {object[]} interfaces - interface definitions
   * @param {object[]} [templates] - implementation templates
   */
  constructor (implementations, interfaces, templates = []) {
    if (!Array.isArray(implementations)) {
      throw new TypeError('implementations not an array')
    }

    /** reference to nodes, set by nodes */
    this._nodes = undefined
    Object.defineProperty(this, 'nodes', {
      get () {
        return this._nodes
      },
      set (nodes) {
        if (!this._nodes && nodes) {
          this._nodes = nodes
          this.implementations.forEach(impl => (impl.nodes = nodes))
        } else if (this._nodes && !nodes) {
          this.implementations.forEach(impl => (impl.nodes = undefined))
          this.nodes = undefined
        } else {
          throw new Error('nodes should be set/reset in pair')
        }
      }
    })

    /** interface implementations */
    this.implementations = []
    implementations.forEach(impl => {
      if (typeof impl === 'string') {
        const tmpl = templates.find(i => i.interface.name === impl)
        if (!tmpl) {
          throw new Error(`interface implementation for "${impl}" not found`)
        }

        // create a new object with impl as prototype
        impl = Object.create(tmpl)
      } else if (typeof impl === 'object' && impl) {
        const iface = interfaces.find(i => i.name === impl.interface)
        if (!iface) {
          throw new Error(`interface definition for "${impl.interface}" not found`)
        }

        validateImpl(iface, impl)

        impl.interface = iface
      } else {
        throw new TypeError('implementation not an object or a string')
      }

      impl.node = this
      this.implementations.push(impl)
    })

    /** emit function */
    this.emit = null
  }

  /**
   * Finds implementations for given interface name
   * @returns {object} implementation
   * @throws {Error} if not found
   */
  getImplementation (interfaceName) {
    const impl = this
      .node
      .implementations
      .find(impl => impl.interface.name === interfaceName)

    if (!impl) {
      throw 'something'
    }
    return impl
  }

  /**
   * Invokes a method for given interface and method name (member)
   * @param {object} m - message
   * @param {string} m.interface - interface name
   * @param {string} m.member - method name
   * @param {string} [m.signature] - argument types
   * @param {TYPE[]} [m.body] - arguments
   */
  /**
  async Method (m) {
    const impl = this.implementations.find(i => i.interface.name === m.interface)
    if (!impl) {
      throw 'TODO something'
    }

    const def = impl.interface.methods.find(def => def.name === m.member)
    if (!def) {
      const e = new Error('unknown method')
      e.name = 'org.freedesktop.DBus.Error.UnknownMethod'
      throw e
    }

    const isig = def.args
      .filter(a => a.direction === 'in')
      .map(a => a.type)
      .join('')

    const osig = def.args
      .filter(a => a.direction === 'out')
      .map(a => a.type)
      .join('')

    // check isig
    if (isig !== (m.signature || '')){
      throw 'something'
    }

    const method = impl[m.member]
    if (typeof method !== 'function') {
      // TODO method may be optional
      throw new Error('method not a function')
    }

    let result
    if (method.constructor.name === 'AsyncFunction') {
      result = await method.call(impl, m)
    } else {
      result = method.call(impl, m)
    }

    if (result) {
      if (!(result instanceof TYPE)) {
        throw 'another thing'
      }

      if (result.signature() !== osig) {
        console.log(result.signature())
        console.log(osig)
        throw 'bad sig'
      }

      return result
    }
  }
*/

  signal (m) {
    this.emit && this.emit(m)
  }

  /**
   *
   * @param {string} iface - interface name
   * @param {strimg} member - method name
   */
  findMethod (iface, member) {
    const impl = this.implementations.find(i => i.interface.name === iface)
    if (!impl) {
      const e = new Error('interface not found')
      e.name = 'org.freedesktop.DBus.Error.UnknownInterface'
      throw e
    }

    const def = impl.interface.methods.find(def => def.name === member)
    if (!def) {
      const e = new Error('method not defined')
      e.name = 'org.freedesktop.DBus.Error.UnknownMethod'
      throw e
    }

    if (typeof impl[member] !== 'function') {
      const e = new Error('method not found')
      e.name = 'org.freedesktop.DBus.Error.UnknownMethod'
      throw e
    }

    const method = impl[member].bind(impl)

    const isig = def.args
      .filter(a => a.direction === 'in')
      .map(a => a.type)
      .join('')

    const osig = def.args
      .filter(a => a.direction === 'out')
      .map(a => a.type)
      .join('')

    return { method, isig, osig }
  }

  /**
   * Invokes method asynchronously
   */
  async invokeAsync (m) {
    const { method, isig, osig } = this.findMethod(m.interface, m.member)

    const body = m.body || []
    const signature = body.map(arg => arg.signature()).join('')

    if (signature !== isig) {
      const msg = `signature mismatch, required: "${isig}", provided: "${signature}"`
      const e = new Error(msg)
      e.name = 'org.freedesktop.DBus.Error.InvalidSignature'
      throw e
    }

    return method(m)
  }

  /**
   * Invokes method synchronously. The invoked method must be a synchronous method.
   *
   * @param {object} m
   * @param {string} m.interface - interface name
   * @param {string} m.member - member name
   * @param {TYPE[]} m.body - arguments
   * @returns {MethodResult}
   */
  invoke (m) {
    const { method, isig, osig } = this.findMethod(m.interface, m.member)

    const body = m.body || []
    const signature = body.map(arg => arg.signature()).join('')

    if (signature !== isig) {
      const msg = `signature mismatch, required: "${isig}", provided: "${signature}"`
      const e = new Error(msg)
      e.name = 'org.freedesktop.DBus.Error.InvalidSignature'
      throw e
    }

    if (m.constructor.name === 'AsyncFunction') {
      throw new Error('method is asynchronous')
    }

    // TODO check signature
    return method(m)
  }
}

module.exports = Node
