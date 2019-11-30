const DBusDriver = require('src/dbus-driver')

const driver = new DBusDriver()

driver.on('connect', () => {
  console.log('connect')
  driver.introspect('org.freedesktop.DBus', (err, body) => {
    console.log(err, body)
  })
})

driver.on('message', msg => console.log('msg', msg))

driver.on('error', err => {
  console.log('driver error', err)
})
