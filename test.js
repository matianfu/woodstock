const {
  LITTLE, BIG,
  BYTE, BOOLEAN, INT16, UINT16, INT32, UINT32, INT64, UINT64, DOUBLE, UNIX_FD,
  STRING, OBJECT_PATH, SIGNATURE,
  STRUCT, ARRAY, VARIANT, DICT_ENTRY
} = require('./lib/types')

const connect = require('./lib/connect')

const xml2js = require('xml2js')

/**
 35 bus.invoke({
 36     destination: 'org.bluez',
 37     path: '/org/bluez/hci0',
 38     interface: 'org.bluez.LEAdvertisingManager1',
 39     member: 'RegisterAdvertisement',
 40     body: [ADV.path, []], 
 41     signature: 'oa{sv}',
 42 }, (err, ret) => {
 43   if (err) {
 44     console.log('err', err)
 45   } else {
 46     console.log('ret', ret)
 47   }
 48 })

*/

class DBusService {
  constructor (path) {
    this.path = path
    this.interfaces = new Map()
  }

  setInterface (name, obj) {
    this.interfaces.set(name, obj)
  }

  getInterface (name) {
    return this.interfaces.get(name)
  }
}

class LEAdvertisement extends DBusService {
  constructor (path) {
    super(path)
    this.setInterface('org.freedesktop.DBus.Properties', {
      GetAll: () => {
      },
    })
  }
}



connect((err, bus) => {
  bus.invoke({
    path: '/org/freedesktop/DBus',
    interface: 'org.freedesktop.DBus',
    member: 'Hello',
    destination: 'org.freedesktop.DBus',
  }, (err, body) => {
    console.log('return', err, body)

    console.log('=====================')

    let servicePath = '/org/bluez/winas/le/advertisement0' 

    // bus.register(servicePath, new LEAdvertisement())
/**
    bus.describeInterface({
      name: 'org.bluez.LEAdvertisement1',
      Properties: [
         
      ],
      Methods: [
        {
          name: 'Release',
          input: '',
          output: ''
          flags: { 
            noReply: true 
          }
        }
      ],
      Signals: [
      ]
    })

*/
    let objectPath = new OBJECT_PATH(servicePath)
    let dict = new ARRAY('a{sv}') 

    console.log(dict)
/**
    bus.invoke({
      path: '/org/bluez/hci0',
      interface: 'org.bluez.LEAdvertisingManager1',
      member: 'RegisterAdvertisement',
      destination: 'org.bluez',
      signature: 'oa{sv}',
      body: [objectPath, dict]
    }, (err, body) => {
      console.log('return', err, body) 
    })


org.bluez.LEAdvertisingManager1
*/
    bus.invoke({
      path: '/org/bluez/hci0',
      interface: 'org.freedesktop.DBus.Introspectable',
      member: 'Introspect',
      destination: 'org.bluez'
    }, (err, body) => {
      let xml = body[0].value
      console.log(xml)

      xml2js.parseString(xml, function (err, result) {
        console.log(JSON.stringify(result, null, '  '))

        var builder = new xml2js.Builder();
        var xml = builder.buildObject(result);

        console.log(xml)
      })
    })
  })
})
