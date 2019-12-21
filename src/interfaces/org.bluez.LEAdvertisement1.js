/**
 * ### Service		
 *
 * org.bluez
 *
 * ### Interface	
 *
 * org.bluez.LEAdvertisement1
 *
 * ### Object path	
 *
 * freely definable
 *
 * ## Methods		
 *
 * ### `void Release() [noreply]`
 *
 * This method gets called when the service daemon
 * removes the Advertisement. A client can use it to do
 * cleanup tasks. There is no need to call
 * UnregisterAdvertisement because when this method gets
 * called it has already been unregistered.
 *
 * ## Properties
 * 
 * ### `string Type`
 *
 * Determines the type of advertising packet requested.
 *
 * Possible values: 
 * - "broadcast"
 * - "peripheral"
 *
 * ### `array{string} ServiceUUIDs`
 *
 * List of UUIDs to include in the "Service UUID" field of the Advertising Data.
 *
 * ### `dict ManufacturerData`
 *
 * Manufactuer Data fields to include in
 * the Advertising Data.  Keys are the Manufacturer ID
 * to associate with the data.
 *
 * ### `array{string} SolicitUUIDs`
 *
 * Array of UUIDs to include in "Service Solicitation" Advertisement Data.
 *
 * ### `dict ServiceData`
 *
 * Service Data elements to include. The keys are the UUID to associate with the data.
 *
 * ### `dict Data [Experimental]`
 *
 * Advertising Type to include in the Advertising
 * Data. Key is the advertising type and value is the
 * data as byte array.
 *
 * Note: Types already handled by other properties shall not be used.
 *
 * Possible values:
 * - `<type> <byte array>`
 * - ...
 * 
 * Example:
 * ```
 * <Transport Discovery> <Organization Flags...>
 * 0x26                   0x01         0x01...
 * ```
 * ### `bool Discoverable [Experimental]`
 *
 * Advertise as general discoverable. When present this
 * will override adapter Discoverable property.
 *
 * Note: This property shall not be set when Type is set to broadcast.
 *
 * ### `uint16 DiscoverableTimeout [Experimental]`
 *
 * The discoverable timeout in seconds. A value of zero
 * means that the timeout is disabled and it will stay in
 * discoverable/limited mode forever.
 *
 * Note: This property shall not be set when Type is set to broadcast.
 *
 * ### `array{string} Includes`
 *
 * List of features to be included in the advertising packet.
 *
 * Possible values: as found on LEAdvertisingManager.SupportedIncludes
 *
 * ### `string LocalName`
 *
 * Local name to be used in the advertising report. If the
 * string is too big to fit into the packet it will be truncated.
 *
 * If this property is available 'local-name' cannot be present in the Includes.
 *
 * ### `uint16 Appearance`
 *
 * Appearance to be used in the advertising report.
 *
 * Possible values: as found on GAP Service.
 *
 * ### `uint16_t Duration`
 *
 * Duration of the advertisement in seconds. If there are
 * other applications advertising no duration is set the
 * default is 2 seconds.
 *
 * ### `uint16_t Timeout`
 *
 * Timeout of the advertisement in seconds. This defines
 * the lifetime of the advertisement.
 *
 * ### `string SecondaryChannel [Experimental]`
 *
 * Secondary channel to be used. Primary channel is
 * always set to "1M" except when "Coded" is set.
 *
 * Possible value: 
 * - "1M" (default)
 * - "2M"
 * - "Coded"
 *
 * ## Example
 *
 * [Code example](https://git.kernel.org/pub/scm/bluetooth/bluez.git/tree/test/example-advertisement) in python:
 *
 * ```Python
 * def get_properties(self):
 *     properties = dict()
 *     properties['Type'] = self.ad_type
 *     if self.service_uuids is not None:
 *         properties['ServiceUUIDs'] = dbus.Array(self.service_uuids, signature='s')
 *     if self.solicit_uuids is not None:
 *         properties['SolicitUUIDs'] = dbus.Array(self.solicit_uuids, signature='s')
 *     if self.manufacturer_data is not None:
 *         properties['ManufacturerData'] = dbus.Dictionary(
 *             self.manufacturer_data, signature='qv')
 *     if self.service_data is not None:
 *         properties['ServiceData'] = dbus.Dictionary(self.service_data, signature='sv')
 *     if self.local_name is not None:
 *         properties['LocalName'] = dbus.String(self.local_name)
 *     if self.include_tx_power is not None:
 *         properties['IncludeTxPower'] = dbus.Boolean(self.include_tx_power)
 * 
 *     if self.data is not None:
 *         properties['Data'] = dbus.Dictionary(self.data, signature='yv')
 *     return {LE_ADVERTISEMENT_IFACE: properties}
 * ```
 * 
 * @module LEAdvertisement1
 */
module.exports = {
  name: 'org.bluez.LEAdvertisement1',
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
      type: 'a{qv}',            // DICT, 0xffff, byte array
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
