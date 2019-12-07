const { TYPE } = require('./types')


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
   * Constructs a Node object with given bus and path
   *
   * @param {object} bus - reference to dbus client
   * @param {string} path - object path
   */
  constructor (bus, path) {
    /** reference to dbus cleint */
    this.bus = bus
    /** object path */
    this.path = path
    /** collection of interface implementation */
    this.implementations = []
  } 

  /**
   * Adds an implementation
   *  
   */
  addImplementation (impl) {
    impl.node = this 
    impl.bus = this.bus
    this.implementations.push(impl)
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
        throw 'bad sig'
      }

      return result
    }
  }
}

module.exports = Node
