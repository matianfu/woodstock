const EventEmitter = require('events')

class DBusNode extends EventEmitter {
  constructor () {
    super()
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

  route (namepath) {
    if (namepath.length === 0) return this
    let child = this.children.find(c => c.name == namepath[0])
    if (child) {
      return child.route(namepath.slice(1))
    } else {
      return
    }
  }
}

class DBusDir extends DBusNode {
  constructor () {
    super()
  }

  mkdir (namepath) {
    if (namepath.length === 0) return this 
    let c = this.children.find(c => c.name === namepath[0])
    if (!c) {
      c = new DBusDir()
      c.name = namepath[0]
      c.dbus = this.dbus
      this.children.push(c)
    }
    return c.mkdir(namepath.slice(1))
  }

  attach (name, dobj) {
    if (this.children.find(c => c.name === name)) {
      let err = new Error('name conflict')
      err.code = 'EEXIST'
      throw err
    }

    dobj.name = name
    dobj.dbus = this.dbus
    this.children.push(dobj)
  }
}

class DBusObject extends DBusNode {
  constructor (ifaces) {
    super()
    if (!ifaces) {
      throw new Error('no iface(s)')
    } else if (Array.isArray(ifaces)) {
      this.ifaces = ifaces
    } else {
      this.ifaces = [ifaces]
    }

    this.ifaces.forEach(i => i.DObject = () => this)
  }
}

module.exports = { DBusObject, DBusDir, DBusNode }
