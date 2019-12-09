const path = require('path')
const expect = require('chai').expect

const {
  LITTLE, BIG, 
  TYPE, BYTE, BOOLEAN, INT16, UINT16, INT32, UINT32, INT64, UINT64,
  DOUBLE, UNIX_FD, STRING, OBJECT_PATH, SIGNATURE, ARRAY, STRUCT,
  DICT_ENTRY, VARIANT
} = require('src/types')

// unsigned int32 -2,147,483,648 to 2,147,483,647

describe(path.basename(__filename), () => {
  it.skip('static INT32 properties', () => {
    throw 'not implemented'
  })

  it('INT32 constructed without value should have no value', () => 
    expect(Object.prototype.hasOwnProperty(new INT32(), 'value')).to.equal(false))

  it('Constructing INT32 with true should throw TypeError', () => 
    expect(() => new INT32(true)).to.throw(TypeError))

  it('Constructing INT32 with 1.1 should throw TypeError', () => 
    expect(() => new INT32(1.1)).to.throw(TypeError))

  it('Constructing INT32 with 0', () => expect(new INT32(0).value).to.equal(0))

  it('Constructing INT32 with -2^31', () => {
    const value = -Math.pow(2, 31)
    expect(new INT32(value).value).to.equal(value)
  })

  it('Constructing INT32 with -2^31 - 1 should throw RangeError', () => {
    const value = -Math.pow(2, 31) - 1
    expect(() => new INT32(value)).to.throw(RangeError)
  })

  it('Constructing INT32 with 2^31 should throw RangeError', () => {
    const value = Math.pow(2, 31)
    expect(() => new INT32(value)).to.throw(RangeError)
  })

  it('Constructing INT32 with 2^31 - 1', () => {
    const value = Math.pow(2, 31) - 1
    expect(new INT32(value).value).to.equal(value)
  })
})
