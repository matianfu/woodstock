/**
 * This interface is defined in [Bluez](https://git.kernel.org/pub/scm/bluetooth/bluez.git/tree/doc/gatt-api.txt)
 *
 * ### Service
 * 
 * `org.bluez`
 *
 * ### Interface
 * 
 * `org.bluez.GattCharacteristic1`
 *
 * ### Object path
 *
 * `[variable prefix]/{hci0,hci1,...}/dev_XX_XX_XX_XX_XX_XX/serviceXX/charYYYY`
 * 
 * ## Methods	
 *
 * ### `array{byte} ReadValue(dict options)`
 * 
 * Issues a request to read the value of the
 * characteristic and returns the value if the
 * operation was successful.
 * 
 * Possible options: 
 * - `offset`: uint16 offset
 * - `mtu`: Exchanged MTU (Server only)
 * - `device`: Object Device (Server only)
 * 
 * Possible Errors: 
 * - `org.bluez.Error.Failed`
 * - `org.bluez.Error.InProgress`
 * - `org.bluez.Error.NotPermitted`
 * - `org.bluez.Error.NotAuthorized`
 * - `org.bluez.Error.InvalidOffset`
 * - `org.bluez.Error.NotSupported`
 * 
 * ### `void WriteValue(array{byte} value, dict options)`
 * 
 * Issues a request to write the value of the	characteristic.
 * 
 * Possible options: 
 * - `offset`: Start offset
 * - `type`: string
 *
 * Possible values:
 * - `command`: Write without	response
 * - `request`: Write with response
 * - `reliable`: Reliable Write
 * - `mtu`: Exchanged MTU (Server only)
 * - `device`: Device path (Server only)
 * - `link`: Link type (Server only)
 * - `prepare-authorize`: True if prepare authorization request
 * 
 * Possible Errors: 
 * - `org.bluez.Error.Failed`
 * - `org.bluez.Error.InProgress`
 * - `org.bluez.Error.NotPermitted`
 * - `org.bluez.Error.InvalidValueLength`
 * - `org.bluez.Error.NotAuthorized`
 * - `org.bluez.Error.NotSupported`
 * 
 * ### `fd, uint16 AcquireWrite(dict options) [optional]`
 * 
 * Acquire file descriptor and MTU for writing. Only
 * sockets are supported. Usage of WriteValue will be
 * locked causing it to return NotPermitted error.
 *
 * For server the MTU returned shall be equal or smaller
 * than the negotiated MTU.
 * 
 * For client it only works with characteristic that has
 * WriteAcquired property which relies on
 * write-without-response Flag.
 * 
 * To release the lock the client shall close the file
 * descriptor, a HUP is generated in case the device
 * is disconnected.
 * 
 * Note: the MTU can only be negotiated once and is
 * symmetric therefore this method may be delayed in
 * order to have the exchange MTU completed, because of
 * that the file descriptor is closed during
 * reconnections as the MTU has to be renegotiated.
 * 
 * Possible options: 
 * - `device`: Object Device (Server only)
 * - `mtu`: Exchanged MTU (Server only)
 * - `link`: Link type (Server only)
 * 
 * Possible Errors: 
 * - `org.bluez.Error.Failed`
 * - `org.bluez.Error.NotSupported`
 * 
 * ### `fd, uint16 AcquireNotify(dict options) [optional]`
 * 
 * Acquire file descriptor and MTU for notify. Only
 * sockets are support. Usage of StartNotify will be locked
 * causing it to return NotPermitted error.
 * 
 * For server the MTU returned shall be equal or smaller
 * than the negotiated MTU.
 * 
 * Only works with characteristic that has NotifyAcquired
 * which relies on notify Flag and no other client have
 * called StartNotify.
 *
 * Notification are enabled during this procedure so
 * StartNotify shall not be called, any notification
 * will be dispatched via file descriptor therefore the
 * Value property is not affected during the time where
 * notify has been acquired.
 * 
 * To release the lock the client shall close the file
 * descriptor, a HUP is generated in case the device
 * is disconnected.
 * 
 * Note: the MTU can only be negotiated once and is
 * symmetric therefore this method may be delayed in
 * order to have the exchange MTU completed, because of
 * that the file descriptor is closed during
 * reconnections as the MTU has to be renegotiated.
 * 
 * Possible options: 
 * - `device`: Object Device (Server only)
 * - `mtu`: Exchanged MTU (Server only)
 * - `link`: Link type (Server only)
 * 
 * Possible Errors: 
 * - `org.bluez.Error.Failed`
 * - `org.bluez.Error.NotSupported`
 * 
 * ### `void StartNotify()`
 * 
 * Starts a notification session from this characteristic
 * if it supports value notifications or indications.
 * 
 * Possible Errors: 
 * - `org.bluez.Error.Failed`
 * - `org.bluez.Error.NotPermitted`
 * - `org.bluez.Error.InProgress`
 * - `org.bluez.Error.NotSupported`
 * 
 * ### `void StopNotify()`
 * 
 * This method will cancel any previous StartNotify
 * transaction. Note that notifications from a
 * characteristic are shared between sessions thus
 * calling StopNotify will release a single session.
 * 
 * Possible Errors: 
 * - `org.bluez.Error.Failed`
 * 
 * ### `void Confirm() [optional] (Server only)`
 * 
 * This method doesn't expect a reply so it is just a
 * confirmation that value was received.
 * 
 * Possible Errors: 
 * - `org.bluez.Error.Failed`
 * 
 * ## Properties	
 * 
 * ### `string UUID [read-only]`
 * 
 * 128-bit characteristic UUID.
 * 
 * ### `object Service [read-only]`
 * 
 * Object path of the GATT service the characteristic
 * belongs to.
 * 
 * ### `array{byte} Value [read-only, optional]`
 * 
 * The cached value of the characteristic. This property
 * gets updated only after a successful read request and
 * when a notification or indication is received, upon
 * which a PropertiesChanged signal will be emitted.
 * 
 * ### `boolean WriteAcquired [read-only, optional]`
 * 
 * True, if this characteristic has been acquired by any
 * client using AcquireWrite.
 *
 * For client properties is ommited in case
 * 'write-without-response' flag is not set.
 *
 * For server the presence of this property indicates
 * that AcquireWrite is supported.
 * 
 * ### `boolean NotifyAcquired [read-only, optional]`
 * 
 * True, if this characteristic has been acquired by any
 * client using AcquireNotify.
 * 
 * For client this properties is ommited in case 'notify'
 * flag is not set.
 * 
 * For server the presence of this property indicates
 * that AcquireNotify is supported.
 * 
 * ### `boolean Notifying [read-only, optional]`
 * 
 * True, if notifications or indications on this
 * characteristic are currently enabled.
 * 
 * ### `array{string} Flags [read-only]`
 * 
 * Defines how the characteristic value can be used. See
 * Core spec "Table 3.5: Characteristic Properties bit
 * field", and "Table 3.8: Characteristic Extended
 * Properties bit field". Allowed values:
 * - `broadcast`
 * - `read`
 * - `write-without-response`
 * - `write`
 * - `notify`
 * - `indicate`
 * - `authenticated-signed-writes`
 * - `extended-properties`
 * - `reliable-write`
 * - `writable-auxiliaries`
 * - `encrypt-read`
 * - `encrypt-write`
 * - `encrypt-authenticated-read`
 * - `encrypt-authenticated-write`
 * - `secure-read` (Server only)
 * - `secure-write` (Server only)
 * - `authorize`
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
 * @module GattCharacteristic1
 */
module.exports = {
  name: 'org.bluez.GattCharacteristic1',
  methods: [
    {
      name: 'ReadValue',
      args: [
        { name: 'options', type: 'a{sv}', direction: 'in' },
        { name: 'value', type: 'ay', direction: 'out' }
      ]
    },
    {
      name: 'WriteValue',
      args: [
        { name: 'value', type: 'ay', direction: 'in' },
        { name: 'options', type: 'a{sv}', direction: 'in' }
      ]
    },
    {
      name: 'AcquireWrite',
      args: [
        { name: 'options', type: 'a{sv}', direction: 'in' },
        { name: 'fd', type: 'q', direction: 'out' }
      ],
      optional: true
    },
    {
      name: 'AcquireNotify',
      args: [
        { name: 'options', type: 'a{sv}', direction: 'in' },
        { name: 'fd', type: 'q', direction: 'out' }
      ],
      optional: true
    },
    { name: 'StartNotify' },
    { name: 'StopNotify' },
    { name: 'Confirm', optional: true }
  ],

  properties: [
    { name: 'UUID', type: 's', access: 'read' },
    { name: 'Service', type: 'o', access: 'read' },

    // write is allowed for reusing Set method on Properties interface
    { name: 'Value', type: 'ay', access: 'readwrite', optional: true },

    { name: 'WriteAcquired', type: 'b', access: 'read', optional: true },
    { name: 'NotifyAcquired', type: 'b', access: 'read', optional: true },
    { name: 'Notifying', type: 'b', access: 'read', optional: true },
    { name: 'Flags', type: 'as', access: 'read' },
    { name: 'Handle', type: 'q', access: 'readwrite', optional: true }
  ]
}
