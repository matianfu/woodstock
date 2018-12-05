const xml2js = require('xml2js')

const DBusInterface = require('../lib/dbus-interface')
const DBusInterfaceDefinition = require('../lib/dbus-interface-definition')

class GattDescriptor1 extends DBusInterface {
  constructor (props) {
    super ()
    Object.assign(this, props)
  }
}

const xml = `\
<interface name="org.bluez.GattDescriptor1">
  <method name="ReadValue">
    <arg direction="out" type="ay" />
  </method>
  <method name="WriteValue">
    <arg direction="in" type="ay" />
  </method>
  <property name="UUID" type="s" />
  <property name="Characteristic" type="o" />
  <property name="Value" type="ay" />
  <property name="Flags" type="as" />
</interface>
`

xml2js.parseString(xml, (err, result) => {
  if (err) throw err
  GattDescriptor1.prototype.definition = new DBusInterfaceDefinition(result.interface)
})

module.exports = GattDescriptor1


