const { STRING } = require('../types')

/**
 * @module PeerTemplate
 */
module.exports = {
  /**
   * interface name
   */
  interface: 'org.freedesktop.DBus.Peer',

  /**
   * Ping
   */
  Ping (m) {

  },

  /**
   * GetMachineId
   * @returns {STRING} machine id
   */
  GetMachineId (m) {
    return STRING.from(this.node.machineId)
  }
}
