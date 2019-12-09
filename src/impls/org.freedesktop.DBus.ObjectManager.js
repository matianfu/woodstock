const { TYPE, STRING, OBJECT_PATH, ARRAY, DICT_ENTRY, VARIANT } = require('../types') 

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

  /** 
   * type="a{oa{sa{sv}}}" 
   */
  GetManagedObjects () {
    const children = this.nodes.getProperChildren(this.node)

    const nodes = []
    children.forEach(node => {
      const ifaces = []
      node.implementations.forEach(impl => {
        // a{sv}
        const ifaceName = impl.interface.name
        const props = []
        impl.interface.properties.forEach(p => {
          const prop = impl[p.name]
          // validate JavaScript type and DBus type signature
          if (prop instanceof TYPE && prop.signature() === p.type) {
            props.push(new DICT_ENTRY([
              new STRING(p.name),
              new VARIANT(prop)
            ]))
          }
        })

        if (props.length) {
          ifaces.push(new DICT_ENTRY([
            new STRING(ifaceName),
            new ARRAY(props) 
          ]))
        }
      })

      if (ifaces.length) {
        nodes.push(new DICT_ENTRY([
          new OBJECT_PATH(node.path),
          new ARRAY(ifaces) 
        ]))
      }
    })

    //return new ARRAY(nodes, 'a{oa{sa{sv}}}')
    return new ARRAY('a{oa{sa{sv}}}', nodes)
  },

  /**
   * org.freedesktop.DBus.ObjectManager.InterfacesAdded (
   *   OBJPATH object_path,
   *   DICT<STRING,DICT<STRING,VARIANT>> interfaces_and_properties);
   */
  nodeAdded (node) {
    if (!this.nodes.hasProperChild(this.node, node)) return
      const ifaces = []
      node.implementations.forEach(impl => {
        const ifaceName = impl.interface.name  
        const props = []
        impl.interface.properties.forEach(p => {
          const prop = impl[p.name]
          if (prop instanceof TYPE && prop.signature() === p.type) {
            props.push(new DICT_ENTRY([
              new STRING(p.name),
              new VARIANT(prop)
            ]))
          }
        })

        ifaces.push(new DICT_ENTRY([
          new STRING(ifaceName), 
//          new ARRAY(props, 'a{sv}')
          new ARRAY('a{sv}', props)
        ]))
      })

      const ifacesAndProps = new ARRAY('a{sa{sv}}', ifaces)

      this.node.signal({
        origin: null,
        path: this.node.path,
        interface: 'org.freedesktop.DBus.ObjectManager',
        member: 'InterfacesAdded',
        body: [new OBJECT_PATH(node.path), ifacesAndProps]
      })
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
