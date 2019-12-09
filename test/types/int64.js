const path = require('path')
const expect = require('chai').expect

const {
  LITTLE, BIG, 
  TYPE, BYTE, BOOLEAN, INT16, UINT16, INT32, UINT32, INT64, UINT64,
  DOUBLE, UNIX_FD, STRING, OBJECT_PATH, SIGNATURE, ARRAY, STRUCT,
  DICT_ENTRY, VARIANT
} = require('src/types')

// -9223372036854775808 to 9223372036854775807
const low = -9223372036854775808n
const high = 9223372036854775807n

describe(path.basename(__filename), () => {
  it.skip('static INT32 properties', () => {
    throw 'not implemented'
  })

  it('INT64 constructed without value should have no value', () =>
    expect(Object.prototype.hasOwnProperty(new INT64(), 'value')).to.equal(false))

  it('Constructing INT64 with true should throw TypeError', () =>
    expect(() => new INT64(true)).to.throw(TypeError))

  it('Constructing INT64 with 1.1 should throw TypeError', () => 
    expect(() => new INT64(1.1)).to.throw(TypeError))

  it('Constructing INT64 with 0 should have 0n as value', () =>
    expect(new INT64(0).value).to.equal(0n))

  it(`Constructing INT64 with ${low - 1n} should throw RangeError`, () => 
    expect(() => new INT64(low - 1n)).to.throw(RangeError))

  it(`Constructing INT64 with ${low} should succeed`, () =>
    expect(new INT64(low).value).to.equal(low))

  it(`Constructing INT64 with ${high} should succeeed`, () =>
    expect(new INT64(high).value).to.equal(high))

  it(`Constructing INT64 with ${high + 1n} should throw RangeError`, () => 
    expect(() => new INT64(high + 1n)).to.throw(RangeError))
})


