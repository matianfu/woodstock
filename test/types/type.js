const path = require('path')
const expect = require('chai').expect

const {
  LITTLE, BIG,
  TYPE, BYTE, BOOLEAN, INT16, UINT16, INT32, UINT32, INT64, UINT64,
  DOUBLE, UNIX_FD, STRING, OBJECT_PATH, SIGNATURE, ARRAY, STRUCT,
  DICT_ENTRY, VARIANT
} = require('src/types')

describe(path.basename(__filename), () => {
  it.skip('verify prototyp._map', done => {
    expect(TYPE.prototype._map).to.deep.equal({
      y: BYTE,
      n: INT16,
      q: UINT16,
      i: INT32,
      u: UINT32,
      b: BOOLEAN,
      h: UNIX_FD,
      x: INT64,
      t: UINT64,
      d: DOUBLE,
      s: STRING,
      o: OBJECT_PATH,
      g: SIGNATURE,
      a: ARRAY,
      '(': STRUCT,
      '{': DICT_ENTRY,
      v: VARIANT
    })
    done()
  })
})
