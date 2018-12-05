const xml2js = require('xml2js')

const DBusInterface = require('../lib/dbus-interface')
const DBusInterfaceDefinition = require('../lib/dbus-interface-definition')

class GattCharacteristic1 extends DBusInterface {
  constructor (props) {  
    super()
    Object.assign(this, props)
  }
}

const xml = `\
<interface name="org.bluez.GattCharacteristic1">
  <method name="ReadValue">
    <arg direction="out" type="ay" />
  </method> 
  <method name="WriteValue">
    <arg name="value" direction="in" type="ay" />
  </method>
  <method name="StartNotify" />
  <method name="StopNotify" />
  <property name="UUID" type="s" />
  <property name="Service" type="o" />
  <property name="Value" type="ay" />
  <property name="Notifying" type="b" />
  <property name="Flags" type="as" />
  <property name="Descriptors" type="ao" />
</interface>
`

xml2js.parseString(xml, (err, result) => {
  if (err) throw err
  GattCharacteristic1.prototype.definition = new DBusInterfaceDefinition(result.interface)
})

module.exports = GattCharacteristic1


