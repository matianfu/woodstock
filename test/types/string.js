const path = require('path')
const expect = require('chai').expect

const {
  LITTLE, BIG,
  TYPE, BYTE, BOOLEAN, INT16, UINT16, INT32, UINT32, INT64, UINT64,
  DOUBLE, UNIX_FD, STRING, OBJECT_PATH, SIGNATURE, ARRAY, STRUCT,
  DICT_ENTRY, VARIANT
} = require('src/types')

describe(path.basename(__filename), () => {
  it('construct STRING with undefined is ALLOWED is problematic !!!', done => {
    const x = new STRING()
    done()
  })
})
