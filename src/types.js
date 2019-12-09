const debug = require('debug')
const { split, slice } = require('./signature')

const log = debug('dbus:types')
const logm = debug('marshal')
const logu = debug('unmarshal')

const $width = 3
const $more = () => $ = $ + ' '.repeat($width)
const $less = () => $ = $.slice($width)

let $ = ''

const LITTLE = Buffer.from('l')[0]
const BIG = Buffer.from('B')[0]

/**
This module defines all classes for DBus data types.

DBus is a binary protocol. It has a type system to marshaling or unmarshaling
transmitted data. In both document and code, classes representing a DBus data
type are named exactly after the data type defined in DBus specification, with
all letters in uppercase.

BYTE, INT, BOOLEAN, DOUBLE and UNIX_FD has fixed length. They are all derived
from FIXED_TYPE.

STRING, OBJECT_PATH, and SIGNATURE has variable length. They are all derived
from STRING_LIKE_TYPE.

Both FIXED_TYPE and STRING_LIKE_TYPE are BASIC_TYPE, which is usually mentioned
as primitive types in programming languages. All basic type object has
a `value` member, holding the value.

DBus also provides container types. There are four container types:

- ARRAY contains a collection of data objects of the same type.
- STRUCT is a container for data objects of different type, like a C struct.
- DICT_ENTRY has exactly two elements, a key and a value.  The key must be
  of a basic type, and DICT_ENTRY can only be the element of an ARRAY.
- VARIANT is a container for single data object of any type. It is the
  equivalent of ANY type in programming languages.

All concrete container types are derived from CONTAINER_TYPE.

All basic types can be constructed from a primitive value. All container types
can only be constructed with an array of instances of TYPE class. They cannot be
constructed from primitive values directly.

Both BASIC_TYPE and CONTAINER_TYPE are derived from TYPE class, which is
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

      STRING_LIKE_TYPE
s       STRING                        4       o: string
o       OBJECT_PATH                   4       o: string
g       SIGNATURE                     1       o: string

    CONTAINER_TYPE
a       ARRAY                         4       m: string (sig) | TYPE[]
(       STRUCT                        8       m: string (sig) | TYPE[]
v       VARIANT                       1       m: string = 'v' | TYPE[] = [SIGNATURE, TYPE]
{       DICT_ENTRY                    8       m: string (sig) | TYPE[] = [BASIC_TYPE, TYPE]
```

@module Types
*/

/** @constant */
const basicTypeCodes = 'ybnqiuxtdsogh'.split('')

/** @functoin */
const round = (offset, modulo) => Math.ceil(offset / modulo) * modulo


/**
 * TYPE is the base class of all DBus data type classes.
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
        if (Type.prototype instanceof CONTAINER_TYPE) {
          return new Type(args[0])
        } else {
          return new Type()
        }
      } else {
        if (Type.prototype instanceof CONTAINER_TYPE) {
          return new Type(args[0], args[1])
        } else {
          return new Type(args[1])
        }
      }
    }
  }

  /**
   *
   */
  type (sig) {
    return this._map[sig[0]]
  }

  // all TYPE object has this method
  // CONTAINER_TYPE should override this method except for VARIANT
  signature () {
    return this.code
  }
}

/**
 * BASIC_TYPE contains primitive values, including
 * both fixed-size and variable-size values.
 *
 * All basic types have a value member, which is a
 * number (integer), a bigint, or a string
 */
class BASIC_TYPE extends TYPE {
/**
  constructor (value) {
    super()
    if (this.value !== undefined) this.value = value
  }
*/

  /**
   * returns value
   */
  eval () {
    return JSON.stringify({ [this.signature()]: this.value })
  }
}

/**
 * FIXED_TYPE contains primitive values with fixed size.
 *
 * FIXED_TYPE implements `marshal` and `unmarshal`, which 
 */
class FIXED_TYPE extends BASIC_TYPE {
  /**
   * Writes value to buffer
   */
  marshal (buf, offset, le) {
    offset = round(offset, this.align)
    this._write(buf, offset, le)
    return offset + this.size
  }

  /**
   *
   */
  unmarshal (buf, offset, le) {
    const $0 = offset
    offset = round(offset, this.align)
    const $1 = offset
    this.value = this._read(buf, offset, le)
    offset += this.size

    logu($, this.constructor.name, `${$0}/${$1} to ${offset}, ${this.value}`)

    return offset
  }
}

/**
 * BYTE
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
   * Writes value to buffer at given offset.
   *
   * @param {Buffer|null} buf
   * @param {number} offset
   * @throws {RangeError} if offset equal or greater than buffer length
   */
  _write (buf, offset) {
    if (buf) buf.writeUInt8(this.value, offset)
  }

  /**
   * Reads value from buffer at given offset.
   * @param {Buffer} buf
   * @param {number} offset
   * @returns {number} an integer value ranging from 0 to 255
   */
  _read (buf, offset) {
    return buf.readUInt8(offset)
  }
}

/**
 * Signed Int16
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
  _write (buf, offset, le) {
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
  _read (buf, offset, le) {
    return le ? buf.readInt16LE(offset) : buf.readInt16BE(offset)
  }
}

/**
 * Unsigned Int16
 */
class UINT16 extends FIXED_TYPE {
  /**
   * Constructs a UINT16 type object
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
   * Writes value into buffer at given offset with provided endianness
   *
   * @param {Buffer} buf
   * @param {number} offset
   * @param {boolean} le - true for little-endian, false for big-endian
   */
  _write (buf, offset, le) {
    if (le) {
      buf.writeUInt16LE(this.value, offset)
    } else {
      buf.writeUInt16BE(this.value, offset)
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
  _read (buf, offset, le) {
    return le ? buf.readUInt16LE(offset) : buf.readUInt16BE(offset)
  }
}

/**
 * Signed Int32
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

  _write (buf, offset, le) {
    le ? buf.writeUInt16LE(this.value, offset) : buf.writeUInt16BE(this.value, offset)
  }

  _read (buf, offset, le) {
    return le ? buf.readUInt16LE(offset) : buf.readUInt16BE(offset)
  }
}

/**
 * Unsigned Int32
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

  _write (buf, offset, le) {
    if (le) {
      buf.writeUInt32LE(this.value, offset)
    } else {
      buf.writeUInt32BE(this.value, offset)
    }
  }

  _read (buf, offset, le) {
    return le ? buf.readUInt32LE(offset) : buf.readUInt32BE(offset)
  }
}

/**
 * Boolean
 */
class BOOLEAN extends UINT32 {
  /**
   *
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
 * Unix File Descriptor (same as UINT32 except for the code)
 */
class UNIX_FD extends UINT32 {}

/**
 * Signed Int64
 */
class INT64 extends FIXED_TYPE {

  /**
   * value 
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

      const bound = BigInt(Math.pow(2, 32)) * BigInt(Math.pow(2, 32)) 
      if (value < -(bound / 2n) || value > (bound / 2n) - 1n) {
        throw new RangeError('value out of range')
      }

      this.value = value
    }
  }

  _write (buf, offset, le) {
    // TODO
  }

  _read (buf, offset, le) {
    // TODO
  }
} // )

/**
 * Unsigned Int64
 */
class UINT64 extends FIXED_TYPE {
  /**
   * Constructs an UINT64
   * 
   * @param {number|bigint} [value]
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

      const bound = BigInt(Math.pow(2, 32)) * BigInt(Math.pow(2, 32)) 
      if (value < 0 || value > (bound - 1n)) {
        throw new RangeError('value out of range')
      }

      this.value = value
    }
  }

  _write (buf, offset, le) {
    // TODO
  }

  _read (buf, offset, le) {
    // TODO
  }
} // )

// const DOUBLE = DEC({ code: 'd', align: 8, size: 8 })(

/**
 * Double Precision Float Number
 */
class DOUBLE extends FIXED_TYPE {

  _write (buf, offset, le) {
    le ? buf.writeDoubleLE(this.value, offset) : buf.writeDoubleBE(this.value, offset)
  }

  _read (buf, offset, le) {
    return le ? buf.readDoubleLE(offset) : buf.readDoubleBE(offset)
  }
}

/**
 * String-like type
 */
class STRING_LIKE_TYPE extends BASIC_TYPE {
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
      throw new Error('value not a string')
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

    this._write(buf, offset, le)
    offset += this.align // happens to be the same value
    buf.write(this.value, offset)
    offset += this.value.length
    buf.write('\0', offset)
    offset += 1

    logm($, this.constructor.name, `${$0}/${$1} to ${offset}, "${this.value}"`)

    return offset
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

/**
 * String
 */
class STRING extends STRING_LIKE_TYPE {
  constructor (value) {
    super(value)
    if (value) this.value = value
  }

  _write (buf, offset, le) {
    if (le) {
      buf.writeUInt32LE(this.value.length, offset)
    } else {
      buf.writeUInt32BE(this.value.length, offset)
    }
  }
}

STRING.from = value => {
  if (typeof value !== 'string') throw new TypeError('value not a string')
  return new STRING(value)
}

// const OBJECT_PATH = DEC({ code: 'o', align: 4 })(

/**
 * Object Path (same as STRING except for type code)
 */
class OBJECT_PATH extends STRING {
  constructor (value) {
    super(value)
    // TODO validate
  }
} // )

// const SIGNATURE = DEC({ code: 'g', align: 1 })(

/**
 * Signature (same as STRING except for type code and alignment)
 */
class SIGNATURE extends STRING_LIKE_TYPE {
  constructor (value) {
    super(value)
    // TODO validate
  }

  _write (buf, offset, le) {
    buf.writeUInt8(this.value.length, offset)
  }

  unmarshal (buf, offset, le) {
    offset = super.unmarshal(buf, offset, le)
    split(this.value)
    return offset
  }
}

/**
 * CONTAINER_TYPE is the base class of ARRAY, STRUCT, DICT_ENTRY and VARIANT.
 *
 * All concrete container type has two constructors. One for construct an empty
 *
 *
 */
// signature is a string, value is an array of TYPE object
// if signature is omitted, signature is generated automatically
// if value is omitted
class CONTAINER_TYPE extends TYPE {
  // new CONTAINER(signature) constructs an empty object, intended for unmarshalling.
  // new CONTAINER(elems, signature) constructs an object loaded with elements, signature is optional, if provided, the constructor will check if they are match.
  // new CONTAINER(signature, vals) constructs an object loaded with elements converted from vals, signature is mandatory.
  // VARIANT is forbidden in construction by value.

  // elems must be an array of TYPE objects, if signature is not provided, the array
  // must not be empty
  // signature must be non-empty string

  /**
   * @param {object} opts
   * @param {string} opts.signature
   * @param {TYPE[]} opts.elems - a colletion of elements (TYPE object)
   * @param {string|number|bigint} opts.vals - a collection of JavaScript values which could be converted to elements
   */
  constructor (...args) {
    super()
    /**
     * signature string
     * @type {string}
     */
    this.sig = ''

    /**
     * an array of TYPE object
     * @type {TYPE[]}
     */
    this.elems = []

    if (args.length === 1) {
      if (typeof args[0] === 'string') {
        this.constructBySignature(args[0])
        return
      } else if (Array.isArray(args[0])) {
        if (!args[0].every(e => e instanceof TYPE)) {
          throw new Error('elems contains non-TYPE object')
        }
        this.constructByElements(args[0])
        return
      }
    } else if (args.length === 2) {
      if (Array.isArray(args[0]) && typeof args[1] === 'string') {
        if (!args[0].every(e => e instanceof TYPE)) {
          console.log(args[0])
          throw new Error('elems contains non-TYPE object')
        }
        this.constructByElements(args[0], args[1])
        return
      } else if (typeof args[0] === 'string' && Array.isArray(args[1])) {
        if (!args[1].every(e => !(e instanceof TYPE))) {
          throw new Error('elems contains TYPE object')
        }

        throw new Error('breaking change')

        log('constructByValues', this.constructor.name, args[0], args[1])

        this.constructByValues(args[0], args[1])
        return
      }
    }
    throw new Error('bad arg number')
  }

  // intended for unmarshalling
  /**
   * @param
   */
  constructBySignature (sig) {
    throw new Error('virtual method')
  }

  // sig is optional
  constructByElements (elems, sig) {
    throw new Error('virtual method')
  }

  // sig is mandatory
  constructByValues (vals, sig) {
    throw new Error('virtual method')
  }

  signature () {
    return this.sig
  }

  eval () {
    return this.elems.map(elem => elem.eval())
  }

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
 * An array contains a collection of objects of the same type
 */
class ARRAY extends CONTAINER_TYPE {
  constructBySignature (sig) {
    if (sig[0] !== 'a') {
      throw new Error('not an ARRAY signature')
    }
    this.sig = sig
    this.esig = this.sig.slice(1)
    this.elems = []
  }

  constructByElements (elems, sig) {
    if (elems.length === 0) {
      return this.constructBySignature(sig)
    } else {
      const esig = elems[0].signature()
      if (!elems.every(e => e.signature() === esig)) {
        throw new Error('ARRAY elements must have the same signature')
      } else if (sig && esig !== sig.slice(1)) {
        throw new Error('ARRAY elements do not match given signature')
      }
      this.elems = elems
      this.esig = esig
      this.sig = 'a' + esig
    }
  }

  constructByValues (sig, vals) {
    this.sig = sig
    this.esig = sig.slice(1)
    this.elems = vals.map(v => new TYPE(this.esig, v))
  }

  eval () {
    if (this.esig[0] === '{') {
      const obj = { type: 'dict' }

      // const map = new Map()
      this.elems.forEach(elem => {
        // map.set(elem.elems[0].eval(), elem.elems[1].eval())

        obj[elem.elems[0].eval()] = elem.elems[1].eval()
      })
      // return map

      return obj
    } else {
      // return this.elems.map(elem => elem.eval())

      return { array: this.elems.map(elem => elem.eval()) }
    }
  }

  // return offset TODO elem align refactor
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
      buf.writeUInt32LE(num, numOffset)
    } else {
      buf.writeUInt32BE(num, numOffset)
    }

    $less()
    logm($, '}', `@${offset}, num: ${num}, ${this.elems.length} element(s)`)
    return offset
  }

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

  push (elem) {
    if (elem.signature() !== this.esig) throw new Error('signature mismatch')
    this.elems.push(elem)
    return this
  }
}

// no container header, accept list of single complete types
class STRUCT extends CONTAINER_TYPE {
  constructBySignature (sig) {
    if (!/^\(.+\)$/.test(sig)) throw new Error('invalid STRUCT signature')
    this.esigs = split(sig.slice(1, sig.length - 1))
    this.sig = sig
    this.elems = []
  }

  constructByElements (elems, sig) {
    if (sig) {
      this.constructBySignature(sig)
      elems.forEach(e => this.push(e))
    } else {
      this.elems = elems
      this.esigs = this.elems.map(e => e.signature())
      this.sig = '(' + this.esigs.join('') + ')'
    }
  }

  constructByValues (sig, values) {
    throw new Error('not implemented, yet')
  }

  eval () {
    return this.elems.map(elem => elem.eval())
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

  push (elem) {
    if (this.elems.length >= this.esigs.length) throw new Error('elems full')
    if (elem.signature() !== this.esigs[this.elems.length]) {
      throw new Error('signature mismatch')
    }
    this.elems.push(elem)
    return this
  }
}

class DICT_ENTRY extends STRUCT {
  constructBySignature (sig) {
    if (!/^\{.+\}$/.test(sig)) throw new Error('invalid DICT_ENTRY signature')
    const esigs = split(sig.slice(1, sig.length - 1))
    if (esigs.length !== 2) {
      throw new Error('dict entry requires exactly two elements as key value')
    } else if (!basicTypeCodes.includes(esigs[0])) {
      throw new Error('dict entry key must be of a basic type')
    }
    this.esigs = esigs
    this.sig = sig
    this.elems = []
  }

  // partial construction allowed if sig provided
  constructByElements (elems, sig) {
    if (sig) {
      this.constructBySignature(sig)
      elems.forEach(e => this.push(e))
    } else {
      if (elems.length !== 2) {
        throw new Error('dict entry requires exactly two elements as key-value')
      } else if (!basicTypeCodes.includes(elems[0].signature())) {
        throw new Error('dict entry key must be of a basic type')
      }

      this.esigs = elems.map(e => e.signature())
      this.sig = '{' + this.esigs.join('') + '}'
      this.elems = elems
    }
  }

  constructByValues (sig, values) {
    if (!/^\{.+\}$/.test(sig)) {
      throw new Error('invalid DICT_ENTRY signature')
    }

    this.sig = sig
    const esigs = split(sig.slice(1, sig.length - 1))
    if (values.length !== 2 || esigs.length !== 2) {
      throw new Error('dict entry requires exactly two elements as key value')
    }

    this.esigs = esigs
    this.elems = [
      new TYPE(esigs[0], values[0]),
      new TYPE(esigs[1], values[1])
    ]
  }

  eval () {
    return Object.assign([this.elems[0].eval(), this.elems[1].eval()], {
      sig: this.signature()
    })
  }
}

// VARIANT accept only elements arg
class VARIANT extends CONTAINER_TYPE {
  // new VARIANT() -> construct by signature
  // new VARIANT(TYPE) -> construct by elements
  // new VARIANT(esig, non-TYPE) -> construct by value ???
  constructor (...args) {
    if (args.length === 0) {
      super('v')
    } else {
      if (args.length === 1) {
        if (args[0] === 'v') {
          super('v')
        } else {
          super([args[0]], 'v')
        }
      } else {
        super(...args)
      }
    }
  }

  // sig is always 'v'
  constructBySignature (sig) {
    this.sig = sig
    this.esigs = []
    this.elems = []
  }

  // ???
  constructByElements ([elem], sig) {
    this.elems = [new SIGNATURE(elem.signature()), elem]
    this.esigs = this.elems.map(elem => elem.signature())
    this.sig = sig
  }

  constructByValues (sig, vals) {
    if (sig !== 'v') {
      throw new Error('invalid signature')
    } else if (vals.length !== 2) {
      throw new Error('VARIANT reqruires exactly two values as signature and value')
    }
    this.sig = 'v'
    this.elems = [new SIGNATURE(vals[0]), new TYPE(vals[0], vals[1])]
    this.esigs = this.elems.map(elem => elem.signature())
  }

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

  eval () {
    return {
      type: 'variant',
      value: this.elems[1].eval()
    }
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
assign(STRUCT, { code: '(', align: 8 })
assign(DICT_ENTRY, { code: '{', align: 8 })
assign(VARIANT, { code: 'v', align: 1 })

TYPE.prototype._map = {
  y: BYTE,
  n: INT16,
  q: UINT16,
  i: INT32,
  u: UINT32,
  b: BOOLEAN,
  h: UNIX_FD,
  x: INT64,
  t: UINT64,
  d: DOUBLE,
  s: STRING,
  o: OBJECT_PATH,
  g: SIGNATURE,
  a: ARRAY,
  '(': STRUCT,
  '{': DICT_ENTRY,
  v: VARIANT
}

module.exports = {
  LITTLE,
  BIG,
  TYPE,
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
  CONTAINER_TYPE,
  ARRAY,
  STRUCT,
  DICT_ENTRY,
  VARIANT
}
