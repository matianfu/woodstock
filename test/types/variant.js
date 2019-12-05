const path = require('path')
const expect = require('chai').expect 

const {
  LITTLE, BIG, 
  TYPE, BYTE, BOOLEAN, INT16, UINT16, INT32, UINT32, INT64, UINT64,
  DOUBLE, UNIX_FD, STRING, OBJECT_PATH, SIGNATURE, ARRAY, STRUCT,
  DICT_ENTRY, VARIANT
} = require('src/types')

describe(path.basename(__filename), () => {
  it('constructs a variant containing a string', done => {
    const buf = Buffer.alloc(32)

    const a = new VARIANT(new STRING('hello'))
    a.marshal(buf, 0, true)

    const b = new VARIANT()
    b.unmarshal(buf, 0, true)

    expect(a).to.deep.equal(b)

    done()
  })
})

