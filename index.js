const types = require('./src/types')
const DBus = require('./src/dbus')
const builtInInterfaces = require('./src/interfaces')
const builtInTemplates = require('./src/templates')

module.exports = opts => {
  const bus = new DBus()

  // add built-in interfaces
  for (const iface in builtInInterfaces) {
    bus.addInterface(builtInInterfaces[iface])
  }

  for (const tmpl in builtInTemplates) {
    bus.addTemplate(builtInTemplates[tmpl])
  }

  return bus
}

module.exports.types = types
