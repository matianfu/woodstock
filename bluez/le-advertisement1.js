const xml2js = require('xml2js')

const DBusInterface = require('../lib/dbus-interface')
const DBusInterfaceDefinition = require('../lib/dbus-interface-definition')


class LEAdvertisement1 extends DBusInterface {
  constructor (props) {  
    super()
    Object.assign(this, props)
    this.Type = props.Type || 'peripheral'
  }
}

/**
code from test/example-advertisement in Bluez-5.48

60         properties['Type'] = self.ad_type
61         if self.service_uuids is not None:
62             properties['ServiceUUIDs'] = dbus.Array(self.service_uuids,
63                                                     signature='s')
64         if self.solicit_uuids is not None:
65             properties['SolicitUUIDs'] = dbus.Array(self.solicit_uuids,
66                                                     signature='s')
67         if self.manufacturer_data is not None:
68             properties['ManufacturerData'] = dbus.Dictionary(
69                 self.manufacturer_data, signature='qv')
70         if self.service_data is not None:
71             properties['ServiceData'] = dbus.Dictionary(self.service_data,
72                                                         signature='sv')
73         if self.local_name is not None:
74             properties['LocalName'] = dbus.String(self.local_name)
75         if self.include_tx_power is not None:
76             properties['IncludeTxPower'] = dbus.Boolean(self.include_tx_power)
*/

// how to mark no-reply ???
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

xml2js.parseString(xml, (err, result) => {
  if (err) throw err
  LEAdvertisement1.prototype.definition = new DBusInterfaceDefinition(result.interface)
})

module.exports = LEAdvertisement1


