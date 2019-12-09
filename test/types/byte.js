const path = require('path')
const expect = require('chai').expect

const {
  LITTLE, BIG, 
  TYPE, BYTE, BOOLEAN, INT16, UINT16, INT32, UINT32, INT64, UINT64,
  DOUBLE, UNIX_FD, STRING, OBJECT_PATH, SIGNATURE, ARRAY, STRUCT,
  DICT_ENTRY, VARIANT
} = require('src/types')

describe(path.basename(__filename), () => {
  it('static BYTE properties', done => {
    expect(BYTE.prototype.code).to.equal('y')
    expect(BYTE.prototype.align).to.equal(1)
    expect(BYTE.prototype.size).to.equal(1)
    done()
  })

  it('BYTE constructed without value should have no value', done => {
    const b = new BYTE()
    expect(b.hasOwnProperty('value')).to.be.false
    done()
  })

  it('construct BYTE with 0', done => {
    const b = new BYTE(0)
    expect(b.value).to.equal(0)
    done()
  })

  it('construct BYTE with 255', done => {
    const b = new BYTE(255)
    expect(b.value).to.equal(255)
    done()
  })

  it('construct BYTE with "l"', done => {
    const b = new BYTE('l')
    expect(b.value).to.equal(108)
    done()
  })

  it('construct BYTE with 256 should throw RangeError', done => {
    expect(() => new BYTE(256)).to.throw(RangeError)
    done()
  })

  it('construct BYTE with {} should throw TypeError', done => {
    expect(() => new BYTE({})).to.throw(TypeError)
    done()
  }) 

  it('marshalling 255 at buffer[0]', done => {
    const b = new BYTE(255)
    const buf = Buffer.alloc(2)
    const offset = b.marshal(buf, 0)
    expect(buf[0]).to.equal(255)
    expect(offset).to.equal(1)
    done()
  })

  it('marshalling 255 at buffer[1]', done => {
    const b = new BYTE(255)
    const buf = Buffer.alloc(2)
    const offset = b.marshal(buf, 1)
    expect(buf[1]).to.equal(255)
    expect(offset).to.equal(2)
    done()
  })

  it('marshalling 255 at buffer[buffer.length] throws RangeError', done => {
    const b = new BYTE(255)
    const buf = Buffer.alloc(2)
    expect(() => b.marshal(buf, 2)).to.throw(RangeError)
    done()
  })

  it('unmarshalling 255 at buffer[0]', done => {
    const b = new BYTE()
    const buf = Buffer.from([255, 0])
    const offset = b.unmarshal(buf, 0)
    expect(b.value).to.equal(255)
    expect(offset).to.equal(1)
    done()
  })

  it('unmarshalling 255 at buffer[1]', done => {
    const b = new BYTE()
    const buf = Buffer.from([0, 255])
    const offset = b.unmarshal(buf, 1)
    expect(b.value).to.equal(255)
    expect(offset).to.equal(2)
    done()
  })

  it('unmarshalling at buffer[buffer.length] throws RangeError', done => {
    const b = new BYTE()
    const buf = Buffer.from([255, 255])
    expect(() => b.unmarshal(buf, 2)).to.throw(RangeError)
    done()
  })
})
