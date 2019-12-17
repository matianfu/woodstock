const { TYPE } = require('./types')

/**
 * This module normalize an implementation against an interface definition
 *
 * Each interfae implementation is an object.
 * - interface, string, interface name
 * - name, string, implementation name, if name is not provided, it is assigned
 *   to "default"
 * - members, including methods and properties
 *   - Method must be of 'function' type. No further check (async, arrow, etc)
 *   - Property must be of 'TYPE' type, the signature is going to be
 *   - checked, and the value is used as defualt value
 *   - all non-optional Methods and Properties must be provided.
 *
 * @module
 */

/**
 * Validates an implementation 
 * 
 * @param {module:interface.NormalizedInterface} iface
 * @param {object} impl - implementation
 */
const validate = (iface, impl) => {
  iface = iface || {}
  impl = impl || {}

  if (typeof iface !== 'object') {
    throw TypeError('interface not an object')
  }

  if (typeof impl !== 'object') {
    throw TypeError('implementation not an object')
  }

  // for each method
  // if mandatory, impl must has a function
  // if optional, impl may not have it, but if it has, must be a function
  iface.methods.forEach(({ name, optional }) => {
    const f = impl[name]
    if (f === undefined) {
      if (!optional) throw new Error(`method ${name} not defined`)
    } else if (typeof f !== 'function') {
      throw new TypeError(`method ${name} not a function`)
    }
  })

  // for each properties
  // if mandatory, impl must have it with correct signature
  // if optional, imple may not have it, but if it has,
  // must be a TYPE object with correct signature
  iface.properties.forEach(({ name, type, optional }) => {
    const p = impl[name]
    if (p === undefined) {
      if (!optional) throw new Error(`property ${name} not defined`)
    } else if (!(p instanceof TYPE)) {
      // throw new TypeError(`property ${name} not a TYPE object`)
      // Convert to TYPE
      impl[name] = new TYPE(type, p)
    } else if (p.signature() !== type) {
      throw new TypeError(`property ${name} type mismatch`)
    }
  })
}

module.exports = validate
