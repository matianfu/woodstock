const path = require('path')

const chai = require('chai')
const expect = chai.expect

const normalize = require('src/interface')

describe(path.basename(__filename), () => {
  it('throws TypeError not an object for "hello"', done => {
    const f = () => normalize('hello') 
    expect(f).to.throw(TypeError, 'not an object')
    done()
  })

  it('throws RangeError if iface.name not defined', done => {
    const f = () => normalize({})
    expect(f).to.throw(RangeError, 'name not defined')
    done()
  })

  it('throws TypeError if iface.name is true', done => {
    const f = () => normalize({ name: true })
    expect(f).to.throw(TypeError, 'name not a string')
    done()
  })

  it('throws TypeError if iface.methods is true', done => {
    const f = () => normalize({ name: 'a', methods: true })
    expect(f).to.throw(TypeError, 'methods not an array')
    done()
  })

  it('throws TypeError if method.name not defined', done => {
    const f = () => normalize({
      name: 'a', methods: [{}]
    })
    expect(f).to.throw(RangeError, 'method name not defined')
    done()
  })

  it('throws TypeError if method.name is true', done => {
    const f = () => normalize({
      name: 'a',
      methods: [{ name: true }]
    })
    expect(f).to.throw(TypeError, 'method name not a string')
    done()
  })

  it('thorws TypeError if method args is true', done => {
    const f = () => normalize({
      name: 'a',
      methods: [{ name: 'a', args: true }]
    })
    expect(f).to.throw(TypeError, 'method args not an array')
    done()
  })

  it('throws TypeError if iface.properties is true', done => {
    const f = () => normalize({ name: 'a', properties: true })
    expect(f).to.throw(TypeError, 'properties not an array')
    done()
  })

  it('throws TypeError if iface.signals is true', done => {
    const f = () => normalize({ name: 'a', signals: true })
    expect(f).to.throw(TypeError, 'signals not an array')
    done()
  })
})
