const path = require('path')

const DBus = require('./lib/dbus')
const { DBusObject } = require('./lib/dbus-object')
const {
  LITTLE, BIG,
  BYTE, BOOLEAN, INT16, UINT16, INT32, UINT32, INT64, UINT64, DOUBLE, UNIX_FD,
  STRING, OBJECT_PATH, SIGNATURE,
  STRUCT, ARRAY, VARIANT, DICT_ENTRY
} = require('./lib/dbus-types')


const DBusProperties = require('./lib/dbus-properties')
const LEAdvertisement1 = require('./bluez/le-advertisement1')
const GattService1 = require('./bluez/gatt-service1')
const GattDescriptor1 = require('./bluez/gatt-descriptor1')
const GattCharacteristic1 = require('./bluez/gatt-characteristic1')

const dbus = new DBus()

dbus.on('connect', () => {
/**
  trigger an error

  dbus.driver.invoke({
    destination: 'org.freedesktop.DBus',
    path: '/org/freedesktop/DBus',
    'interface': 'org.freedesktop.DBus.ObjectManager',
    member: 'GetManagedObjects',
  }, (err, body) => {
    console.log(err || body)
  })
*/

  let advpath = '/com/winas/bluetooth/le/advertisement0'
  let advObj = dbus.createDBusObject()
    .addInterface(new DBusProperties())
    .addInterface(new LEAdvertisement1({
      Type: 'peripheral',
      LocalName: 'hello-world',
      ServiceUUIDs: ['180D', '180F'],
      ManufacturerData: [
        [0xffff, ['ay', [0x55, 0x33, 0x55, 0x55]]]
      ],
      IncludeTxPower: true
    }))
    .attach(advpath)

  dbus.driver.invoke({
    destination: 'org.bluez',
    path: '/org/bluez/hci0',
    'interface': 'org.bluez.LEAdvertisingManager1',
    member: 'RegisterAdvertisement',
    signature: 'oa{sv}',
    body: [
      new OBJECT_PATH(advpath),
      new ARRAY('a{sv}')
    ]
  })

  /**
-> /com/example
  |   - org.freedesktop.DBus.ObjectManager
  |
  -> /com/example/service0
  | |   - org.freedesktop.DBus.Properties
  | |   - org.bluez.GattService1
  | |
  | -> /com/example/service0/char0
  | |     - org.freedesktop.DBus.Properties
  | |     - org.bluez.GattCharacteristic1
  | |
  | -> /com/example/service0/char1
  |   |   - org.freedesktop.DBus.Properties
  |   |   - org.bluez.GattCharacteristic1
  |   |
  |   -> /com/example/service0/char1/desc0
  |       - org.freedesktop.DBus.Properties
  |       - org.bluez.GattDescriptor1
  |
  -> /com/example/service1
    |   - org.freedesktop.DBus.Properties
    |   - org.bluez.GattService1
    |
    -> /com/example/service1/char0
        - org.freedesktop.DBus.Properties
        - org.bluez.GattCharacteristic1
*/

  let s0Path = '/com/winas/bluetooth/le/gatt/service0'
  let s0Obj = dbus.createDBusObject()
    .addInterface(new DBusProperties())
    .addInterface(new GattService1({
    }))
    .attach(s0Path)

  let s0char0Path = path.join(s0Path, 'char0')
  let s0char0Obj = dbus.createDBusObject()
    .addInterface(new DBusProperties())
    .addInterface(new GattCharacteristic1({
    }))
    .attach(s0char0Path)

  console.dir(dbus.root, { depth: 200 })
 
})
