const xml2js = require('xml2js')

const DBusInterface = require('../lib/dbus-interface')
const DBusInterfaceDefinition = require('../lib/dbus-interface-definition')

const { ARRAY, OBJECT_PATH } = require('../lib/dbus-types')

class GattService1 extends DBusInterface {
  constructor (props) {
    super()
    this.UUID = props.UUID
    this.Primary = props.Primary

    // Device is client-side property
    // Includes not yet implemented according to doc

    // this property is not defined in document
    // don't if it is only required by OM or belongs to properties
    Object.defineProperty(this, 'Characteristics', {
      get () {
        // filter obj with characteristic interface
        let name = 'org.bluez.GattCharacteristic1'
        return this.dobj.children.reduce((a, c) => [...a, c.objectPath()], [])
      }
    })
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
