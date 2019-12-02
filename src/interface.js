const { split } = require('./signature')

/**
 * An interface object is a JavaScript object literal DEFINING
 * a DBus interface. It is a schema, not an implementation or a base class.
 *
 * This module provides a set of methods for normalizing a definition.
 *
 * Each method accepts a type of object, validates its properties,
 * sets default value if the property is optional, and returns a normalized one.
 *
 * An interface object looks like:
 *
 * ```JavaScript
 * {
 *   name: 'string',
 *   methods: [
 *     {
 *       name: 'string',
 *       args: [
 *         {
 *           name: 'string',      // optional
 *           type: 'string',      // DBus data type signature,
 *                                // single complete type
 *           direction: 'string', // "in" or "out"
 *         }
 *       ],
 *       optional: true
 *     }
 *   ],
 *   properties: [
 *     {
 *       name: 'string',
 *       type: 'string',          // DBus data type signature,
 *                                // single complete type
 *       access: 'read',          // read, write, or readwrite
 *       optional: true
 *     }
 *   ],
 *   signals: [
 *     {
 *       name: 'string',
 *       args: [
 *         {
 *           name: 'string',      // optional
 *           type: 'string',      // DBus data type signature,
 *                                // single complete type
 *         }
 *       ],
 *       optional: true
 *     }
 *   ]
 * }
 * ```
 *
 * @module
 */

/**
 * @typedef {object} MethodArg
 * @property {string} [name] - arg name
 * @property {string} type - DBus data type signature, single complete
 * @property {string} direction - "in" or "out"
 */

/**
 * @typedef NormalizedMethodArg
 * @property {string} name - arg name, may be empty ("")
 * @property {string} type - DBus data type signature
 * @property {string} direction - "in" or "out"
 */

/**
 * Normalize a method arg
 *
 * @param {MethodArg} arg
 * @returns {NormalizedMethodArg} - normalized method arg
 * @throws {TypeError|RangeError}
 */
const normalizeMethodArg = arg => {
  arg = arg || {}

  if (typeof arg !== 'object') {
    throw new TypeError('method arg not an object')
  }

  const direction = arg.direction || ''
  if (typeof direction !== 'string') {
    throw new TypeError('method arg direction not a string')
  }

  if (direction !== 'in' && direction !== 'out') {
    throw new RangeError('invalid method arg direction')
  }

  const type = arg.type || ''
  if (typeof type !== 'string') {
    throw new TypeError('method arg type not a string')
  }

  if (!type) {
    throw new RangeError('method arg type not defined')
  }

  let sigs
  try {
    sigs = split(type)
  } catch (e) {
    throw new RangeError('method arg type not a dbus type signature')
  }

  if (sigs.length > 1) {
    throw new RangeError('method arg type not a single complete type')
  }

  const name = arg.name || ''
  if (typeof name !== 'string') {
    throw new TypeError('method arg name not a string')
  }

  return { direction, type, name }
}

/**
 * @typedef {object} Method
 * @property {string} name - method name
 * @property {MethodArg[]} args - arg list
 * @property {boolean} [optional] - could be implemented optionally
 */

/**
 * @typedef {object} NormalizedMethod
 * @property {string} name - method name
 * @property {NormalizedMethodArg[]} args - arg list
 * @property {boolean} optional - could be implemented optionally
 */

/**
 * Normalizes a method
 *
 * @param {Method} method
 * @returns {NormalizedMethod}
 * @throws {TypeError|RangeError}
 */
const normalizeMethod = method => {
  method = method || {}

  if (typeof method !== 'object') {
    throw new TypeError('method not an object')
  }

  const name = method.name || ''
  if (typeof name !== 'string') {
    throw new TypeError('method name not a string')
  }

  if (!name) {
    throw new RangeError('method name not defined')
  }

  const as = method.args || []
  if (!Array.isArray(as)) {
    throw new TypeError('method args not an array')
  }

  const args = as.map(a => normalizeMethodArg(a))
  if (args.filter(a => a.direction === 'out').length > 1) {
    throw new RangeError('method has multiple out args')
  }

  const optional = method.optional || false
  if (typeof optional !== 'boolean') {
    throw new TypeError('method optional not a boolean')
  }

  return { name, args, optional }
}

/**
 * @typedef {object} Property
 * @property {string} name        - property name
 * @property {string} type        - DBus data type signature, single complete type
 * @property {string} access      - "read", "write", or "readwrite"
 * @property {boolean} [optional] - if true, the implementation may not have this
 *                                  member
 */

/**
 * @typedef {object} NormalizedProperty
 * @property {string} name        - property name
 * @property {string} type        - DBus data type signature, single complete type
 * @property {string} access      - "read", "write", or "readwrite"
 * @property {boolean} optional   - if true, the implementation may not have this
 *                                  member
 */

/**
 * Normalizes a Property
 *
 * @param {Property} prop
 * @returns {NormalizedProperty}
 * @throws {TypeError|RangeError}
 */
const normalizeProperty = prop => {
  prop = prop || {}

  if (typeof prop !== 'object') {
    throw new TypeError('property not an object')
  }

  const name = prop.name || ''
  const type = prop.type || ''
  const access = prop.access || ''
  const optional = prop.optional || false

  if (typeof name !== 'string') {
    throw new TypeError('property name not a string')
  }

  if (!name) {
    throw new RangeError('property name not defined')
  }

  if (typeof type !== 'string') {
    throw new TypeError('property type not a string')
  }

  if (!type) {
    throw new RangeError('property type not defined')
  }

  let sigs
  try {
    sigs = split(type)
  } catch (e) {
    throw new RangeError('property type not a dbus type signature')
  }

  if (sigs.length > 1) {
    throw new RangeError('property type not a single complete type')
  }

  if (typeof access !== 'string') {
    throw new TypeError('property access not a string')
  }

  if (access !== 'read' && access !== 'write' && access !== 'readwrite') {
    console.log('000000000000', prop)
    throw new RangeError('invalid property access')
  }

  if (typeof optional !== 'boolean') {
    throw new TypeError('property optional not a boolean')
  }

  return { name, type, access, optional }
}

/**
 * @typedef {object} SignalArg
 * @property {string} [name] - arg name
 * @property {string} type - DBus data type signature, single complete type
 */

/**
 * @typedef {object} NormalizedSignalArg
 * @property {string} name - arg name, may be empty string
 * @property {string} type - DBus data type signature, single complete type
 */

/**
 * Normalizes a signal arg
 *
 * @param {SignalArg} arg
 * @returns {NormalziedSignalArg}
 * @throws {TypeError|RangeError}
 */
const normalizeSignalArg = arg => {
  arg = arg || {}

  if (typeof arg !== 'object') {
    throw new TypeError('signal arg not an object')
  }

  const type = arg.type || ''
  if (typeof type !== 'string') {
    throw new TypeError('signal arg type not a string')
  }

  if (!type) {
    throw new RangeError('signal arg type not defined')
  }

  let sigs
  try {
    sigs = split(type)
  } catch (e) {
    throw new RangeError('signal arg type not a dbus type signature')
  }

  if (sigs.length > 1) {
    throw new RangeError('signal arg type not a single complete type')
  }

  const name = arg.name || ''
  if (typeof name !== 'string') {
    throw new TypeError('signal arg name not a string')
  }

  return { type, name }
}

/**
 * @typedef {objet} Signal
 * @property {string} name
 * @property {SignalArg[]} [args]
 * @property {boolean} [optional]
 */

/**
 * @typedef {objet} NormalizedSignal
 * @property {string} name
 * @property {SignalArg[]} args
 * @property {boolean} optional
 */

/**
 * Normalizes signal
 *
 * @param {Signal} signal
 * @returns {NormalizedSignal}
 * @throws {TypeError|RangeError}
 */
const normalizeSignal = signal => {
  signal = signal || {}

  if (typeof signal !== 'object') {
    throw new TypeError('signal not an object')
  }

  const name = signal.name || ''
  if (typeof name !== 'string') {
    throw new TypeError('signal name not a string')
  }

  if (!name) {
    throw new RangeError('signal name not defined')
  }

  const as = signal.args || []
  if (!Array.isArray(as)) {
    throw new TypeError('signal args not an array')
  }

  const args = as.map(a => normalizeSignalArg(a))

  const optional = signal.optional || false
  if (typeof optional !== 'boolean') {
    throw new TypeError('signal optional not a boolean')
  }

  return { name, args, optional }
}

/**
 * @typedef {object} Interface
 * @property {string} name - interface name, eg. org.freedesktop.DBus.Properties
 * @property {Method[]} [methods]
 * @property {Property[]} [properties]
 * @property {Signal[]} [signals]
 */

/**
 * @typedef {object} NormalizedInterface
 * @property {string} name - interface name, eg. org.freedesktop.DBus.Properties
 * @property {NormalizedMethod[]} methods
 * @property {NormalizedProperty[]} properties
 * @property {NormalizedSignal[]} signals
 */

/**
 * Normalizes a DBus interface definition
 *
 * @param {Interface}
 * @returns {NormalizedInterface}
 * @throws {TypeError|RangeError}
 */
const normalize = iface => {
  iface = iface || {}

  if (typeof iface !== 'object') {
    throw new TypeError('interface not an object')
  }

  const name = iface.name || ''
  if (typeof name !== 'string') {
    throw new TypeError('interface name not a string')
  }

  if (!name) {
    throw new RangeError('interface name not defined')
  }

  const ms = iface.methods || []
  if (!Array.isArray(ms)) {
    throw new TypeError('interface methods not an array')
  }

  const methods = ms.map(m => normalizeMethod(m))

  const ps = iface.properties || []
  if (!Array.isArray(ps)) {
    throw new TypeError('interface properties not an array')
  }
  const properties = ps.map(p => normalizeProperty(p))

  const ss = iface.signals || []
  if (!Array.isArray(ss)) {
    throw new TypeError('interface signals not an array')
  }

  const signals = ss.map(s => normalizeSignal(s))

  const names = [
    ...methods.map(m => m.name),
    ...properties.map(p => p.name),
    ...signals.map(s => s.name)
  ]

  if (names.length !== new Set(names).size) {
    throw new RangeError('interface members have duplicate name')
  }

  return { name, methods, properties, signals }
}

module.exports = Object.assign(normalize, {
  normalizeMethodArg,
  normalizeMethod,
  normalizeProperty,
  normalizeSignalArg,
  normalizeSignal
})
