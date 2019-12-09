const {
  LITTLE, BIG,
  BYTE, UINT32, STRING, OBJECT_PATH, SIGNATURE,
  STRUCT, ARRAY, VARIANT
} = require('./types')

/**
 * This module provides low-level for encoding or decoding
 * wire format messages.
 *
 * The message in JavaScript object literal format is not intended
 * for upper layer applications. It includes properties for driver layer,
 * such as serial, protocol version, flags, etc.
 *
 * TODO
 * - Buffer is preallocated, not a dryrun of marshal, TYPE does not support yet
 *
 * ### Wire Format
 * ```
 * Header (yyyyuua(yv))
 *
 * 0       BYTE  endianness 'l' for little and 'B' for BIG
 * 1       BYTE  message type
 *               0   INVALID
 *               1   METHOD_CALL
 *               2   METHOD_RETURN
 *               3   ERROR
 *               4   SIGNAL
 * 2       BYTE  flags
 *               0x01  NO_REPLY_EXPECTED
 *               0x02  NO_AUTO_START
 *               0x04  ALLOW_INTERACTIVE_AUTHORIZATION
 * 3       BYTE  protocol version
 * 4       UINT32  body length
 * 8       UINT32  message serial
 * 12      ARRAY of STRUCT of (BYTE, VARIANT)
 *                                                   Required
 *               0   INVALID
 *               1   PATH          OBJECT_PATH       METHOD_CALL, SIGNAL
 *               2   INTERFACE     STRING            SIGNAL
 *               3   MEMBER        STRING            METHOD_CALL, SIGNAL
 *               4   ERROR_NAME    STRING            ERROR
 *               5   REPLY_SERIAL  UINT32            ERROR, METHOD_RETURN
 *               6   DESTINATION   STRING            optional
 *               7   SENDER        STRING            optional
 *               8   SIGNATURE     SIGNATURE (body)  optional
 *               9   UNIX_FDS      UINT32            optional
 * ```
 *
 * 
 * @module dbus-codec
 */


/**
 * Converts type string to type code
 *
 * @param {string} type - `METHOD_CALL`, `METHOD_RETURN`, `ERROR` or `SIGNAL`
 * @returns {number} type code
 * @throws {TypeError} type not a string
 * @throws {RangeError} invalid type value
 */
const encodeType = type => {
  if (typeof type !== 'string') {
    throw new TypeError('type not a string')
  }

  switch (type) {
    case 'METHOD_CALL':
      return 1
    case 'METHOD_RETURN':
      return 2
    case 'ERROR':
      return 3
    case 'SIGNAL':
      return 4
    default:
      throw new RangeError('invalid type value')
  }
}

/**
 * Converts type code to type string
 *
 * TODO is 0 valid? NO!
 *
 * @param {number} code - type code, 0, 1, 2, 3, or 4
 * @returns {string} type string
 * @throws {TypeError} code is not an integer
 * @throws {RangeError} invalid code
 */
const decodeType = code => {
  if (!Number.isInteger(code)) {
    throw new TypeError('code not an integer')
  }

  switch (code) {
    case 0:
      return 'INVALID'
    case 1:
      return 'METHOD_CALL'
    case 2:
      return 'METHOD_RETURN'
    case 3:
      return 'ERROR'
    case 4:
      return 'SIGNAL'
    default:
      throw new RangeError(`invalid type code ${code}`)
  }
}

/**
 * @typedef {object} Flags
 * @property {boolean} noReply
 * @property {boolean} noAutoStart
 * @property {boolean} interactiveAuth
 */

/**
 * Encodes a flags object
 *
 * @param {Flags} flags
 * @returns {number} code
 */
const encodeFlags = flags => {
  let x = 0
  if (flags) {
    if (flags.noReply) x |= 0x01
    if (flags.noAutoStart) x |= 0x02
    if (flags.interactiveAuth) x |= 0x04
  }
  return x
}


/**
 * Decodes a flags code to Flags object
 *
 * @param {number} code
 * @returns {Flags}
 */
const decodeFlags = code => {
  if (!Number.isInteger(code)) {
    throw new TypeError('code not an integer')
  }

  const flags = {}
  if (code & 0x01) flags.noReply = true
  if (code & 0x02) flags.noAutoStart = true
  if (code & 0x04) flags.interactiveAuth = true
  return flags
}

/**
 * Encodes a header field
 *
 * @param {number} key - field number 1-9, see DBus Specification
 * @returns {STRUCT} encoded header field
 * @throws {TypeError} key is not an integer or the value type 
 *                     does not match the key
 * @throws {RangeError} key value is out of range
 */
const headerField = (key, value) => {
  if (!Number.isInteger(key)) {
    throw new TypeError('key not an integer')
  }

  switch (key) {
    case 1:
      if (!(value instanceof OBJECT_PATH)) {
        throw new TypeError('invalid value type')
      }
      break
    case 2:
    case 3:
    case 4:
    case 6:
    case 7:
      if (!(value instanceof STRING)) {
        throw new TypeError('invalid value type')
      }
      break
    case 5:
    case 9:
      if (!(value instanceof UINT32)) {
        throw new TypeError('invalid value type')
      }
      break
    case 8:
      if (!(value instanceof SIGNATURE)) {
        throw new TypeError('invalid value type')
      }
      break
    default:
      throw new RangeError('invalid key value')
  }

  // return new STRUCT([new BYTE(key), new VARIANT(value)], '(yv)')
  return new STRUCT('(yv)', [new BYTE(key), new VARIANT(value)])
}

/**
 * Encode given message to DBus message
 *
 * @param {object} m - message to encode
 * @param {number} m.type - message type code
 * @param {object} m.flags - message flags
 * @param {string} m.path - object path
 * @param {string} m.interface - interface name
 * @param {string} m.member - method or signal name
 * @param {string} m.errorName - error name
 * @param {number} m.replySerial - reply serial
 * @param {string} m.destination - destination
 * @param {string} [m.signature] - body signature. If body provided, signature
 * must be consistent. If body not provided, signature neglected.
 * @param {TYPE} [m.body] - message body
 * @param {number} serial - serial number
 * @returns {Buffer} encoded message in wire format
 */
const encode = (m, serial, name = '') => {
  const headerBuf = Buffer.alloc(1024 * 1024)
  const bodyBuf = Buffer.alloc(1024 * 1024)

  /** header */
  const header = new STRUCT('(yyyyuua(yv))')
  /** header fields */
  const fields = new ARRAY('a(yv)')
  /** endianness */
  header.push(new BYTE(LITTLE))
  /** message type */
  header.push(new BYTE(encodeType(m.type)))
  /** flags */
  header.push(new BYTE(encodeFlags(m.flags)))
  /** protocol version */
  header.push(new BYTE(0x01))

  const body = m.body && new STRUCT(m.body)

  const bodyLength = m.body ? body.marshal(bodyBuf, 0, LITTLE) : 0

  header.push(new UINT32(bodyLength))
  header.push(new UINT32(serial))

  /** PATH */
  if (m.path) {
    fields.push(headerField(1, new OBJECT_PATH(m.path)))
  }

  /** INTERFACE */
  if (m.interface) {
    fields.push(headerField(2, new STRING(m.interface)))
  }

  /** MEMBER */
  if (m.member) {
    fields.push(headerField(3, new STRING(m.member)))
  }

  /** ERROR_NAME */
  if (m.errorName) {
    fields.push(headerField(4, new STRING(m.errorName)))
  }

  /** REPLY_SERIAL */
  if (m.replySerial) {
    fields.push(headerField(5, new UINT32(m.replySerial)))
  }

  /** DESTINATION */
  if (m.destination) {
    fields.push(headerField(6, new STRING(m.destination)))
  }

  /** SENDER */
  if (name) {
    fields.push(headerField(7, new STRING(name)))
  }

  const sig = body && (body.signature()).slice(1, -1)

  /** check m.signature if provided */
  if (sig && m.sig && sig !== m.sig) {
    throw new TypeError('signature mismatch')
  }

  /** SIGNATURE */
  if (sig) {
    fields.push(headerField(8, new SIGNATURE(sig)))
  }

  /** UNIX_FDS */
  if (m.unixFds) {
    fields.push(headerField(9, new UINT32(m.unixFds)))
  }

  header.push(fields)

  const hlen = header.marshal(headerBuf, 0, LITTLE)

  return Buffer.concat([
    headerBuf.slice(0, Math.ceil(hlen / 8) * 8),
    bodyBuf.slice(0, bodyLength)
  ])
}

/**
 * @typedef DecodedMessage
 * @property {boolean} le - true for little endian
 * @property {string} type - type string
 * @property {Flags} flags - message flags
 * @property {number} version - protocol version
 * @property {number} serial - serial number
 * @property {string} path - object path
 * @property {string} interface - interface name
 * @property {string} member - method or signal name
 * @property {string} errorName - error name
 * @property {number} replySerial - serial in error or method return 
 * @property {string} destination - destination name
 * @property {string} sender - sender name
 * @property {string} [signature] - body signature 
 * @property {number} unixFds - unix file descriptor
 * @property {TYPE[]} [body] - body is an array of TYPE object
 * @property {number} bytesDecoded - decoded message length
 */

/**
 * Decodes a wire format message from the given data.
 * If the message is incomplete, returns undefined. Otherwise,
 * return full message with decoded length in bytes.
 *
 * @param {Buffer} data - a chunk of data
 * @returns {DecodedMessage}
 */
const decode = data => {
  if (data.length < 16) return

  let le
  if (data[0] === LITTLE) {
    le = true
  } else if (data[0] === BIG) {
    le = false
  } else {
    throw new Error('bad endianness')
  }

  const fieldsLen = le ? data.readUInt32LE(12) : data.readUInt32BE(12)
  const headerLen = 16 + fieldsLen
  const bodyLen = le ? data.readUInt32LE(4) : data.readUInt32BE(4)
  const totalLen = Math.ceil(headerLen / 8) * 8 + bodyLen
  if (data.length < totalLen) return

  // slice data
  const total = data.slice(0, totalLen)
  // data = data.slice(totalLen)

  // unmarshal header
  const header = new STRUCT('(yyyyuua(yv))')
  let offset = header.unmarshal(total.slice(0, headerLen), 0, le)
  if (offset !== headerLen) {
    throw new Error('offset mismatch when unmarshalling header')
  }
  if (bodyLen !== header.elems[4].value) {
    throw new Error('body length mismatch when unmarshalling header')
  }

  const m = {}
  m.le = le
  m.type = decodeType(header.elems[1].value)
  m.flags = decodeFlags(header.elems[2].value)
  m.version = header.elems[3].value
  m.serial = header.elems[5].value

  header.elems[6].elems.forEach(yv => {
    const y = yv.elems[0].value
    const v = yv.elems[1].elems[1].value
    const names = [
      'invalid', 'path', 'interface', 'member', 'errorName',
      'replySerial', 'destination', 'sender', 'signature', 'unixFds'
    ]
    if (y > 0 && y < 10) m[names[y]] = v
  })

  // signature and body must be consistent
  if (m.signature) {
    if (bodyLen === 0) {
      throw new Error('zero body length and non-empty signature')
    } else {
      const s = new STRUCT(`(${m.signature})`)
      offset = s.unmarshal(total, Math.ceil(offset / 8) * 8, le)
      if (offset !== total.length) {
        throw new Error('offset mismatch when unmarshalling body')
      } else {
        m.body = s.elems
      }
    }
  } else {
    if (bodyLen !== 0) {
      throw new Error('non-zero body length and empty signature')
    }
  }

  // return { length: totalLen, m }
  m.bytesDecoded = totalLen
  return m
}

module.exports = { encode, decode }
