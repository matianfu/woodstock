const xml2js = require('xml2js')

class DBusInterfaceDefinition {
  constructor (i) {
    this.i = i
  }

  name () {
    return this.i.$.name
  }

  // return a signature
  method (name) {
    if (this.i && this.i.method) {
      let m = this.i.method.find(o => o.$.name === name)
      if (m) return m.arg.map(x => x.$)
    }
  }

  signal (name) {
  }

  property (name) {
  }

  // return [[name, sig]]
  properties () {
    
  }
}

const parseInterfaceDefinition = xml => {
  let i
  xml2js.parseString(xml, (err, obj) => {
    if (!err) i = new DBusInterfaceDefinition(obj.interface)
  })
  return i
}

module.exports = parseInterfaceDefinition
