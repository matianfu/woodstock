const path = require('path')
const expect = require('chai').expect

const {
  LITTLE, BIG,
  TYPE, BYTE, BOOLEAN, INT16, UINT16, UINT32, INT64, UINT64,
  DOUBLE, UNIX_FD, STRING, OBJECT_PATH, SIGNATURE, ARRAY, STRUCT,
  DICT_ENTRY, VARIANT
} = require('src/types')

describe(path.basename(__filename), () => {
  it.skip('static UINT32 properties', () => {
    throw 'not implemented'
  })

  it('UINT32 constructed without value should have no value', () =>
    expect(Object.prototype.hasOwnProperty(new UINT32(), 'value')).to.equal(false))

  it('Constructing UINT32 with true should throw TypeError', () =>
    expect(() => new UINT32(true)).to.throw(TypeError))

  it('Constructing UINT32 with 1.1 should throw TypeError', () =>
    expect(() => new UINT32(1.1)).to.throw(TypeError))

  it('Constructing UINT32 with 0', () => expect(new UINT32(0).value).to.equal(0))

  it('Constructing UINT32 with -1 should throw RangeError', () =>
    expect(() => new UINT32(-1)).to.throw(RangeError))

  it('Constructing UINT32 with 2^32 should throw RangeError', () => {
    const value = Math.pow(2, 32)
    expect(() => new UINT32(value)).to.throw(RangeError)
  })

  it('Constructing UINT32 with 2^32 - 1', () => {
    const value = Math.pow(2, 32) - 1
    expect(new UINT32(value).value).to.equal(value)
  })
})
