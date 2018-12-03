const debug = require('debug')

const logm = debug('marshal')
const logu = debug('unmarshal')

const { explode } = require('./sig')

let $width = 3
let $ = ''
let $more = () => $ = $ + ' '.repeat($width)
let $less = () => $ = $.slice($width)

/**
A TYPE object may or may not have a value.

There are basic type and containr type. The basic type has fixed type and string-like type as its sub-type.

All basic types can either be constructed by a

An object of basic type, or VARIANT type can be constructed with a value, or can be constructed with an empty object, which value is load by unmarshal method later.

An ARRAY, STRUCT, and DICT_ENTRY object can only be constructed as an empty object with signature. The elements can

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

All TYPE has:

All CONTAINER_TYPE has

*/

const basicTypeCodes = 'ybnqiuxtdsogh'.split('')

const round = (offset, modulo) => Math.ceil(offset / modulo) * modulo

// code, align and size decorator
// all types have code and alignment, only fixed types have size
// all integer based types have sign, either true or false,
// the upper bound and lower bound are calculated according to sign and bits
// if no sign, the bound check is skipped
const DEC = ({ code, align, size, sign, bits }) => type => {
  type.prototype._code = code
  type.prototype._align = align
  if (size) {
    type.prototype._size = size
    if (typeof sign === 'boolean') {
      type.prototype._sign = sign
      type.prototype._bits = bits
    }
  }
  return type
}

class TYPE {
  // all TYPE object has this method
  // CONTAINER_TYPE should override this method except for VARIANT
  signature () {
    return this._code
  }
}

// ANY common attribute besides dict_entry key?
class BASIC_TYPE extends TYPE {
  eval () {
    return this.value
  }
}

class FIXED_TYPE extends BASIC_TYPE {
  constructor (value) {
    super()
    if (value === undefined) {
    } else if (Number.isInteger(value)) {
      if (typeof this._sign === 'boolean') {
        let lower, upper
        switch (this._bits) {
          case 1:
            lower = 0
            upper = 1
            break
          case 8:
            lower = this._sign ? -0x80 : 0
            upper = this._sign ? 0x7f : 0xff
            break
          case 16:
            lower = this._sign ? -0x8000 : 0
            upper = this._sign ? 0x7fff : 0xffff
            break
          case 32:
            lower = this._sign ? -0x80000000 : 0
            upper = this._sign ? 0x7fffffff : 0xffffffff
            break
          default:
            throw new Error('invalid bits')
        }
        if (value < lower || value > upper) throw new Error('out of range')
      }
      this.value = value
    } else if (typeof value === 'bigint') {
      if (typeof this._sign !== 'boolean') throw new Error('no sign for bigint')
      let lower = this._sign ? -0x8000000000000000n : 0n
      let upper = this._sign ? 0x7fffffffffffffffn : 0xffffffffffffffffn
      if (value < lower || value > upper) throw new Error('out of range')
      this.value = value
    } else {
      throw new Error('invalid value type')
    }
  }

  marshal (buf, offset, le) {
    offset = round(offset, this._align)
    this._write(buf, offset, le)
    return offset + this._size
  }

  unmarshal (buf, offset, le) {
    let $0 = offset
    offset = round(offset, this._align)
    let $1 = offset
    this.value = this._read(buf, offset, le)
    offset += this._size

    logu($, this.constructor.name, `${$0}/${$1} to ${offset}, ${this.value}`)

    return offset
  }
}

const BYTE = DEC({ code: 'y', align: 1, size: 1, sign: false, bits: 8 })(
  class BYTE extends FIXED_TYPE {
    constructor (value) {
      if (typeof value === 'string' && value.length === 1) {
        value = Buffer.from(value)[0]
      }
      super(value)
    }

    _write (buf, offset, le) {
      buf.writeUInt8(this.value, offset)
    }

    _read (buf, offset, le) {
      return buf.readUInt8(offset)
    }
  })

const INT16 = DEC({ code: 'n', align: 2, size: 2, sign: true, bits: 16 })(
  class INT16 extends FIXED_TYPE {
    _write (buf, offset, le) {
      le ? buf.writeInt16LE(this.value, offset) : buf.writeInt16BE(this.value, offset)
    }

    _read (buf, offset, le) {
      return le ? buf.readInt16LE(offset) : buf.readInt16BE(offset)
    }
  })

const UINT16 = DEC({ code: 'q', align: 2, size: 2, sign: false, bits: 16 })(
  class UINT16 extends TYPE {
    _write (buf, offset, le) {
      le ? buf.writeUInt16LE(this.value, offset) : buf.writeUInt16BE(this.value, offset)
    }

    _read (buf, offset, le) {
      return le ? buf.readUInt16LE(offset) : buf.readUInt16BE(offset)
    }
  })

const INT32 = DEC({ code: 'i', align: 4, size: 4, sign: true, bits: 32 })(
  class INT32 extends FIXED_TYPE {
    _write (buf, offset, le) {
      le ? buf.writeUInt16LE(this.value, offset) : buf.writeUInt16BE(this.value, offset)
    }

    _read (buf, offset, le) {
      return le ? buf.readUInt16LE(offset) : buf.readUInt16BE(offset)
    }
  })

const UINT32 = DEC({ code: 'u', align: 4, size: 4, sign: false, bits: 32 })(
  class UINT32 extends FIXED_TYPE {
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
  })

const BOOLEAN = DEC({ code: 'b', align: 4, size: 4, sign: false, bits: 1 })(
  class BOOLEAN extends UINT32 {})

const UNIX_FD = DEC({ code: 'h', align: 4, size: 4, sign: false, bits: 32 })(
  class UNIX_FD extends UINT32 {})

const INT64 = DEC({ code: 'x', align: 8, size: 8, sign: true, bits: 64 })(
  class INT64 extends FIXED_TYPE {
    _write (buf, offset, le) {
      // TODO
    }

    _read (buf, offset, le) {
      // TODO
    }
  })

const UINT64 = DEC({ code: 't', align: 8, size: 8, sign: false, bits: 64 })(
  class UINT64 extends FIXED_TYPE {
    _write (buf, offset, le) {
    }

    _read (buf, offset, le) {
    }
  })

const DOUBLE = DEC({ code: 'd', align: 8, size: 8 })(
  class DOUBLE extends FIXED_TYPE {
    _write (buf, offset, le) {
      le ? buf.writeDoubleLE(this.value, offset) : buf.writeDoubleBE(this.value, offset)
    }

    _read (buf, offset, le) {
      return le ? buf.readDoubleLE(offset) : buf.readDoubleBE(offset)
    }
  })

class STRING_LIKE_TYPE extends BASIC_TYPE {
  constructor (value) {
    super()
    if (typeof value === 'string') {
      this.value = value
    } else if (value === undefined) {
    } else {
      console.log('###')
      console.log(value)
      console.log('###')
      throw new Error('value not a string')
    }
  }

  marshal (buf, offset, le) {
    let $0 = offset
    offset = round(offset, this._align)
    let $1 = offset

    this._write(buf, offset, le)
    offset += this._align // happens to be the same value
    buf.write(this.value, offset)
    offset += this.value.length
    buf.write('\0', offset)
    offset += 1

    logm($, this.constructor.name, `${$0}/${$1} to ${offset}, "${this.value}"`)
  
    return offset
  }

  unmarshal (buf, offset, le) {
    let d0 = offset
    offset = round(offset, this._align)
    let d1 = offset

    let strlen
    if (this._align === 1) {
      strlen = buf.readUInt8(offset)
    } else if (this._align === 4) {
      strlen = le ? buf.readUInt32LE(offset) : buf.readUInt32BE(offset)
    } else {
      throw new Error('invalid align for string')
    }
    offset += this._align
    this.value = buf.slice(offset, offset + strlen).toString()
    // skip null termination
    offset += strlen + 1

    logu($, this.constructor.name, `${d0}/${d1} to ${offset}, "${this.value}"`)

    return offset
  }
}

const STRING = DEC({ code: 's', align: 4 })(
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
  })

const OBJECT_PATH = DEC({ code: 'o', align: 4 })(
  class OBJECT_PATH extends STRING {
    constructor (value) {
      super(value)
    // TODO validate
    }
  })

const SIGNATURE = DEC({ code: 'g', align: 1 })(
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
      explode(this.value)
      return offset
    }
  })

// signature is a string, value is an array of TYPE object
// if signature is omitted, signature is generated automatically
// if value is omitted
class CONTAINER_TYPE extends TYPE {
  // new CONTAINER(elems)
  // new CONTAINER(signature)
  // new CONTAINER(elems, signature)
  // elems must be an array of TYPE objects, if signature is not provided, the array 
  // must not be empty
  // signature must be non-empty string
  constructor (...args) {
    super()
    if (args.length < 1 || args.length > 2) {
      throw new Error('bad arg number')
    }

    if (args.length === 1) {  // elems or signature
      if (Array.isArray(args[0])) { // elems
        if (!args[0].length) {
          throw new Error('elems must be non-empty array if signature not provided')
        }
        if (!args[0].every(e => e instanceof TYPE)) {
          throw new Error('elems contains non-TYPE object')
        }
        this.elems = args[0]
      } else if (typeof args[0] === 'string') {
        if (!args[0]) {
          throw new Errro('empty signature string')
        }
        this.elems = []
        this.sig = args[0]
      } else {
        if (args[0] instanceof TYPE) {
          throw new Error('TYPE object must be wrapped in ARRAY as elements')
        } else {
          throw new Error('neither elememt array nor signature')
        }
      }
    } else if (args.length === 2) {
      if (!Array.isArray(args[0])) {
        throw new Error('elems not an array')
      }
      if (!args[0].every(e => e instanceof TYPE)) {
        throw new Error('elems contains non-TYPE object')
      }
      this.elems = args[0]
      if (typeof args[1] !== 'string') {
        throw new Error('signature not a string')
      }
      if (!args[1]) {
        throw new Error('empty signature string')
      }
      this.sig = args[1]
    } 
  }

  signature () {
    return this.sig
  }

  marshal (buf, offset, le) {
    let $0 = offset
    offset = round(offset, this._align)
    let $1 = offset

    logm($, this.constructor.name, `${$0}/${$1}, {`) 
    $more()

    offset = this.elems.reduce((offset, el) =>
      el.marshal(buf, offset, le), round(offset, this._align))

    $less()
    logm($, '}', `@${offset}, ${this.elems.length} element(s)`)

    return offset
  }
}

// no container header, accept list of single complete types
const STRUCT = DEC({ code: '(', align: 8 })(
  class STRUCT extends CONTAINER_TYPE {
    constructor (...args) {
      super(...args)

      if (this.sig) {
        if (!this.testSignature(this.sig)) {
          throw new Error('bad signature')
        }
        this.esigs = explode(this.sig.slice(1, this.sig.length - 1))

        // rebuild elems array, validate element signature one-by-one
        if (this.elems.length) {
          let elems = this.elems
          this.elems = []
          elems.forEach(el => this.push(el))
        } 
      } else {
        // generate signature from elements
        this.esigs = this.elems.map(el => el.signature())
        this.sig = this.genSignature(this.esigs)
      }
    }

    testSignature (sig) {
      return /^\(.+\)$/.test(sig)    
    }

    genSignature (esigs) {
      return `(${esigs.join('')})`
    }

    unmarshal (buf, offset, le) {
      let d0 = offset
      offset = round(offset, this._align)
      let d1 = offset

      logu($, this.constructor.name, `${d0}/${d1} {`)
      $more()

      this.elems = []       
      this.esigs.forEach(sig => {
        let Type = typeMap[sig[0]].Type  
        let type
        if (Type.prototype instanceof CONTAINER_TYPE) {
          type = new Type(sig)
        } else {
          type = new Type()
        }
        offset = type.unmarshal(buf, offset, le) 
        this.elems.push(type)
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
    }
  })

const ARRAY = DEC({ code: 'a', align: 4 })(
  class ARRAY extends CONTAINER_TYPE {
    constructor (...args) {
      super(...args)
      if (this.sig) {
        if (this.sig[0] !== 'a') {
          throw new Error('not a ARRAY signature')
        }
        this.esig = this.sig.slice(1)
        if (this.elems.length) {
          if (!this.elems.every(el => el.signature() === this.esig)) {
            console.log('======')
            console.log(this.esig)
            console.log(this.elems.map(el => el.signature()))
            console.log(this.elems.map(el => el.constructor.name))
            console.log('======')
            throw new Error('elem signature mismatch')
          }
        } 
      } else {

        console.log(this.sig)
        console.log(this.elems)

        let sig0 = this.elems[0].signature()
        if (!this.elems.every(el => el.signature === sig0)) {
          throw new Error('elem signature mismatch')
        }
        this.esig = sig0
        this.sig = 'a' + sig0
      }
    }

    // return offset TODO elem align refactor
    marshal (buf, offset, le) {
      let $0 = offset
      offset = round(offset, 4)
      let $1 = offset

      let numOffset = offset
      offset += this._align
      offset = round(offset, typeMap[this.esig[0]].align)
      let elemOffset = offset

      logm($, this.constructor.name, 
        `${$0}/${$1}, num @ ${numOffset}, element[0] @ ${elemOffset} {`) 
      $more()

      offset = this.elems.reduce((offset, elem) =>
        elem.marshal(buf, offset, le), elemOffset)

      let num = offset - elemOffset
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
      let d0 = offset
      offset = round(offset, 4)
      let d1 = offset

      let num = le ? buf.readUInt32LE(offset) : buf.readUInt32BE(offset)
      let elemStart = round(offset, typeMap[this.esig[0]].align)
      offset = elemStart

      logu($, this.constructor.name, `${d0}/${d1}, n: ${num}, es: ${offset} {`)
      $more()

      while (offset < elemStart + num) {
        let code = this.esig[0]
        let Type = typeMap[code].Type  
        let type
        if (Type.prototype instanceof CONTAINER_TYPE) {
          type = new Type(this.esig)
        } else {
          type = new Type()
        }
        offset = type.unmarshal(buf, offset, le)
        this.elems.push(type)
      }

      $less()
      logu($, '}', `@ ${offset}, ${this.elems.length} element(s)`)

      return elemStart + num
    }

    push (elem) {
      if (elem.signature() !== this.esig) throw new Error('signature mismatch')
      this.elems.push(elem)
    }
  })

const VARIANT = DEC({ code: 'v', align: 1 })(
  // VARIANT accept only elements arg
  class VARIANT extends CONTAINER_TYPE {
    constructor (elem) {
      if (elem === 'v') {
        super('v')
      } else {
        super([elem], 'v')
      }

      if (this.elems.length) {
        this.esig = this.elems[0].signature()
        this.elems.unshift(new SIGNATURE(this.esig))
      }
    }

    unmarshal (buf, offset, le) {
      this.elems = []

      let d0 = offset

      logu($, this.constructor.name, `${d0}/${d0} {`)
      $more()

      let e0 = new SIGNATURE() 
      offset = e0.unmarshal(buf, offset, le)
      this.elems.push(e0)
      this.esig = e0.value

      let Type = typeMap[this.esig[0]].Type 
      let type
      if (Type.prototype instanceof CONTAINER_TYPE) {
        type = new Type(this.esig)
      } else {
        type = new Type()
      }
      offset = type.unmarshal(buf, offset, le)
      this.elems.push(type)

      $less()
      logu($, '}', `@ ${offset}, ${this.elems.length} elements`)

      return offset
    }
  })

const DICT_ENTRY = DEC({ code: '{', align: 8 })(
  class DICT_ENTRY extends STRUCT {

    constructor (...args) {
      super(...args)
      if (this.esigs.length !== 2) {
        throw new Error('dict entry requires exactly two elements as key value pair')
      }

      if (!basicTypeCodes.includes(this.esigs[0])) {
        throw new Error('dict entry key must be of a basic type')
      }
    }

    testSignature (sig) {
      return /^\{.+\}$/.test(sig)    
    }

    genSignature (esigs) {
      return `{${esigs.join('')}}`
    }
  })

const typeMap = {
  y: { Type: BYTE, align: 1 },
  b: { Type: BOOLEAN, align: 4 },
  n: { Type: INT16, align: 2 },
  q: { Type: UINT16, align: 2 },
  i: { Type: INT32, align: 4 },
  u: { Type: UINT32, align: 4 },
  x: { Type: INT64, align: 8 },
  t: { Type: UINT64, align: 8 },
  d: { Type: DOUBLE, align: 8 },
  s: { Type: STRING, align: 4 },
  o: { Type: OBJECT_PATH, align: 4 },
  g: { Type: SIGNATURE, align: 1 },
  a: { Type: ARRAY, align: 4 },
  '(': { Type: STRUCT, align: 8 },
  v: { Type: VARIANT, align: 1 },
  '{': { Type: DICT_ENTRY, align: 8 },
  h: { Type: UNIX_FD, align: 4 }
}

module.exports = {
  LITTLE: Buffer.from('l')[0],
  BIG: Buffer.from('B')[0],
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
  STRUCT,
  ARRAY,
  VARIANT,
  DICT_ENTRY
}
