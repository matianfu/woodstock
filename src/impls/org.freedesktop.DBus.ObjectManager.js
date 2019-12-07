const { STRING, OBJECT_PATH, ARRAY, DICT_ENTRY, VARIANT } = require('../types') 

/**
 * > Quote from DBus Specification:
 * >
 * > All returned object paths are children of the object path
 * > implementing this interface, i.e. their object paths start
 * > with the ObjectManager's object path plus '/'.
 */

// org.freedesktop.DBus.ObjectManager.GetManagedObjects (
//   out
//   DICT<OBJPATH,DICT<STRING,DICT<STRING,VARIANT>>>
//   objpath_interfaces_and_properties);

const om = {
  interface: 'org.freedesktop.DBus.ObjectManager',

  GetManagedObjects () {
    const children = this.nodes.getProperChildren(this.node)

    console.log(children.map(c => c.path))

//    console.dir(this)
/**
    const result = new ARRAY('signature')

    this.bus.nodes.forEach(node => {
      // not a child
      if (!this.isChild(node)) return

      const propImpl = node.implementations.find(i =>
        i.interface.name === 'org.freedesktop.DBus.Properties')
      if (!propImpl) return

      const impls = node.implementations.filter(impl => {
        if (impl.interface.properties.length === 0) return false
      })
    })
*/
  },

  nodeAdded (node) {
    if (this.nodes.hasProperChild(this.node, node)) {
    // TODO signal
      console.log('child added')
    }
  },

  nodeRemoved (node) {
    if (this.nodes.hasProperChild(this.node, node)) {
    // TODO signal
    }
  },

  get nodes () {
    return this._nodes
  },

  set nodes (value) {
    if (!this._nodes && value) {
      this._nodes = value
      this.onNodeAdded = this.nodeAdded.bind(this)
      this.onNodeRemoved = this.nodeRemoved.bind(this)
      this._nodes.on('added', this.onNodeAdded)
      this._nodes.on('removed', this.onNodeRemoved)
    } else if (this._nodes && !value) {
      this._nodes.removeListener('added', this.onNodeAdded)
      this._nodes.removeListener('removed', this.onNodeRemoved)
      this._nodes = undefined
    } else {
      throw new Error('nodes should be set/reset in pair')
    }
  }
}

module.exports = om
