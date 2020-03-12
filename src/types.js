const path = require('path')
const debug = require('debug')
const { split, slice } = require('./signature')

const log = debug('dbus:types')
const logm = debug('marshal')
const logu = debug('unmarshal')

const $width = 3
const $more = () => { $ = $ + ' '.repeat($width) }
const $less = () => { $ = $.slice($width) }

let $ = ''

const LITTLE = Buffer.from('l')[0]
const BIG = Buffer.from('B')[0]

const POW32 = BigInt(Math.pow(2, 32))
const POW64 = POW32 * POW32

const print = buf => {
  while (buf.length) {
    console.log(buf.slice(0, 16))
    buf = buf.slice(16)
  }
}

/**
This module defines all classes for DBus data types.

DBus is a binary protocol. It has a type system to marshaling or unmarshaling
transmitted data. In both document and code, classes representing a DBus data
type are named exactly after the data type defined in DBus specification, with
all letters in uppercase.

BYTE, INT, BOOLEAN, DOUBLE and UNIX_FD has fixed length. They are all derived
from FIXED_TYPE.

STRING, OBJECT_PATH, and SIGNATURE has variable length. They are all derived
from STRING_LIKE.

Both FIXED_TYPE and STRING_LIKE are BASIC_TYPE, which is usually mentioned
as primitive types in programming languages. All basic type object has
a `value` member, holding the value.

DBus also provides container types. There are four container types:

- ARRAY contains a collection of data objects of the same type.
- STRUCT is a container for data objects of different type, like a C struct.
- DICT_ENTRY has exactly two elements, a key and a value.  The key must be
  of a basic type, and DICT_ENTRY can only be the element of an ARRAY.
- VARIANT is a container for single data object of any type. It is the
  equivalent of ANY type in programming languages.

All concrete container types are derived from CONTAINER.

All basic types can be constructed from a primitive value. All container types
can only be constructed with an array of instances of TYPE class. They cannot be
constructed from primitive values directly.

Both BASIC_TYPE and CONTAINER are derived from TYPE class, which is
the base class of all types.

All types can be constructed as an empty object, then the value is extracted
from a binary Buffer by `unmarshal` method.

All types can fill their values into a binary Buffer by `marshal` method.

In original design, the container types may be constructed by values. All types
have an `eval` method to generate a literal JavaScript object.

`constructByValue` is removed in latter version. There is no good way to
provided a literal presentation of DBus data object in general. Writing
application interface specific adapter is unavoidable.

The `eval` method is preserved but user should not use it for data manipulation.
It is only used for developer to print the complex data in a compact format.

The following table lists the type hierarchy, type signature code, data size
for basic types, and data alignments.

```
  TYPE                        size    align   construct
    BASIC_TYPE
      FIXED_TYPE
y       BYTE (UINT8)          1       1       o: number
n       INT16                 2       2       o: number
q       UINT16                2       2       o: number
i       INT32                 4       4       o: number
u       UINT32                4       4       o: number
b       BOOLEAN (UINT32)      4       4       o: number
x       INT64                 8       8       o: bigint
t       UINT64                8       8       o: bigint
d       DOUBLE                8       8       o: number
h       UNIX_FD               4       4       o: number

      (STRING_LIKE)
s       STRING                        4       o: string
o         OBJECT_PATH                 4       o: string
g         SIGNATURE                   1       o: string

    CONTAINER
a       ARRAY                         4       m: string (sig), TYPE[]
(       STRUCT                        8       m: string (sig), TYPE[]
{         DICT_ENTRY                  8       m: string (sig), [BASIC_TYPE, TYPE]
v       VARIANT                       1       m: string = 'v' | TYPE
```

@module Types
*/

/** @constant */
const basicTypeCodes = 'ybnqiuxtdsogh'.split('')

/** @function */
const round = (offset, modulo) => Math.ceil(offset / modulo) * modulo

/**
 * TYPE is the base class of all DBus data type classes.
 *
 * All TYPE objects has the following methods:
 * - signature
 * - eval, returns a non-TYPE JavaScript object. The signature information is lost.
 * - ulgy, returns a JavaScript object preserving signature, but looks ugly.
 */
class TYPE {
  /**
   * Constructs an DBus type object.
   *
   * If invoked by constructing a derived class with new, such as , do nothing.
   * If invoked directly, this constructor returns an object
   * of one derived class, according to `sig` argument. This
   * is the so-called **abstract factory** pattern in GoF book.
   * @param {string} sig - type signature
   * @param {string} [val] - value, depends on type
   */
  constructor (...args) {
    // abstract factory
    // new TYPE(sig) -> construct an empty TYPE object
    // new TYPE(sig, val) -> construct and TYPE object from value
    if (this.constructor === TYPE) { // abstract factory
      const Type = this.type(args[0])
      if (!Type) {
        throw new Error(`bad sig, ${args[0]}`)
      }

      if (args[1] === undefined) {
        if (Type.prototype instanceof CONTAINER) {
          return new Type(args[0])
        } else {
          return new Type()
        }
      } else {
        if (Type.prototype instanceof CONTAINER) {
          return new Type(args[0], args[1])
        } else {
          return new Type(args[1])
        }
      }
    }
  }

  /**
   * @returns {string} type code character
   */
  type (sig) {
    if (typeof sig !== 'string') throw new TypeError('sig not a string')

    switch (sig[0]) {
      case 'y': return BYTE
      case 'n': return INT16
      case 'q': return UINT16
      case 'i': return INT32
      case 'u': return UINT32
      case 'b': return BOOLEAN
      case 'h': return UNIX_FD
      case 'x': return INT64
      case 't': return UINT64
      case 'd': return DOUBLE
      case 's': return STRING
      case 'o': return OBJECT_PATH
      case 'g': return SIGNATURE
      case 'a': return ARRAY
      case '(': return STRUCT
      case '{': return DICT_ENTRY
      case 'v': return VARIANT
      default: throw new Error('xxx')
    }
  }

  /**
   * @returns {string} type signature
   */
  signature () {
    return this.code
  }
}

/**
 * BASIC_TYPE contains primitive values, including
 * both fixed-size and variable-size values.
 *
 * All basic types have a value property, which is a
 * - integer for BYTE, INT16, UINT16, INT32, UINT32, BOOLEAN and UNIX_FD
 * - bigint for INT64 and UINT16
 * - number for DOUBLE
 */
class BASIC_TYPE extends TYPE {
  /**
   *
   */
  eval () {
    return this.value
  }
}

/**
 * FIXED_TYPE contains primitive value with fixed size.
 *
 * The base class implements `marshal` and `unmarshal` methods, which
 * called `write` and `read` methods implemented by concrete type classes.
 */
class FIXED_TYPE extends BASIC_TYPE {
  /**
   * Writes value to buffer
   *
   * @param {Buffer|null} buf - if null, dry run
   * @param {number} offset
   * @param {boolean} [le] - true for little endian, defaults to true
   * @throws {RangeError} if offset out of range
   */
  marshal (buf, offset, le = true) {
    offset = round(offset, this.align)

    if (!buf) return offset + this.size

    if (offset + this.size > buf.length) { // useless
      throw new RangeError('marshaling beyond buffer length')
    }

    this.write(buf, offset, le)
    return offset + this.size
  }

  /**
   * Reads value from buffer
   *
   * @param {Buffer} buf
   * @param {number} offset
   * @param {boolean} [le] - true for little endian, defaults to true
   */
  unmarshal (buf, offset, le) {
    const $0 = offset
    offset = round(offset, this.align)
    const $1 = offset
    this.value = this.read(buf, offset, le)
    offset += this.size

    logu($, this.constructor.name, `${$0}/${$1} to ${offset}, ${this.value}`)

    return offset
  }
}

/**
 * BYTE is an unsigned int stored with 8 bits
 */
class BYTE extends FIXED_TYPE {
  /**
   * Constructs a BYTE object.
   *
   * `value` should be an integer from 0 to 255. A character is
   * also allowed for convenience. For example, 'l' denotes little
   * endian in message header. If not provided, the BYTE object has
   * no value. The value should be generated from unmarshalling
   * binary data.
   *
   * @param {number|string|undefined} value - byte value
   */
  constructor (value) {
    super()

    // char
    if (typeof value === 'string' && value.length === 1) {
      value = Buffer.from(value)[0]
    }

    if (value !== undefined) {
      if (!Number.isInteger(value)) {
        throw new TypeError('value not an integer')
      }

      if (value < 0 || value > Math.pow(2, 8) - 1) {
        throw new RangeError('value out of range')
      }

      this.value = value
    }
  }

  /**
   * Writes value to buffer
   *
   * @param {Buffer|null} buf
   * @param {number} offset
   * @throws {RangeError} if offset equal or greater than buffer length
   */
  write (buf, offset) {
    buf.writeUInt8(this.value, offset)
  }

  /**
   * Reads value from buffer at given offset.
   * @param {Buffer} buf
   * @param {number} offset
   * @returns {number} an integer value ranging from 0 to 255
   */
  read (buf, offset) {
    return buf.readUInt8(offset)
  }
}

/**
 * INT16 is a signed integer stored with 16 bits.
 */
class INT16 extends FIXED_TYPE {
  /**
   * Constructs a INT16 object
   *
   * @param {number} value
   * @throws {TypeError} if value not an integer
   * @throws {RangeError} if value out of range
   */
  constructor (value) {
    super()
    if (value !== undefined) {
      if (!Number.isInteger(value)) {
        throw new TypeError('not an integer')
      }

      if (value < -Math.pow(2, 15) || value > Math.pow(2, 15) - 1) {
        throw new RangeError('value out of range')
      }
      this.value = value
    }
  }

  /**
   * Writes value into buffer at given offset with provided endianness
   *
   * @param {Buffer} buf
   * @param {number} offset
   * @param {boolean} le - true for little-endian, false for big-endian
   */
  write (buf, offset, le) {
    if (le) {
      buf.writeInt16LE(this.value, offset)
    } else {
      buf.writeInt16BE(this.value, offset)
    }
  }

  /**
   * Reads value from buffer at given offset with provided endianness
   *
   * @param {Buffer} buf
   * @param {number} offset
   * @param {boolean} le - true for little-endian, false for big-endian
   * @returns {number} an integer ranging from -32,768 to 32767
   */
  read (buf, offset, le) {
    if (le) {
      return buf.readInt16LE(offset)
    } else {
      return buf.readInt16BE(offset)
    }
  }
}

/**
 * UINT16 is an unsigned integer stored with 16 bits.
 */
class UINT16 extends FIXED_TYPE {
  /**
   * Constructs a UINT16
   *
   * @throws {TypeError} if value not an integer
   * @throws {RangeError} if value out of range
   */
  constructor (value) {
    super()
    if (value !== undefined) {
      if (!Number.isInteger(value)) {
        throw new TypeError('not an integer')
      }

      if (value < 0 || value > Math.pow(2, 16) - 1) {
        throw new RangeError('value must be in range of 0 to 65535')
      }

      this.value = value
    }
  }

  /**
   * Writes value to buffer
   *
   * @param {Buffer} buf
   * @param {number} offset
   * @param {boolean} le - true for little-endian
   */
  write (buf, offset, le) {
    if (le) {
      buf.writeUInt16LE(this.value, offset)
    } else {
      buf.writeUInt16BE(this.value, offset)
    }
  }

  /**
   * Reads value from buffer
   *
   * @param {Buffer} buf
   * @param {number} offset
   * @param {boolean} le - true for little-endian
   * @returns {number} an integer in range
   */
  read (buf, offset, le) {
    if (le) {
      return buf.readUInt16LE(offset)
    } else {
      return buf.readUInt16BE(offset)
    }
  }
}

/**
 * INT32 is an signed integer stored with 32 bits.
 */
class INT32 extends FIXED_TYPE {
  /**
   * Constructs an INT32
   *
   * @param {number} value - an integer in range
   */
  constructor (value) {
    super()
    if (value !== undefined) {
      if (!Number.isInteger(value)) {
        throw new TypeError('not an integer')
      }

      if (value < -Math.pow(2, 31) || value > Math.pow(2, 31) - 1) {
        throw new RangeError('value out of range')
      }

      this.value = value
    }
  }

  /**
   *
   */
  write (buf, offset, le) {
    if (le) {
      buf.writeUInt16LE(this.value, offset)
    } else {
      buf.writeUInt16BE(this.value, offset)
    }
  }

  /**
   *
   */
  read (buf, offset, le) {
    if (le) {
      return buf.readUInt16LE(offset)
    } else {
      return buf.readUInt16BE(offset)
    }
  }
}

/**
 * UINT32 is an unsigned integer stored with 32 bits.
 */
class UINT32 extends FIXED_TYPE {
  /**
   * Constructs an UINT32
   *
   * @param {number} value - an integer in range
   */
  constructor (value) {
    super()
    if (value !== undefined) {
      if (!Number.isInteger(value)) {
        throw new TypeError('not an integer')
      }

      if (value < 0 || value > Math.pow(2, 32) - 1) {
        throw new RangeError('value out of range')
      }

      this.value = value
    }
  }

  /**
   *
   */
  write (buf, offset, le) {
    if (le) {
      buf.writeUInt32LE(this.value, offset)
    } else {
      buf.writeUInt32BE(this.value, offset)
    }
  }

  /**
   *
   */
  read (buf, offset, le) {
    if (le) {
      return buf.readUInt32LE(offset)
    } else {
      return buf.readUInt32BE(offset)
    }
  }
}

/**
 * In DBus data types, BOOLEAN is a UINT32 with differen code and ranging from 0 to 1.
 */
class BOOLEAN extends UINT32 {
  /**
   * Constructs a BOOLEAN
   *
   * @param {boolean} [value]
   */
  constructor (value) {
    if (typeof value === 'boolean') {
      value = value ? 1 : 0
    }
    super(value)
  }

  eval () {
    return !!this.value
  }
}

/**
 * UNIX_FD is a UINT32 with different type code
 */
class UNIX_FD extends UINT32 {}

/**
 * Int64
 */
class INT64 extends FIXED_TYPE {
  /**
   * Constructs a INT64
   *
   * @param {number|bigint} [value] - an integer or a bigint in range
   */
  constructor (value) {
    super()

    if (value !== undefined) {
      if (Number.isInteger(value)) {
        value = BigInt(value)
      }

      if (typeof value !== 'bigint') {
        throw new TypeError('not an integer or a bigint')
      }

      if (value < -(POW64 / 2n) || value > (POW64 / 2n) - 1n) {
        throw new RangeError('value out of range')
      }

      this.value = value
    }
  }

  /**
   *
   */
  write (buf, offset, le) {
    const value = this.value >= 0n ? this.value : this.value + POW64
    const high = Number(value / POW32)
    const low = Number(value % POW32)
    if (le) {
      buf.writeUInt32LE(low, offset)
      offset += 4
      buf.writeUInt32LE(high, offset)
    } else {
      buf.writeUInt32BE(high, offset)
      offset += 4
      buf.writeUInt32BE(low, offset)
    }
  }

  /**
   *
   */
  read (buf, offset, le) {
    let high, low
    if (le) {
      low = buf.readUInt32LE(offset)
      offset += 4
      high = buf.readUInt32LE(offset)
    } else {
      high = buf.readUInt32BE(offset)
      offset += 4
      low = buf.readUInt32BE(offset)
    }

    const value = BigInt(high) * POW32 + BigInt(low)
    return value < (POW64 / 2n) ? value : (value - POW64)
  }
}

/**
 * UINT64
 */
class UINT64 extends FIXED_TYPE {
  /**
   * Constructs an UINT64
   *
   * @param {number|bigint} [value] - an integer or a bigint in range
   */
  constructor (value) {
    super()
    if (value !== undefined) {
      if (Number.isInteger(value)) {
        value = BigInt(value)
      }

      if (typeof value !== 'bigint') {
        throw new TypeError('not an integer or a bigint')
      }

      if (value < 0 || value > (POW64 - 1n)) {
        throw new RangeError('value out of range')
      }

      this.value = value
    }
  }

  /**
   *
   */
  write (buf, offset, le) {
    const high = Number(this.value / POW32)
    const low = Number(this.value % POW32)
    if (le) {
      buf.writeUInt32LE(low, offset)
      offset += 4
      buf.writeUInt32LE(high, offset)
    } else {
      buf.writeUInt32BE(high, offset)
      offset += 4
      buf.writeUInt32BE(low, offset)
    }
  }

  /**
   *
   */
  read (buf, offset, le) {
    let high, low
    if (le) {
      low = buf.readUInt32LE(offset)
      offset += 4
      high = buf.readUInt32LE(offset)
    } else {
      high = buf.readUInt32BE(offset)
      offset += 4
      low = buf.readUInt32BE(offset)
    }

    return BigInt(high) * POW32 + BigInt(low)
  }
}

/**
 * DOUBLE
 *
 * In JavaScript, a number is always a double precision floating point number
 * conforming to IEEE754 standard.
 */
class DOUBLE extends FIXED_TYPE {
  /**
   * Constructs a DOUBLE
   *
   * @param {number} [value]
   */
  constructor (value) {
    super()

    if (value !== undefined) {
      if (typeof value !== 'number') {
        throw new TypeError('value no a number')
      }

      this.value = value
    }
  }

  /**
   *
   */
  write (buf, offset, le) {
    if (le) {
      buf.writeDoubleLE(this.value, offset)
    } else {
      buf.writeDoubleBE(this.value, offset)
    }
  }

  /**
   *
   */
  read (buf, offset, le) {
    if (le) {
      return buf.readDoubleLE(offset)
    } else {
      return buf.readDoubleBE(offset)
    }
  }
}

/**
 *
 */
class STRING extends BASIC_TYPE {
  /**
   * Constructs a String-like type
   *
   * @param {string} [value] - if undefined, construct an empty object for unmarshaling
   */
  constructor (value) {
    super()
    if (typeof value === 'string') {
      this.value = value
    } else if (value === undefined) {
      // empty
    } else {
      throw new TypeError('value not a string')
    }
  }

  /**
   * Writes value to buffer
   *
   * @param {Buffer|null} buf - if null, dry run.
   * @param {number} offset
   * @param {boolean} le - true for little endian, defaults to true
   */
  marshal (buf, offset, le) {
    const $0 = offset
    offset = round(offset, this.align)
    const $1 = offset

    buf && this.writeLen(buf, offset, le)
    offset += this.align // happens to be the same value
    buf && buf.write(this.value, offset)
    offset += this.value.length
    buf && buf.write('\0', offset)
    offset += 1

    logm($, this.constructor.name, `${$0}/${$1} to ${offset}, "${this.value}"`)

    return offset
  }

  /**
   * Writes string length to buffer
   */
  writeLen (buf, offset, le) {
    if (le) {
      buf.writeUInt32LE(this.value.length, offset)
    } else {
      buf.writeUInt32BE(this.value.length, offset)
    }
  }

  /**
   *
   */
  unmarshal (buf, offset, le) {
    const d0 = offset
    offset = round(offset, this.align)
    const d1 = offset

    let strlen
    if (this.align === 1) {
      strlen = buf.readUInt8(offset)
    } else if (this.align === 4) {
      strlen = le ? buf.readUInt32LE(offset) : buf.readUInt32BE(offset)
    } else {
      throw new Error('invalid align for string')
    }
    offset += this.align
    this.value = buf.slice(offset, offset + strlen).toString()
    // skip null termination
    offset += strlen + 1

    logu($, this.constructor.name, `${d0}/${d1} to ${offset}, "${this.value}"`)

    return offset
  }
}

STRING.from = value => {
  if (typeof value !== 'string') throw new TypeError('value not a string')
  return new STRING(value)
}

/**
 * Object Path (same as STRING except for type code)
 */
class OBJECT_PATH extends STRING {
  /**
   * Constructs an OBJECT_PATH
   */
  constructor (value) {
    super(value)
    if (Object.prototype.hasOwnProperty.call(this, 'value')) {
      if (!path.isAbsolute(this.value) || path.normalize(this.value) !== this.value) {
        throw new RangeError('invalid object path')
      }
    }
  }
}

/**
 * SIGNATURE has difference type code and alignment from STRING.
 *
 * SIGNATURE could be empty string.
 */
class SIGNATURE extends STRING {
  /**
   * Constructs an SIGNATURE
   */
  constructor (value) {
    super(value)
    if (Object.prototype.hasOwnProperty.call(this, 'value')) {
      this.value && split(this.value)
    }
  }

  writeLen (buf, offset, le) {
    buf.writeUInt8(this.value.length, offset)
  }

  /**
   *
   */
  unmarshal (buf, offset, le) {
    offset = super.unmarshal(buf, offset, le)
    this.value && split(this.value)
    return offset
  }
}

/**
 * CONTAINER is the base class of ARRAY, STRUCT, DICT_ENTRY and VARIANT.
 *
 * All container types are constructed with a signature and an array
 * containing elements. Strictly, all elements should be DBus TYPE objects.
 * However, this makes code tedious and unreadable. So mixing JavaScript type
 * DBus TYPE is allowed. Elements of JavaScript type could be primitive type
 * or an array for containers. Other data types are not allowed.
 *
 */
class CONTAINER extends TYPE {
  /**
   *
   */
  signature () {
    return this.sig
  }

  /**
   *
   */
  eval () {
    return this.elems.map(elem => elem.eval())
  }

  /**
   *
   */
  marshal (buf, offset, le) {
    const $0 = offset
    offset = round(offset, this.align)
    const $1 = offset

    logm($, this.constructor.name, `${$0}/${$1}, {`)
    $more()

    offset = this.elems.reduce((offset, el) => {
      return el.marshal(buf, offset, le)
    }, round(offset, this.align))

    $less()
    logm($, '}', `@${offset}, ${this.elems.length} element(s)`)

    return offset
  }
}

/**
 * ARRAY contains elements of the same type
 */
class ARRAY extends CONTAINER {
  /**
   * Constructs an ARRAY
   *
   * @param {string} [signature]
   * @param {Array} [elements]
   */
  constructor (signature, elements) {
    super()

    if (Array.isArray(signature)) {
      elements = signature
      if (!elements.length) {
        throw new Error('signature required')
      }

      if (!elements.every(el => el instanceof TYPE &&
        el.signature() === elements[0].signature())) {
        throw new Error('signature required')
      }

      signature = 'a' + elements[0].signature()
    }

    if (typeof signature !== 'string') {
      throw new TypeError('signature not a string')
    }

    const sigs = split(signature)
    if (sigs.length !== 1) {
      throw new RangeError('signature not a single complete type')
    }

    if (signature[0] !== 'a') {
      throw new RangeError('not an ARRAY signature')
    }

    this.sig = signature
    this.esig = this.sig.slice(1)
    this.elems = []

    if (Array.isArray(elements)) {
      elements.forEach(el => this.push(el))
    }
  }

  // return offset TODO elem align refactor, what does this mean?
  /**
   *
   */
  marshal (buf, offset, le) {
    const $0 = offset
    offset = round(offset, 4)
    const $1 = offset

    const numOffset = offset
    offset += this.align
    offset = round(offset, this.type(this.esig).prototype.align)
    const elemOffset = offset

    logm($, this.constructor.name,
      `${$0}/${$1}, num @ ${numOffset}, element[0] @ ${elemOffset} {`)

    $more()

    offset = this.elems.reduce((offset, elem) =>
      elem.marshal(buf, offset, le), elemOffset)

    const num = offset - elemOffset
    if (le) {
      buf && buf.writeUInt32LE(num, numOffset)
    } else {
      buf && buf.writeUInt32BE(num, numOffset)
    }

    $less()

    logm($, '}', `@${offset}, num: ${num}, ${this.elems.length} element(s)`)

    return offset
  }

  /**
   *
   */
  unmarshal (buf, offset, le) {
    const d0 = offset
    offset = round(offset, this.align)
    const d1 = offset

    const num = le ? buf.readUInt32LE(offset) : buf.readUInt32BE(offset)
    offset += 4
    offset = round(offset, this.type(this.esig).prototype.align)
    const elemStart = offset

    logu($, this.constructor.name, `${d0}/${d1}, n: ${num}, es: ${offset} {`)
    $more()

    while (offset < elemStart + num) {
      const elem = new TYPE(this.esig)
      offset = elem.unmarshal(buf, offset, le)
      this.elems.push(elem)
    }

    $less()
    logu($, '}', `@ ${offset}, ${this.elems.length} element(s)`)

    return elemStart + num
  }

  /**
   * Adds a new element into array
   *
   * @param {TYPE} elem - elem should be a TYPE object. If not, this function
   * will construct a TYPE object with esig and elem.
   */
  push (elem) {
    if (elem instanceof TYPE) {
      if (elem.signature() !== this.esig) throw new Error('signature mismatch')
      this.elems.push(elem)
      return this
    } else {
      return this.push(new TYPE(this.esig, elem))
    }
  }

  /**
   * returns an array of elements. If the ARRAY is a DICT, if the key is string
   * like type, returns a JavaScript object. If the key is other basic type,
   * returns a JavaScript Map.
   */
  eval () {
    if (this.esig[0] === '{') {
      if ('sog'.includes(this.esig[1])) { // string like key
        return this.elems.reduce((o, dentry) =>
          Object.assign(o, {
            [dentry.elems[0].eval()]: dentry.elems[1].eval()
          }), {})
      } else { // other basic type
        return new Map(super.eval())
      }
    } else {
      return super.eval()
    }
  }
}

/**
 * STRUCT
 */
class STRUCT extends CONTAINER {
  /**
   * if signature not provided, elements must be non-empty and all elements
   * must be TYPE object
   *
   * @param {string} signature
   * @param {Array} elements
   */
  constructor (signature, elements) {
    super()

    if (Array.isArray(signature)) {
      elements = signature
      if (!elements.length) {
        throw new Error('signature required')
      }

      if (!elements.every(elem => elem instanceof TYPE)) {
        throw new Error('signature required')
      }

      signature = this.bra + elements.map(el => el.signature()).join('') + this.ket
    }

    if (typeof signature !== 'string') {
      throw new TypeError('signature not a string')
    }

    if (signature.length < 3 ||
      !signature.startsWith(this.bra) ||
      !signature.endsWith(this.ket)) {
      throw new Error('invalid signature')
    }

    this.sig = signature
    this.esigs = split(signature.slice(1, signature.length - 1))
    if (this.esigs.find(s => s.startsWith('{'))) {
      throw new Error('DICT_ENTRY can only be element of ARRAY')
    }

    this.elems = []
    if (Array.isArray(elements)) {
      elements.forEach(el => this.push(el))
    }
  }

  unmarshal (buf, offset, le) {
    const d0 = offset
    offset = round(offset, this.align)
    const d1 = offset

    logu($, this.constructor.name, `${d0}/${d1} {`)
    $more()

    this.elems = []
    this.esigs.forEach(sig => {
      const elem = new TYPE(sig)

      offset = elem.unmarshal(buf, offset, le)
      this.elems.push(elem)
    })

    $less()
    logu($, '}', `@ ${offset}, ${this.elems.length} elements`)

    return offset
  }

  /**
   *
   */
  push (elem) {
    if (this.elems.length >= this.esigs.length) throw new Error('elems full')
    if (elem.signature() !== this.esigs[this.elems.length]) {
      throw new Error('signature mismatch')
    }
    this.elems.push(elem)
    return this
  }
}

/**
 * DICT_ENTRY is a key-value pair where the key can only be a basic type.
 * DICT_ENTRY can only be the element of ARRAY.
 */
class DICT_ENTRY extends STRUCT {
  /**
   * Constructs a DICT_ENTRY
   */
  constructor (signature, elements) {
    super(signature, elements)

    if (this.esigs.length !== 2) {
      throw new Error('dict entry must have exactly two elements as key value')
    }

    if (!basicTypeCodes.includes(this.esigs[0])) {
      throw new Error('dict entry key must be of a basic type')
    }

    if (this.elems.length && this.elems.length !== 2) {
      throw new Error('partial construction not allowed for dict entry')
    }
  }
}

/**
 * VARIANT contains single TYPE object
 */
class VARIANT extends CONTAINER {
  /**
   * Constructs a VARIANT
   *
   * @param {string|TYPE}
   */
  constructor (element) {
    super()
    this.sig = 'v'
    this.elems = []
    this.esigs = []

    if (element === 'v' || element === undefined) return

    if (element instanceof TYPE) {
      this.elems = [new SIGNATURE(element.signature()), element]
      this.esigs = this.elems.map(elem => elem.signature())
    } else {
      throw new Error('VARIANT: non-TYPE object')
    }
  }

  /**
   *
   */
  unmarshal (buf, offset, le) {
    const d0 = offset

    logu($, this.constructor.name, `${d0}/${d0} {`)
    $more()

    const elem0 = new SIGNATURE()
    offset = elem0.unmarshal(buf, offset, le)
    this.elems.push(elem0)

    const elem1 = new TYPE(elem0.value)
    offset = elem1.unmarshal(buf, offset, le)
    this.elems.push(elem1)

    this.esigs = this.elems.map(elem => elem.signature())

    $less()
    logu($, '}', `@ ${offset}, ${this.elems.length} elements`)

    return offset
  }

  /**
   *
   */
  eval () {
    const value = this.elems[1].eval()
    if (value === undefined) {
      console.dir(this, { depth: 10 })
      throw Error('stack')
    }
    return value
    /**
    return {
      signature: this.elems[0].eval(),
      value: this.elems[1].eval()
    }
*/
  }
}

const assign = (type, attrs) => Object.assign(type.prototype, attrs)

assign(BYTE, { code: 'y', align: 1, size: 1 })
assign(INT16, { code: 'n', align: 2, size: 2 })
assign(UINT16, { code: 'q', align: 2, size: 2 })
assign(INT32, { code: 'i', align: 4, size: 4 })
assign(UINT32, { code: 'u', align: 4, size: 4 })
assign(BOOLEAN, { code: 'b', align: 4, size: 4 })
assign(UNIX_FD, { code: 'h', align: 4, size: 4 })
assign(INT64, { code: 'x', align: 8, size: 8 })
assign(UINT64, { code: 't', align: 8, size: 8 })
assign(DOUBLE, { code: 'd', align: 8, size: 8 })
assign(STRING, { code: 's', align: 4 })
assign(OBJECT_PATH, { code: 'o', align: 4 })
assign(SIGNATURE, { code: 'g', align: 1 })
assign(ARRAY, { code: 'a', align: 4 })
assign(STRUCT, { code: '(', align: 8, bra: '(', ket: ')' })
assign(DICT_ENTRY, { code: '{', align: 8, bra: '{', ket: '}' })
assign(VARIANT, { code: 'v', align: 1 })

module.exports = {
  LITTLE,
  BIG,
  POW32,
  POW64,
  TYPE,
  BASIC_TYPE,
  CONTAINER,
  BYTE,
  BOOLEAN,
  INT16,
  UINT16,
  INT32,
  UINT32,
  INT64,
  UINT64,
  DOUBLE,
  UNIX_FD,
  STRING,
  OBJECT_PATH,
  SIGNATURE,
  ARRAY,
  STRUCT,
  DICT_ENTRY,
  VARIANT
}
