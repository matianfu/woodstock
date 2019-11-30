const EventEmitter = require('events')

/**
 * BLE implements a BLE service
 *
 *
 *
 * @emits written
 */
class BLE extends EventEmitter {
  /**
   * @param {object} opts
   * @param {Buffer} opts.adv - initial advertisement
   */
  constructor (opts) {
    super()
    
    /**
     * 
     */
    this.nodes = []
  }

  /**
   * @param {object} m - message, type METHOD_CALL or SIGNAL
   */
  handleMessage (m) {
    if (m.type === 'METHOD_CALL') {
      this.handleMethodCall(m)
    } else if (m.type === 'SIGNAL') {
      this.handleSignal(m)
    }
  }

  supports (path, iface) {
  }

  introspect (path) {
  }

  handleMethodCall (m) {
    const node = this.nodes.find(n => n.path === m.path)
    if (!node) {
      // TODO
      return
    }

    switch (m.interface) {
      case 'org.freedesktop.DBus.Peer': {
      } break
      case 'org.freedesktop.DBus.Properties': {
      } break
      case 'org.freedesktop.DBus.ObjectManager': {
      } break
      case 'org.freedesktop.DBus.Introspectable': {
      } break
      case 'org.bluez.GattService1': {
      } break
      case 'org.bluez.GattCharacteristic1': {
      } break
      case 'org.bluez.GattCharacteristic1': {
      } break
      case 'org.bluez.GattDescriptor1': {
      } break
      default: 
        // do something 
    }
  }

  /**
   * ```
   * Service		org.bluez
   * Interface	org.bluez.GattService1
   * Object path	[variable prefix]/{hci0,...}/dev_XX_XX_XX_XX_XX_XX/serviceXX
   * 
   * Properties	
   * 
   * string UUID [read-only]
   * 
   *   128-bit service UUID.
   * 
   * boolean Primary [read-only]
   * 
   *   Indicates whether or not this GATT service is a
   *   primary service. If false, the service is secondary.
   * 
   * object Device [read-only, optional]
   * 
   *   Object path of the Bluetooth device the service
   *   belongs to. Only present on services from remote
   *   devices.
   * 
   * array{object} Includes [read-only, optional]
   * 
   *   Array of object paths representing the included
   *   services of this service.
   * 
   * uint16 Handle [read-write, optional] (Server Only)
   * 
   *   Service handle. When available in the server it
   *   would attempt to use to allocate into the database
   *   which may fail, to auto allocate the value 0x0000
   *   shall be used which will cause the allocated handle to
   *   be set once registered.
   * ```
   *
   * @param {object} node
   * @param {string} node.path - absolute node path
   * @param {string} node.UUID - service UUID
   * @parma {boolean} node.Primary - true if this service is the primary service
   */
  addService (node) {
    node.type = 'service'
    this.node.push(node)   
  }

  /**
   * ```
   * Service		org.bluez
   * Interface	org.bluez.GattCharacteristic1
   * Object path	
   *   [variable prefix]/{hci0,...}/dev_XX_XX_XX_XX_XX_XX/serviceXX/charYYYY
   * 
   * Methods		array{byte} ReadValue(dict options)
   * 
   *   Issues a request to read the value of the
   *   characteristic and returns the value if the
   *   operation was successful.
   * 
   *   Possible options: 
   *     "offset": uint16 offset
   *     "mtu": Exchanged MTU (Server only)
   *     "device": Object Device (Server only)
   * 
   *   Possible Errors: org.bluez.Error.Failed
   *        org.bluez.Error.InProgress
   *        org.bluez.Error.NotPermitted
   *        org.bluez.Error.NotAuthorized
   *        org.bluez.Error.InvalidOffset
   *        org.bluez.Error.NotSupported
   * 
   * void WriteValue(array{byte} value, dict options)
   * 
   *   Issues a request to write the value of the
   *   characteristic.
   * 
   *   Possible options: "offset": Start offset
   *         "type": string
   *         Possible values:
   *         "command": Write without response
   *         "request": Write with response
   *         "reliable": Reliable Write
   *         "mtu": Exchanged MTU (Server only)
   *         "device": Device path (Server only)
   *         "link": Link type (Server only)
   *         "prepare-authorize": True if prepare
   *                  authorization
   *                  request
   * 
   *   Possible Errors: org.bluez.Error.Failed
   *        org.bluez.Error.InProgress
   *        org.bluez.Error.NotPermitted
   *        org.bluez.Error.InvalidValueLength
   *        org.bluez.Error.NotAuthorized
   *        org.bluez.Error.NotSupported
   * 
   * fd, uint16 AcquireWrite(dict options) [optional]
   * 
   *   Acquire file descriptor and MTU for writing. Only
   *   sockets are supported. Usage of WriteValue will be
   *   locked causing it to return NotPermitted error.
   * 
   *   For server the MTU returned shall be equal or smaller
   *   than the negotiated MTU.
   * 
   *   For client it only works with characteristic that has
   *   WriteAcquired property which relies on
   *   write-without-response Flag.
   * 
   *   To release the lock the client shall close the file
   *   descriptor, a HUP is generated in case the device
   *   is disconnected.
   * 
   *   Note: the MTU can only be negotiated once and is
   *   symmetric therefore this method may be delayed in
   *   order to have the exchange MTU completed, because of
   *   that the file descriptor is closed during
   *   reconnections as the MTU has to be renegotiated.
   * 
   *   Possible options: "device": Object Device (Server only)
   *         "mtu": Exchanged MTU (Server only)
   *         "link": Link type (Server only)
   * 
   *   Possible Errors: org.bluez.Error.Failed
   *        org.bluez.Error.NotSupported
   * 
   * fd, uint16 AcquireNotify(dict options) [optional]
   * 
   *   Acquire file descriptor and MTU for notify. Only
   *   sockets are support. Usage of StartNotify will be locked
   *   causing it to return NotPermitted error.
   * 
   *   For server the MTU returned shall be equal or smaller
   *   than the negotiated MTU.
   * 
   *   Only works with characteristic that has NotifyAcquired
   *   which relies on notify Flag and no other client have
   *   called StartNotify.
   * 
   *   Notification are enabled during this procedure so
   *   StartNotify shall not be called, any notification
   *   will be dispatched via file descriptor therefore the
   *   Value property is not affected during the time where
   *   notify has been acquired.
   * 
   *   To release the lock the client shall close the file
   *   descriptor, a HUP is generated in case the device
   *   is disconnected.
   * 
   *   Note: the MTU can only be negotiated once and is
   *   symmetric therefore this method may be delayed in
   *   order to have the exchange MTU completed, because of
   *   that the file descriptor is closed during
   *   reconnections as the MTU has to be renegotiated.
   * 
   *   Possible options: "device": Object Device (Server only)
   *         "mtu": Exchanged MTU (Server only)
   *         "link": Link type (Server only)
   * 
   *   Possible Errors: org.bluez.Error.Failed
   *        org.bluez.Error.NotSupported
   * 
   * void StartNotify()
   * 
   *   Starts a notification session from this characteristic
   *   if it supports value notifications or indications.
   * 
   *   Possible Errors: org.bluez.Error.Failed
   *        org.bluez.Error.NotPermitted
   *        org.bluez.Error.InProgress
   *        org.bluez.Error.NotSupported
   * 
   * void StopNotify()
   * 
   *   This method will cancel any previous StartNotify
   *   transaction. Note that notifications from a
   *   characteristic are shared between sessions thus
   *   calling StopNotify will release a single session.
   * 
   *   Possible Errors: org.bluez.Error.Failed
   * 
   * void Confirm() [optional] (Server only)
   * 
   *   This method doesn't expect a reply so it is just a
   *   confirmation that value was received.
   * 
   *   Possible Errors: org.bluez.Error.Failed
   * 
   * Properties	
   * 
   * string UUID [read-only]
   * 
   *   128-bit characteristic UUID.
   * 
   * object Service [read-only]
   * 
   *   Object path of the GATT service the characteristic
   *   belongs to.
   * 
   * array{byte} Value [read-only, optional]
   * 
   *   The cached value of the characteristic. This property
   *   gets updated only after a successful read request and
   *   when a notification or indication is received, upon
   *   which a PropertiesChanged signal will be emitted.
   * 
   * boolean WriteAcquired [read-only, optional]
   * 
   *   True, if this characteristic has been acquired by any
   *   client using AcquireWrite.
   * 
   *   For client properties is ommited in case
   *   'write-without-response' flag is not set.
   * 
   *   For server the presence of this property indicates
   *   that AcquireWrite is supported.
   * 
   * boolean NotifyAcquired [read-only, optional]
   * 
   *   True, if this characteristic has been acquired by any
   *   client using AcquireNotify.
   * 
   *   For client this properties is ommited in case 'notify'
   *   flag is not set.
   * 
   *   For server the presence of this property indicates
   *   that AcquireNotify is supported.
   * 
   * boolean Notifying [read-only, optional]
   * 
   *   True, if notifications or indications on this
   *   characteristic are currently enabled.
   * 
   * array{string} Flags [read-only]
   * 
   *   Defines how the characteristic value can be used. See
   *   Core spec "Table 3.5: Characteristic Properties bit
   *   field", and "Table 3.8: Characteristic Extended
   *   Properties bit field". Allowed values:
   * 
   *     "broadcast"
   *     "read"
   *     "write-without-response"
   *     "write"
   *     "notify"
   *     "indicate"
   *     "authenticated-signed-writes"
   *     "extended-properties"
   *     "reliable-write"
   *     "writable-auxiliaries"
   *     "encrypt-read"
   *     "encrypt-write"
   *     "encrypt-authenticated-read"
   *     "encrypt-authenticated-write"
   *     "secure-read" (Server only)
   *     "secure-write" (Server only)
   *     "authorize"
   * 
   * uint16 Handle [read-write, optional] (Server Only)
   * 
   *   Characteristic handle. When available in the server it
   *   would attempt to use to allocate into the database
   *   which may fail, to auto allocate the value 0x0000
   *   shall be used which will cause the allocated handle to
   *   be set once registered.
   * ```
   * 
   * @param {object} node
   * @param {string} node.path - absolute node path
   * @param {string} node.UUID - characteristic UUID
   * @param {string} [node.Service] - service object path
   * @param {buffer} node.Value - characteristic value
   * @param {string[]} node.Flags
   */
  addCharacteristic (node) {
    node.type = 'characteristic'
    this.nodes.push(node)
  }

  /**
   * TODO
Service		org.bluez
Interface	org.bluez.GattDescriptor1
Object path	[variable prefix]/{hci0,...}/dev_XX_XX_XX_XX_XX_XX/serviceXX/charYYYY/descriptorZZZ

Methods		array{byte} ReadValue(dict flags)

			Issues a request to read the value of the
			characteristic and returns the value if the
			operation was successful.

			Possible options: "offset": Start offset
					  "device": Device path (Server only)
					  "link": Link type (Server only)

			Possible Errors: org.bluez.Error.Failed
					 org.bluez.Error.InProgress
					 org.bluez.Error.NotPermitted
					 org.bluez.Error.NotAuthorized
					 org.bluez.Error.NotSupported

		void WriteValue(array{byte} value, dict flags)

			Issues a request to write the value of the
			characteristic.

			Possible options: "offset": Start offset
					  "device": Device path (Server only)
					  "link": Link type (Server only)
					  "prepare-authorize": boolean Is prepare
							       authorization
							       request

			Possible Errors: org.bluez.Error.Failed
					 org.bluez.Error.InProgress
					 org.bluez.Error.NotPermitted
					 org.bluez.Error.InvalidValueLength
					 org.bluez.Error.NotAuthorized
					 org.bluez.Error.NotSupported

Properties	string UUID [read-only]

			128-bit descriptor UUID.

		object Characteristic [read-only]

			Object path of the GATT characteristic the descriptor
			belongs to.

		array{byte} Value [read-only, optional]

			The cached value of the descriptor. This property
			gets updated only after a successful read request, upon
			which a PropertiesChanged signal will be emitted.

		array{string} Flags [read-only]

			Defines how the descriptor value can be used.

			Possible values:

				"read"
				"write"
				"encrypt-read"
				"encrypt-write"
				"encrypt-authenticated-read"
				"encrypt-authenticated-write"
				"secure-read" (Server Only)
				"secure-write" (Server Only)
				"authorize"

		uint16 Handle [read-write, optional] (Server Only)

			Characteristic handle. When available in the server it
			would attempt to use to allocate into the database
			which may fail, to auto allocate the value 0x0000
			shall be used which will cause the allocated handle to
			be set once registered.
   */
  addDescriptor (node) {
    node.type = 'descriptor'
    this.nodes.push(node)
  }

  /**
   *
   */
  updateAdv (buf) {
  }

  /**
   * @param {string} path - absolute path of a characteristic or a descriptor
   */
  updateValue (path, buf) {
    const node = this.nodes.find(n => n.path === path)   
    if (!node) throw new Error('path not found')
    
    if (node.type !== 'characteristic' && node.type !== 'descriptor') {
      throw new Error('invalid node type')
    }

    this.bus.signal({
    })
  }
}

module.exports = BLE
