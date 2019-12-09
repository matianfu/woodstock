const path = require('path')
const expect = require('chai').expect

const {
  LITTLE, BIG, 
  TYPE, BYTE, BOOLEAN, INT16, UINT16, INT32, UINT32, INT64, UINT64,
  DOUBLE, UNIX_FD, STRING, OBJECT_PATH, SIGNATURE, ARRAY, STRUCT,
  DICT_ENTRY, VARIANT
} = require('src/types')

// 0 to 18446744073709551615
const low = 0n
const high = 18446744073709551615n

describe(path.basename(__filename), () => {
  it.skip('static INT32 properties', () => {
    throw 'not implemented'
  })
  
  it('UINT64 constructed without value should have no value', () => 
    expect(Object.prototype.hasOwnProperty(new UINT64(), 'value')).to.equal(false))

  it('Constructing UINT64 with true should throw TypeError', () => 
    expect(() => new UINT64(true)).to.throw(TypeError))

  it('Constructing UINT64 with 1.1 should throw TypeError', () => 
    expect(() => new UINT64(1.1)).to.throw(TypeError))

  it('Constructing UINT64 with 0 should have 0n as value', () =>
    expect(new UINT64(0).value).to.equal(0n))

  it(`Constructing UINT64 with ${low - 1n} should throw RangeError`, () =>
    expect(() => new UINT64(low - 1n)).to.throw(RangeError))

  it(`Constructing UINT64 with ${low} should succeed`, () => 
    expect(new UINT64(low).value).to.equal(low))

  it(`Constructing UINT64 with ${high} should succeed`, () =>
    expect(new UINT64(high).value).to.equal(high))

  it(`Constructing UINT64 with ${high + 1n} should throw RangeError`, () => 
    expect(() => new UINT64(high + 1n)).to.throw(RangeError))
})
