const path = require('path')
const EventEmitter = require('events')

const PEER = `\
<interface name="org.freedesktop.DBus.Peer">
  <method name="Ping"/>
  <method name="GetMachineId">
    <arg type="s" name="machine_uuid" direction="out"/>
  </method>
</interface>
`

/**
 * @typedef {object} CustomInterfaces
 * @property {string[]} descriptions - descriptions in xml format
 * @property {object} properties - properties defined in interface description
 * @property {object} methods
 */

/**
 * All DBusObject have DBus.Peer, DBus.Properties interface built-in, with ObjectManager optional.
 *
 *
 * DBusObject has the following built-in properties
 * 
 * 1. dbus, root object has _dbus; non-root object retrieve this property from parent
 * 2. name, optional, but non-root object should have a proper name when attached to dbus object tree.
 * 3. parent & children[], maintaining tree structure
 * 4. ifaces[], interfaces implemented by this object
 */
class DBusObject extends EventEmitter {
  /**
   * @param {object} opts
   * @param {string} [opts.name] - object name, non-root object should have this name
   * @param {boolean} [opts.om] - implements ObjectManager interface if true
   * @param {string}  - custom interface definition
   */
  construct (opts) {
  }

/**
  constructor (name = '') {
    super ()

    Object.defineProperty(this, 'dbus', {
      configurable: true, // allowing redefine
      get () {
        return  this.parent ? this.parent.dbus : null
      }
    })
   
    this.name = name
    this.ifaces = []
    this.children = []
  }
*/

  /**
   * pre-visits the subtree
   * @param {function} f - visitor function, `(dbusObject) => {}`
   */
  visit (f) {
    f(this)
    this.children.forEach(c => c.visit(f))
  }

  /**
   * find first object
   * @param {function} f - matching function, `(dbusObject) => boolean`
   * @returns the matching dbus object or undefined
   */
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
      child = new DBusObject(namepath[0])
      this.addChild(child)
    }
    return child.route(namepath.slice(1), make)
  } 

  // add an interface (object) to this object
  addInterface(iface) {
    // late binding and avoid cyclic, aka, weak 
    Object.defineProperty(iface, 'dobj', { get: () => this })
    Object.defineProperty(iface, 'dbus', { get: () => this.dbus })
    this.ifaces.push(iface)
    return this
  }

  /**
   *
   */
  removeInterface(iface) {
    let index = this.ifaces.findIndex(x => x == iface)
    if (index !== -1) this.ifaces.splice(index, 1)
    return this
  }

  // add an dbus object as a child
  addChild (child) {
    child.attach(this)
    return this
  }

  // create a dbus object, add it as a child and return the child object
  createChild (name) {
    let child = new DBusObject(name)
    child.attach(this)
    return child
  }

  attach (parent) {
    if (parent) {
      this.parent = parent
      parent.children.push(this)
      if (this.dbus) {
        const f = node => node.mounted()
        this.visit(f)
      }  
    }
  }

  detach () {
    if (this.parent) {
    }
  }

  // this is an event handler
  mounted () {
    console.log(this.objectPath() + ' mounted')
  }

  /////////////////////////////////////////////////////////
  async getManagedObjectsAsync () {
  }

  async getAsync () {
  }

  async setAsync () {
  }

  async getAllAsync () {
  }

  handleMethodCall () {
  } 
}

module.exports = DBusObject 
