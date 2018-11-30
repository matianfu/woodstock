const EventEmitter = require('events')

/**
const OFFSET_ENDIANNESS = 0
const OFFSET_MESSAGE_TYPE = 1 
const OFFSET_FLAGS 
const OFFSET_BODY_LENGTH
const OFFSET_HEADER_LENGTH

class Parser extends EventEmitter {

  constructor () {
    this.data = Buffer.alloc(0)
  } 

  push (data) {
    this.data = Buffer.concat(this.data, data)

    // yyyy u u a(yv) 
    while (this.data.length >= 4 + 4 + 4 + 8 
      && this.data.length < this.headerLength()
      && this.data.length < this.messageLength()) {
      this.parse()
    }
  }

  parse () {
    let message = {}
    message.type = this.type() 
    message.serial = this.serial()
    message.flags = this.flags()
    message.body = [] 

    
  }

  type () {
    return this.data.readUInt8(OFFST_MESSAGE_TYPE)
  }

  serial () {
    return this.endianness() === 'l'
      ? this.data.readUInt32LE(4 + 4)
      : this.data.readUInt32BE(4 + 4)
  }

  // return 'l' or 'B'
  endianness () {
    if (this.data.length < 1) {
      throw new Error('insufficient data to read endianness')
    }

    let x = this.data.slice(0, 1).toString()
    let h = this.data.slice(0, 1).toString('hex')
    if (x === 'l' || x === 'B') {
      return x
    } else {
      throw new Error(`invalid endianness ${h}`)
    }
  }

  headerLength () {
    if (data.length < 4 + 4 + 4 + 8) {
      throw new Error('insufficient data to read header length')
    }

    let arrLen = this.endianness() === 'l' 
      ? this.data.readUInt32LE(4 + 4 + 4)
      : this.data.readUInt32BE(4 + 4 + 4)

    if (arrLen % 8) {
      console.log('WARNING: header struct array length is not a multiple of 8')
    }

    return 4 + 4 + 4 + 8 + arrLen
  }

  bodyLength () {
    if (data.length < 4 + 4) {
      throw new Error('insufficient data to read body length')
    }

    return this.endianness() === 'l'
      ? this.data.readUInt32LE(4)
      : this.data.readUInt32BE(4)
    }
  }

  messageLength () {
    return this.headerLength() + this.bodyLength()
  }

}
*/

const unwire = (buf, start, end, sig, le = true) => {
  console.log(buf, start, end, sig, le)

  let xs = []
  
}

module.exports = unwire
