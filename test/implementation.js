const path = require('path')

const chai = require('chai')
const expect = chai.expect

const { TYPE, STRING, BYTE } = require('src/types')
const normalize = require('src/interface')
const validate = require('src/implementation')

describe(path.basename(__filename), () => {
  let f
  it('TypeError "interface not an object" if it is "hello"', done => {
    f = () => validate('hello', {})
    expect(f).to.throw(TypeError, 'interface not an object')
    done()
  })

  it('TypeError "implementation not an object" if it is "world"', done => {
    f = () => validate({}, 'world')
    expect(f).to.throw(TypeError, 'implementation not an object')
    done()
  })

  // TypeError method not implemented
  // optional method not implemented is allowed
  // TypeError method not a function
  //  - optional true
  //  - optional false
  // TypeError property not implemented
  // TypeError property not a TYPE object
  // TypeError property type mismatch (wrong signature)

  it('Error "method foo not defined" if foo is required and undefined',
    done => {
      const iface = normalize({
        name: 'hello',
        methods: [{ name: 'foo' }]
      })
      const impl = { interface: 'hello', name: 'default' }

      const f = () => validate(iface, impl)
      expect(f).to.throw(Error, 'method foo not defined')
      done()
    })

  it('TypeError "method foo not a function" if foo is required and set to true',
    done => {
      const iface = normalize({
        name: 'hello',
        methods: [{ name: 'foo' }]
      })
      const impl = { interface: 'hello', name: 'default', foo: true }

      const f = () => validate(iface, impl)
      expect(f).to.throw(TypeError, 'method foo not a function')
      done()
    })

  it('method foo undefined is allowed if it is optional', done => {
    const iface = normalize({
      name: 'hello',
      methods: [{ name: 'foo', optional: true }]
    })

    const impl = { interface: 'hello', name: 'default' }
    validate(iface, impl)
    done()
  })

  it('TypeError "method foo not a function" if foo is optional and set to true',
    done => {
      const iface = normalize({
        name: 'hello',
        methods: [{ name: 'foo', optional: true }]
      })
      const impl = { interface: 'hello', name: 'default', foo: true }

      const f = () => validate(iface, impl)
      expect(f).to.throw(TypeError, 'method foo not a function')
      done()
    })

  it('Error "property bar not defined" if bar is undefined and required',
    done => {
      const iface = normalize({
        name: 'hello',
        properties: [{
          name: 'bar',
          type: 's',
          access: 'read'
        }]
      })
      const impl = { interface: 'hello', name: 'default' }

      const f = () => validate(iface, impl)
      expect(f).to.throw(Error, 'property bar not defined')
      done()
    })

  it('OK if bar is undefined and optional', done => {
    const iface = normalize({
      name: 'hello',
      properties: [{
        name: 'bar',
        type: 's',
        access: 'read',
        optional: true
      }]
    })
    const impl = { interface: 'hello', name: 'default' }
    validate(iface, impl)
    done()
  })

  it('TypeError "property bar not a TYPE object" ' +
    'if bar is required and set to true', done => {
    const iface = normalize({
      name: 'hello',
      properties: [{
        name: 'bar',
        type: 's',
        access: 'read'
      }]
    })
    const impl = { interface: 'hello', name: 'default', bar: true }
    const f = () => validate(iface, impl)
    expect(f).to.throw(TypeError, 'property bar not a TYPE object')
    done()
  })

  it('TypeError "property bar not a TYPE object" ' +
    'if bar is optional and set to true', done => {
    const iface = normalize({
      name: 'hello',
      properties: [{
        name: 'bar',
        type: 's',
        access: 'read',
        optional: true
      }]
    })
    const impl = { interface: 'hello', name: 'default', bar: true }
    const f = () => validate(iface, impl)
    expect(f).to.throw(TypeError, 'property bar not a TYPE object')
    done()
  })

  it('TypeError "property bar type mismatch" ' +
    'if bar is required to be STRING but set to BYTE ', done => {
    const iface = normalize({
      name: 'hello',
      properties: [{
        name: 'bar',
        type: 's',
        access: 'read'
      }]
    })
    const impl = {
      interface: 'hello',
      name: 'default',
      bar: new BYTE(1)
    }

    const f = () => validate(iface, impl)
    expect(f).to.throw(TypeError, 'property bar type mismatch')
    done()
  })

  it('TypeError "property bar type mismatch" ' +
    'if bar is optionally to be STRING but set to BYTE ', done => {
    const iface = normalize({
      name: 'hello',
      properties: [{
        name: 'bar',
        type: 's',
        access: 'read'
      }]
    })
    const impl = {
      interface: 'hello',
      name: 'default',
      bar: new BYTE(1)
    }

    const f = () => validate(iface, impl)
    expect(f).to.throw(TypeError, 'property bar type mismatch')
    done()
  })

  it('OK if bar is required to be STRING and set to STRING', done => {
    const iface = normalize({
      name: 'hello',
      properties: [{
        name: 'bar',
        type: 's',
        access: 'read'
      }]
    })
    const impl = {
      interface: 'hello',
      name: 'default',
      bar: new STRING('hi')
    }

    validate(iface, impl)
    done()
  })

  it('OK if bar is optionally to be STRING and set to STRING', done => {
    const iface = normalize({
      name: 'hello',
      properties: [{
        name: 'bar',
        type: 's',
        access: 'read'
      }]
    })
    const impl = {
      interface: 'hello',
      name: 'default',
      bar: new STRING('hi')
    }

    validate(iface, impl)
    done()
  })
})
