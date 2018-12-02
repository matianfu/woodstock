const xml2js = require('xml2js')

class DBusInterfaceDefinition {
  constructor (xml) {
    if (typeof xml !== 'string') throw new Error('invalid arg')
    xml2js.parseString(xml, (err, raw) => {
      if (err) throw err
      console.log(raw) 
    })
  }
}

module.exports = DBusInterfaceDefinition

