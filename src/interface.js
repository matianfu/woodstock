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

  if (!isValidType(type)) {
  }

  if (!isSingleCompleteType(type)) {
  }

  const name = arg.name || ''
  if (typeof name !== 'string') {
    throw new TypeError('method arg name not a string')
  }
}

/**
 *
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
  return { name, args }
}

const normalizeProperty = property => {
}

const normalizeSignal = signal => {
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

  return { name, methods, properties, signals }
}

module.exports = normalize
