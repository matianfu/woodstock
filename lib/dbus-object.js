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

  // empty array is OK
  route (namepath) {
    if (!Array.isArray(namepath)) {      
      throw new Error('namepath not an array')
    } else if (!namepath.every(name => name && typeof name === 'string')) {
      throw new Error('all names must be non-empty string')
    }
      
    if (namepath.length === 0) return this
    let child = this.children.find(c => c.name == namepath[0])
    if (child) {
      return child.route(namepath.slice(1))
    } else {
      return
    }
  } 

  // 
  install (namepath, obj) {
    if (namepath.length === 0) {
      obj.name = namepath[0]
      this.children.push(obj)
    } else {
      let child = new this.dbus.DBusObject()
      child.name = namepath[0]
      this.children.push(child)
      child.install(namepath.slice(1), obj)
    }
  }

  addInterface(iface) {
    // late binding and avoid cyclic
    Object.defineProperty(iface, 'dobj', { get: () => this })
    Object.defineProperty(iface, 'dbus', { get: () => this.dbus })
    this.ifaces.push(iface)
  }
}

module.exports = DBusObject 
