const { TYPE, STRING, ARRAY, DICT_ENTRY, VARIANT } = require('../types')

module.exports = {
  interface: 'org.freedesktop.DBus.Properties',

  // This function should not be here
  getImplementation (name) {
    const impl = this.node.implementations
      .find(impl => impl.interface.name === name)

    if (!impl) throw new Error('interface not found')
    return impl
  },

  async Get (m) {
    const iname = m.body[0].value
    const pname = m.body[1].value

    const impl = this.getImplementation(iname)
    const def = impl.interface.properties.find(p => p.name === pname)

    if (def.access === 'write') {
      const err = new Error(`property is write-only`)
      err.name = 'org.freedesktop.DBus.Error.PropertyWriteOnly'
      throw err
    }

    const prop = impl[pname]
    if (!(prop instanceof TYPE)) {
      throw new Error('not a TYPE object')
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
    const interfaceName = m.body[0].value
    const propertyName = m.body[1].value
    const signature = m.body[2].elems[0].value
    // value is a TYPE object
    const value = m.body[2].elems[1]

    const impl = this.getImplementation(interfaceName)
    const def = impl.interface.properties.find(p => p.name === propertyName)

    // forbid Set on read-only property
    if (def.access === 'read') {
      const err = new Error('property is read-only')
      err.name = 'org.freedesktop.DBus.Error.PropertyReadOnly'
      throw err
    }

    if (def.type !== signature) {
      const err = new Error('property signature mismatch')
      err.name = 'org.freedesktop.DBus.Error.InvalidSignature'
      throw err
    }

    impl[propertyName] = value

    this.signal(interfaceName, { [propertyName]: value }, [], m)
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
    this.bus.emit('signal', {
      origin,
      path: this.node.path,
      interface: 'org.freedesktop.DBus.Properties',
      member: 'PropertiesChanged',
      body: [
        new STRING(interfaceName),
        new ARRAY(Object.keys(changedProperties)
          .map(name => new DICT_ENTRY([
            new STRING(name),
            new VARIANT(changedProperties[name])
          ]))),
        new ARRAY(invalidatedProperties.map(name => new STRING(name)), 'as')
      ]
    })
  }
}
