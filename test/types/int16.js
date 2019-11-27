const path = require('path')
const expect = require('chai').expect

const {
  LITTLE, BIG, 
  TYPE, BYTE, BOOLEAN, INT16, UINT16, INT32, UINT32, INT64, UINT64,
  DOUBLE, UNIX_FD, STRING, OBJECT_PATH, SIGNATURE, ARRAY, STRUCT,
  DICT_ENTRY, VARIANT
} = require('src/dbus-types')

describe(path.basename(__filename), () => {
  it('static INT16 properties', done => {
    expect(INT16.prototype._code).to.equal('n')
    expect(INT16.prototype._align).to.equal(2)
    expect(INT16.prototype._size).to.equal(2)
    expect(INT16.prototype._sign).to.equal(true)
    expect(INT16.prototype._bits).to.equal(16)
    done()
  })

  it('INT16 constructed w/o value should have no value', done => {
    const i = new INT16()
    expect(i.hasOwnProperty('value')).to.be.false
    done()
  })

  it('construct INT16 with 0', done => {
    const i = new INT16(0)
    expect(i.value).to.equal(0)
    done()
  })

  it('construct INT16 with 32767', done => {
    const i = new INT16(32767)
    expect(i.value).to.equal(32767)
    done()
  })

  it('constructing INT16 with 32768 throws RangeError', done => {
    expect(() => new INT16(32768)).to.throw(RangeError)
    done()
  })

  it('construct INT16 with -32768', done => {
    const i = new INT16(-32768)
    expect(i.value).to.equal(-32768)
    done()
  })

  it('constructing INT16 with -32769 throws RangeError', done => {
    expect(() => new INT16(-32769)).to.throw(RangeError)
    done()
  })

 
})

