const path = require('path')
const expect = require('chai').expect 

const {
  LITTLE, BIG, 
  TYPE, BYTE, BOOLEAN, INT16, UINT16, INT32, UINT32, INT64, UINT64,
  DOUBLE, UNIX_FD, STRING, OBJECT_PATH, SIGNATURE, ARRAY, STRUCT,
  DICT_ENTRY, VARIANT
} = require('src/types')

describe(path.basename(__filename), () => {
  it('static ARRAY properties', done => {
    expect(ARRAY.prototype._code).to.equal('a')
    expect(ARRAY.prototype._align).to.equal(4)
    done()
  })

  it('constructing an empty array', done => {
    const arr = new ARRAY('a')
    // TODO
    done()
  }) 
})
