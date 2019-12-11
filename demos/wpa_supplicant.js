const path = require('path')

const DBus = require('../src/dbus')

const client = new DBus()

client.on('connect', () => {
  client.AddMatch({
    type: 'signal',
    sender: 'fi.w1.wpa_supplicant1',
    interface: 'org.freedesktop.DBus.Properties',
    member: 'PropertiesChanged',
    'path_namespace': '/fi/w1/wpa_supplicant1'
  }, err => {
    if (err) return console.log(err)
    client.wpaProps((err, props) => {
      if (err) return console.log(err)
      client.GetAllProps('fi.w1.wpa_supplicant1',
        // '/fi/w1/wpa_supplicant1/Interfaces/9',
        props.Interfaces[0], 
        'fi.w1.wpa_supplicant1.Interface',
        (err, body) => {
          console.log(err)
          // console.dir(body[0], { depth: 9})

          console.log(body[0].signature(), body[0].eval())

        })
      
    })
  })
})

client.on('signal', signal => console.log(signal))


