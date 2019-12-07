
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
    }
  },

  nodeRemoved (node) {
    if (this.nodes.hasProperChild(this.node, node)) {
    // TODO signal
    }
  }
}

Object.defineProperty(om, 'nodes', {
  get () {
    return this._nodes
  },
  set (nodes) {
    if (!this._nodes && nodes) {
      this._nodes = nodes
      this.onNodeAdded = this.nodeAdded.bind(this)
      this.onNodeRemoved = this.nodeRemoved.bind(this)
      this.nodes.on('added', this.onNodeAdded)
      this.nodes.on('removed', this.onNodeRemoved)
    } else if (this._nodes && !nodes) {
      this.nodes.removeListener('added', this.onNodeAdded)
      this.nodes.removeListener('removed', this.onNodeRemoved)
      this.nodes = undefined
    } else {
      throw new Error('nodes should be set/reset in pair')
    }
  }
})

module.exports = om
