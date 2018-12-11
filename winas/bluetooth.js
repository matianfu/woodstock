const DBusObject = require('../lib/dbus-object')
const DBusProperties = require('../lib/dbus-properties')
const DBusObjectManager = require('../lib/dbus-object-manager')
const Advertisement = require('../bluez/advertisement')
const GattSerialService = require('../bluez/gatt-serial-service')

module.exports = () => {
  // name will be set when attaching this object
  let bluetooth = new DBusObject()

  let adv = new Advertisement('advertisement0', {
    Type: 'peripheral',
    LocalName: 'winas',
    // ServiceUUIDs: ['180D', '180F'],
    // 1805 CTS
    // ServiceUUIDs: ['80000000-0182-406c-9221-0a6680bd0943'],
    ManufacturerData: [
      [0xffff, ['ay', [0x55, 0x33, 0x55, 0x55]]]
    ],
    IncludeTxPower: true
  })

  bluetooth.addChild(adv)

  // gatt root
  let gatt = new DBusObject('gatt')
    .addInterface(new DBusObjectManager())
    .addChild(new GattSerialService('service0', true))

  bluetooth.addChild(gatt)

  return bluetooth
}
