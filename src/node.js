/**
 * @typedef NormalizedImplementation
 * ```
   {
     interface: {
       
     }
   }
 * ```
 */

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
   * Constructs a Node object with given path and implementations
   */
  constructor (bus, path, ) {
    this.bus = bus
    this.path = path
    this.implementations = []
  } 

  /**
   * Add an implementation
   */
  addImplementation (impl) {
    impl.node = this 
    impl.bus = this.bus
    this.implementations.push(impl)
  }

  async Method (m) {
    const impl = this.implementations.find(i => i.interface.name === m.interface)

    if (!impl) {
      throw 'TODO something'
    }

    const method = impl.interface.methods
      .find(method => method.name === m.member)

    if (!method) {
      throw 'anything'
    }

    const isig = method.args
      .filter(a => a.direction === 'in')
      .map(a => a.type)
      .join('')

    const osig = method.args
      .filter(a => a.direction === 'out')
      .map(a => a.type)
      .join('')

    // check isig
    if (isig !== (m.signature || '')){
      throw 'something'
    }

    const result = await impl[m.member](m) 

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
