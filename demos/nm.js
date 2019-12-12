const path = require('path')

const DBus = require('../src/dbus')

const client = new DBus()

client.on('connect', () => {
  client.AddMatch({
    type: 'signal',
    sender: 'org.freedesktop.NetworkManager',
    'path_namespace': '/org/freedesktop'
  }, err => {
    if (err) return err

    client.GetManagedObjects('org.freedesktop.NetworkManager', '/org/freedesktop', 
      (err, body) => {
        if (err) return err

        console.dir(body[0].eval(), { depth: 9 })

      })
  })
})

client.on('signal', signal => console.log('signal', signal))
