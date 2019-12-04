const { STRING } = require('../types')

/**
 * Note: interface will be replace with an interface object
 * this.node is the reference to node
 * this.bus is the reference to dbus
 */
const impl = {
  'interface': 'org.freedesktop.DBus.Peer',
  
  async Ping (m) {
    return
  },

  async GetMachineId (m) {
    return new STRING(this.bus.machineId)
  }
}

module.exports = impl
