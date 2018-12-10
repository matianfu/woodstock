const EventEmitter = require('events')

const DBusInterfaceDefinition = require('../lib/dbus-interface-definition')
const parseXml = require('../lib/parse-xml')

const xml = `\
<interface name = "org.bluez.LEAdvertisement1">
  <method name="Release" />
  <property name="Type" type="s" direction="read" />
  <property name="ServiceUUIDs" type="as" direction="read" />
  <property name="ManufacturerData" type="a{qv}" direction="read" />
  <property name="SolicitUUIDs" type="as" direction="read" />
  <property name="ServiceData" type="a{sv}" direction="read" />
  <property name="LocalName" type="s" direction="read" />
  <property name="IncludeTxPower" type="b" direction="read" />
</interface>
`

const definition = new DBusInterfaceDefinition(parseXml(xml).interface)

class LEAdvertisement1 extends EventEmitter {
  constructor (props) {  
    super()
    Object.assign(this, props)
  }
}

LEAdvertisement1.prototype.definition = definition
LEAdvertisement1.prototype.name = definition.name

module.exports = LEAdvertisement1


