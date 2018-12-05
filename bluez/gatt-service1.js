const xml2js = require('xml2js')

const DBusInterface = require('../lib/dbus-interface')
const DBusInterfaceDefinition = require('../lib/dbus-interface-definition')

class GattService1 extends DBusInterface {
  constructor (props) {
    super()
  } 
}

const xml = `\
<interface name="org.bluez.GattService1">
  <property name="UUID" type="s" />
  <property name="Primary" type="b" />
  <property name="Device" type="o" />
  <property name="Characteristics" type="ao" />
  <property name="Includes" type="ao" />
</interface>
`

xml2js.parseString(xml, (err, result) => {
  if (err) throw err
  GattService1.prototype.definition = new DBusInterfaceDefinition(result.interface)
})

module.exports = GattService1
