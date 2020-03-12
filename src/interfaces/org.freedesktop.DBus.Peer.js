/**
 * `org.freedesktop.DBus.Peer` interface is defined in DBus specification
 *
 * @module PeerInterface
 */
module.exports = {
  name: 'org.freedesktop.DBus.Peer',
  methods: [
    {
      name: 'Ping'
    },
    {
      name: 'GetMachineId',
      args: [{ name: 'machine_id', type: 's', direction: 'out' }]
    }
  ]
}
