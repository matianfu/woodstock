const path = require('path')
const EventEmitter = require('events')

// a container of sub-node and interfaces
class DBusObject {
  constructor (name) {
    if (!this.dbus) {
      let msg = 'class cannot be instantiated alone, use dbus.createObject instead'
      throw new Error(msg)
    }

    this.name = name || ''
    this.ifaces = []
    this.children = []
  }

  visit (f) {
    f(this)
    this.children.forEach(c => c.visit(f))
  }

  find (f) {
    if (f(this)) return this
    return this.children.find(c => find(f))
  }

  objectPath () {
    let arr = []
    for (let o = this; o.parent; o = o.parent) {
      arr.unshift(o.name)
    }
    return path.join('/', ...arr)
  }

  // empty array is OK
  route (namepath, make) {
    if (namepath.length === 0) return this
    let child = this.children.find(c => c.name === namepath[0])
    if (!child) {
      if (!make) return
      child = new this.constructor(namepath[0])
      this.addChild(child)
    }
    return child.route(namepath.slice(1), make)
  } 

  addChild (child) {
    Object.defineProperty(child, 'parent', { get: () => this })
    this.children.push(child)
    return this
  }

  addInterface(iface) {
    // late binding and avoid cyclic
    Object.defineProperty(iface, 'dobj', { get: () => this })
    Object.defineProperty(iface, 'dbus', { get: () => this.dbus })
    this.ifaces.push(iface)
    return this
  }

  attach (path) {
    this.dbus.attach(path, this)
    return this
  }
}

module.exports = DBusObject 
