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
    expect(UINT16.prototype._code).to.equal('q')
    expect(UINT16.prototype._align).to.equal(2)
    expect(UINT16.prototype._size).to.equal(2)
    expect(UINT16.prototype._sign).to.equal(false)
    expect(UINT16.prototype._bits).to.equal(16)
    done()
  })
})
