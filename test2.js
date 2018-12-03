const DBus = require('./lib/dbus')
const { DBusObject } = require('./lib/dbus-object')
const {
  LITTLE, BIG,
  BYTE, BOOLEAN, INT16, UINT16, INT32, UINT32, INT64, UINT64, DOUBLE, UNIX_FD,
  STRING, OBJECT_PATH, SIGNATURE,
  STRUCT, ARRAY, VARIANT, DICT_ENTRY
} = require('./lib/types')

const dbus = new DBus()

// require('lib/dbus-interface')

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
  let advPath = '/com/wisnuc/bluetooth/le/advertisement0'
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

