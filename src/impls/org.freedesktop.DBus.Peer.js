const { STRING } = require('../types')

module.exports = {
  'interface': 'org.freedesktop.DBus.Peer',
  
  async Ping (m) {
    return
  },

  async GetMachineId (m) {
    return new STRING(this.dbus.machineId)
  }
}
