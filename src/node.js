/**
 * Node represents a DBus object on dbus service object tree.
 * 
 * Each node has an object path (as a key) and a collection of 
 * interfaces. Each interface has a name and a collection of properties 
 * The mandatory property must be provided.
 *
 * DBus object differs from a JavaScript object in that
 */
class Node {
  /**
   * @param {object} opts
   * @param {string[]} opts.methods
   * @param {string[]} opts.signals 
   * @param {string[]} opts.properties
   */
  constructor (opts = {}) {
    this.path = path 
    this.interfaces = [
    ]
  }

  invoke (iface, method) {
  }

  signal (iface, signal) {
  }
}

