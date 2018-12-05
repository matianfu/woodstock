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

  let advpath = '/com/wisnuc/bluetooth/le/advertisement0'
  let dobj = dbus.createDBusObject()
  dobj.addInterface(new DBusProperties())
  dobj.addInterface(new LEAdvertisement1({
    Type: 'peripheral',
    LocalName: 'hello-world',
  }))
  dbus.attach(advpath, dobj)

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
  dbus.createObject(advPath, [{
    name: 'org.bluez.LEAdvertisement1',
    Type: 'peripheral',
    LocalName: 'hello'
  }, {
    name: 'org.freedesktop.DBus.Properties',
    GetAll: function (ifaceName, callback) {
      let err, data
      if (ifaceName.value === 'org.bluez.LEAdvertisement1') {
        data = new ARRAY([
          new DICT_ENTRY([
            new STRING('Type'), 
            new VARIANT(new STRING('peripheral'))
          ]),
          new DICT_ENTRY([
            new STRING('LocalName'),
            new VARIANT(new STRING('winas02'))
          ]) 
        ], 'a{sv}')
      } else {
        err = new Error() 
      }
      process.nextTick(() => callback(err, [data]))
    }
  }])
*/

/**
  dbus.driver.invoke({
    destination: 'org.bluez',
    path: '/org/bluez/hci0',
    'interface': 'org.bluez.LEAdvertisingManager1',
    member: 'RegisterAdvertisement',
    signature: 'oa{sv}',
    body: [
      new OBJECT_PATH(advPath),
      new ARRAY('a{sv}')
    ]
  })
*/

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

/**
dbus.createObject()
  .addInterface('org.freedesktop.DBus.ObjectManager')
  .addChild(
  )
*/

  let gattPath = '/com/wisnuc/bluetooth/le/gatt/service0'
  // dbus.createObject(

/**
  dbus.driver.invoke({
    destination: 'org.freedesktop.DBus',
    path: '/org/freedesktop/DBus',
    'interface': 'org.freedesktop.DBus.Introspectable',
    member: 'Introspect',
  }, (err, body) => {
//    console.log(body[0].value)
  })
*/
})



