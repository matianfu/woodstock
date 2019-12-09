const path = require('path')
const expect = require('chai').expect

const {
  LITTLE, BIG,
  TYPE, BYTE, BOOLEAN, INT16, UINT16, INT32, UINT32, INT64, UINT64,
  DOUBLE, UNIX_FD, STRING, OBJECT_PATH, SIGNATURE, ARRAY, STRUCT,
  DICT_ENTRY, VARIANT
} = require('src/types')

describe(path.basename(__filename), () => {
  it('static INT16 properties', done => {
    expect(UINT16.prototype.code).to.equal('q')
    expect(UINT16.prototype.align).to.equal(2)
    expect(UINT16.prototype.size).to.equal(2)
    done()
  })

  it('UINT16 constructed without value should have no value', () => 
    expect(Object.prototype.hasOwnProperty.call(new UINT16(), 'value')).to.equal(false))

  it('construct UINT16 with true should throw TypeError', () =>
    expect(() => new UINT16(true)).to.throw(TypeError))

  it('construct UINT16 with 0', () => 
    expect(new UINT16(0).value).to.equal(0))

  it('construct UINT16 with 65535', () => 
    expect(new UINT16(65535).value).to.equal(65535))

  it('construct UINT16 with -1 should throw RangeError', () =>
    expect(() => new UINT16(-1)).to.throw(RangeError))

  it('construct UINT16 with 65536 should throw RangeError', () => 
    expect(() => new UINT16(65536)).to.throw(RangeError))
})
