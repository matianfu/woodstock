const path = require('path')

const chai = require('chai')
const expect = chai.expect

const normalize = require('src/interface')
const {
  normalizeMethodArg,
  normalizeMethod,
  normalizeProperty,
  normalizeSignalArg,
  normalizeSignal
} = normalize

describe(path.basename(__filename) + ', normalizeMethodArg()', () => {
  it('TypeError "method arg not an object" if arg is "hello"', done => {
    const f = () => normalizeMethodArg('hello')
    expect(f).to.throw(TypeError, 'method arg not an object')
    done()
  })

  it('TypeError "method arg direction not a string" if it is true', done => {
    const f = () => normalizeMethodArg({ direction: true })
    expect(f).to.throw(TypeError, 'method arg direction not a string')
    done()
  })

  it('RangeError "invalid method arg direction" if it is "hello"', done => {
    const f = () => normalizeMethodArg({ direction: 'hello' })
    expect(f).to.throw(RangeError, 'invalid method arg direction')
    done()
  })

  it('TypeError "method arg type not a string" if it is true', done => {
    const f = () => normalizeMethodArg({ direction: 'in', type: true })
    expect(f).to.throw(TypeError, 'method arg type not a string')
    done()
  })

  it('RangeError "method arg type not defined" if method has no type', done => {
    const f = () => normalizeMethodArg({ direction: 'in' })
    expect(f).to.throw(RangeError, 'method arg type not defined')
    done()
  })

  it('RangeError "method arg type not a dbus type signature" ' +
    'if it is "abc"', done => {
    const f = () => normalizeMethodArg({ direction: 'in', type: 'abc' })
    expect(f).to.throw(RangeError, 'method arg type not a dbus type signature')
    done()
  })

  it('RangeError "method arg type not a single complete type" ' +
    'if it is "a{sv}a{sv}"', done => {
    const f = () => normalizeMethodArg({ direction: 'in', type: 'a{sv}a{sv}' })
    expect(f).to.throw(RangeError, 'method arg type not a single complete type')
    done()
  })

  it('TypeError "method arg name not a string" if it is true', done => {
    const f = () => normalizeMethodArg({
      direction: 'in',
      type: 'ay',
      name: true
    })
    expect(f).to.throw(TypeError, 'method arg name not a string')
    done()
  })

  it('should parse a valid arg with a name', done => {
    const arg = normalizeMethodArg({
      direction: 'in',
      type: 'ay',
      name: 'hello'
    })
    expect(arg).to.deep.equal({
      direction: 'in',
      type: 'ay',
      name: 'hello'
    })
    done()
  })

  it('should parse a valid arg without a name', done => {
    const arg = normalizeMethodArg({
      direction: 'in',
      type: 'ay'
    })
    expect(arg).to.deep.equal({
      direction: 'in',
      type: 'ay',
      name: ''
    })
    done()
  })
})

describe(path.basename(__filename) + ', normalizeMethod()', () => {
  it('TypeError "method not an object" if it is "hello"', done => {
    const f = () => normalizeMethod('hello')
    expect(f).to.throw(TypeError, 'method not an object')
    done()
  })

  it('RangeError "method name not defined" if method has no name', done => {
    const f = () => normalizeMethod({})
    expect(f).to.throw(RangeError, 'method name not defined')
    done()
  })

  it('TypeError "method name not a string" if it is true', done => {
    const f = () => normalizeMethod({ name: true })
    expect(f).to.throw(TypeError, 'method name not a string')
    done()
  })

  it('TypeError "method args not an array" if it is true', done => {
    const f = () => normalizeMethod({ name: 'hello', args: true })
    expect(f).to.throw(TypeError, 'method args not an array')
    done()
  })

  it('RangeError "method has multiple out args"', done => {
    const f = () => normalizeMethod({
      name: 'hello',
      args: [
        { type: 'ay', direction: 'out' },
        { type: 'ay', direction: 'out' }
      ]
    })
    expect(f).to.throw(RangeError, 'method has multiple out args')
    done()
  })

  it('TypeError "method optional not a boolean" if optional is "hello"',
    done => {
      const f = () => normalizeMethod({ name: 'hello', optional: 'hello' })
      expect(f).to.throw(TypeError, 'method optional not a boolean')
      done()
    })

  it('should normalize a valid method with args and optional', done => {
    expect((normalizeMethod({
      name: 'hello',
      args: [
        { type: 'ay', direction: 'in' },
        { type: 'ay', direction: 'out' }
      ],
      optional: true
    }))).to.deep.equal({
      name: 'hello',
      args: [
        { name: '', type: 'ay', direction: 'in' },
        { name: '', type: 'ay', direction: 'out' }
      ],
      optional: true
    })
    done()
  })

  it('should parse a valid method without args and optioal', done => {
    expect((normalizeMethod({ name: 'hello' }))).to.deep.equal({
      name: 'hello',
      args: [],
      optional: false
    })
    done()
  })
})

describe(path.basename(__filename) + ', normalizeProperty()', () => {
  it('TypeError "property not an object" if it is "hello"', done => {
    const f = () => normalizeProperty('hello')
    expect(f).to.throw(TypeError, 'property not an object')
    done()
  })

  it('TypeError "property name not a string" if it is true', done => {
    const f = () => normalizeProperty({ name: true })
    expect(f).to.throw(TypeError, 'property name not a string')
    done()
  })

  it('RangeError "property name not defined" if property has no name', done => {
    const f = () => normalizeProperty({})
    expect(f).to.throw(RangeError, 'property name not defined')
    done()
  })

  it('TypeError "property type not a string" if it is true', done => {
    const f = () => normalizeProperty({
      name: 'hello',
      type: true
    })
    expect(f).to.throw(TypeError, 'property type not a string')
    done()
  })

  it('RangeError "property type not defined" if property has no type', done => {
    const f = () => normalizeProperty({ name: 'hello' })
    expect(f).to.throw(RangeError, 'property type not defined')
    done()
  })

  it('RangeError "property type not a dbus type signature" if it is "abc"',
    done => {
      const f = () => normalizeProperty({ name: 'hello', type: 'abc' })
      expect(f).to.throw(RangeError, 'property type not a dbus type signature')
      done()
    })

  it('RangeError "property type not a single complete type" if its "ayay"',
    done => {
      const f = () => normalizeProperty({ name: 'hello', type: 'ayay' })
      expect(f).to.throw(RangeError, 'property type not a single complete type')
      done()
    })

  it('TypeError "property access not a string" if it is true', done => {
    const f = () => normalizeProperty({
      name: 'hello', type: 'ay', access: true
    })
    expect(f).to.throw(TypeError, 'property access not a string')
    done()
  })

  it('RangeError "invalid property access" if it is "hello"', done => {
    const f = () => normalizeProperty({
      name: 'hello', type: 'ay', access: 'hello'
    })
    expect(f).to.throw(RangeError, 'invalid property access')
    done()
  })

  it('TypeError "property optional not a boolean" if it is "hello"', done => {
    const f = () => normalizeProperty({
      name: 'hello', type: 'ay', access: 'read', optional: 'hello'
    })
    expect(f).to.throw(TypeError, 'property optional not a boolean')
    done()
  })

  it('shoud normalize a property with optional', done => {
    expect(normalizeProperty({
      name: 'hello', type: 'b', access: 'read', optional: true
    })).to.deep.equal({
      name: 'hello', type: 'b', access: 'read', optional: true
    })
    done()
  })

  it('shoud normalize a property without optional', done => {
    expect(normalizeProperty({
      name: 'hello', type: 'b', access: 'read'
    })).to.deep.equal({
      name: 'hello', type: 'b', access: 'read', optional: false
    })
    done()
  })
})

describe(path.basename(__filename) + ', normalizeSignalArg()', () => {
  it('TypeError "signal arg not an object" if arg is "hello"', done => {
    const f = () => normalizeSignalArg('hello')
    expect(f).to.throw(TypeError, 'signal arg not an object')
    done()
  })

  it('TypeError "signal arg type not a string" if it is true', done => {
    const f = () => normalizeSignalArg({ type: true })
    expect(f).to.throw(TypeError, 'signal arg type not a string')
    done()
  })

  it('RangeError "signal arg type not defined" if signal has no type ', done => {
    const f = () => normalizeSignalArg({})
    expect(f).to.throw(RangeError, 'signal arg type not defined')
    done()
  })

  it('RangeError "signal arg type not a dbus type signature" ' +
    'if it is "abc"', done => {
    const f = () => normalizeSignalArg({ type: 'abc' })
    expect(f).to.throw(RangeError, 'signal arg type not a dbus type signature')
    done()
  })

  it('RangeError "signal arg type not a single complete type" ' +
    'if it is "a{sv}a{sv}"', done => {
    const f = () => normalizeSignalArg({ type: 'a{sv}a{sv}' })
    expect(f).to.throw(RangeError, 'signal arg type not a single complete type')
    done()
  })

  it('TypeError "signal arg name not a string" if it is true', done => {
    const f = () => normalizeSignalArg({ type: 'ay', name: true })
    expect(f).to.throw(TypeError, 'signal arg name not a string')
    done()
  })

  it('should normalize a valid signal arg with a name', done => {
    const arg = normalizeSignalArg({ type: 'ay', name: 'hello' })
    expect(arg).to.deep.equal({ type: 'ay', name: 'hello' })
    done()
  })

  it('should normalize a valid signal arg without a name', done => {
    const arg = normalizeSignalArg({ type: 'ay' })
    expect(arg).to.deep.equal({ type: 'ay', name: '' })
    done()
  })
})

describe(path.basename(__filename) + ', normalizeSignal()', () => {
  it('TypeError "signal not an object" if it is "hello"', done => {
    const f = () => normalizeSignal('hello')
    expect(f).to.throw(TypeError, 'signal not an object')
    done()
  })

  it('RangeError "signal name not defined" if signal has no name', done => {
    const f = () => normalizeSignal({})
    expect(f).to.throw(RangeError, 'signal name not defined')
    done()
  })

  it('TypeError "signal name not a string" if it is true', done => {
    const f = () => normalizeSignal({ name: true })
    expect(f).to.throw(TypeError, 'signal name not a string')
    done()
  })

  it('TypeError "signal args not an array" if it is true', done => {
    const f = () => normalizeSignal({ name: 'hello', args: true })
    expect(f).to.throw(TypeError, 'signal args not an array')
    done()
  })

  it('TypeError "signal optional not a boolean" if it is "hello"', done => {
    const f = () => normalizeSignal({ name: 'hello', optional: 'hello' })
    expect(f).to.throw(TypeError, 'signal optional not a boolean')
    done()
  })

  it('should normalize a valid signal with args and optional', done => {
    expect((normalizeSignal({
      name: 'hello',
      args: [
        { type: 'ay' },
        { type: 'ay' }
      ],
      optional: true
    }))).to.deep.equal({
      name: 'hello',
      args: [
        { name: '', type: 'ay' },
        { name: '', type: 'ay' }
      ],
      optional: true
    })
    done()
  })

  it('should normalize a valid signal without args and optional', done => {
    expect((normalizeSignal({
      name: 'hello'
    }))).to.deep.equal({
      name: 'hello',
      args: [],
      optional: false
    })
    done()
  })
})

describe(path.basename(__filename) + ', normalize()', () => {
  it('TypeError "interface not an object" if it is "hello"', done => {
    const f = () => normalize('hello')
    expect(f).to.throw(TypeError, 'interface not an object')
    done()
  })

  it('TypeError "interface name not a string" if it is true', done => {
    const f = () => normalize({ name: true })
    expect(f).to.throw(TypeError, 'interface name not a string')
    done()
  })

  it('RangeError "interface name not defined" if interface has no name',
    done => {
      const f = () => normalize({})
      expect(f).to.throw(RangeError, 'interface name not defined')
      done()
    })

  it('TypeError "interface methods not an array" if is true', done => {
    const f = () => normalize({ name: 'a', methods: true })
    expect(f).to.throw(TypeError, 'interface methods not an array')
    done()
  })

  it('TypeError "interface properties not an array" if it is true', done => {
    const f = () => normalize({ name: 'a', properties: true })
    expect(f).to.throw(TypeError, 'interface properties not an array')
    done()
  })

  it('TypeError "interface signals not an array" if it is true', done => {
    const f = () => normalize({ name: 'a', signals: true })
    expect(f).to.throw(TypeError, 'interface signals not an array')
    done()
  })

  it('RangeError "interface members have duplicate name"', done => {
    const f = () => normalize({
      name: 'a',
      methods: [{ name: 'Hello' }],
      properties: [{ name: 'Hello', type: 'ay', access: 'read' }]
    })

    expect(f).to.throw(RangeError, 'interface members have duplicate name')
    done()
  })

  it('should normalize an empty interface definition', done => {
    expect(normalize({
      name: 'hello'
    })).to.deep.equal({
      name: 'hello',
      methods: [],
      properties: [],
      signals: []
    })
    done()
  })
})
