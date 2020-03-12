const woodstock = require('../index')
const { BYTE, BOOLEAN, STRING, OBJECT_PATH, ARRAY, VARIANT } = woodstock.types

const dbus = woodstock()

dbus.addNode({
  path: '/',
  implementations: ['org.freedesktop.DBus.Properties']
})

dbus.addNode({
  path: '/adv',
  implementations: [
    'org.freedesktop.DBus.Properties',
    {
      interface: 'org.bluez.LEAdvertisement1',
      Type: new STRING('peripheral'),
      LocalName: new STRING('Hello'),
      ServiceUUIDs: new ARRAY('as'),
      Release () { }
    }
  ]
})

dbus.addNode({
  path: '/com/example/gatt',
  implementations: [
    'org.freedesktop.DBus.Properties',
    'org.freedesktop.DBus.ObjectManager'
  ]
})

dbus.addNode({
  path: '/com/example/gatt/service001',
  implementations: [
    'org.freedesktop.DBus.Properties',
    {
      interface: 'org.bluez.GattService1',
      UUID: new STRING('60000000-0182-406c-9221-0a6680bd0943'),
      Primary: new BOOLEAN(true)

      // These two properties are harmless and useless as of this writing
      //
      // Device: new OBJECT_PATH('/org/bluez/hci0'),
      // Characteristics: new ARRAY([
      //   new OBJECT_PATH('/com/example/gatt/service001/char001')
      // ])
    }
  ]
})

dbus.addNode({
  path: '/com/example/gatt/service001/char001',
  implementations: [
    'org.freedesktop.DBus.Properties',
    {
      interface: 'org.bluez.GattCharacteristic1',
      UUID: new STRING('60000002-0182-406c-9221-0a6680bd0943'),
      Service: new OBJECT_PATH('/com/example/gatt/service001'),
      Value: new ARRAY('ay', [new BYTE('f'), new BYTE('o'), new BYTE('o')]),
      Flags: new ARRAY('as', [new STRING('read'), new STRING('notify')]),
      ReadValue (m) {
        console.log('read value', m, this.Value)
        return this.Value
      },
      WriteValue (m) {
        // NotSupported or NotPermitted ???
      },
      StartNotify () { },
      StopNotify () { }
    }
  ]
})

dbus.addNode({
  path: '/com/example/gatt/service001/char002',
  implementations: [
    'org.freedesktop.DBus.Properties',
    {
      interface: 'org.bluez.GattCharacteristic1',
      UUID: new STRING('60000003-0182-406c-9221-0a6680bd0943'),
      Service: new OBJECT_PATH('/com/example/gatt/service001'),
      Value: new ARRAY('ay', [new BYTE('b'), new BYTE('a'), new BYTE('r')]),
      Flags: new ARRAY('as', [new STRING('read'), new STRING('write')]),
      ReadValue (m) { return this.Value },
      WriteValue (m) {
        this.node.invoke({
          interface: 'org.freedesktop.DBus.Properties',
          member: 'Set',
          body: [
            new STRING('org.bluez.GattCharacteristic1'),
            new STRING('Value'),
            new VARIANT(m.body[0])
          ],
          sender: m.sender
        })
      },
      StartNotify () { },
      StopNotify () { }
    }
  ]
})

dbus.addNode({
  path: '/com/example/gatt/service002',
  implementations: [
    'org.freedesktop.DBus.Properties',
    {
      interface: 'org.bluez.GattService1',
      UUID: new STRING('70000000-0182-406c-9221-0a6680bd0943'),
      Primary: new BOOLEAN(true)
    }
  ]
})

dbus.addNode({
  path: '/com/example/gatt/service002/char001',
  implementations: [
    'org.freedesktop.DBus.Properties',
    {
      interface: 'org.bluez.GattCharacteristic1',
      UUID: new STRING('70000002-0182-406c-9221-0a6680bd0943'),
      Service: new OBJECT_PATH('/com/example/gatt/service002'),
      Value: new ARRAY('ay', [new BYTE('f'), new BYTE('o'), new BYTE('o')]),
      Flags: new ARRAY('as', [new STRING('read'), new STRING('notify')]),
      ReadValue (m) { return this.Value },
      WriteValue (m) { console.log(m) },
      StartNotify () { },
      StopNotify () { }
    }
  ]
})

dbus.addNode({
  path: '/com/example/gatt/service002/char002',
  implementations: [
    'org.freedesktop.DBus.Properties',
    {
      interface: 'org.bluez.GattCharacteristic1',
      UUID: new STRING('70000003-0182-406c-9221-0a6680bd0943'),
      Service: new OBJECT_PATH('/com/example/gatt/service002'),
      Value: new ARRAY('ay', [new BYTE('b'), new BYTE('a'), new BYTE('r')]),
      Flags: new ARRAY('as', [new STRING('read'), new STRING('write')]),
      ReadValue (m) { },
      WriteValue (m) { },
      StartNotify () { },
      StopNotify () { }
    }
  ]
})

dbus.on('connect', () => {
  dbus.AddMatch({
    type: 'signal',
    sender: 'org.freedesktop.DBus'
  }, err => {
    dbus.AddMatch({
      type: 'signal',
      sender: 'org.bluez'
    }, err => {
      console.log('registering advertisement')
      dbus.invoke({
        destination: 'org.bluez',
        path: '/org/bluez/hci0',
        interface: 'org.bluez.LEAdvertisingManager1',
        member: 'RegisterAdvertisement',
        signature: 'oa{sv}',
        body: [
          new OBJECT_PATH('/adv'),
          new ARRAY('a{sv}')
        ]
      }, (err, result) => {
        console.log('advertisement registered')
        console.log(err, result)

        console.log('registering application')
        dbus.invoke({
          destination: 'org.bluez',
          path: '/org/bluez/hci0',
          interface: 'org.bluez.GattManager1',
          member: 'RegisterApplication',
          signature: 'oa{sv}',
          body: [
            new OBJECT_PATH('/com/example/gatt'),
            new ARRAY('a{sv}')
          ]
        }, (err, result) => {
          console.log('application registered')
          console.log(err, result)
        })

        let count = 0

        setInterval(() => {
          dbus.Set({
            path: '/com/example/gatt/service001/char001',
            interfaceName: 'org.bluez.GattCharacteristic1',
            propertyName: 'Value',
            value: new ARRAY('ay', [new BYTE(count++)])
          })

          if (count >= 256) count = 0
        }, 1000)
      })
    })
  })
})

dbus.on('signal', signal => {
  if (!signal.initiator && !signal.sender) {
    const body = signal.body.map(arg => arg.eval())
    console.dir(Object.assign({}, signal, { body }), { depth: 5 })
  }
})
