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
    expect(ARRAY.prototype.code).to.equal('a')
    expect(ARRAY.prototype.align).to.equal(4)
    done()
  })

  it('Constructing an ARRAY with true should throw TypeError', () =>
    expect(() => new ARRAY(true)).to.throw(TypeError)) 

  it('Constructing an ARRAY with "true" should throw RangeError', () => 
    expect(() => new ARRAY('true')).to.throw(RangeError))

  it('Constructing an ARRAY with "ao" should succeed', () => {
    expect(Object.assign({}, new ARRAY('ao')))
      .to.deep.equal({ sig: 'ao', esig: 'o', elems: [] })
  })

  it('Constructing an ARRAY with "a" should throw RangeError', () =>
    expect(() => new ARRAY('a')).to.throw(RangeError))

  it('Constructing an ARRAY with "b" should throw RangeError', () =>
    expect(() => new ARRAY('b')).to.throw(RangeError))

  it('Constructing an ARRAY with "aoo" shold throw RangeError', () =>
    expect(() => new ARRAY('aoo')).to.throw(RangeError))

  it('Constructing an ARRAY with empty array should throw Error', () => 
    expect(() => new ARRAY([])).to.throw(Error))

  it('Constructing an ARRAY with different TYPE should throw Error', () =>
    expect(() => new ARRAY([
      new INT16(0),
      new UINT16(0)
    ])).to.throw(Error))

  it('Constructing an ARRAY with string array should succeed', () => {
    const arr = new ARRAY('as', ['foo', 'bar'])
    expect(arr.elems[0] instanceof STRING)
    expect(arr.elems[0].value).to.equal('foo')
    expect(arr.elems[1] instanceof STRING)
    expect(arr.elems[1].value).to.equal('bar')
  })

  it('STRING ARRAY should eval to number array', () =>  {
    const arr = new ARRAY('as', [new STRING('foo'), new STRING('bar')])
    expect(arr.eval()).to.deep.equal(['foo', 'bar'])
  }) 

  it('DICT with string key should eval to JavaScript object', () => {
    const arr = new ARRAY([
      new DICT_ENTRY([new STRING('hello'), new STRING('world')]),
      new DICT_ENTRY([new STRING('foo'), new STRING('bar')])
    ])
    expect(arr.eval()).to.deep.equal({ hello: 'world', foo: 'bar' })
  })

  it('DICT with byte key should eval to JavaScript map', () => {
    const arr = new ARRAY([
      new DICT_ENTRY([new BYTE(1), new STRING('world')]),
      new DICT_ENTRY([new BYTE(2), new STRING('bar')])
    ])

    const map = arr.eval()

    expect(map).to.be.an.instanceof(Map)
    expect(map.get(1)).to.equal('world')
    expect(map.get(2)).to.equal('bar')
  })
})
