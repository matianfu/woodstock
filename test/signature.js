const path = require('path')
const expect = require('chai').expect

const { split } = require('src/signature')

describe(path.basename(__filename), () => {
  it('split "a" should throw RangeError', () =>
    expect(() => split('a')).to.throw(RangeError))

  it('oa{sv}', done => {
    expect(split('oa{sv}')).to.deep.equal([
      'o', 'a{sv}'])
    done()
  })

  it('yyyyuua(yv)', done => {
    expect(split('yyyyuua(yv)')).to.deep.equal([
      'y', 'y', 'y', 'y', 'u', 'u', 'a(yv)'])
    done()
  })
})
