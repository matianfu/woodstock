const { TYPE, STRING, OBJECT_PATH, ARRAY, DICT_ENTRY, VARIANT } = require('../types') 


/** 
 * Implements `org.freedesktop.DBus.ObjectManager`
 *
 * ```
 * org.freedesktop.DBus.ObjectManager.GetManagedObjects (out
 *   DICT<OBJPATH,DICT<STRING,DICT<STRING,VARIANT>>> objpath_interfaces_and_properties);
 * ```
 *
 * @module OmTemplate 
 */
module.exports = {
  /**
   * interface name
   */
  interface: 'org.freedesktop.DBus.ObjectManager',

  /** 
   * GetManagedObjects returns all **proper** children.
   *
   * > from DBus Specification:
   * >
   * > All returned object paths are children of the object path
   * > implementing this interface, i.e. their object paths start
   * > with the ObjectManager's object path plus '/'.
   *
   * type signature of returned object is "a{oa{sa{sv}}}".
   *
   * @returns {TYPE} `objpath_interfaces_and_properties`
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
   * listens to node added event and emits `InterfacesAdded` signal
   *
   * @param {object} node
   */
  nodeAdded (node) {
    /**
     * org.freedesktop.DBus.ObjectManager.InterfacesAdded (
     *   OBJPATH object_path,
     *   DICT<STRING,DICT<STRING,VARIANT>> interfaces_and_properties);
     */

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
          new ARRAY('a{sv}', props)
        ]))
      })

      const ifacesAndProps = new ARRAY('a{sa{sv}}', ifaces)

      this.node.signal({
        path: this.node.path,
        interface: 'org.freedesktop.DBus.ObjectManager',
        member: 'InterfacesAdded',
        body: [new OBJECT_PATH(node.path), ifacesAndProps]
      })
  },

  /**
   * listens to node removed event and emits `InterfacesRemoved` signal
   * 
   * @param {object} node
   */
  nodeRemoved (node) {
    if (this.nodes.hasProperChild(this.node, node)) {
    // TODO signal
    }
  },

  /**
   * Getter function
   */
  get nodes () {
    return this._nodes
  },

  /**
   * Setter function for `this.nodes`
   * 
   * `node` and `nodes` has mutual references, which are established when
   * a `node` is added to `nodes`. `node` will populate `nodes` property to 
   * all implementations. As a setter, we have a chance to hook event listeners
   * onto `nodes`.
   * 
   * @param {object} value
   */
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

