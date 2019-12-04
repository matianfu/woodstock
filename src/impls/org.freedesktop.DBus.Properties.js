const { TYPE, STRING, ARRAY, DICT_ENTRY, VARIANT } = require('../types')

module.exports = {
  interface: 'org.freedesktop.DBus.Properties',

  getImplementation (name) {
    const impl = this
      .node
      .implementations
      .find(impl => impl.interface.name === name)

    if (!impl) {
      throw 'interface not found'
    }
    return impl
  },

  async Get (m) {
    const iname = m.body[0].value
    const pname = m.body[1].value

    const impl = this.getImplementation(iname)

    const def = impl.interface.properties.find(p => p.name === pname)
    if (!def) {
    }

    // check write only TODO
   
    const prop = impl[pname.value]
    if (!(prop instanceof TYPE)) {
    }

    return new VARIANT(prop) 
  },

  async GetAll (m) {
    const iname = m.body[0].value
    const impl = this.getImplementation(iname)
   
    const arr = impl
      .interface
      .properties
      .filter(prop => prop.access === 'read' || prop.access === 'readwrite')
      .filter(prop => impl[prop.name] instanceof TYPE)
      .map(prop => new DICT_ENTRY([
        new STRING(prop.name),
        new VARIANT(impl[prop.name])
      ]))

    return new ARRAY(arr)
  },

  async Set (m) {
    const iname = m.body[0].value
    const pname = m.body[1].value
    const impl = this.getImplementation(iname)

    const def = impl.interface.properties.find(p => p.name === pname)
    if (!def) {
    }

    // read-only
    
    impl[propName] = value

    this.signal(iname, { [panme]: value }, [], m)
  },

  /**
   * @param {string} interfaceName
   * @param {object} changeProperties
   * @param {string[]} invalidatedProperties
   * @param {object} trigger
   */
  signal (interfaceName, 
    changedProperties, 
    invalidatedProperties = [],
    origin = null
  ) {
    const body = []
    body.push(new STRING(interfaceName))
    body.push(new Array(Object.keys.map(name => new DICT_ENTRY([
      new STRING(name),
      new VARIANT(changedProperties[name])
    ]))))
    body.push(new Array(invalidatdProperties.map(name => 
      new STRING(name))))

    this.bus.emit('signal', {
      origin,
      path: this.node.path,
      interface: 'org.freedesktop.DBus.Properties',
      member: 'PropertiesChanged',
      body, 
    })
  }
}
