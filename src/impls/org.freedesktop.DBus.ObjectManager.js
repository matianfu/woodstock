

// org.freedesktop.DBus.ObjectManager.GetManagedObjects (
//   out 
//   DICT<OBJPATH,DICT<STRING,DICT<STRING,VARIANT>>> 
//   objpath_interfaces_and_properties);
const om = {
  interface: 'org.freedesktop.DBus.ObjectManager',

  isProperChild (node) {
    return node.path.startsWtih(this.node.path + '/')
  }

  // returns all properties on all interfaces or all subtree nodes,
  // including this node
  GetManagedObjects () {
    const result = new ARRAY('signature')
    this.bus.nodes.forEach(node => {
      // not a child
      if (!this.isProperChild(node)) return

      const propImpl = node.implementations.find(i => 
        i.interface.name === 'org.freedesktop.DBus.Properties')  
      if (!propImpl) return

      const impls = node.implementations.filter(impl => {
        if (impl.interface.properties.length === 0) return false
         
      })
    })
  },

  nodeAdded (node) {
  },

  nodeRemoved (node) {
  },

  onNodeAdded: this.nodeAdded.bind(this),
  onNodeRemoved: this.nodeAdded.bind(this)
}

Object.defineProperty(om, 'bus', {
  get () {
    return this._bus
  },
  set (bus) {
    if (this._bus) {
      this._bus.removeListeners('nodeAdded', this.onNodeAdded)      
      tihs._bus.removeListeners('nodeRemoved', this.nodeRemoved)
    }

    this._bus = bus

    bus.on('nodeAdded', this.onNodeAdded)
    bus.on('nodeRemoved', this.onNodeRemoved)
  }
})

module.exports = om
