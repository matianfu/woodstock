const path = require('path')
const EventEmitter = require('events')

/**
 * Tree maintains the service object tree
 *
 * Tree maintains the object hierarchy and provides retriev, add, and remove methods.
 * Tree also emits node added and removed events for observers.
 *
 * Internally, Tree use an array to store nodes, but this should not be visible
 * to external components.
 */
class Nodes extends EventEmitter {
  /**
   *
   */
  constructor () {
    super()
    this.nodes = []
  }

  hasProperChild (parent, child) {
    if (parent.path === '/') {
      return child.path.length > 1
    } else {
      return child.path.startsWith(parent.path + '/')
    }
  }

  getProperChildren (parent) {
    return this.nodes.filter(n => this.hasProperChild(parent, n))
  }

  find (path) {
    return this.nodes.find(n => n.path === path)
  }

  add (objectPath, node) {
    if (typeof node !== 'object' || !node) {
      throw new TypeError('node not an object')
    }

    if (typeof objectPath !== 'string') {
      throw new TypeError('object path not a string')
    }

    if (!path.isAbsolute(objectPath) || path.normalize(objectPath) !== objectPath) {
      throw new RangeError('invalid object path')
    }

    if (objectPath !== '/' && objectPath.endsWith('/')) {
      throw new RangeError('trailing "/" is not allowed in object path')
    }

    if (this.find(objectPath)) {
      throw new Error('object path in use')
    }

    node.path = objectPath
    this.nodes.push(node)
    this.nodes.sort((a, b) => {
      if (a.path < b.path) return -1
      if (a.path > b.path) return 1
      return 0
    })
    node.nodes = this
    this.emit('added', node)
  }

  remove (path) {

  }
}

module.exports = Nodes
