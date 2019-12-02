const { split } = require('./signature')

/**
 * A method arg has:
 * - name, string, optional, empty string allowed
 * - type, string, must be valid multiple complete type signature
 * - direction, string, either in or out
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
 * A method has a name and args
 * - name is a non-empty string
 * - args is an array of method args
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

  return { name, args }
}

/**
 * A Property must have a name, a dbus data type, access, and optional
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
    throw new RangeError('invalid property access')
  }

  if (typeof optional !== 'boolean') {
    throw new TypeError('property optional not a boolean')
  }

  return { name, type, access, optional }
}

/**
 * A signal arg has:
 * - name, string, optional, empty string allowed
 * - type, string, must be valid single complete type
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
 *
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

  return { name, args }
}

/**
 *
 *
 */
const normalize = iface => {
  iface = iface || {}

  if (typeof iface !== 'object') {
    throw new TypeError('iface not an object')
  }

  const name = iface.name || ''
  if (typeof name !== 'string') {
    throw new TypeError('name not a string')
  }

  if (!name) {
    throw new RangeError('name not defined')
  }

  const ms = iface.methods || []
  if (!Array.isArray(ms)) {
    throw new TypeError('methods not an array')
  }

  const methods = ms.map(m => normalizeMethod(m))

  const ps = iface.properties || []
  if (!Array.isArray(ps)) {
    throw new TypeError('properties not an array')
  }
  const properties = ps.map(p => normalizeProperty(p))

  const ss = iface.signals || []
  if (!Array.isArray(ss)) {
    throw new TypeError('signals not an array')
  }

  const signals = ss.map(s => normalizeSignal(s))

  const names = [
    ...methods.map(m => m.name),
    ...properties.map(p => p.name),
    ...signals.map(s => s.name)
  ]

  return { name, methods, properties, signals }
}

module.exports = Object.assign(normalize, {
  normalizeMethodArg,
  normalizeMethod,
  normalizeProperty,
  normalizeSignalArg,
  normalizeSignal
})
