const EventEmitter = require('events')

class DBusInterface extends EventEmitter {
  constructor (dbus, dobj, props) {
    this.dbus = dbus
    this.dbusObj = dobj

    this.name = props.name  // interface name

    let def = this.dbus.interfaceDefinition(this.name)
    if (!def) throw new Error(`no definition for interface ${this.name}`)

    if (props.hasOwnProperty('methods')) {
      this.methods = 
    }
  }
}

class DBusObject {
  constructor () {
    // children object
    this.children = []

    // map alias to full interface name
    this.alias = {}
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
    let child = this.children.find(c => c.name === namepath[0])
    if (child) {
      return child.rout(namepath.slice(1))
    } else {
      return
    }
  }

  i (name) {
    if (!name.contains('.')) name = this.alias[name]
    return this.ifaceMap.get(ifaceName)
  }

  // string for standard interface, or object for custom interface
  addInterface (arg) {
    if (arg.alias && this.alias[arg.alias]) {
      throw new Error('alias exists')
    }

    let iface = new DBusInterface(this, arg)
    this.ifaces.push(iface)
  
    if (arg.alias) {
      this.alias[arg.alias] = arg.name
    } 
  }
}

module.exports = DBusObject

