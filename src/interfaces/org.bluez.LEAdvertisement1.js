// see https://git.kernel.org/pub/scm/bluetooth/bluez.git/tree/test/example-advertisement

/**
 * Example code in python.
 *
 * ```Python
 * def get_properties(self):
 *     properties = dict()
 *     properties['Type'] = self.ad_type
 *     if self.service_uuids is not None:
 *         properties['ServiceUUIDs'] = dbus.Array(self.service_uuids,
 *                                                 signature='s')
 *     if self.solicit_uuids is not None:
 *         properties['SolicitUUIDs'] = dbus.Array(self.solicit_uuids,
 *                                                 signature='s')
 *     if self.manufacturer_data is not None:
 *         properties['ManufacturerData'] = dbus.Dictionary(
 *             self.manufacturer_data, signature='qv')
 *     if self.service_data is not None:
 *         properties['ServiceData'] = dbus.Dictionary(self.service_data,
 *                                                     signature='sv')
 *     if self.local_name is not None:
 *         properties['LocalName'] = dbus.String(self.local_name)
 *     if self.include_tx_power is not None:
 *         properties['IncludeTxPower'] = dbus.Boolean(self.include_tx_power)
 * 
 *     if self.data is not None:
 *         properties['Data'] = dbus.Dictionary(
 *             self.data, signature='yv')
 *     return {LE_ADVERTISEMENT_IFACE: properties}
 * ```
 */
module.exports = {
  name: 'org.bluez.LEAdertisement1',
  methods: [
    {
      name: 'Release',
      noReply: true
    }
  ],
  properties: [
    {
      name: 'Type', 
      type: 's',                // string, "broadcast" or "peripheral"
      access: 'read',
    },
    {
      name: 'ServiceUUIDs',
      type: 'as',               // array{string}
      access: 'read',
      optional: true
    },
    {
      name: 'ManufacturerData',
      type: 'a{qv}',            // DICT, 0xffff, byte....
      access: 'read',
      optional: true
    },
    {
      name: 'SolicitUUIDs',
      type: 'as',               // array{string}
      access: 'read',
      optional: true
    },
    {
      name: 'ServiceData',
      type: 'a{sv}',            // DICT, see offiial example
      access: 'read',
      optional: true
    },
    {
      name: 'Data',
      type: 'a{yv}',            // DICT, see official example
      access: 'read',
      optional: true
    },
    {
      name: 'Discoverable',
      type: 'b',                // boolean
      access: 'read',
      optional: true
    },
    {
      name: 'DiscoverableTimeout',
      type: 'q',                // uint16
      access: 'read',
      optional: true
    },
    {
      name: 'Includes',
      type: 'as',               // array{string}
      access: 'read',
      optional: true
    },
    {
      name: 'LocalName',
      type: 's',                // string
      access: 'read',
      optional: true
    },
    {
      name: 'Appearance',
      type: 'q',                // uint16
      access: 'read',
      optional: true
    },
    {
      name: 'Duration',
      type: 'q',                // uint16
      access: 'read',
      optional: true
    },
    {
      name: 'Timeout',
      type: 'q',                // uint16 
      access: 'read',
      optional: true
    },
    {
      name: 'SecondaryChannel',
      type: 's',                // string
      access: 'read',
      optional: true
    }
  ]
}
