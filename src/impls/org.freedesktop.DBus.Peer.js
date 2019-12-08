const { STRING } = require('../types')

/**
 * Note: interface will be replace with an interface object
 * this.node is the reference to node
 * this.bus is the reference to dbus
 */
const impl = {
  'interface': 'org.freedesktop.DBus.Peer',
  
  Ping (m) {
    return
  },

  GetMachineId (m) {
    return STRING.from(this.node.machineId)
  }
}

module.exports = impl
