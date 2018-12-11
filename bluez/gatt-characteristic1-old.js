const xml2js = require('xml2js')

const DBusInterface = require('../lib/dbus-interface')
const DBusInterfaceDefinition = require('../lib/dbus-interface-definition')

const { TYPE, BYTE, STRING, SIGNATURE, ARRAY, DICT_ENTRY, VARIANT } = require('../lib/dbus-types')

class GattCharacteristic1 extends DBusInterface {
  constructor (props) {  
    super()
    Object.assign(this, props)

    this.UUID = props.UUID
    this.Value = props.Value || []
    if (props.WriteAcquired) this.WriteAcquired = props.WriteAcquired
    if (props.NotifyAcquired) this.NotifyAcquired = props.NotifyAcquired
    this.Flags = props.Flags

    Object.defineProperty(this, 'Service', {
      get () {
        return this.dobj.parent.objectPath()
      }
    })

    Object.defineProperty(this, 'Descriptors', {
      get () {
        return this.dobj.children.reduce((a, c) => [...a, c.objectPath()], [])
      }
    }) 
  }

  readValue (opts, callback) {
    process.nextTick(() => callback(null, this.Value))
  }
 
  /**
  a{sv} 
    Possible options: 
      "offset": uint16 offset
      "device": Object Device (Server only)

    Possible Errors: org.bluez.Error.Failed
       org.bluez.Error.InProgress
       org.bluez.Error.NotPermitted
       org.bluez.Error.NotAuthorized
       org.bluez.Error.InvalidOffset
       org.bluez.Error.NotSupported
  */
  ReadValue (dopts, callback) {
    let opts = dopts.elems.reduce((o, dentry) => 
      Object.assign(o, { [dentry.elems[0].eval()]: dentry.elems[1].elems[1].eval() }), {})
    this.readValue(opts, (err, vs) => 
      err ? callback(err) : callback(null, new TYPE('ay', vs)))
  }

  writeValue () {
  }

  WriteValue () {
  }

  Confirm (a1, a2, a3) {
    console.log('Confirm', a1, a2, a3)
  }

/**
{ type: 'SIGNAL',
  flags: { noReply: true },
  version: 1,
  serial: 203,
  path: <this.objectPath>,
  interface: 'org.freedesktop.DBus.Properties',
  member: 'PropertiesChanged',
  signature: 'sa{sv}as',
  body:
   [ STRING { value: 'org.bluez.GattCharacteristic1' },
     ARRAY { sig: 'a{sv}', esig: '{sv}', elems: [Array] },
     ARRAY { sig: 'as', esig: 's', elems: [] } ] }

*/

  StartNotify (callback) {
    console.log('Start Notify')
    process.nextTick(() => callback())

    this.value = 0

    this.timer = setInterval(() => {

      let buf = Buffer.alloc(4)      
      buf.writeUInt32LE(this.value++)
      this.Value = Array.from(buf)

      console.log(this.Value)

      this.dbus.driver.signal({
        path: this.dobj.objectPath(),
        interface: 'org.freedesktop.DBus.Properties',
        member: 'PropertiesChanged',
        signature: 'sa{sv}as',
        body: [
          new STRING('org.bluez.GattCharacteristic1'),
          new ARRAY([
            new DICT_ENTRY([  
              new STRING('Value'),
              new VARIANT(new ARRAY(this.Value.map(b => new BYTE(b)), 'ay'))
            ])
          ], 'a{sv}'),
          new ARRAY('as')
        ]
      })
    }, 2048)
  } 

  StopNotify (callback) {
    console.log('Stop Notify')

    clearInterval(this.timer)

    process.nextTick(() => callback())
  }
}

const xml = `\
<interface name="org.bluez.GattCharacteristic1">
  <method name="ReadValue">
    <arg name="options" direction="in" type="a{sv}" />
    <arg direction="out" type="ay" />
  </method> 
  <method name="WriteValue">
    <arg name="value" direction="in" type="ay" />
    <arg name="options" direction="in" type="a{sv}" />
  </method>
  <!--
  <method name="AcquireWrite">
    <arg name="options" direction="in" type="a{sv}" />
  </method>
  <method name="AcquireNotify">
  </method>
  -->
  <method name="StartNotify" />
  <method name="StopNotify" />
  <method name="Confirm" />
  
  <!-- read-only -->
  <property name="UUID" type="s" />
 
  <!-- read-only --> 
  <property name="Service" type="o" />

  <!-- read-only, optional -->
  <property name="Value" type="ay" />

  <!-- read-only, optional -->
  <property name="WriteAcquired" type="b" />

  <!-- read-only, optional -->
  <property name="NotifyAcquired" type="b" />

  <!-- read-only, optional -->
  <property name="Notifying" type="b" />

  <!-- read-only -->
  <property name="Flags" type="as" />

  <!-- non-standard -->
  <property name="Descriptors" type="ao" />
</interface>
`

module.exports = GattCharacteristic1


