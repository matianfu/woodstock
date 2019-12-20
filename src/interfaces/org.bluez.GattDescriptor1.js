/**
 * This interface is defined in [Bluez](https://git.kernel.org/pub/scm/bluetooth/bluez.git/tree/doc/gatt-api.txt)
 *
 * ### Service		  
 *
 * org.bluez
 *
 * ### Interface	  
 *
 * org.bluez.GattDescriptor1
 *
 * ### Object path	
 *
 * [variable prefix]/{hci0,hci1,...}/dev_XX_XX_XX_XX_XX_XX/serviceXX/charYYYY/descriptorZZZ
 * 
 * ## Methods		
 *
 * ### `array{byte} ReadValue(dict flags)`
 * 
 * Issues a request to read the value of the
 * characteristic and returns the value if the
 * operation was successful.
 * 
 * Possible options: 
 * - "offset": Start offset
 * - "device": Device path (Server only)
 * - "link": Link type (Server only)
 * 
 * Possible Errors: 
 * - org.bluez.Error.Failed
 * - org.bluez.Error.InProgress
 * - org.bluez.Error.NotPermitted
 * - org.bluez.Error.NotAuthorized
 * - org.bluez.Error.NotSupported
 * 
 * ### `void WriteValue(array{byte} value, dict flags)`
 * 
 * Issues a request to write the value of the	characteristic.
 * 
 * Possible options: 
 * - "offset": Start offset
 * - "device": Device path (Server only)
 * - "link": Link type (Server only)
 * - "prepare-authorize": boolean Is prepare authorization request
 * 
 * Possible Errors: 
 * - org.bluez.Error.Failed
 * - org.bluez.Error.InProgress
 * - org.bluez.Error.NotPermitted
 * - org.bluez.Error.InvalidValueLength
 * - org.bluez.Error.NotAuthorized
 * - org.bluez.Error.NotSupported
 * 
 * ## Properties	
 *
 * ### `string UUID [read-only]`
 * 
 * 128-bit descriptor UUID.
 * 
 * ### `object Characteristic [read-only]`
 * 
 * Object path of the GATT characteristic the descriptorbelongs to.
 * 
 * ### `array{byte} Value [read-only, optional]`
 * 
 * The cached value of the descriptor. This property
 * gets updated only after a successful read request, upon
 * which a PropertiesChanged signal will be emitted.
 * 
 * ### `array{string} Flags [read-only]`
 * 
 * Defines how the descriptor value can be used.
 * 
 * Possible values:
 * - "read"
 * - "write"
 * - "encrypt-read"
 * - "encrypt-write"
 * - "encrypt-authenticated-read"
 * - "encrypt-authenticated-write"
 * - "secure-read" (Server Only)
 * - "secure-write" (Server Only)
 * - "authorize"
 * 
 * ### `uint16 Handle [read-write, optional] (Server Only)`
 * 
 * Characteristic handle. When available in the server it
 * would attempt to use to allocate into the database
 * which may fail, to auto allocate the value 0x0000
 * shall be used which will cause the allocated handle to
 * be set once registered.
 * ```
 * 
 * @module GattDescriptor1
 */
module.exports = {
  name: 'org.bluez.GattDescriptor1',
  
  methods: [
    {
      name: 'ReadValue'
    } 
  ] 
}
