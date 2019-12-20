/**
 * This interface is defined in [Bluez](https://git.kernel.org/pub/scm/bluetooth/bluez.git/tree/doc/gatt-api.txt)
 *
 * In [`example-gatt-server`](https://git.kernel.org/pub/scm/bluetooth/bluez.git/tree/test/example-gatt-server), the following properties are implemented:
 * - `UUID`
 * - `Primary`
 * - `Characteristics`
 *
 * The `Charactertistics` property is not defined in [API document](https://git.kernel.org/pub/scm/bluetooth/bluez.git/tree/doc/gatt-api.txt). 
 * Omitting this property seems harmless.
 *
 * ### Service
 *
 * `org.bluez`
 *
 * ### Interface
 *
 * `org.bluez.GattService1`
 *
 * ### Object path	
 *
 * `[variable prefix]/{hci0,hci1,...}/dev_XX_XX_XX_XX_XX_XX/serviceXX`
 * 
 * ## Properties	
 *
 * ### `string UUID [read-only]`
 * 
 * 128-bit service UUID.
 * 
 * ### `boolean Primary [read-only]`
 * 
 * Indicates whether or not this GATT service is a
 * primary service. If false, the service is secondary.
 * 
 * ### `object Device [read-only, optional]`
 * 
 * Object path of the Bluetooth device the service
 * belongs to. Only present on services from remote
 * devices.
 * 
 * ### `array{object} Includes [read-only, optional]`
 * 
 * Array of object paths representing the included
 * services of this service.
 * 
 * ### `uint16 Handle [read-write, optional] (Server Only)`
 * 
 * Service handle. When available in the server it
 * would attempt to use to allocate into the database
 * which may fail, to auto allocate the value 0x0000
 * shall be used which will cause the allocated handle to
 * be set once registered.
 *
 * @module GattService1
 */
module.exports = {
  name: 'org.bluez.GattService1',

  properties: [
    { name: 'UUID', type: 's', access: 'read' },
    { name: 'Primary', type: 'b', access: 'read' },
    { name: 'Device', type: 'o', access: 'read', optional: true },
    { name: 'Includes', type: 'ao', access: 'read', optional: true },
    { name: 'Handle', type: 'q', access: 'readwrite', optional: true }  
  ]
}
